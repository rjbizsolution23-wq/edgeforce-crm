/**
 * EdgeForce CRM - Cloudflare Worker Backend
 * Enterprise AI-Powered CRM on Cloudflare Edge
 * Built by: RJ Business Solutions | 2026-03-29
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import * as jose from 'jose'

// ============================================================================
// TYPES & CONFIG
// ============================================================================

type Env = {
  DB: D1Database
  SESSIONS: KVNamespace
  CACHE: KVNamespace
  RATE_LIMIT: KVNamespace
  ASSETS: R2Bucket
  AI: Ai
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use('*', cors({
  origin: ['https://edgeforce-crm.pages.dev', 'http://localhost:8787'],
  credentials: true,
}))
app.use('*', logger())
app.use('*', prettyJSON())

// Rate limiting
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const key = `ratelimit:${ip}`
  const current = await c.env.RATE_LIMIT.get(key)
  const count = current ? parseInt(current) + 1 : 1
  c.header('X-RateLimit-Limit', '1000')
  c.header('X-RateLimit-Remaining', String(Math.max(0, 1000 - count)))
  if (count > 1000) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  await c.env.RATE_LIMIT.put(key, String(count), { expirationTtl: 60 })
  await next()
})

// ============================================================================
// AUTH
// ============================================================================

// Default JWT secret - in production use wrangler secret put JWT_SECRET
const DEFAULT_JWT_SECRET = 'edgeforce-secret-key-change-in-production'

async function verifyToken(c: any): Promise<jose.JWTPayload | null> {
  const env = c.env as Env
  const jwtSecret = new TextEncoder().encode(env.JWT_SECRET || DEFAULT_JWT_SECRET)
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const { payload } = await jose.jwtVerify(token, jwtSecret)
    return payload
  } catch {
    return null
  }
}

function getJwtSecret(env: Env): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET || DEFAULT_JWT_SECRET)
}

function createToken(env: Env, userId: string, tenantId: string, role: string): Promise<string> {
  return new jose.SignJWT({ userId, tenantId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret(env))
}

function createRefreshToken(env: Env): Promise<string> {
  return new jose.SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret(env))
}

// ============================================================================
// HEALTH & STATUS
// ============================================================================

app.get('/health', (c) => c.json({
  status: 'healthy',
  service: 'EdgeForce CRM API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  region: c.req.header('CF-Region') || 'unknown',
}))

app.get('/api/status', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({
    user: { id: user.userId, tenantId: user.tenantId },
    plan: 'pro',
    usage: { apiCalls: 0, storage: 0 },
  })
})

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post('/api/auth/register', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string().optional(),
})), async (c) => {
  const { email, password, firstName, lastName, companyName } = c.req.valid('json')

  // Check if user exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first()
  if (existing) {
    return c.json({ error: 'Email already registered' }, 400)
  }

  const tenantId = crypto.randomUUID()
  const userId = crypto.randomUUID()
  const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))

  // Create tenant
  await c.env.DB.prepare(`
    INSERT INTO tenants (id, name, slug, plan) VALUES (?, ?, ?, 'free')
  `).bind(tenantId, companyName || `${firstName}'s CRM`, email.split('@')[0]).run()

  // Create user
  await c.env.DB.prepare(`
    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?, 'owner')
  `).bind(userId, tenantId, email, passwordHash, firstName, lastName).run()

  // Create default pipeline
  const pipelineId = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO pipelines (id, tenant_id, name, stages, is_default)
    VALUES (?, ?, 'Default Pipeline', ?, 1)
  `).bind(pipelineId, tenantId, JSON.stringify([
    { id: '1', name: 'Lead', color: '#6366f1', order: 1 },
    { id: '2', name: 'Qualified', color: '#8b5cf6', order: 2 },
    { id: '3', name: 'Proposal', color: '#a855f7', order: 3 },
    { id: '4', name: 'Negotiation', color: '#d946ef', order: 4 },
    { id: '5', name: 'Won', color: '#22c55e', order: 5 },
    { id: '6', name: 'Lost', color: '#ef4444', order: 6 },
  ])).run()

  const token = await createToken(c.env, userId, tenantId, 'owner')
  const refreshToken = await createRefreshToken(c.env)

  return c.json({
    token,
    refreshToken,
    user: { id: userId, email, firstName, lastName, tenantId },
  })
})

app.post('/api/auth/login', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string(),
})), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  ).bind(email).first() as any

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))

  if (passwordHash !== user.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await createToken(c.env, user.id, user.tenant_id, user.role)
  const refreshToken = await createRefreshToken(c.env)

  // Update last login
  await c.env.DB.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
    .bind(user.id).run()

  return c.json({
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
    },
  })
})

app.post('/api/auth/refresh', zValidator('json', z.object({
  refreshToken: z.string(),
})), async (c) => {
  const { refreshToken } = c.req.valid('json')
  try {
    const { payload } = await jose.jwtVerify(refreshToken, getJwtSecret(c.env))
    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401)
    }
    const token = await createToken(c.env, payload.userId as string, payload.tenantId as string, payload.role as string)
    return c.json({ token })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

// ============================================================================
// CONTACTS CRUD
// ============================================================================

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

app.get('/api/contacts', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit
  const search = c.req.query('search')
  const status = c.req.query('status')
  const sort = c.req.query('sort') || 'created_at'
  const order = c.req.query('order') || 'desc'

  let query = 'SELECT * FROM contacts WHERE tenant_id = ?'
  const bindings: any[] = [user.tenantId]

  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)'
    const searchPattern = `%${search}%`
    bindings.push(searchPattern, searchPattern, searchPattern, searchPattern)
  }

  if (status) {
    query += ' AND lead_status = ?'
    bindings.push(status)
  }

  query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
  bindings.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()

  const { total } = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM contacts WHERE tenant_id = ?'
  ).bind(user.tenantId).first() as any

  return c.json({
    data: results,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

app.post('/api/contacts', zValidator('json', contactSchema), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO contacts (id, tenant_id, owner_id, first_name, last_name, email, phone, company, job_title, website, industry, source, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.tenantId, user.userId, data.firstName, data.lastName, data.email || null,
    data.phone || null, data.company || null, data.jobTitle || null, data.website || null,
    data.industry || null, data.source || 'manual', JSON.stringify(data.tags || [])
  ).run()

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first()

  // Log activity
  await c.env.DB.prepare(`
    INSERT INTO activities (id, tenant_id, user_id, contact_id, type, subject)
    VALUES (?, ?, ?, ?, 'note_added', 'Contact created')
  `).bind(crypto.randomUUID(), user.tenantId, user.userId, id).run()

  return c.json({ data: contact }, 201)
})

app.get('/api/contacts/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const contact = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ? AND tenant_id = ?'
  ).bind(c.req.param('id'), user.tenantId).first()

  if (!contact) return c.json({ error: 'Not found' }, 404)

  // Get activities
  const { results: activities } = await c.env.DB.prepare(
    'SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(c.req.param('id')).all()

  return c.json({ data: { ...contact, activities } })
})

app.patch('/api/contacts/:id', zValidator('json', contactSchema.partial()), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = c.req.param('id')

  const updates: string[] = []
  const bindings: any[] = []

  Object.entries(data).forEach(([key, value]) => {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    updates.push(`${dbKey} = ?`)
    bindings.push(Array.isArray(value) ? JSON.stringify(value) : value)
  })

  if (updates.length > 0) {
    bindings.push(id, user.tenantId)
    await c.env.DB.prepare(`
      UPDATE contacts SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?
    `).bind(...bindings).run()
  }

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first()
  return c.json({ data: contact })
})

app.delete('/api/contacts/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  await c.env.DB.prepare(
    'DELETE FROM contacts WHERE id = ? AND tenant_id = ?'
  ).bind(c.req.param('id'), user.tenantId).run()

  return c.json({ deleted: true })
})

// ============================================================================
// DEALS & PIPELINES
// ============================================================================

app.get('/api/pipelines', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM pipelines WHERE tenant_id = ? ORDER BY is_default DESC, created_at ASC'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/pipelines', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stages: z.array(z.object({
    name: z.string(),
    color: z.string(),
    order: z.number(),
  })).optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { name, description, stages } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO pipelines (id, tenant_id, name, description, stages)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, name, description || null, JSON.stringify(stages || [])).run()

  const pipeline = await c.env.DB.prepare('SELECT * FROM pipelines WHERE id = ?').bind(id).first()
  return c.json({ data: pipeline }, 201)
})

app.get('/api/deals', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const pipelineId = c.req.query('pipelineId')
  const stage = c.req.query('stage')

  let query = `
    SELECT d.*, c.first_name as contact_first_name, c.last_name as contact_last_name
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    WHERE d.tenant_id = ?
  `
  const bindings: any[] = [user.tenantId]

  if (pipelineId) {
    query += ' AND d.pipeline_id = ?'
    bindings.push(pipelineId)
  }

  if (stage) {
    query += ' AND d.stage = ?'
    bindings.push(stage)
  }

  query += ' ORDER BY d.created_at DESC'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()

  return c.json({ data: results })
})

app.post('/api/deals', zValidator('json', z.object({
  name: z.string().min(1),
  pipelineId: z.string(),
  stage: z.string(),
  contactId: z.string().optional(),
  value: z.number().optional(),
  expectedCloseDate: z.string().optional(),
  probability: z.number().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO deals (id, tenant_id, owner_id, name, pipeline_id, stage, contact_id, value, expected_close_date, probability, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.tenantId, user.userId, data.name, data.pipelineId, data.stage,
    data.contactId || null, data.value || 0, data.expectedCloseDate || null,
    data.probability || 0, data.notes || null
  ).run()

  // Log activity
  await c.env.DB.prepare(`
    INSERT INTO activities (id, tenant_id, user_id, deal_id, type, subject)
    VALUES (?, ?, ?, ?, 'deal_created', ?)
  `).bind(crypto.randomUUID(), user.tenantId, user.userId, id, `Deal created: ${data.name}`).run()

  const deal = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first()
  return c.json({ data: deal }, 201)
})

app.patch('/api/deals/:id/stage', zValidator('json', z.object({
  stage: z.string(),
  probability: z.number().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { stage, probability } = c.req.valid('json')
  const id = c.req.param('id')

  const deal = await c.env.DB.prepare(
    'SELECT * FROM deals WHERE id = ? AND tenant_id = ?'
  ).bind(id, user.tenantId).first() as any

  if (!deal) return c.json({ error: 'Not found' }, 404)

  await c.env.DB.prepare(`
    UPDATE deals SET stage = ?, probability = ? WHERE id = ? AND tenant_id = ?
  `).bind(stage, probability || deal.probability, id, user.tenantId).run()

  // Log activity
  await c.env.DB.prepare(`
    INSERT INTO activities (id, tenant_id, user_id, deal_id, type, subject, metadata)
    VALUES (?, ?, ?, ?, 'deal_stage_changed', ?, ?)
  `).bind(
    crypto.randomUUID(), user.tenantId, user.userId, id,
    `Stage changed to ${stage}`,
    JSON.stringify({ from: deal.stage, to: stage })
  ).run()

  const updated = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first()
  return c.json({ data: updated })
})

// Get deal by ID
app.get('/api/deals/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { id } = c.req.param()

  const deal = await c.env.DB.prepare(`
    SELECT d.*, c.first_name as contact_first_name, c.last_name as contact_last_name,
           p.name as pipeline_name
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN pipelines p ON d.pipeline_id = p.id
    WHERE d.id = ? AND d.tenant_id = ?
  `).bind(id, user.tenantId).first()

  if (!deal) return c.json({ error: 'Deal not found' }, 404)

  return c.json({ data: deal })
})

// Update deal
app.patch('/api/deals/:id', zValidator('json', z.object({
  name: z.string().optional(),
  pipelineId: z.string().optional(),
  stage: z.string().optional(),
  contactId: z.string().optional(),
  value: z.number().optional(),
  expectedCloseDate: z.string().optional(),
  probability: z.number().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { id } = c.req.param()
  const data = c.req.valid('json')

  const deal = await c.env.DB.prepare(
    'SELECT * FROM deals WHERE id = ? AND tenant_id = ?'
  ).bind(id, user.tenantId).first() as any

  if (!deal) return c.json({ error: 'Deal not found' }, 404)

  // Build update query
  const updates: string[] = []
  const bindings: any[] = []

  if (data.name !== undefined) { updates.push('name = ?'); bindings.push(data.name) }
  if (data.pipelineId !== undefined) { updates.push('pipeline_id = ?'); bindings.push(data.pipelineId) }
  if (data.stage !== undefined) { updates.push('stage = ?'); bindings.push(data.stage) }
  if (data.contactId !== undefined) { updates.push('contact_id = ?'); bindings.push(data.contactId) }
  if (data.value !== undefined) { updates.push('value = ?'); bindings.push(data.value) }
  if (data.expectedCloseDate !== undefined) { updates.push('expected_close_date = ?'); bindings.push(data.expectedCloseDate) }
  if (data.probability !== undefined) { updates.push('probability = ?'); bindings.push(data.probability) }
  if (data.notes !== undefined) { updates.push('notes = ?'); bindings.push(data.notes) }

  if (updates.length > 0) {
    bindings.push(id, user.tenantId)
    await c.env.DB.prepare(`
      UPDATE deals SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?
    `).bind(...bindings).run()
  }

  const updated = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first()
  return c.json({ data: updated })
})

// Delete deal
app.delete('/api/deals/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { id } = c.req.param()

  const deal = await c.env.DB.prepare(
    'SELECT * FROM deals WHERE id = ? AND tenant_id = ?'
  ).bind(id, user.tenantId).first()

  if (!deal) return c.json({ error: 'Deal not found' }, 404)

  await c.env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(id).run()

  return c.json({ data: { success: true } })
})

// ============================================================================
// TASKS
// ============================================================================

app.get('/api/tasks', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const status = c.req.query('status')
  const assignedTo = c.req.query('assignedTo')

  let query = 'SELECT t.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.tenant_id = ?'
  const bindings: any[] = [user.tenantId]

  if (status) {
    query += ' AND t.status = ?'
    bindings.push(status)
  }

  if (assignedTo) {
    query += ' AND t.assigned_to = ?'
    bindings.push(assignedTo)
  }

  query += ' ORDER BY t.due_date ASC'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ data: results })
})

app.post('/api/tasks', zValidator('json', z.object({
  title: z.string().min(1),
  type: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  description: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO tasks (id, tenant_id, owner_id, assigned_to, title, description, type, priority, due_date, contact_id, deal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.tenantId, user.userId, data.assignedTo || user.userId, data.title,
    data.description || null, data.type || 'task', data.priority || 'medium',
    data.dueDate || null, data.contactId || null, data.dealId || null
  ).run()

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  return c.json({ data: task }, 201)
})

app.patch('/api/tasks/:id', zValidator('json', z.object({
  status: z.string().optional(),
  completed: z.boolean().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = c.req.param('id')

  const updates: string[] = []
  const bindings: any[] = []

  if (data.status) {
    updates.push('status = ?')
    bindings.push(data.status)
  }

  if (data.completed !== undefined) {
    updates.push('completed = ?', 'completed_at = ?')
    bindings.push(data.completed ? 1 : 0, data.completed ? new Date().toISOString() : null)
  }

  if (updates.length > 0) {
    bindings.push(id, user.tenantId)
    await c.env.DB.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?
    `).bind(...bindings).run()
  }

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  return c.json({ data: task })
})

// ============================================================================
// ACTIVITIES
// ============================================================================

app.get('/api/activities', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const contactId = c.req.query('contactId')
  const dealId = c.req.query('dealId')
  const limit = parseInt(c.req.query('limit') || '50')

  let query = 'SELECT a.*, u.first_name, u.last_name FROM activities a JOIN users u ON a.user_id = u.id WHERE a.tenant_id = ?'
  const bindings: any[] = [user.tenantId]

  if (contactId) {
    query += ' AND a.contact_id = ?'
    bindings.push(contactId)
  }

  if (dealId) {
    query += ' AND a.deal_id = ?'
    bindings.push(dealId)
  }

  query += ' ORDER BY a.created_at DESC LIMIT ?'
  bindings.push(limit)

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ data: results })
})

// ============================================================================
// ANALYTICS & AI LEAD SCORING
// ============================================================================

app.get('/api/analytics/dashboard', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()

  // Contacts stats
  const { totalContacts } = await c.env.DB.prepare(
    'SELECT COUNT(*) as totalContacts FROM contacts WHERE tenant_id = ?'
  ).bind(user.tenantId).first() as any

  const { newContactsThisMonth } = await c.env.DB.prepare(
    'SELECT COUNT(*) as newContactsThisMonth FROM contacts WHERE tenant_id = ? AND created_at > ?'
  ).bind(user.tenantId, startOfMonth).first() as any

  // Deals stats
  const { totalDeals } = await c.env.DB.prepare(
    'SELECT COUNT(*) as totalDeals FROM deals WHERE tenant_id = ?'
  ).bind(user.tenantId).first() as any

  const { openDeals } = await c.env.DB.prepare(
    'SELECT COUNT(*) as openDeals FROM deals WHERE tenant_id = ? AND stage NOT IN ("Won", "Lost")'
  ).bind(user.tenantId).first() as any

  const { totalPipelineValue } = await c.env.DB.prepare(
    'SELECT SUM(value) as totalPipelineValue FROM deals WHERE tenant_id = ? AND stage NOT IN ("Won", "Lost")'
  ).bind(user.tenantId).first() as any

  const { wonDealsThisMonth } = await c.env.DB.prepare(
    'SELECT COUNT(*) as wonDealsThisMonth FROM deals WHERE tenant_id = ? AND stage = "Won" AND updated_at > ?'
  ).bind(user.tenantId, startOfMonth).first() as any

  const { revenueThisMonth } = await c.env.DB.prepare(
    'SELECT SUM(value) as revenueThisMonth FROM deals WHERE tenant_id = ? AND stage = "Won" AND updated_at > ?'
  ).bind(user.tenantId, startOfMonth).first() as any

  // Tasks stats
  const { pendingTasks } = await c.env.DB.prepare(
    'SELECT COUNT(*) as pendingTasks FROM tasks WHERE tenant_id = ? AND status != "completed"'
  ).bind(user.tenantId).first() as any

  const { overdueTasks } = await c.env.DB.prepare(
    'SELECT COUNT(*) as overdueTasks FROM tasks WHERE tenant_id = ? AND due_date < datetime("now") AND status != "completed"'
  ).bind(user.tenantId).first() as any

  // Activity feed
  const { results: recentActivity } = await c.env.DB.prepare(`
    SELECT a.*, u.first_name, u.last_name
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.tenant_id = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).bind(user.tenantId).all()

  return c.json({
    data: {
      contacts: {
        total: totalContacts || 0,
        newThisMonth: newContactsThisMonth || 0,
      },
      deals: {
        total: totalDeals || 0,
        open: openDeals || 0,
        pipelineValue: totalPipelineValue || 0,
        wonThisMonth: wonDealsThisMonth || 0,
        revenueThisMonth: revenueThisMonth || 0,
      },
      tasks: {
        pending: pendingTasks || 0,
        overdue: overdueTasks || 0,
      },
      recentActivity,
    },
  })
})

app.post('/api/ai/score-lead', zValidator('json', z.object({
  contactId: z.string(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { contactId } = c.req.valid('json')

  const contact = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ? AND tenant_id = ?'
  ).bind(contactId, user.tenantId).first() as any

  if (!contact) return c.json({ error: 'Contact not found' }, 404)

  // AI-powered lead scoring using Workers AI
  const prompt = `Analyze this lead and score them 0-100 based on conversion likelihood:
Name: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'N/A'}
Job Title: ${contact.job_title || 'N/A'}
Industry: ${contact.industry || 'N/A'}
Email: ${contact.email || 'N/A'}
Phone: ${contact.phone || 'N/A'}
Source: ${contact.source || 'N/A'}
Created: ${contact.created_at || 'N/A'}

Return a JSON with: score (0-100), grade (A/B/C/D/F), factors (array of reasons), recommendations (array of next steps).`

  try {
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    })

    let analysis
    try {
      analysis = JSON.parse(aiResponse.messages[0].content)
    } catch {
      analysis = {
        score: 50,
        grade: 'C',
        factors: ['AI analysis unavailable, using default scoring'],
        recommendations: ['Review lead manually'],
      }
    }

    // Update contact with AI score
    await c.env.DB.prepare(
      'UPDATE contacts SET lead_score = ? WHERE id = ?'
    ).bind(analysis.score, contactId).run()

    return c.json({
      data: {
        contactId,
        aiScore: analysis.score,
        grade: analysis.grade,
        factors: analysis.factors,
        recommendations: analysis.recommendations,
      },
    })
  } catch (error) {
    // Fallback to rule-based scoring
    let score = 50

    if (contact.email) score += 10
    if (contact.phone) score += 10
    if (contact.company) score += 15
    if (contact.job_title) score += 10
    if (contact.industry) score += 5

    await c.env.DB.prepare(
      'UPDATE contacts SET lead_score = ? WHERE id = ?'
    ).bind(score, contactId).run()

    return c.json({
      data: {
        contactId,
        aiScore: score,
        grade: score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D',
        factors: ['Rule-based scoring applied'],
        recommendations: ['Add more contact information to improve score'],
      },
    })
  }
})

// ============================================================================
// TEAMS & PERMISSIONS
// ============================================================================

app.get('/api/team', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT id, email, first_name, last_name, role, avatar_url, last_login, is_active FROM users WHERE tenant_id = ?'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/team/invite', zValidator('json', z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member', 'viewer']),
  firstName: z.string(),
  lastName: z.string(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user || !['owner', 'admin'].includes(user.role as string)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { email, role, firstName, lastName } = c.req.valid('json')
  const id = crypto.randomUUID()
  const tempPassword = crypto.randomUUID().slice(0, 12)
  const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tempPassword))
    .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))

  try {
    await c.env.DB.prepare(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.tenantId, email, passwordHash, firstName, lastName, role).run()

    return c.json({
      data: { id, email, role },
      tempPassword, // In production, send via email
    }, 201)
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      return c.json({ error: 'User already exists in this workspace' }, 400)
    }
    throw error
  }
})

// ============================================================================
// FORMS & LANDING PAGES
// ============================================================================

app.get('/api/forms', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM forms WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/forms', zValidator('json', z.object({
  name: z.string().min(1),
  fields: z.array(z.object({
    type: z.string(),
    label: z.string(),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
  })),
  redirectUrl: z.string().optional(),
  thankYouMessage: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO forms (id, tenant_id, name, fields, redirect_url, thank_you_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, data.name, JSON.stringify(data.fields), data.redirectUrl || null, data.thankYouMessage || null).run()

  const form = await c.env.DB.prepare('SELECT * FROM forms WHERE id = ?').bind(id).first()
  return c.json({ data: form }, 201)
})

app.post('/api/forms/:id/submit', zValidator('json', z.record(z.string(), z.any())), async (c) => {
  const formId = c.req.param('id')
  const data = c.req.valid('json')

  const form = await c.env.DB.prepare('SELECT * FROM forms WHERE id = ? AND is_active = 1').bind(formId).first() as any
  if (!form) return c.json({ error: 'Form not found' }, 404)

  // Get tenant from form
  const submissionId = crypto.randomUUID()
  const fields = JSON.parse(form.fields)
  const emailField = fields.find((f: any) => f.type === 'email')
  let contactId: string | null = null

  // Create or update contact
  if (emailField && data[emailField.label]) {
    const existingContact = await c.env.DB.prepare(
      'SELECT id FROM contacts WHERE email = ?'
    ).bind(data[emailField.label]).first()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      contactId = crypto.randomUUID()
      await c.env.DB.prepare(`
        INSERT INTO contacts (id, tenant_id, email, first_name, last_name, source)
        VALUES (?, ?, ?, ?, ?, 'form')
      `).bind(contactId, form.tenant_id, data[emailField.label], data['First Name'] || 'Unknown', data['Last Name'] || '').run()
    }
  }

  // Save submission
  await c.env.DB.prepare(`
    INSERT INTO form_submissions (id, tenant_id, form_id, contact_id, data, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(submissionId, form.tenant_id, formId, contactId, JSON.stringify(data), c.req.header('CF-Connecting-IP'), c.req.header('User-Agent')).run()

  return c.json({
    success: true,
    message: form.thank_you_message || 'Thank you for your submission!',
    redirectUrl: form.redirect_url,
  })
})

// ============================================================================
// AUTOMATIONS
// ============================================================================

app.get('/api/automations', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM automations WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/automations', zValidator('json', z.object({
  name: z.string().min(1),
  trigger: z.string(),
  triggerConfig: z.record(z.any()).optional(),
  actions: z.array(z.object({
    type: z.string(),
    config: z.record(z.any()),
  })),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO automations (id, tenant_id, name, trigger, trigger_config, actions, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.tenantId, data.name, data.trigger,
    JSON.stringify(data.triggerConfig || {}),
    JSON.stringify(data.actions),
    JSON.stringify(data.conditions || [])
  ).run()

  const automation = await c.env.DB.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
  return c.json({ data: automation }, 201)
})

// ============================================================================
// WEBHOOKS
// ============================================================================

app.post('/api/webhooks/test', zValidator('json', z.object({
  url: z.string().url(),
  event: z.string(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { url, event } = c.req.valid('json')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        tenantId: user.tenantId,
        timestamp: new Date().toISOString(),
        test: true,
      }),
    })

    return c.json({
      success: response.ok,
      status: response.status,
      response: await response.text(),
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
    }, 400)
  }
})

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

app.get('/api/email-templates', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM email_templates WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/email-templates', zValidator('json', z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { name, subject, body, category } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO email_templates (id, tenant_id, name, subject, body, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, name, subject, body, category || 'general').run()

  const template = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first()
  return c.json({ data: template }, 201)
})

app.patch('/api/email-templates/:id', zValidator('json', z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  category: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = c.req.param('id')

  const updates: string[] = []
  const bindings: any[] = []

  Object.entries(data).forEach(([key, value]) => {
    updates.push(`${key} = ?`)
    bindings.push(value)
  })

  if (updates.length > 0) {
    bindings.push(id, user.tenantId)
    await c.env.DB.prepare(`
      UPDATE email_templates SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?
    `).bind(...bindings).run()
  }

  const template = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first()
  return c.json({ data: template })
})

app.delete('/api/email-templates/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  await c.env.DB.prepare(
    'DELETE FROM email_templates WHERE id = ? AND tenant_id = ?'
  ).bind(c.req.param('id'), user.tenantId).run()

  return c.json({ deleted: true })
})

// ============================================================================
// EMAIL SEQUENCES
// ============================================================================

app.get('/api/email-sequences', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM email_sequences WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results })
})

app.post('/api/email-sequences', zValidator('json', z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  delayDays: z.number().min(0).default(1),
  trigger: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { name, subject, body, delayDays, trigger } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO email_sequences (id, tenant_id, name, subject, body, delay_days, trigger)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, name, subject, body, delayDays, trigger || 'manual').run()

  const sequence = await c.env.DB.prepare('SELECT * FROM email_sequences WHERE id = ?').bind(id).first()
  return c.json({ data: sequence }, 201)
})

// ============================================================================
// SMS (Twilio Integration)
 // ============================================================================

 app.get('/api/sms/templates', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM sms_templates WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/sms/templates', zValidator('json', z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { name, content, variables } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO sms_templates (id, tenant_id, name, content, variables)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, name, content, JSON.stringify(variables || [])).run()

  const template = await c.env.DB.prepare('SELECT * FROM sms_templates WHERE id = ?').bind(id).first()
  return c.json({ data: template }, 201)
})

app.get('/api/sms/campaigns', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM sms_campaigns WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/sms/campaigns', zValidator('json', z.object({
  name: z.string().min(1),
  templateId: z.string(),
  audienceFilter: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { name, templateId, audienceFilter, scheduledAt } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO sms_campaigns (id, tenant_id, name, template_id, audience_filter, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).bind(id, user.tenantId, name, templateId, JSON.stringify(audienceFilter || {}), scheduledAt || null).run()

  const campaign = await c.env.DB.prepare('SELECT * FROM sms_campaigns WHERE id = ?').bind(id).first()
  return c.json({ data: campaign }, 201)
})

app.get('/api/sms/logs', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const limit = parseInt(c.req.query('limit') || '100')

  const { results } = await c.env.DB.prepare(`
    SELECT sl.*, c.first_name, c.last_name, c.phone as contact_phone
    FROM sms_logs sl
    LEFT JOIN contacts c ON sl.contact_id = c.id
    WHERE sl.tenant_id = ?
    ORDER BY sl.sent_at DESC
    LIMIT ?
  `).bind(user.tenantId, limit).all()

  return c.json({ data: results || [] })
})

// ============================================================================
// AI ASSISTANT (Workers AI)
 // ============================================================================

 app.post('/api/ai/chat', zValidator('json', z.object({
  message: z.string().min(1),
  context: z.record(z.any()).optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { message, context } = c.req.valid('json')

  // Build context prompt for CRM data
  const tenantId = user.tenantId

  // Get relevant CRM data
  const { results: contacts } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM contacts WHERE tenant_id = ?'
  ).bind(tenantId).first() as any

  const { results: deals } = await c.env.DB.prepare(
    'SELECT SUM(value) as total, COUNT(*) as count FROM deals WHERE tenant_id = ?'
  ).bind(tenantId).first() as any

  const systemPrompt = `You are EdgeForce AI, an AI assistant for a CRM system. You help users with:
- Analyzing pipeline and deal data
- Writing emails and follow-ups
- Lead scoring and prioritization
- Meeting summaries
- General CRM guidance

Current user context:
- Tenant ID: ${tenantId}
- Total contacts: ${contacts?.count || 0}
- Total deals: ${deals?.count || 0}
- Pipeline value: $${deals?.total || 0}

Be helpful, concise, and focused on actionable insights.`

  try {
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
    })

    const reply = aiResponse.messages?.[0]?.content || 'I\'m having trouble processing your request. Please try again.'

    return c.json({
      data: {
        reply,
        timestamp: new Date().toISOString(),
        model: 'llama-3-8b-instruct',
      },
    })
  } catch (error) {
    // Fallback response
    return c.json({
      data: {
        reply: 'I\'m here to help with your CRM! I can assist with pipeline analysis, email drafting, lead scoring, and more. What would you like to do?',
        timestamp: new Date().toISOString(),
        model: 'fallback',
      },
    })
  }
})

app.post('/api/ai/email-writer', zValidator('json', z.object({
  type: z.enum(['follow-up', 'cold-outreach', 'welcome', 'closing']),
  contactName: z.string(),
  context: z.record(z.any()).optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { type, contactName, context } = c.req.valid('json')

  const prompts: Record<string, string> = {
    'follow-up': `Write a follow-up email to ${contactName}. Keep it professional, short, and compelling. Include a clear call-to-action.`,
    'cold-outreach': `Write a cold outreach email to ${contactName}. Make it personalized, value-focused, and not pushy.`,
    'welcome': `Write a welcome email for ${contactName} who just signed up. Make it warm and informative.`,
    'closing': `Write a closing email for ${contactName}. Be confident but not aggressive. Include next steps.`,
  }

  try {
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are an expert email copywriter for a CRM platform. Write concise, professional emails that convert.' },
        { role: 'user', content: prompts[type] || prompts['follow-up'] },
      ],
      max_tokens: 500,
    })

    const email = aiResponse.messages?.[0]?.content || ''

    return c.json({
      data: {
        subject: `Following up - ${contactName}`,
        body: email,
        type,
      },
    })
  } catch (error) {
    return c.json({ data: { subject: '', body: 'AI generation failed. Please try again.', type } })
  }
})

// ============================================================================
// CALENDAR & BOOKING
 // ============================================================================

 app.get('/api/calendar/availability', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM calendar_availability WHERE tenant_id = ?'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/calendar/availability', zValidator('json', z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean().default(true),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO calendar_availability (id, tenant_id, day_of_week, start_time, end_time, is_available)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, data.dayOfWeek, data.startTime, data.endTime, data.isAvailable ? 1 : 0).run()

  return c.json({ data: { id } }, 201)
})

app.post('/api/calendar/bookings', zValidator('json', z.object({
  contactId: z.string().optional(),
  contactName: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  meetingType: z.enum(['video', 'phone', 'in-person']),
  notes: z.string().optional(),
})), async (c) => {
  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO calendar_bookings (id, tenant_id, contact_id, contact_name, contact_email, contact_phone, start_time, end_time, meeting_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.contactId || null, data.contactName, data.contactEmail,
    data.contactPhone || null, data.startTime, data.endTime,
    data.meetingType, data.notes || null
  ).run()

  return c.json({ data: { id, confirmation: 'Booking confirmed' } }, 201)
})

// ============================================================================
// CALLS & MEETINGS
 // ============================================================================

 app.get('/api/calls', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM calls WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/calls', zValidator('json', z.object({
  contactId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']),
  duration: z.number().optional(),
  status: z.enum(['completed', 'missed', 'voicemail']),
  notes: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO calls (id, tenant_id, user_id, contact_id, direction, duration, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, user.userId, data.contactId || null, data.direction, data.duration || 0, data.status, data.notes || null).run()

  return c.json({ data: { id } }, 201)
})

app.get('/api/meetings', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM meetings WHERE tenant_id = ? ORDER BY start_time DESC LIMIT 100'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/meetings', zValidator('json', z.object({
  title: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  contactId: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO meetings (id, tenant_id, owner_id, title, start_time, end_time, contact_id, attendees, meeting_link, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenantId, user.userId, data.title, data.startTime, data.endTime, data.contactId || null, JSON.stringify(data.attendees || []), data.meetingLink || null, data.notes || null).run()

  return c.json({ data: { id } }, 201)
})

// ============================================================================
// REVIEWS MANAGEMENT
 // ============================================================================

 app.get('/api/reviews', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM reviews WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/reviews/respond', zValidator('json', z.object({
  reviewId: z.string(),
  response: z.string().min(1),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { reviewId, response } = c.req.valid('json')

  await c.env.DB.prepare(`
    UPDATE reviews SET response = ?, responded_at = datetime('now'), status = 'responded'
    WHERE id = ? AND tenant_id = ?
  `).bind(response, reviewId, user.tenantId).run()

  return c.json({ success: true })
})

app.post('/api/reviews/requests', zValidator('json', z.object({
  contactId: z.string(),
  method: z.enum(['email', 'sms']),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { contactId, method } = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO review_requests (id, tenant_id, contact_id, method, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).bind(id, user.tenantId, contactId, method).run()

  return c.json({ data: { id } }, 201)
})

// ============================================================================
// AGENCY & WHITE-LABEL
 // ============================================================================

 app.get('/api/agency/accounts', async (c) => {
  const user = await verifyToken(c)
  if (!user || !['owner', 'admin'].includes(user.role as string)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM agency_accounts WHERE parent_tenant_id = ? ORDER BY created_at DESC'
  ).bind(user.tenantId).all()

  return c.json({ data: results || [] })
})

app.post('/api/agency/accounts', zValidator('json', z.object({
  name: z.string().min(1),
  domain: z.string(),
  ownerEmail: z.string().email(),
  ownerName: z.string(),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  primaryColor: z.string().optional(),
})), async (c) => {
  const user = await verifyToken(c)
  if (!user || !['owner', 'admin'].includes(user.role as string)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const data = c.req.valid('json')
  const id = crypto.randomUUID()
  const tenantId = crypto.randomUUID()

  // Create sub-account tenant
  await c.env.DB.prepare(`
    INSERT INTO tenants (id, name, slug, plan, parent_id, settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    tenantId, data.name, data.domain.split('.')[0],
    data.plan, user.tenantId,
    JSON.stringify({ primaryColor: data.primaryColor || '#6366f1', customDomain: data.domain })
  ).run()

  // Create owner user
  const userId = crypto.randomUUID()
  const tempPassword = crypto.randomUUID().slice(0, 12)

  await c.env.DB.prepare(`
    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?, 'owner')
  `).bind(userId, tenantId, data.ownerEmail, tempPassword, data.ownerName.split(' ')[0], data.ownerName.split(' ').slice(1).join(' ')).run()

  await c.env.DB.prepare(`
    INSERT INTO agency_accounts (id, parent_tenant_id, tenant_id, name, domain, owner_email, owner_name, plan, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(id, user.tenantId, tenantId, data.name, data.domain, data.ownerEmail, data.ownerName, data.plan).run()

  return c.json({
    data: { id, tenantId, tempPassword },
    message: 'Sub-account created. Temp password: ' + tempPassword,
  }, 201)
})

// ============================================================================
// HELPDESK & TICKETING
// ============================================================================

// Get tickets
app.get('/api/helpdesk/tickets', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { status, priority, assigned_to, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = 'SELECT * FROM helpdesk_tickets WHERE tenant_id = ?'
  const params: any[] = [user.tenant_id]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  if (priority) {
    query += ' AND priority = ?'
    params.push(priority)
  }
  if (assigned_to) {
    query += ' AND assigned_to = ?'
    params.push(assigned_to)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const tickets = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: tickets.results })
})

// Create ticket
app.post('/api/helpdesk/tickets', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { subject, description, priority = 'medium', category, channel = 'email', contact_id, assigned_to, related_deal_id, tags, custom_fields } = body

  const id = crypto.randomUUID()
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

  await c.env.DB.prepare(`
    INSERT INTO helpdesk_tickets (id, tenant_id, ticket_number, subject, description, priority, category, channel, contact_id, assigned_to, related_deal_id, tags, custom_fields)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenant_id, ticketNumber, subject, description, priority, category, channel, contact_id, assigned_to, related_deal_id, JSON.stringify(tags || []), JSON.stringify(custom_fields || {})).run()

  return c.json({ data: { id, ticketNumber, subject } }, 201)
})

// Get single ticket with messages
app.get('/api/helpdesk/tickets/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const ticket = await c.env.DB.prepare('SELECT * FROM helpdesk_tickets WHERE id = ? AND tenant_id = ?').bind(c.req.param('id'), user.tenant_id).first()
  if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

  const messages = await c.env.DB.prepare('SELECT * FROM helpdesk_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').bind(c.req.param('id')).all()

  return c.json({ data: { ...ticket, messages: messages.results } })
})

// Update ticket
app.patch('/api/helpdesk/tickets/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { status, priority, assigned_to, assigned_team_id, tags, custom_fields } = body
  const updates: string[] = []
  const params: any[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
    if (status === 'resolved' && !ticket.resolved_at) {
      updates.push('resolved_at = datetime("now")')
    }
    if (status === 'closed' && !ticket.closed_at) {
      updates.push('closed_at = datetime("now")')
    }
  }
  if (priority) { updates.push('priority = ?'); params.push(priority) }
  if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to) }
  if (assigned_team_id !== undefined) { updates.push('assigned_team_id = ?'); params.push(assigned_team_id) }
  if (tags) { updates.push('tags = ?'); params.push(JSON.stringify(tags)) }
  if (custom_fields) { updates.push('custom_fields = ?'); params.push(JSON.stringify(custom_fields)) }

  if (updates.length === 0) return c.json({ error: 'No updates provided' }, 400)

  params.push(c.req.param('id'), user.tenant_id)
  await c.env.DB.prepare(`UPDATE helpdesk_tickets SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).bind(...params).run()

  return c.json({ message: 'Ticket updated' })
})

// Add message to ticket
app.post('/api/helpdesk/tickets/:id/messages', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { message, is_internal = false, attachments } = body
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO helpdesk_ticket_messages (id, tenant_id, ticket_id, user_id, contact_id, is_internal, message, attachments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenant_id, c.req.param('id'), user.id, body.contact_id || null, is_internal ? 1 : 0, message, JSON.stringify(attachments || [])).run()

  // Update ticket last activity
  await c.env.DB.prepare('UPDATE helpdesk_tickets SET updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run()

  return c.json({ data: { id, message } }, 201)
})

// Get helpdesk teams
app.get('/api/helpdesk/teams', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const teams = await c.env.DB.prepare('SELECT * FROM helpdesk_teams WHERE tenant_id = ? AND is_active = 1').bind(user.tenant_id).all()
  return c.json({ data: teams.results })
})

// Get knowledge base articles
app.get('/api/helpdesk/kb/articles', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { category_id, status = 'published', page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = 'SELECT * FROM knowledge_base_articles WHERE tenant_id = ? AND status = ?'
  const params: any[] = [user.tenant_id, status]

  if (category_id) {
    query += ' AND category_id = ?'
    params.push(category_id)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const articles = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: articles.results })
})

// ============================================================================
// LIVE CHAT
// ============================================================================

// Get chat sessions
app.get('/api/live-chat/sessions', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { status, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = 'SELECT * FROM live_chat_sessions WHERE tenant_id = ?'
  const params: any[] = [user.tenant_id]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const sessions = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: sessions.results })
})

// Get single chat session
app.get('/api/live-chat/sessions/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const session = await c.env.DB.prepare('SELECT * FROM live_chat_sessions WHERE id = ? AND tenant_id = ?').bind(c.req.param('id'), user.tenant_id).first()
  if (!session) return c.json({ error: 'Session not found' }, 404)

  return c.json({ data: session })
})

// Start new chat session (visitor)
app.post('/api/live-chat/sessions', async (c) => {
  const body = await c.req.json()
  const { tenant_id, visitor_id, visitor_name, visitor_email, country, city, browser, os, current_page } = body

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO live_chat_sessions (id, tenant_id, visitor_id, visitor_name, visitor_email, status, country, city, browser, os, current_page, started_at)
    VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenant_id, visitor_id, visitor_name, visitor_email, country, city, browser, os, current_page).run()

  return c.json({ data: { id, status: 'waiting' } }, 201)
})

// Send message in chat
app.post('/api/live-chat/sessions/:id/messages', async (c) => {
  const body = await c.req.json()
  const { sender_type, sender_id, message, direction } = body

  const session = await c.env.DB.prepare('SELECT * FROM live_chat_sessions WHERE id = ?').bind(c.req.param('id')).first()
  if (!session) return c.json({ error: 'Session not found' }, 404)

  const messages = JSON.parse(session.messages as string || '[]')
  messages.push({
    id: crypto.randomUUID(),
    sender_type,
    sender_id,
    message,
    direction,
    timestamp: new Date().toISOString(),
  })

  await c.env.DB.prepare('UPDATE live_chat_sessions SET messages = ? WHERE id = ?').bind(JSON.stringify(messages), c.req.param('id')).run()

  // Update session status to active if this is first agent message
  if (sender_type === 'agent' && session.status === 'waiting') {
    await c.env.DB.prepare('UPDATE live_chat_sessions SET status = \'active\', assigned_to = ? WHERE id = ?').bind(sender_id, c.req.param('id')).run()
  }

  return c.json({ data: { success: true } })
})

// End chat session
app.post('/api/live-chat/sessions/:id/end', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { rating, feedback } = body

  await c.env.DB.prepare(`
    UPDATE live_chat_sessions SET status = 'ended', ended_by = ?, ended_at = datetime('now'), rating = ?, feedback = ?
    WHERE id = ?
  `).bind(user.id, rating || null, feedback || null, c.req.param('id')).run()

  return c.json({ message: 'Chat session ended' })
})

// Get chat widgets
app.get('/api/live-chat/widgets', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const widgets = await c.env.DB.prepare('SELECT * FROM live_chat_widgets WHERE tenant_id = ?').bind(user.tenant_id).all()
  return c.json({ data: widgets.results })
})

// ============================================================================
// AI CHATBOT BUILDER
// ============================================================================

// Get chatbots
app.get('/api/ai-chatbots', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const chatbots = await c.env.DB.prepare('SELECT * FROM ai_chatbots WHERE tenant_id = ? ORDER BY created_at DESC').bind(user.tenant_id).all()
  return c.json({ data: chatbots.results })
})

// Create chatbot
app.post('/api/ai-chatbots', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { name, description, welcome_message, fallback_message, config, personality, tone, language, is_public } = body

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO ai_chatbots (id, tenant_id, name, description, welcome_message, fallback_message, config, personality, tone, language, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenant_id, name, description, welcome_message, fallback_message, JSON.stringify(config || {}), personality, tone || 'professional', language || 'en', is_public ? 1 : 0).run()

  return c.json({ data: { id, name } }, 201)
})

// Get single chatbot with flows
app.get('/api/ai-chatbots/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const chatbot = await c.env.DB.prepare('SELECT * FROM ai_chatbots WHERE id = ? AND tenant_id = ?').bind(c.req.param('id'), user.tenant_id).first()
  if (!chatbot) return c.json({ error: 'Chatbot not found' }, 404)

  const flows = await c.env.DB.prepare('SELECT * FROM ai_chatbot_flows WHERE chatbot_id = ? ORDER BY priority ASC').bind(c.req.param('id')).all()

  return c.json({ data: { ...chatbot, flows: flows.results } })
})

// Update chatbot
app.patch('/api/ai-chatbots/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { name, description, welcome_message, fallback_message, config, personality, tone, language, is_active, is_public } = body

  const updates: string[] = []
  const params: any[] = []

  if (name) { updates.push('name = ?'); params.push(name) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (welcome_message !== undefined) { updates.push('welcome_message = ?'); params.push(welcome_message) }
  if (fallback_message !== undefined) { updates.push('fallback_message = ?'); params.push(fallback_message) }
  if (config) { updates.push('config = ?'); params.push(JSON.stringify(config)) }
  if (personality !== undefined) { updates.push('personality = ?'); params.push(personality) }
  if (tone) { updates.push('tone = ?'); params.push(tone) }
  if (language) { updates.push('language = ?'); params.push(language) }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0) }
  if (is_public !== undefined) { updates.push('is_public = ?'); params.push(is_public ? 1 : 0) }

  if (updates.length === 0) return c.json({ error: 'No updates provided' }, 400)

  params.push(c.req.param('id'), user.tenant_id)
  await c.env.DB.prepare(`UPDATE ai_chatbots SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).bind(...params).run()

  return c.json({ message: 'Chatbot updated' })
})

// Delete chatbot
app.delete('/api/ai-chatbots/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  await c.env.DB.prepare('DELETE FROM ai_chatbots WHERE id = ? AND tenant_id = ?').bind(c.req.param('id'), user.tenant_id).run()

  return c.json({ message: 'Chatbot deleted' })
})

// Get chatbot flows
app.get('/api/ai-chatbots/:id/flows', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const flows = await c.env.DB.prepare('SELECT * FROM ai_chatbot_flows WHERE chatbot_id = ? ORDER BY priority ASC').bind(c.req.param('id')).all()
  return c.json({ data: flows.results })
})

// Create chatbot flow
app.post('/api/ai-chatbots/:id/flows', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { name, trigger, trigger_type, response, actions, conditions, next_flow_id, is_default, priority } = body

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO ai_chatbot_flows (id, chatbot_id, name, trigger, trigger_type, response, actions, conditions, next_flow_id, is_default, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, c.req.param('id'), name, trigger, trigger_type || 'keyword', response, JSON.stringify(actions || []), JSON.stringify(conditions || []), next_flow_id, is_default ? 1 : 0, priority || 0).run()

  return c.json({ data: { id, name } }, 201)
})

// Update chatbot flow
app.patch('/api/ai-chatbots/:flows/flowId', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const updates: string[] = []
  const params: any[] = []

  const fields = ['name', 'trigger', 'trigger_type', 'response', 'actions', 'conditions', 'next_flow_id', 'is_default', 'priority', 'is_active']
  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`)
      params.push(field === 'is_default' || field === 'is_active' ? (body[field] ? 1 : 0) : body[field])
    }
  }

  if (updates.length === 0) return c.json({ error: 'No updates provided' }, 400)

  const flowId = c.req.param('flowId')
  params.push(flowId, user.tenant_id)

  await c.env.DB.prepare(`UPDATE ai_chatbot_flows SET ${updates.join(', ')} WHERE id = ? AND chatbot_id IN (SELECT id FROM ai_chatbots WHERE tenant_id = ?)`).bind(...params).run()

  return c.json({ message: 'Flow updated' })
})

// Get chatbot conversations (analytics)
app.get('/api/ai-chatbots/:id/conversations', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  const conversations = await c.env.DB.prepare(`
    SELECT * FROM ai_chatbot_conversations WHERE chatbot_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(c.req.param('id'), parseInt(limit), offset).all()

  return c.json({ data: conversations.results })
})

// Public chatbot conversation (for embedded chat)
app.post('/api/public/chatbots/:id/chat', async (c) => {
  const chatbot = await c.env.DB.prepare('SELECT * FROM ai_chatbots WHERE id = ? AND is_active = 1 AND (is_public = 1 OR tenant_id = ?)').bind(c.req.param('id'), c.req.header('X-Tenant-ID') || '').first()
  if (!chatbot) return c.json({ error: 'Chatbot not found or inactive' }, 404)

  const body = await c.req.json()
  const { message, session_id, contact_id } = body

  // Find matching flow
  const flows = await c.env.DB.prepare('SELECT * FROM ai_chatbot_flows WHERE chatbot_id = ? AND is_active = 1 ORDER BY priority ASC').bind(c.req.param('id')).all()

  let response = chatbot.fallback_message || 'I\'m sorry, I didn\'t understand that. Let me connect you with an agent.'
  let matchedFlow = null

  for (const flow of flows.results as any[]) {
    if (flow.trigger_type === 'always') {
      matchedFlow = flow
      break
    }
    if (flow.trigger_type === 'keyword' && message.toLowerCase().includes(flow.trigger.toLowerCase())) {
      matchedFlow = flow
      break
    }
  }

  if (matchedFlow) {
    response = matchedFlow.response
  } else if (c.env.AI) {
    // Use Workers AI for dynamic responses
    try {
      const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: `You are ${chatbot.name}, a ${chatbot.tone || 'professional'} AI assistant. ${chatbot.personality || 'You are helpful and concise.'}` },
          { role: 'user', content: message }
        ],
        max_tokens: 256,
      })
      response = (aiResponse as any).response || response
    } catch (e) {
      console.error('AI response error:', e)
    }
  }

  // Create conversation log
  const convId = session_id || crypto.randomUUID()
  const existingConv = await c.env.DB.prepare('SELECT * FROM ai_chatbot_conversations WHERE id = ?').bind(convId).first()

  if (existingConv) {
    const messages = JSON.parse(existingConv.messages as string || '[]')
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() })
    messages.push({ role: 'bot', content: response, timestamp: new Date().toISOString() })
    await c.env.DB.prepare('UPDATE ai_chatbot_conversations SET messages = ? WHERE id = ?').bind(JSON.stringify(messages), convId).run()
  } else {
    await c.env.DB.prepare(`
      INSERT INTO ai_chatbot_conversations (id, chatbot_id, session_id, contact_id, messages)
      VALUES (?, ?, ?, ?, ?)
    `).bind(convId, c.req.param('id'), session_id, contact_id, JSON.stringify([
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'bot', content: response, timestamp: new Date().toISOString() }
    ])).run()
  }

  return c.json({ response, session_id: convId })
})

// ============================================================================
// INTEGRATIONS
// ============================================================================

// Get integrations
app.get('/api/integrations', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const integrations = await c.env.DB.prepare('SELECT id, tenant_id, provider, is_active, created_at FROM integrations WHERE tenant_id = ?').bind(user.tenant_id).all()
  return c.json({ data: integrations.results })
})

// Add integration
app.post('/api/integrations', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { provider, access_token, refresh_token, expires_at, metadata } = body
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO integrations (id, tenant_id, provider, access_token, refresh_token, expires_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.tenant_id, provider, access_token, refresh_token, expires_at, JSON.stringify(metadata || {})).run()

  return c.json({ data: { id, provider } }, 201)
})

// Update integration
app.patch('/api/integrations/:provider', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { access_token, refresh_token, expires_at, is_active, metadata } = body

  const updates: string[] = []
  const params: any[] = []

  if (access_token) { updates.push('access_token = ?'); params.push(access_token) }
  if (refresh_token) { updates.push('refresh_token = ?'); params.push(refresh_token) }
  if (expires_at) { updates.push('expires_at = ?'); params.push(expires_at) }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0) }
  if (metadata) { updates.push('metadata = ?'); params.push(JSON.stringify(metadata)) }

  if (updates.length === 0) return c.json({ error: 'No updates provided' }, 400)

  params.push(c.req.param('provider'), user.tenant_id)
  await c.env.DB.prepare(`UPDATE integrations SET ${updates.join(', ')} WHERE provider = ? AND tenant_id = ?`).bind(...params).run()

  return c.json({ message: 'Integration updated' })
})

// Delete integration
app.delete('/api/integrations/:provider', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  await c.env.DB.prepare('DELETE FROM integrations WHERE provider = ? AND tenant_id = ?').bind(c.req.param('provider'), user.tenant_id).run()

  return c.json({ message: 'Integration deleted' })
})

// Integration OAuth callback
app.get('/api/integrations/:provider/callback', async (c) => {
  const { code, state } = c.req.query()
  const provider = c.req.param('provider')

  // Handle OAuth callback based on provider
  // This would redirect to the frontend with success/error
  return c.redirect(`/settings/integrations?provider=${provider}&status=callback_received`)
})

// ============================================================================
// WORKFLOW TEMPLATES & ANALYTICS
// ============================================================================

// Get workflow templates
app.get('/api/workflow-templates', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { category, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = 'SELECT * FROM workflow_templates WHERE is_public = 1'
  const params: any[] = []

  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }

  query += ' ORDER BY usage_count DESC, rating DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const templates = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: templates.results })
})

// Create workflow from template
app.post('/api/workflow-templates/:id/use', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const template = await c.env.DB.prepare('SELECT * FROM workflow_templates WHERE id = ?').bind(c.req.param('id')).first()
  if (!template) return c.json({ error: 'Template not found' }, 404)

  // Create new automation from template
  const automationId = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO automations (id, tenant_id, name, description, trigger, trigger_config, actions, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(automationId, user.tenant_id, template.name, template.description, template.trigger, template.trigger_config, template.actions, template.conditions).run()

  // Increment template usage
  await c.env.DB.prepare('UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = ?').bind(c.req.param('id')).run()

  return c.json({ data: { automation_id: automationId, name: template.name } }, 201)
})

// Get workflow executions (analytics)
app.get('/api/workflow-executions', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { workflow_id, status, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = `SELECT we.*, a.name as workflow_name FROM workflow_executions we
    JOIN automations a ON we.workflow_id = a.id
    WHERE a.tenant_id = ?`
  const params: any[] = [user.tenant_id]

  if (workflow_id) {
    query += ' AND we.workflow_id = ?'
    params.push(workflow_id)
  }
  if (status) {
    query += ' AND we.status = ?'
    params.push(status)
  }

  query += ' ORDER BY we.started_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const executions = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: executions.results })
})

// Get workflow execution stats
app.get('/api/workflow-executions/stats', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { workflow_id } = c.req.query()

  let query = `SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    AVG(CASE WHEN execution_time > 0 THEN execution_time ELSE NULL END) as avg_execution_time
  FROM workflow_executions we
  JOIN automations a ON we.workflow_id = a.id
  WHERE a.tenant_id = ?`
  const params: any[] = [user.tenant_id]

  if (workflow_id) {
    query += ' AND we.workflow_id = ?'
    params.push(workflow_id)
  }

  const stats = await c.env.DB.prepare(query).bind(...params).first()
  return c.json({ data: stats })
})

// ============================================================================
// PUBLIC PORTAL API (No Auth Required - For Customer Portal)
// ============================================================================

// Public Knowledge Base - no auth required
app.get('/api/public/kb/articles', async (c) => {
  const { category, search, page = '1', limit = '10' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = 'SELECT id, title, content, category, excerpt, tags, author_name, views_count, helpful_score, status, created_at, updated_at FROM knowledge_base_articles WHERE status = ?'
  const params: any[] = ['published']

  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }
  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)'
    const searchTerm = `%${search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  query += ' ORDER BY views_count DESC, helpful_score DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const articles = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: articles.results })
})

// Public Knowledge Base - single article
app.get('/api/public/kb/articles/:id', async (c) => {
  const article = await c.env.DB.prepare(
    'SELECT id, title, content, category, excerpt, tags, author_name, views_count, helpful_score, status, created_at, updated_at FROM knowledge_base_articles WHERE id = ? AND status = ?'
  ).bind(c.req.param('id'), 'published').first()

  if (!article) return c.json({ error: 'Article not found' }, 404)

  // Increment views
  await c.env.DB.prepare('UPDATE knowledge_base_articles SET views_count = views_count + 1 WHERE id = ?').bind(c.req.param('id')).run()

  return c.json({ data: article })
})

// Public Knowledge Base - categories
app.get('/api/public/kb/categories', async (c) => {
  const categories = await c.env.DB.prepare(`
    SELECT c.id, c.name, c.description, c.icon, c.sort_order,
           COUNT(a.id) as article_count
    FROM knowledge_base_categories c
    LEFT JOIN knowledge_base_articles a ON a.category = c.name AND a.status = 'published'
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all()

  return c.json({ data: categories.results })
})

// Public ticket submission (for customers without account)
app.post('/api/public/tickets', async (c) => {
  try {
    const body = await c.req.json()
    const { subject, description, email, name, category, priority } = body

    if (!subject || !email || !name) {
      return c.json({ error: 'Name, email, and subject are required' }, 400)
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email address' }, 400)
    }

    const ticketId = crypto.randomUUID()
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

    // Create a placeholder contact or find existing
    let contactId: string | null = null

    // For public tickets, we create a simple contact record
    const existingContact = await c.env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first()
    if (existingContact) {
      contactId = existingContact.id
    }

    // Create ticket in helpdesk
    await c.env.DB.prepare(`
      INSERT INTO helpdesk_tickets (id, tenant_id, ticket_number, subject, description, priority, category, channel, contact_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ticketId,
      'default', // tenant_id - in production would need proper routing
      ticketNumber,
      subject,
      description || '',
      priority || 'medium',
      category || 'General',
      'portal',
      contactId,
      'open'
    ).run()

    return c.json({
      data: {
        id: ticketId,
        ticket_number: ticketNumber,
        status: 'open',
        message: 'Your ticket has been submitted successfully. You will receive an email confirmation.'
      }
    }, 201)
  } catch (err) {
    console.error('Public ticket creation error:', err)
    return c.json({ error: 'Failed to create ticket' }, 500)
  }
})

// Check ticket status (public - by ticket number and email)
app.get('/api/public/tickets/:ticketNumber', async (c) => {
  const { ticketNumber } = c.req.param()
  const { email } = c.req.query()

  if (!email) {
    return c.json({ error: 'Email is required to view ticket status' }, 400)
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }

  const ticket = await c.env.DB.prepare(`
    SELECT ht.id, ht.ticket_number, ht.subject, ht.status, ht.priority, ht.category,
           ht.created_at, ht.updated_at,
           COUNT(htm.id) as message_count
    FROM helpdesk_tickets ht
    LEFT JOIN helpdesk_ticket_messages htm ON htm.ticket_id = ht.id AND htm.is_internal = 0
    WHERE ht.ticket_number = ?
    GROUP BY ht.id
  `).bind(ticketNumber).first()

  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }

  return c.json({ data: ticket })
})

// ============================================================================
// QUOTES API
// ============================================================================

// List quotes
app.get('/api/quotes', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { status, search } = c.req.query()

  try {
    let query = 'SELECT * FROM quotes WHERE tenant_id = ?'
    const params: any[] = [tenantId]

    if (status && status !== 'all') {
      query += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      query += ' AND (title LIKE ? OR contact_name LIKE ? OR number LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    query += ' ORDER BY created_at DESC'

    const quotes = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ data: quotes.results })
  } catch (err) {
    console.error('Get quotes error:', err)
    return c.json({ error: 'Failed to fetch quotes' }, 500)
  }
})

// Create quote
app.post('/api/quotes', zValidator('json', z.object({
  title: z.string(),
  contactId: z.string().optional(),
  contactName: z.string(),
  contactEmail: z.string().email().optional(),
  contactCompany: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  validUntil: z.string(),
  notes: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const data = c.req.valid('json')

  try {
    const quoteId = crypto.randomUUID()
    const number = `QT-${Date.now()}`
    const value = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    await c.env.DB.prepare(`
      INSERT INTO quotes (id, tenant_id, number, title, contact_id, contact_name, contact_email, contact_company, value, items, valid_until, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      quoteId, tenantId, number, data.title, data.contactId || null,
      data.contactName, data.contactEmail || null, data.contactCompany || null,
      value, JSON.stringify(data.items), data.validUntil, data.notes || null
    ).run()

    return c.json({ data: { id: quoteId, number, value, status: 'draft' } }, 201)
  } catch (err) {
    console.error('Create quote error:', err)
    return c.json({ error: 'Failed to create quote' }, 500)
  }
})

// Get quote by ID
app.get('/api/quotes/:id', async (c) => {
  const { id } = c.req.param()

  const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first()

  if (!quote) {
    return c.json({ error: 'Quote not found' }, 404)
  }

  return c.json({ data: quote })
})

// Update quote
app.put('/api/quotes/:id', zValidator('json', z.object({
  title: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactCompany: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })).optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional()
})), async (c) => {
  const { id } = c.req.param()
  const data = c.req.valid('json')

  try {
    const existing = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first()
    if (!existing) {
      return c.json({ error: 'Quote not found' }, 404)
    }

    let value = existing.value
    if (data.items) {
      value = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const updates: string[] = []
    const params: any[] = []

    if (data.title) { updates.push('title = ?'); params.push(data.title) }
    if (data.contactName) { updates.push('contact_name = ?'); params.push(data.contactName) }
    if (data.contactEmail) { updates.push('contact_email = ?'); params.push(data.contactEmail) }
    if (data.contactCompany) { updates.push('contact_company = ?'); params.push(data.contactCompany) }
    if (data.items) { updates.push('items = ?'); params.push(JSON.stringify(data.items)) }
    if (data.validUntil) { updates.push('valid_until = ?'); params.push(data.validUntil) }
    if (data.notes !== undefined) { updates.push('notes = ?'); params.push(data.notes) }
    if (data.status) {
      updates.push('status = ?')
      params.push(data.status)
      if (data.status === 'sent') {
        updates.push('sent_at = ?')
        params.push(new Date().toISOString())
      } else if (data.status === 'accepted') {
        updates.push('accepted_at = ?')
        params.push(new Date().toISOString())
      } else if (data.status === 'rejected') {
        updates.push('rejected_at = ?')
        params.push(new Date().toISOString())
      }
    }
    updates.push('value = ?')
    params.push(value)
    updates.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(id)

    await c.env.DB.prepare(`UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()

    return c.json({ data: { id, ...data, value } })
  } catch (err) {
    console.error('Update quote error:', err)
    return c.json({ error: 'Failed to update quote' }, 500)
  }
})

// Delete quote
app.delete('/api/quotes/:id', async (c) => {
  const { id } = c.req.param()

  try {
    await c.env.DB.prepare('DELETE FROM quotes WHERE id = ?').bind(id).run()
    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Delete quote error:', err)
    return c.json({ error: 'Failed to delete quote' }, 500)
  }
})

// Send quote to client
app.post('/api/quotes/:id/send', async (c) => {
  const { id } = c.req.param()

  try {
    const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first()
    if (!quote) {
      return c.json({ error: 'Quote not found' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE quotes SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), id).run()

    return c.json({ data: { success: true, message: 'Quote sent to client' } })
  } catch (err) {
    console.error('Send quote error:', err)
    return c.json({ error: 'Failed to send quote' }, 500)
  }
})

// Duplicate quote
app.post('/api/quotes/:id/duplicate', async (c) => {
  const { id } = c.req.param()

  try {
    const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first()
    if (!quote) {
      return c.json({ error: 'Quote not found' }, 404)
    }

    const newId = crypto.randomUUID()
    const number = `QT-${Date.now()}`

    await c.env.DB.prepare(`
      INSERT INTO quotes (id, tenant_id, number, title, contact_id, contact_name, contact_email, contact_company, value, items, valid_until, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      newId, quote.tenant_id, number, quote.title + ' (Copy)',
      quote.contact_id, quote.contact_name, quote.contact_email, quote.contact_company,
      quote.value, quote.items, quote.valid_until, quote.notes
    ).run()

    return c.json({ data: { id: newId, number } }, 201)
  } catch (err) {
    console.error('Duplicate quote error:', err)
    return c.json({ error: 'Failed to duplicate quote' }, 500)
  }
})

// ============================================================================
// INVOICES API
// ============================================================================

// List invoices
app.get('/api/invoices', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { status, search } = c.req.query()

  try {
    let query = 'SELECT * FROM invoices WHERE tenant_id = ?'
    const params: any[] = [tenantId]

    if (status && status !== 'all') {
      query += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      query += ' AND (title LIKE ? OR contact_name LIKE ? OR number LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    query += ' ORDER BY created_at DESC'

    const invoices = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ data: invoices.results })
  } catch (err) {
    console.error('Get invoices error:', err)
    return c.json({ error: 'Failed to fetch invoices' }, 500)
  }
})

// Create invoice
app.post('/api/invoices', zValidator('json', z.object({
  title: z.string(),
  quoteId: z.string().optional(),
  contactId: z.string().optional(),
  contactName: z.string(),
  contactEmail: z.string().email().optional(),
  contactCompany: z.string().optional(),
  contactAddress: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const data = c.req.valid('json')

  try {
    const invoiceId = crypto.randomUUID()
    const number = `INV-${Date.now()}`
    const value = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    await c.env.DB.prepare(`
      INSERT INTO invoices (id, tenant_id, number, title, quote_id, contact_id, contact_name, contact_email, contact_company, contact_address, value, items, issue_date, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      invoiceId, tenantId, number, data.title, data.quoteId || null,
      data.contactId || null, data.contactName, data.contactEmail || null,
      data.contactCompany || null, data.contactAddress || null,
      value, JSON.stringify(data.items), data.issueDate, data.dueDate, data.notes || null
    ).run()

    return c.json({ data: { id: invoiceId, number, value, status: 'draft' } }, 201)
  } catch (err) {
    console.error('Create invoice error:', err)
    return c.json({ error: 'Failed to create invoice' }, 500)
  }
})

// Get invoice by ID
app.get('/api/invoices/:id', async (c) => {
  const { id } = c.req.param()

  const invoice = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first()

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }

  return c.json({ data: invoice })
})

// Update invoice
app.put('/api/invoices/:id', zValidator('json', z.object({
  title: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactCompany: z.string().optional(),
  contactAddress: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded']).optional()
})), async (c) => {
  const { id } = c.req.param()
  const data = c.req.valid('json')

  try {
    const existing = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first()
    if (!existing) {
      return c.json({ error: 'Invoice not found' }, 404)
    }

    let value = existing.value
    if (data.items) {
      value = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const updates: string[] = []
    const params: any[] = []

    if (data.title) { updates.push('title = ?'); params.push(data.title) }
    if (data.contactName) { updates.push('contact_name = ?'); params.push(data.contactName) }
    if (data.contactEmail) { updates.push('contact_email = ?'); params.push(data.contactEmail) }
    if (data.contactCompany) { updates.push('contact_company = ?'); params.push(data.contactCompany) }
    if (data.contactAddress) { updates.push('contact_address = ?'); params.push(data.contactAddress) }
    if (data.items) { updates.push('items = ?'); params.push(JSON.stringify(data.items)) }
    if (data.issueDate) { updates.push('issue_date = ?'); params.push(data.issueDate) }
    if (data.dueDate) { updates.push('due_date = ?'); params.push(data.dueDate) }
    if (data.notes !== undefined) { updates.push('notes = ?'); params.push(data.notes) }
    if (data.status) {
      updates.push('status = ?')
      params.push(data.status)
      if (data.status === 'paid') {
        updates.push('paid_date = ?')
        params.push(new Date().toISOString())
      }
    }
    updates.push('value = ?')
    params.push(value)
    updates.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(id)

    await c.env.DB.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()

    return c.json({ data: { id, ...data, value } })
  } catch (err) {
    console.error('Update invoice error:', err)
    return c.json({ error: 'Failed to update invoice' }, 500)
  }
})

// Delete invoice
app.delete('/api/invoices/:id', async (c) => {
  const { id } = c.req.param()

  try {
    await c.env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run()
    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Delete invoice error:', err)
    return c.json({ error: 'Failed to delete invoice' }, 500)
  }
})

// Send invoice to client
app.post('/api/invoices/:id/send', async (c) => {
  const { id } = c.req.param()

  try {
    const invoice = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first()
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE invoices SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), id).run()

    return c.json({ data: { success: true, message: 'Invoice sent to client' } })
  } catch (err) {
    console.error('Send invoice error:', err)
    return c.json({ error: 'Failed to send invoice' }, 500)
  }
})

// Mark invoice as paid
app.post('/api/invoices/:id/paid', async (c) => {
  const { id } = c.req.param()

  try {
    const invoice = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first()
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE invoices SET status = 'paid', paid_date = ?, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), id).run()

    return c.json({ data: { success: true, message: 'Invoice marked as paid' } })
  } catch (err) {
    console.error('Mark invoice paid error:', err)
    return c.json({ error: 'Failed to mark invoice as paid' }, 500)
  }
})

// ============================================================================
// PAYMENTS API (Stripe)
// ============================================================================

// Create payment for invoice
app.post('/api/payments', zValidator('json', z.object({
  invoiceId: z.string(),
  amount: z.number()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { invoiceId, amount } = c.req.valid('json')

  try {
    const paymentId = crypto.randomUUID()
    const stripePaymentIntentId = `pi_${crypto.randomUUID().slice(2)}`

    await c.env.DB.prepare(`
      INSERT INTO payments (id, tenant_id, invoice_id, amount, stripe_payment_intent_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(paymentId, tenantId, invoiceId, amount, stripePaymentIntentId).run()

    return c.json({
      data: {
        id: paymentId,
        clientSecret: `${stripePaymentIntentId}_secret`,
        amount
      }
    }, 201)
  } catch (err) {
    console.error('Create payment error:', err)
    return c.json({ error: 'Failed to create payment' }, 500)
  }
})

// Get payments for invoice
app.get('/api/payments/invoice/:invoiceId', async (c) => {
  const { invoiceId } = c.req.param()

  const payments = await c.env.DB.prepare(
    'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC'
  ).bind(invoiceId).all()

  return c.json({ data: payments.results })
})

// Webhook for Stripe payment events
app.post('/api/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature')
  const body = await c.req.text()

  try {
    const event = JSON.parse(body)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object

      await c.env.DB.prepare(`
        UPDATE payments SET status = 'completed', paid_at = ? WHERE stripe_payment_intent_id = ?
      `).bind(new Date().toISOString(), paymentIntent.id).run()

      // Update associated invoice
      const payment = await c.env.DB.prepare(
        'SELECT * FROM payments WHERE stripe_payment_intent_id = ?'
      ).bind(paymentIntent.id).first()

      if (payment) {
        await c.env.DB.prepare(`
          UPDATE invoices SET status = 'paid', paid_date = ?, updated_at = ? WHERE id = ?
        `).bind(new Date().toISOString(), new Date().toISOString(), payment.invoice_id).run()
      }
    }

    return c.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return c.json({ error: 'Webhook processing failed' }, 400)
  }
})

// ============================================================================
// STRIPE SUBSCRIPTION API
// ============================================================================

// Create Stripe checkout session for subscription upgrade
app.post('/api/stripe/checkout', zValidator('json', z.object({
  priceId: z.string()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { priceId } = c.req.valid('json')

  try {
    // In production, this would create a real Stripe checkout session
    // For now, return a mock session ID for development
    const checkoutSessionId = `cs_${crypto.randomUUID().slice(2)}`
    const successUrl = `${c.req.header('origin') || 'http://localhost:3000'}/settings?success=true`
    const cancelUrl = `${c.req.header('origin') || 'http://localhost:3000'}/settings?canceled=true`

    // Store pending checkout in KV
    await c.env.KV.put(`checkout:${checkoutSessionId}`, JSON.stringify({
      tenantId,
      priceId,
      createdAt: new Date().toISOString()
    }), { expirationTtl: 3600 })

    return c.json({
      data: {
        sessionId: checkoutSessionId,
        url: `https://checkout.stripe.com/c/pay/${checkoutSessionId}#fidkdWxOYHwnPyd1blpxYHZxWjA0TjE8YGRhZz1NNTJhMmZhZ3志`
      }
    })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

// Create Stripe customer portal session
app.post('/api/stripe/portal', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user

  try {
    // In production, this would create a real Stripe portal session
    const portalSessionId = `bps_${crypto.randomUUID().slice(2)}`

    return c.json({
      data: {
        url: `https://billing.stripe.com/session/${portalSessionId}`
      }
    })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return c.json({ error: 'Failed to create portal session' }, 500)
  }
})

// Get subscription status
app.get('/api/stripe/subscription', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user

  try {
    // Get tenant's subscription from database
    const tenant = await c.env.DB.prepare(`
      SELECT plan, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_expires_at
      FROM tenants WHERE id = ?
    `).bind(tenantId).first()

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404)
    }

    return c.json({
      data: {
        plan: tenant.plan || 'free',
        status: tenant.subscription_status || 'inactive',
        expiresAt: tenant.subscription_expires_at,
        customerId: tenant.stripe_customer_id
      }
    })
  } catch (err) {
    console.error('Get subscription error:', err)
    return c.json({ error: 'Failed to get subscription' }, 500)
  }
})

// Update subscription (webhook handler for Stripe events)
app.post('/api/stripe/subscription/update', zValidator('json', z.object({
  subscriptionId: z.string(),
  status: z.string(),
  plan: z.string(),
  expiresAt: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { subscriptionId, status, plan, expiresAt } = c.req.valid('json')

  try {
    await c.env.DB.prepare(`
      UPDATE tenants SET
        stripe_subscription_id = ?,
        subscription_status = ?,
        plan = ?,
        subscription_expires_at = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(subscriptionId, status, plan, expiresAt || null, new Date().toISOString(), tenantId).run()

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Update subscription error:', err)
    return c.json({ error: 'Failed to update subscription' }, 500)
  }
})

// ============================================================================
// NOTIFICATIONS & REAL-TIME API
// ============================================================================

// Get notifications for user
app.get('/api/notifications', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId, userId } = user
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')
  const unreadOnly = c.req.query('unread') === 'true'

  try {
    let query = 'SELECT * FROM notifications WHERE user_id = ? AND tenant_id = ?'
    if (unreadOnly) {
      query += ' AND read_at IS NULL'
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

    const notifications = await c.env.DB.prepare(query)
      .bind(userId, tenantId, limit, offset)
      .all()

    const unreadCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND tenant_id = ? AND read_at IS NULL'
    ).bind(userId, tenantId).first()

    return c.json({
      data: notifications.results,
      unreadCount: unreadCount?.count || 0
    })
  } catch (err) {
    console.error('Get notifications error:', err)
    return c.json({ error: 'Failed to get notifications' }, 500)
  }
})

// Create notification
app.post('/api/notifications', zValidator('json', z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string().optional(),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { userId, type, title, message, data, actionUrl } = c.req.valid('json')

  try {
    const notificationId = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO notifications (id, tenant_id, user_id, type, title, message, data, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(notificationId, tenantId, userId, type, title, message || null, JSON.stringify(data || {}), actionUrl || null).run()

    return c.json({ data: { id: notificationId } }, 201)
  } catch (err) {
    console.error('Create notification error:', err)
    return c.json({ error: 'Failed to create notification' }, 500)
  }
})

// Mark notification as read
app.put('/api/notifications/:id/read', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { id } = c.req.param()
  const { userId } = user

  try {
    await c.env.DB.prepare(`
      UPDATE notifications SET read_at = ?, read_by = ? WHERE id = ? AND user_id = ?
    `).bind(new Date().toISOString(), userId, id, userId).run()

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Mark read error:', err)
    return c.json({ error: 'Failed to mark as read' }, 500)
  }
})

// Mark all notifications as read
app.post('/api/notifications/read-all', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId, userId } = user

  try {
    await c.env.DB.prepare(`
      UPDATE notifications SET read_at = ?, read_by = ? WHERE user_id = ? AND tenant_id = ? AND read_at IS NULL
    `).bind(new Date().toISOString(), userId, userId, tenantId).run()

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Mark all read error:', err)
    return c.json({ error: 'Failed to mark all as read' }, 500)
  }
})

// Delete notification
app.delete('/api/notifications/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { id } = c.req.param()

  try {
    await c.env.DB.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run()
    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Delete notification error:', err)
    return c.json({ error: 'Failed to delete notification' }, 500)
  }
})

// ============================================================================
// PUSH SUBSCRIPTIONS API
// ============================================================================

// Register push subscription
app.post('/api/push/subscribe', zValidator('json', z.object({
  endpoint: z.string(),
  keys_p256dh: z.string(),
  keys_auth: z.string(),
  expiresAt: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId, userId } = user
  const { endpoint, keys_p256dh, keys_auth, expiresAt } = c.req.valid('json')

  try {
    // Delete existing subscription for this endpoint
    await c.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run()

    const subscriptionId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO push_subscriptions (id, user_id, tenant_id, endpoint, keys_p256dh, keys_auth, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(subscriptionId, userId, tenantId, endpoint, keys_p256dh, keys_auth, expiresAt || null).run()

    return c.json({ data: { id: subscriptionId } }, 201)
  } catch (err) {
    console.error('Subscribe error:', err)
    return c.json({ error: 'Failed to subscribe' }, 500)
  }
})

// Get push subscriptions for user
app.get('/api/push/subscriptions', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { userId } = user

  try {
    const subscriptions = await c.env.DB.prepare(
      'SELECT id, endpoint, expires_at, last_used_at, created_at FROM push_subscriptions WHERE user_id = ?'
    ).bind(userId).all()

    return c.json({ data: subscriptions.results })
  } catch (err) {
    console.error('Get subscriptions error:', err)
    return c.json({ error: 'Failed to get subscriptions' }, 500)
  }
})

// Delete push subscription
app.delete('/api/push/unsubscribe', zValidator('json', z.object({
  endpoint: z.string()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { endpoint } = c.req.valid('json')

  try {
    await c.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run()
    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Unsubscribe error:', err)
    return c.json({ error: 'Failed to unsubscribe' }, 500)
  }
})

// ============================================================================
// WEBSOCKET REAL-TIME API
// ============================================================================

// WebSocket endpoint upgrade
app.get('/ws', async (c) => {
  // This would be handled by the Worker with WebSocket support
  // The Durable Object handles the actual WebSocket connections
  return c.json({
    message: 'WebSocket endpoint - connect via ws://host/ws?tenantId=xxx&userId=xxx',
    durableObject: 'WebSocketServer'
  })
})

// Send real-time message to tenant
app.post('/api/ws/send', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { message, excludeConnectionId } = await c.req.json().catch(() => ({}))

  try {
    // Get the Durable Object stub
    const id = c.env.WEBSOCKET.idFromName('websocket-' + tenantId)
    const stub = c.env.WEBSOCKET.get(id)

    // Send to DO
    const response = await stub.fetch('/api/ws/send', {
      method: 'POST',
      body: JSON.stringify({ tenantId, message, excludeConnectionId })
    })

    return c.json({ success: true })
  } catch (err) {
    console.error('WebSocket send error:', err)
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

// Send notification to specific user via WebSocket
app.post('/api/ws/notify', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId, userId, notification } = await c.req.json().catch(() => ({}))

  if (!userId || !notification) {
    return c.json({ error: 'Missing userId or notification' }, 400)
  }

  try {
    const id = c.env.WEBSOCKET.idFromName('websocket-' + tenantId)
    const stub = c.env.WEBSOCKET.get(id)

    await stub.fetch('/api/ws/notify', {
      method: 'POST',
      body: JSON.stringify({ tenantId, userId, notification })
    })

    return c.json({ success: true })
  } catch (err) {
    console.error('WebSocket notify error:', err)
    return c.json({ error: 'Failed to send notification' }, 500)
  }
})

// Get connection count for tenant
app.get('/api/ws/connections', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user

  try {
    const id = c.env.WEBSOCKET.idFromName('websocket-' + tenantId)
    const stub = c.env.WEBSOCKET.get(id)

    const response = await stub.fetch('/api/ws/connections/' + tenantId)
    const data = await response.json()

    return c.json(data)
  } catch (err) {
    console.error('WebSocket connections error:', err)
    return c.json({ count: 0 })
  }
})

// ============================================================================
// DOCUMENT UPLOAD API (R2)
// ============================================================================

// Upload document to R2
app.post('/api/documents/upload', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const contentType = c.req.header('content-type') || 'application/octet-stream'
  const fileName = c.req.header('x-filename') || 'document'

  try {
    const arrayBuffer = await c.req.arrayBuffer()
    const key = `${tenantId}/documents/${crypto.randomUUID()}-${fileName}`

    await c.env.ASSETS.put(key, arrayBuffer, {
      httpMetadata: {
        contentType
      }
    })

    const documentId = crypto.randomUUID()

    // Store metadata in database
    await c.env.DB.prepare(`
      INSERT INTO documents (id, tenant_id, user_id, filename, content_type, size, storage_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(documentId, tenantId, user.userId, fileName, contentType, arrayBuffer.byteLength, key).run()

    return c.json({
      data: {
        id: documentId,
        filename: fileName,
        contentType,
        size: arrayBuffer.byteLength,
        url: `/api/documents/${documentId}`
      }
    }, 201)
  } catch (err) {
    console.error('Document upload error:', err)
    return c.json({ error: 'Failed to upload document' }, 500)
  }
})

// Get document metadata
app.get('/api/documents/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { id } = c.req.param()

  try {
    const doc = await c.env.DB.prepare(`
      SELECT id, tenant_id, filename, content_type, size, created_at
      FROM documents WHERE id = ? AND tenant_id = ?
    `).bind(id, tenantId).first()

    if (!doc) {
      return c.json({ error: 'Document not found' }, 404)
    }

    return c.json({ data: doc })
  } catch (err) {
    console.error('Get document error:', err)
    return c.json({ error: 'Failed to get document' }, 500)
  }
})

// Download document
app.get('/api/documents/:id/download', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { id } = c.req.param()

  try {
    const doc = await c.env.DB.prepare(`
      SELECT filename, content_type, storage_key FROM documents WHERE id = ? AND tenant_id = ?
    `).bind(id, tenantId).first() as any

    if (!doc) {
      return c.json({ error: 'Document not found' }, 404)
    }

    const object = await c.env.ASSETS.get(doc.storage_key)

    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404)
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': doc.content_type,
        'Content-Disposition': `attachment; filename="${doc.filename}"`
      }
    })
  } catch (err) {
    console.error('Download document error:', err)
    return c.json({ error: 'Failed to download document' }, 500)
  }
})

// Delete document
app.delete('/api/documents/:id', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const { id } = c.req.param()

  try {
    const doc = await c.env.DB.prepare(`
      SELECT storage_key FROM documents WHERE id = ? AND tenant_id = ?
    `).bind(id, tenantId).first() as any

    if (!doc) {
      return c.json({ error: 'Document not found' }, 404)
    }

    // Delete from R2
    await c.env.ASSETS.delete(doc.storage_key)

    // Delete from database
    await c.env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run()

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Delete document error:', err)
    return c.json({ error: 'Failed to delete document' }, 500)
  }
})

// List documents
app.get('/api/documents', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { tenantId } = user
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')

  try {
    const docs = await c.env.DB.prepare(`
      SELECT id, filename, content_type, size, created_at
      FROM documents WHERE tenant_id = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(tenantId, limit, offset).all()

    return c.json({ data: docs.results })
  } catch (err) {
    console.error('List documents error:', err)
    return c.json({ error: 'Failed to list documents' }, 500)
  }
})

// ============================================================================
// LLM INTEGRATIONS API (OpenRouter + HuggingFace)
// ============================================================================

// Import LLM clients
import { createOpenRouterClient, getFreeModel, selectModel, OPENROUTER_MODELS } from './llm/openrouter'
import { createHuggingFaceClient, selectHuggingFaceModel, HUGGINGFACE_MODELS } from './llm/huggingface'
import { createSuperOrchestrator } from './agents/orchestrator'

// Get available models
app.get('/api/llm/models', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  return c.json({
    providers: {
      openrouter: OPENROUTER_MODELS,
      huggingface: HUGGINGFACE_MODELS,
      cloudflare: {
        '@cf/meta/llama-3.1-8b-instruct': { name: 'Llama 3.1 8B', context: 128000 },
        '@cf/meta/llama-3.1-70b-instruct': { name: 'Llama 3.1 70B', context: 128000 },
        '@cf/meta/llama-3.1-8b-instruct': { name: 'Llama 3.1 8B', context: 128000 }
      }
    }
  })
})

// Chat completion with configurable LLM
app.post('/api/llm/chat', zValidator('json', z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().max(4000).default(2000)
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { model, messages, temperature, maxTokens } = c.req.valid('json')

  try {
    // Route to appropriate provider
    if (model.startsWith('meta-llama') || model.startsWith('mistralai') || model.startsWith('qwen') || model.startsWith('google/')) {
      // Use OpenRouter
      const client = createOpenRouterClient(c.env)
      if (!client) return c.json({ error: 'OpenRouter not configured' }, 503)
      const response = await client.chat({ model, messages, temperature, max_tokens: maxTokens })
      return c.json({ data: response })
    } else if (model.startsWith('sentence-transformers') || model.startsWith('microsoft/') || model.startsWith('facebook/')) {
      // Use HuggingFace
      const client = createHuggingFaceClient(c.env)
      if (!client) return c.json({ error: 'HuggingFace not configured' }, 503)
      const embedding = await client.embeddings(model, messages[messages.length - 1]?.content || '')
      return c.json({ data: { embedding } })
    } else {
      // Use Cloudflare Workers AI
      const response = await c.env.AI.run(model, {
        messages,
        temperature,
        max_tokens: maxTokens
      })
      return c.json({ data: { response: (response as any).response } })
    }
  } catch (err) {
    console.error('LLM chat error:', err)
    return c.json({ error: 'LLM request failed' }, 500)
  }
})

// Get embeddings
app.post('/api/llm/embeddings', zValidator('json', z.object({
  model: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),
  input: z.union([z.string(), z.array(z.string())])
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { model, input } = c.req.valid('json')

  try {
    // Use HuggingFace for embeddings
    const client = createHuggingFaceClient(c.env)
    if (!client) return c.json({ error: 'HuggingFace not configured' }, 503)
    const text = Array.isArray(input) ? input[0] : input
    const embedding = await client.embeddings(model, text)

    return c.json({ data: { embedding, model } })
  } catch (err) {
    console.error('Embeddings error:', err)
    return c.json({ error: 'Embedding generation failed' }, 500)
  }
})

// ============================================================================
// SUPER ORCHESTRATOR AGENT API
// ============================================================================

// Execute agent task
app.post('/api/agents/execute', zValidator('json', z.object({
  task: z.string(),
  context: z.record(z.any()).optional(),
  agentType: z.enum(['orchestrator', 'research', 'planning', 'execution', 'review', 'optimization']).default('orchestrator'),
  model: z.string().optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { task, context, agentType, model } = c.req.valid('json')

  try {
    const orchestrator = createSuperOrchestrator(c.env as any)
    const result = await orchestrator.execute(task, context || {})

    return c.json({
      data: {
        taskId: result.id,
        status: result.status,
        result: result.result,
        metadata: result.metadata
      }
    })
  } catch (err) {
    console.error('Agent execution error:', err)
    return c.json({ error: 'Agent execution failed' }, 500)
  }
})

// Get agent metrics
app.get('/api/agents/metrics', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const orchestrator = createSuperOrchestrator(c.env as any)
  const metrics = orchestrator.getMetrics()
  const health = orchestrator.getHealthStatus()

  return c.json({
    data: {
      metrics,
      health,
      totalTasks: Object.values(metrics).reduce((sum, m) => sum + m.totalTasks, 0),
      successRate: Object.values(metrics).reduce((sum, m) => sum + m.successRate, 0) / Object.keys(metrics).length
    }
  })
})

// Submit agent feedback for self-improvement
app.post('/api/agents/feedback', zValidator('json', z.object({
  taskId: z.string(),
  agentType: z.enum(['orchestrator', 'research', 'planning', 'execution', 'review', 'optimization']),
  rating: z.number().min(1).max(5),
  feedback: z.string(),
  improvements: z.array(z.string()).optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { taskId, agentType, rating, feedback, improvements } = c.req.valid('json')

  try {
    const orchestrator = createSuperOrchestrator(c.env as any)
    await orchestrator.submitFeedback(taskId, agentType, rating, feedback, improvements)

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Feedback submission error:', err)
    return c.json({ error: 'Failed to submit feedback' }, 500)
  }
})

// Trigger self-improvement cycle
app.post('/api/agents/improve', zValidator('json', z.object({
  agentType: z.enum(['orchestrator', 'research', 'planning', 'execution', 'review', 'optimization']).optional()
})), async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { agentType } = c.req.valid('json')

  try {
    const orchestrator = createSuperOrchestrator(c.env as any)
    const result = await orchestrator.triggerSelfImprovement(agentType)

    return c.json({ data: result })
  } catch (err) {
    console.error('Self-improvement error:', err)
    return c.json({ error: 'Self-improvement failed' }, 500)
  }
})

// Get agent status
app.get('/api/agents/status', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const orchestrator = createSuperOrchestrator(c.env as any)
  const health = orchestrator.getHealthStatus()

  return c.json({
    data: {
      healthy: health.healthy,
      issues: health.issues,
      timestamp: new Date().toISOString()
    }
  })
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('EdgeForce API Error:', err)
  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500)
})

export default app