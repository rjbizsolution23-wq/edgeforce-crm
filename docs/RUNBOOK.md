# EdgeForce CRM — Operations Runbook

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Table of Contents

1. [Incident Response](#incident-response)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Backup & Recovery](#backup--recovery)
4. [Maintenance Tasks](#maintenance-tasks)
5. [Escalation Procedures](#escalation-procedures)

---

## Incident Response

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| P0 - Critical | Complete outage, data loss | 5 minutes | API down, DB unavailable |
| P1 - High | Core feature broken | 15 minutes | Auth failure, can't save data |
| P2 - Medium | Degraded performance | 1 hour | Slow responses, errors up |
| P3 - Low | Minor issue | 24 hours | UI glitch, non-critical bug |

### Incident Playbook

#### Step 1: Identify
- Check Cloudflare Dashboard for worker errors
- Check application monitoring (Sentry, CF Analytics)
- Review user reports (support@rjbusinesssolutions.org)

#### Step 2: Assess
- Determine severity level
- Identify affected systems
- Estimate user impact

#### Step 3: Contain
- **Worker down?** Run `wrangler deployments list` and rollback
- **Database issues?** Check D1 dashboard for errors
- **Frontend down?** Promote previous Pages deployment

#### Step 4: Resolve
- Implement fix or rollback
- Test fix in staging
- Deploy fix or confirm rollback successful

#### Step 5: Post-Mortem
- Document timeline
- Identify root cause
- Create action items
- Share learnings

---

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Primary Engineer | Rick Jefferson | rjbizsolution23@gmail.com |
| Cloudflare Support | Enterprise support | Via dashboard |
| DNS Registrar | Domain registrar support | Via registrar portal |

---

## Monitoring & Alerts

### Cloudflare Workers Metrics

Access: Cloudflare Dashboard → Workers & Pages → edgeforce-crm-worker

**Key Metrics:**

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Error Rate | <0.1% | 0.1-1% | >1% |
| Request Duration (P99) | <200ms | 200-500ms | >500ms |
| CPU Time | <50ms | 50-100ms | >100ms |
| Invocations | Normal | +50% | +100% |

### Setting Up Alerts

1. Cloudflare Dashboard → Workers & Pages → edgeforce-crm-worker
2. Settings → Alerts → Create Alert
3. Configure thresholds and notification channels

**Recommended Alerts:**
- Error rate > 1%
- P99 latency > 500ms
- Worker invocation failure > 10

---

## Backup & Recovery

### D1 Database Backups

Cloudflare D1 provides automatic backups. Manual backup:

```bash
# Export database
wrangler d1 export edgeforce-crm-db --output=backup-$(date +%Y%m%d).sql

# Store in R2
wrangler r2 object put backups/edgeforce-crm-$(date +%Y%m%d).sql --file=backup-$(date +%Y%m%d).sql
```

**Recovery Procedure:**
1. Create new D1 database
2. Apply schema: `wrangler d1 execute new-db --file=./database/schema.sql`
3. Import backup: `wrangler d1 execute new-db --file=backup.sql`
4. Update wrangler.toml with new database ID

### KV Data

KV is ephemeral. Session data loss = users re-login. No backup needed.

### R2 Assets

Assets have versioning enabled:
```bash
# List object versions
wrangler r2 object list edgeforce-crm-assets --versions

# Restore previous version
wrangler r2 object restore edgeforce-crm-assets/<key> --version-id=<id>
```

---

## Maintenance Tasks

### Weekly Tasks

1. **Review Worker logs**
   ```bash
   wrangler tail edgeforce-crm-worker --env production
   ```

2. **Check D1 row counts**
   ```bash
   wrangler d1 execute edgeforce-crm-db --command="SELECT COUNT(*) FROM contacts"
   ```

3. **Review Sentry errors**
   - Login to Sentry dashboard
   - Review unhandled exceptions
   - Create issues for bugs

### Monthly Tasks

1. **Security audit**
   - Review Cloudflare WAF rules
   - Check for unusual traffic patterns
   - Update rate limiting if needed

2. **Dependency update**
   ```bash
   pnpm up --latest
   pnpm audit
   ```

3. **Performance review**
   - Analyze Cloudflare Analytics
   - Review Core Web Vitals
   - Optimize slow endpoints

### Quarterly Tasks

1. **Disaster recovery test**
   - Simulate worker failure
   - Test rollback procedure
   - Verify data backup integrity

2. **Architecture review**
   - Review ADRs for relevance
   - Plan for major changes
   - Document lessons learned

---

## Escalation Procedures

### P0 (Critical) Response

1. **Immediately:**
   - Acknowledge incident
   - Create incident channel in Slack/Teams
   - Start incident log

2. **Within 5 minutes:**
   - Rollback worker if cause is recent deploy
   ```bash
   wrangler rollback <last-working-deployment-id>
   ```
   - Or promote previous Pages deployment

3. **Within 15 minutes:**
   - Assess user impact
   - Communicate status to stakeholders
   - Begin root cause investigation

4. **Resolution:**
   - Fix in staging
   - Test thoroughly
   - Deploy fix or confirm rollback
   - Update stakeholders

### P1 (High) Response

1. **Within 15 minutes:**
   - Acknowledge incident
   - Assess scope

2. **Within 1 hour:**
   - Identify root cause
   - Implement temporary fix or fallback

3. **Within 4 hours:**
   - Deploy permanent fix
   - Verify fix works

### Contact Escalation

| Issue | Contact | Response |
|-------|---------|----------|
| Cloudflare outage | cf-status on Twitter | Monitor status page |
| D1 issues | Cloudflare Support | Open ticket via dashboard |
| Security incident | rjbizsolution23@gmail.com | Immediate response |

---

## Common Issues & Solutions

### Issue: Worker returning 500 errors

**Diagnosis:**
```bash
# Check worker logs
wrangler tail edgeforce-crm-worker

# Check D1 status
wrangler d1 execute edgeforce-crm-db --command="SELECT 1"
```

**Solutions:**
1. D1 issue → Check dashboard for database errors
2. Memory issue → Optimize queries, reduce response size
3. Unknown → Rollback to previous deployment

### Issue: Frontend not loading

**Diagnosis:**
1. Check if Pages deployment succeeded
2. Check DNS configuration
3. Check for JavaScript errors in browser

**Solutions:**
1. Promote previous deployment via dashboard
2. Clear browser cache
3. Check Cloudflare Pages deployment logs

### Issue: Slow API responses

**Diagnosis:**
```bash
# Test response time
time curl https://edgeforce-crm-worker.rickjefferson.workers.dev/health

# Check worker metrics
```

**Solutions:**
1. D1 query optimization → Add indexes
2. Cache more responses in KV
3. Scale to larger Workers plan

### Issue: Rate limiting too aggressive

**Diagnosis:**
- Check `X-RateLimit-Remaining` header
- Review KV for rate limit keys

**Solutions:**
1. Adjust rate limit thresholds in worker code
2. Implement sliding window instead of fixed
3. Allow higher limits for authenticated users

---

## Performance Benchmarks

| Endpoint | Target | Measurement |
|----------|--------|-------------|
| /health | <50ms | Cold start |
| /api/auth/login | <200ms | Auth flow |
| /api/contacts (list) | <300ms | With pagination |
| /api/contacts (search) | <500ms | With search |
| /api/dashboard | <400ms | Stats aggregation |

---

## Runbook Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Update contact info | As needed | Rick Jefferson |
| Review and update procedures | Quarterly | Rick Jefferson |
| Test backup/restore | Quarterly | Rick Jefferson |
| Update software versions | Monthly | Rick Jefferson |

---

*Document Version: 1.0.0 | Generated: 2026-03-29*
*Last Updated: 2026-03-29*
*Owner: Rick Jefferson | rjbizsolution23@gmail.com*