# EdgeForce CRM — Deployment Guide

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Prerequisites

- Node.js 22+ (managed via fnm)
- pnpm 9+
- Cloudflare account with Workers & Pages
- Wrangler CLI (`pnpm add -g wrangler`)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/rjbizsolution23-wq/edgeforce-crm.git
cd edgeforce-crm
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env.local` in `apps/web/`:
```bash
NEXT_PUBLIC_API_URL=https://edgeforce-crm-worker.rickjefferson.workers.dev
```

Set Worker secrets:
```bash
cd apps/worker
wrangler secret put JWT_SECRET
# Enter a secure, random string (32+ characters)

wrangler secret put DATABASE_ID
# Already set in wrangler.toml for D1
```

### 4. Verify Wrangler Auth

```bash
wrangler whoami
```

---

## Database Setup

### 1. Create D1 Database (if needed)

```bash
wrangler d1 create edgeforce-crm-db
```

Update `wrangler.toml` with the returned `database_id`.

### 2. Apply Schema

```bash
wrangler d1 execute edgeforce-crm-db --file=./database/schema.sql
```

### 3. Verify Tables

```bash
wrangler d1 execute edgeforce-crm-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output:
```
tenants, users, sessions, contacts, companies, pipelines, deals, tasks, activities, email_templates, email_sequences, email_campaigns, sms_campaigns, conversations, messages, forms, form_submissions, landing_pages, reports, dashboards, automations, webhooks, integrations, calls, meetings, proposals, leaderboard
```

---

## KV Namespace Setup

The following KV namespaces are configured in `wrangler.toml`:

| Binding | Purpose | ID |
|---------|---------|-----|
| SESSIONS | User sessions | d6aa41f7a0294edb9594c56d0a74f77b |
| CACHE | API response cache | 9e1cb9202d884c32a9fa653cbd45e63c |
| RATE_LIMIT | Rate limiting | 62fb4d47abb645788db1aa889338a34d |

---

## R2 Bucket Setup

Create R2 bucket for file storage:
```bash
wrangler r2 bucket create edgeforce-crm-assets
```

---

## Deploy Backend (Worker)

### 1. Navigate to Worker Directory

```bash
cd apps/worker
```

### 2. Deploy to Cloudflare

```bash
pnpm deploy
```

Or using wrangler directly:
```bash
wrangler deploy
```

### 3. Verify Deployment

```bash
curl https://edgeforce-crm-worker.rickjefferson.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "EdgeForce CRM API",
  "version": "1.0.0"
}
```

---

## Deploy Frontend (Pages)

### 1. Navigate to Web Directory

```bash
cd apps/web
```

### 2. Build for Production

```bash
pnpm build
```

### 3. Deploy to Cloudflare Pages

```bash
pnpm deploy
```

Or using wrangler:
```bash
wrangler pages deploy dist --project-name=edgeforce-crm
```

### 4. Configure Custom Domain (optional)

```bash
wrangler pages domain add crm.rjbusinesssolutions.org
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter worker deploy
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter web build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          projectName: edgeforce-crm
          directory: apps/web/out
```

### Required Secrets

Add to GitHub repository settings:
- `CF_API_TOKEN` - Cloudflare API token with Workers/Pages permissions

---

## DNS Configuration

### Custom Domain Setup

1. Log into Cloudflare Dashboard
2. Navigate to Pages → edgeforce-crm
3. Custom domains → Add custom domain
4. Enter `crm.rjbusinesssolutions.org`
5. Update DNS at your registrar

### DNS Records

| Type | Name | Content |
|------|------|---------|
| CNAME | crm | edgeforce-crm.pages.dev |

---

## Rollback Procedures

### Worker Rollback

```bash
# List recent deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback <deployment-id>
```

### Pages Rollback

1. Log into Cloudflare Dashboard
2. Navigate to Pages → edgeforce-crm → Deployments
3. Select previous working deployment
4. Click "Promote to production"

### Database Rollback

D1 doesn't support direct rollback. To restore:
1. Export current data
2. Apply migrations to new database
3. Import data

---

## Monitoring & Logs

### View Worker Logs

```bash
wrangler tail edgeforce-crm-worker
```

### View Analytics

Cloudflare Dashboard → Workers & Pages → edgeforce-crm-worker → Metrics

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >1% | Alert |
| P99 latency | >500ms | Alert |
| CPU time | >4000ms | Alert |
| Worker invocations | >10K/hr | Scale |

---

## Environment Variables Reference

### Worker (wrangler secret put)

| Variable | Description | Example |
|----------|-------------|---------|
| JWT_SECRET | Token signing secret | `openssl rand -base64 32` |
| DATABASE_ID | D1 database ID | Set via wrangler.toml |

### Web (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Worker API URL | `https://edgeforce-crm-worker...` |
| NEXT_PUBLIC_SENTRY_DSN | Sentry DSN | `https://...@sentry.io/...` |

---

## Troubleshooting

### Worker Not Deploying

```bash
# Check for TypeScript errors
pnpm typecheck

# Validate wrangler.toml
wrangler validate

# Check wrangler logs
wrangler deploy --verbose
```

### Frontend Build Fails

```bash
# Clear .next cache
rm -rf apps/web/.next

# Clear node_modules
rm -rf apps/web/node_modules

# Reinstall
pnpm install
pnpm build
```

### Database Connection Issues

```bash
# Verify D1 binding
wrangler d1 execute edgeforce-crm-db --command="SELECT 1"

# Check database ID in wrangler.toml matches Cloudflare
```

---

*Document Version: 1.0.0 | Generated: 2026-03-29*
*Last Tested: 2026-03-29*