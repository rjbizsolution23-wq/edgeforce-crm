# EdgeForce CRM
![RJ Business Solutions](https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg)

**Built by RJ Business Solutions**

---

## Enterprise AI-Powered CRM on Cloudflare

EdgeForce is a next-generation CRM that runs entirely on Cloudflare's edge network, delivering Salesforce-beating performance with AI-powered insights, real-time collaboration, and enterprise-grade security.

### Features

- **AI-Powered Lead Scoring** — Workers AI analyzes contacts and prioritizes leads
- **Pipeline Management** — Visual drag-drop Kanban boards
- **Real-time Collaboration** — Durable Objects for live updates
- **Multi-tenant SaaS** — White-label ready for agencies
- **Edge-native** — Sub-50ms response times globally
- **Complete Automation** — Email, SMS, tasks, workflows

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5.8+ |
| Backend | Cloudflare Workers, Hono 4 |
| Database | Cloudflare D1 (SQLite), Supabase |
| Auth | Cloudflare Turnstile, JWT RS256 |
| AI | Workers AI, AI Gateway |
| Storage | R2, KV |
| Real-time | Durable Objects |
| Deploy | Cloudflare Workers + Pages |

### Quick Start

```bash
# Clone
git clone https://github.com/rjbizsolution23-wq/edgeforce-crm.git
cd edgeforce-crm

# Install
pnpm install

# Develop
cd apps/web && pnpm dev
cd apps/worker && pnpm dev

# Deploy
pnpm deploy:worker
pnpm deploy:web
```

---

📍 1342 NM 333, Tijeras, New Mexico 87059
🌐 https://rjbusinesssolutions.org
📧 support@rjbusinesssolutions.org

**Version:** 1.0.0 | **Built:** 2026-03-29