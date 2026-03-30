# Support

## Getting Help

| Channel | Best for | Response time |
|---------|----------|---------------|
| [GitHub Discussions](https://github.com/rjbizsolution23-wq/edgeforce-crm/discussions) | Questions, ideas | Community |
| [GitHub Issues](https://github.com/rjbizsolution23-wq/edgeforce-crm/issues) | Bug reports | 24–48 hours |
| [Email](mailto:support@rjbusinesssolutions.org) | Security, billing | 1 business day |
| [Website](https://rjbusinesssolutions.org) | General inquiries | 1–2 business days |

---

## Before Opening an Issue

1. Search [existing issues](https://github.com/rjbizsolution23-wq/edgeforce-crm/issues)
2. Check the [docs](./docs/)
3. Review [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Common Issues

### Installation fails
```bash
# Make sure you have Node 22+ and pnpm
node --version  # should be 22.x
pnpm --version  # should be 9.x

# Clear cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

### API not responding
Check that the Cloudflare Worker is deployed:
```bash
cd apps/worker
wrangler dev
```

### Database connection issues
Verify your `DATABASE_URL` in `.env.local` and ensure your Supabase project is active.

---

## RJ Business Solutions

📍 1342 NM 333, Tijeras, New Mexico 87059
🌐 [rjbusinesssolutions.org](https://rjbusinesssolutions.org)
🐦 [@ricksolutions1](https://twitter.com/ricksolutions1)
📧 support@rjbusinesssolutions.org