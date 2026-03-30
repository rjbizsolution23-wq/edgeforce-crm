-- EdgeForce CRM Database Schema
-- Cloudflare D1 (SQLite at the edge)
-- Built by RJ Business Solutions | 2026-03-29

-- ============================================================================
-- TENANTS (Multi-tenant SaaS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')),
  max_users INTEGER DEFAULT 5,
  max_contacts INTEGER DEFAULT 1000,
  max_deals INTEGER DEFAULT 500,
  settings TEXT DEFAULT '{}', -- JSON blob for tenant settings
  custom_domains TEXT DEFAULT '[]', -- JSON array of domains
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- USERS & AUTH
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- argon2id
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions TEXT DEFAULT '[]', -- JSON array of permission strings
  last_login TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- CONTACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  source TEXT DEFAULT 'manual', -- manual, import, webhook, form, api
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT DEFAULT 'new' CHECK(lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK(lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified', 'sales_qualified', 'customer', 'evangelist')),
  tags TEXT DEFAULT '[]',
  custom_fields TEXT DEFAULT '{}',
  last_contacted TEXT,
  next_task TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- COMPANIES (Account-level for B2B)
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT CHECK(size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  annual_revenue TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  logo_url TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  facebook_url TEXT,
  custom_fields TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- DEALS & PIPELINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stages TEXT DEFAULT '[]', -- JSON array of stage objects
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  contact_id TEXT,
  company_id TEXT,
  owner_id TEXT,
  name TEXT NOT NULL,
  value REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT NOT NULL,
  probability INTEGER DEFAULT 0,
  expected_close_date TEXT,
  closed_at TEXT,
  closed_reason TEXT,
  loss_reason TEXT,
  tags TEXT DEFAULT '[]',
  custom_fields TEXT DEFAULT '{}',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- TASKS & ACTIVITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_id TEXT,
  assigned_to TEXT,
  deal_id TEXT,
  contact_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'task' CHECK(type IN ('task', 'call', 'email', 'meeting', 'demo', 'follow_up')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TEXT,
  completed_at TEXT,
  reminder TEXT,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  contact_id TEXT,
  deal_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('email_sent', 'email_opened', 'email_clicked', 'call_made', 'call_received', 'meeting_scheduled', 'meeting_completed', 'note_added', 'task_completed', 'deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost', 'form_submitted', 'page_viewed', 'custom')),
  subject TEXT,
  body TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);

-- ============================================================================
-- EMAILS & SEQUENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_sequences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps TEXT DEFAULT '[]', -- JSON array of step objects
  trigger_type TEXT CHECK(trigger_type IN ('manual', 'contact_created', 'deal_stage', 'tag_added', 'form_submitted')),
  trigger_value TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sequence_id TEXT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  target_filter TEXT, -- JSON filter criteria
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  scheduled_at TEXT,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE SET NULL
);

-- ============================================================================
-- SMS & COMMUNICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  target_filter TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  channel TEXT DEFAULT 'email' CHECK(channel IN ('email', 'sms', 'chat', 'whatsapp')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'pending', 'resolved', 'spam')),
  assigned_to TEXT,
  last_message_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  direction TEXT CHECK(direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK(status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  sent_at TEXT,
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================================================
-- FORMS & LANDING PAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  fields TEXT DEFAULT '[]',
  style TEXT DEFAULT '{}',
  integrations TEXT DEFAULT '{}',
  redirect_url TEXT,
  thank_you_message TEXT,
  notifications TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  form_id TEXT NOT NULL,
  contact_id TEXT,
  data TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  form_id TEXT,
  published INTEGER DEFAULT 0,
  published_at TEXT,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, slug)
);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('pipeline', 'activity', 'revenue', 'team', 'custom')),
  config TEXT NOT NULL,
  schedule TEXT,
  last_run TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dashboards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  layout TEXT DEFAULT '[]',
  widgets TEXT DEFAULT '[]',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- AUTOMATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  trigger_config TEXT DEFAULT '{}',
  actions TEXT DEFAULT '[]',
  conditions TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  run_count INTEGER DEFAULT 0,
  last_run TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- WEBHOOKS & INTEGRATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL, -- JSON array of event types
  headers TEXT DEFAULT '{}',
  secret TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- stripe, slack, zapier, google, microsoft, etc.
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  metadata TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- CALLS & MEETINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT,
  user_id TEXT NOT NULL,
  direction TEXT CHECK(direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'completed',
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  notes TEXT,
  outcome TEXT CHECK(outcome IN ('connected', 'no_answer', 'voicemail', 'busy', 'failed')),
  scheduled_at TEXT,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contact_ids TEXT DEFAULT '[]',
  user_ids TEXT DEFAULT '[]',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  location TEXT,
  video_link TEXT,
  join_url TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- PROPOSALS & QUOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  deal_id TEXT,
  contact_id TEXT,
  name TEXT NOT NULL,
  content TEXT,
  items TEXT DEFAULT '[]',
  subtotal REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired')),
  sent_at TEXT,
  viewed_at TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- ============================================================================
-- GAMIFICATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  achievements TEXT DEFAULT '[]',
  period TEXT DEFAULT 'monthly',
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_lead_score ON contacts(lead_score DESC);

CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_stage ON deals(stage);

CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_activities_tenant ON activities(tenant_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);

CREATE INDEX idx_forms_tenant ON forms(tenant_id);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);

