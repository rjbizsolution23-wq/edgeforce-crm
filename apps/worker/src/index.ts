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