-- ============================================================================
-- TRIGGERS (Updated timestamps)
-- ============================================================================
CREATE TRIGGER update_tenants_timestamp AFTER UPDATE ON tenants
BEGIN
  UPDATE tenants SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_users_timestamp AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_contacts_timestamp AFTER UPDATE ON contacts
BEGIN
  UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_deals_timestamp AFTER UPDATE ON deals
BEGIN
  UPDATE deals SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_tasks_timestamp AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- SMS & TEMPLATES (Twilio Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT,
  campaign_id TEXT,
  direction TEXT CHECK(direction IN ('outbound', 'inbound')),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK(status IN ('queued', 'sent', 'delivered', 'failed', 'undelivered')),
  twilio_sid TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL
);

-- ============================================================================
-- CALENDAR & BOOKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_availability (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available INTEGER DEFAULT 1,
  buffer_minutes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendar_bookings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT,
  user_id TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'video' CHECK(meeting_type IN ('video', 'phone', 'in-person')),
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  video_link TEXT,
  reminder_sent INTEGER DEFAULT 0,
  cancel_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- REVIEWS MANAGEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT,
  platform TEXT NOT NULL CHECK(platform IN ('google', 'facebook', 'yelp', 'trustpilot', 'other')),
  source TEXT,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT,
  response TEXT,
  responded_at TEXT,
  sentiment TEXT DEFAULT 'neutral' CHECK(sentiment IN ('positive', 'neutral', 'negative')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'responded', 'flagged', 'hidden')),
  flagged_reason TEXT,
  external_id TEXT,
  external_url TEXT,
  posted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS review_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('email', 'sms')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'completed', 'failed')),
  template TEXT,
  rating INTEGER,
  review_link TEXT,
  sent_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- ============================================================================
-- AGENCY & WHITE-LABEL
-- ============================================================================
CREATE TABLE IF NOT EXISTS agency_accounts (
  id TEXT PRIMARY KEY,
  parent_tenant_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT,
  plan TEXT DEFAULT 'starter' CHECK(plan IN ('starter', 'professional', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'cancelled', 'trial')),
  primary_color TEXT DEFAULT '#6366f1',
  logo_url TEXT,
  trial_ends_at TEXT,
  billing_email TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agency_commissions (
  id TEXT PRIMARY KEY,
  agency_account_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  paid_at TEXT,
  invoice_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agency_account_id) REFERENCES agency_accounts(id) ON DELETE CASCADE
);

-- ============================================================================
-- HELPDESK & TICKETING
-- ============================================================================
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'spam')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
  category TEXT,
  channel TEXT DEFAULT 'email' CHECK(channel IN ('email', 'chat', 'phone', 'web', 'api', 'social')),
  contact_id TEXT,
  assigned_to TEXT,
  assigned_team_id TEXT,
  related_deal_id TEXT,
  related_contact_id TEXT,
  sla_due_at TEXT,
  first_response_at TEXT,
  resolved_at TEXT,
  closed_at TEXT,
  tags TEXT DEFAULT '[]',
  custom_fields TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_deal_id) REFERENCES deals(id) ON DELETE SET NULL,
  FOREIGN KEY (related_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_ticket_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ticket_id TEXT NOT NULL,
  user_id TEXT,
  contact_id TEXT,
  is_internal INTEGER DEFAULT 0,
  message TEXT NOT NULL,
  attachments TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_teams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  members TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS helpdesk_sla_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions TEXT DEFAULT '{}',
  first_response_time INTEGER DEFAULT 60,
  resolution_time INTEGER DEFAULT 1440,
  priority TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS helpdesk_csat_surveys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ticket_id TEXT NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  feedback TEXT,
  responded_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(id) ON DELETE CASCADE
);

-- ============================================================================
-- KNOWLEDGE BASE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base_categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  author_id TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, slug)
);

-- ============================================================================
-- LIVE CHAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT,
  visitor_id TEXT,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'active', 'ended')),
  assigned_to TEXT,
  messages TEXT DEFAULT '[]',
  started_at TEXT,
  ended_at TEXT,
  ended_by TEXT,
  rating INTEGER,
  feedback TEXT,
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  current_page TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS live_chat_widgets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  offline_message TEXT,
  greeting TEXT,
  theme TEXT DEFAULT '{}',
  branding TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS live_chat_routing_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  conditions TEXT DEFAULT '[]',
  target_type TEXT NOT NULL CHECK(target_type IN ('user', 'team', 'round_robin')),
  target_id TEXT,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- AI CHATBOT BUILDER
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_chatbots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  welcome_message TEXT,
  fallback_message TEXT,
  config TEXT DEFAULT '{}',
  personality TEXT,
  tone TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'en',
  is_active INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0,
  embed_code TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_chatbot_flows (
  id TEXT PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'keyword' CHECK(trigger_type IN ('keyword', 'intent', 'button', 'menu', 'always')),
  response TEXT,
  actions TEXT DEFAULT '[]',
  conditions TEXT DEFAULT '[]',
  next_flow_id TEXT,
  is_default INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chatbot_id) REFERENCES ai_chatbots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_chatbot_conversations (
  id TEXT PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  session_id TEXT,
  contact_id TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT,
  messages TEXT DEFAULT '[]',
  rating INTEGER,
  feedback TEXT,
  handoff_to_agent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chatbot_id) REFERENCES ai_chatbots(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_chatbot_lead_qualification (
  id TEXT PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  questions TEXT DEFAULT '[]',
  score_fields TEXT DEFAULT '{}',
  threshold INTEGER DEFAULT 50,
  auto_handoff INTEGER DEFAULT 1,
  notify_users TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chatbot_id) REFERENCES ai_chatbots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_chatbot_knowledge_sources (
  id TEXT PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('url', 'file', 'text', 'kb_article')),
  source_content TEXT NOT NULL,
  title TEXT,
  is_active INTEGER DEFAULT 1,
  last_indexed TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chatbot_id) REFERENCES ai_chatbots(id) ON DELETE CASCADE
);

-- ============================================================================
-- INTEGRATIONS (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  is_encrypted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, integration_type, config_key)
);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  direction TEXT CHECK(direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- WORKFLOW TEMPLATES & ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  trigger TEXT NOT NULL,
  actions TEXT DEFAULT '[]',
  conditions TEXT DEFAULT '[]',
  node_layout TEXT DEFAULT '[]',
  is_public INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_by TEXT,
  is_featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  trigger_type TEXT,
  trigger_data TEXT DEFAULT '{}',
  status TEXT DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  error_message TEXT,
  execution_time INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workflow_id) REFERENCES automations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT,
  node_type TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  input_data TEXT DEFAULT '{}',
  output_data TEXT DEFAULT '{}',
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  execution_order INTEGER DEFAULT 0,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES (Additional)
-- ============================================================================
CREATE INDEX idx_tickets_tenant ON helpdesk_tickets(tenant_id);
CREATE INDEX idx_tickets_status ON helpdesk_tickets(status);
CREATE INDEX idx_tickets_assigned ON helpdesk_tickets(assigned_to);
CREATE INDEX idx_tickets_priority ON helpdesk_tickets(priority);

CREATE INDEX idx_live_chat_tenant ON live_chat_sessions(tenant_id);
CREATE INDEX idx_live_chat_status ON live_chat_sessions(status);

CREATE INDEX idx_chatbots_tenant ON ai_chatbots(tenant_id);
CREATE INDEX idx_chatbots_active ON ai_chatbots(is_active);

CREATE INDEX idx_kb_articles_tenant ON knowledge_base_articles(tenant_id);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category_id);
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles(status);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at DESC);

CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_number ON quotes(number);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(number);
CREATE INDEX idx_invoices_quote ON invoices(quote_id);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS workflow_versions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  trigger_config TEXT DEFAULT '{}',
  actions TEXT DEFAULT '[]',
  conditions TEXT DEFAULT '[]',
  node_layout TEXT DEFAULT '[]',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workflow_id) REFERENCES automations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- QUOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  contact_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_company TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  value REAL DEFAULT 0,
  items TEXT DEFAULT '[]', -- JSON array of line items
  valid_until TEXT,
  notes TEXT,
  sent_at TEXT,
  viewed_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number TEXT NOT NULL,
  quote_id TEXT,
  title TEXT NOT NULL,
  contact_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_company TEXT,
  contact_address TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  value REAL DEFAULT 0,
  items TEXT DEFAULT '[]', -- JSON array of line items
  issue_date TEXT,
  due_date TEXT,
  paid_date TEXT,
  notes TEXT,
  sent_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PAYMENTS (for Stripe integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  payment_method TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE TRIGGER update_helpdesk_tickets_timestamp AFTER UPDATE ON helpdesk_tickets
BEGIN
  UPDATE helpdesk_tickets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_kb_categories_timestamp AFTER UPDATE ON knowledge_base_categories
BEGIN
  UPDATE knowledge_base_categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_kb_articles_timestamp AFTER UPDATE ON knowledge_base_articles
BEGIN
  UPDATE knowledge_base_articles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_live_chat_widgets_timestamp AFTER UPDATE ON live_chat_widgets
BEGIN
  UPDATE live_chat_widgets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_ai_chatbots_timestamp AFTER UPDATE ON ai_chatbots
BEGIN
  UPDATE ai_chatbots SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_quotes_timestamp AFTER UPDATE ON quotes
BEGIN
  UPDATE quotes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_invoices_timestamp AFTER UPDATE ON invoices
BEGIN
  UPDATE invoices SET updated_at = datetime('now') WHERE id = NEW.id;
END;