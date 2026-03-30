# Security Policy

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability in EdgeForce CRM, please report it immediately:

**Email:** security@rjbusinesssolutions.org
**Response Time:** 24-48 hours
**GitHub:** https://github.com/rjbizsolution23-wq/edgeforce-crm/security/advisories

---

## Security Model

### Trusted Components

EdgeForce CRM is built on Cloudflare's security infrastructure:

| Component | Security Feature |
|-----------|------------------|
| Workers | Isolated JavaScript contexts |
| D1 | Encrypted at rest (Cloudflare managed) |
| KV | Encrypted at rest and in transit |
| R2 | Encrypted at rest, TLS 1.3 in transit |
| Cloudflare CDN | DDoS protection, WAF |

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. AUTHENTICATION                                              │
│     ├── JWT HS256 (15 min access token)                        │
│     ├── Refresh token (7 day expiry, KV stored)               │
│     └── Password hashing (SHA-256*)                            │
│                                                                 │
│  2. AUTHORIZATION                                               │
│     ├── Tenant isolation (all queries include tenant_id)        │
│     ├── Role-based access (owner, admin, manager, member)      │
│     └── Multi-tenant data separation                          │
│                                                                 │
│  3. INPUT VALIDATION                                            │
│     ├── Zod schemas on all API endpoints                       │
│     ├── Type-safe request validation                           │
│     └── SQL parameterized queries only                         │
│                                                                 │
│  4. RATE LIMITING                                               │
│     ├── Per-IP limits (1000 req/min)                           │
│     ├── Per-user limits for authenticated                      │
│     └── KV-based sliding window                               │
│                                                                 │
│  5. OUTPUT SANITIZATION                                         │
│     ├── XSS prevention via React                               │
│     ├── CSP headers on all responses                           │
│     └── HSTS enforced                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
* Note: argon2id planned for future release
```

---

## Data Security

### Data at Rest

| Storage | Encryption | Notes |
|---------|------------|-------|
| D1 (Database) | ✓ Cloudflare managed | SQLite with encryption |
| KV (Sessions) | ✓ Cloudflare managed | In-memory KV, encrypted |
| R2 (Files) | ✓ AES-256 | Object storage |

### Data in Transit

- TLS 1.3 enforced for all connections
- Cloudflare handles certificate management
- HSTS header with 2-year max-age

### Data Retention

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| User accounts | Until deleted | Permanent on request |
| Contact data | Until deleted | Permanent on request |
| Activity logs | 90 days | Automatic purge |
| Session tokens | 7 days | TTL expiry |

---

## API Security

### Authentication

All protected endpoints require Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token payload:
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "member",
  "iat": 1711712400,
  "exp": 1711713300
}
```

### Token Security

- Access token: 15 minute expiry
- Refresh token: 7 day expiry, single use
- Tokens signed with HS256 (secret stored in Workers env)

### CORS Policy

Only allowed origins can access the API:

```typescript
const ALLOWED_ORIGINS = [
  'https://edgeforce-crm.pages.dev',
  'http://localhost:8787', // Development only
]
```

---

## Rate Limiting

### Default Limits

| Plan | Requests | Window |
|------|----------|--------|
| Free | 100 | per minute |
| Starter | 500 | per minute |
| Pro | 2000 | per minute |
| Enterprise | 10000 | per minute |

### Response Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1711712400
```

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED"
}
```

---

## OWASP Top 10 Compliance

### A01:2021 - Broken Access Control
- [x] JWT verification on all protected routes
- [x] Tenant isolation with tenant_id on all queries
- [x] Role-based access control implemented
- [x] CORS configured with explicit origins

### A02:2021 - Cryptographic Failures
- [x] No sensitive data in URLs
- [x] Passwords hashed (SHA-256*, planned argon2id)
- [x] TLS 1.3 enforced
- [x] Session tokens in KV, not client-readable

### A03:2021 - Injection
- [x] Parameterized SQL queries only (D1 prepared statements)
- [x] Zod validation on all inputs
- [x] No string interpolation in SQL

### A04:2021 - Insecure Design
- [x] Threat modeling done in ADR-005
- [x] Rate limiting implemented
- [x] Error messages don't expose internals

### A05:2021 - Security Misconfiguration
- [x] CSP headers configured
- [x] HSTS header set
- [x] X-Content-Type-Options header
- [x] No debug mode in production

### A06:2021 - Vulnerable Components
- [x] Dependencies pinned (no ^ or ~)
- [x] pnpm audit in CI pipeline
- [ ] Manual security review (planned)
- [ ] Dependency update automation (planned)

### A07:2021 - Auth Failures
- [x] Account lockout on failed attempts
- [x] Secure password requirements (8+ chars)
- [x] Session expiry enforced
- [x] No default credentials

### A08:2021 - Data Integrity Failures
- [ ] Signed updates (planned)
- [x] CI/CD pipeline validated
- [x] Version controlled configurations

### A09:2021 - Logging Failures
- [x] Structured JSON logging
- [x] Cloudflare observability enabled
- [ ] SIEM integration (planned)

### A10:2021 - SSRF
- [x] No user-provided URLs fetched server-side
- [x] Cloudflare network isolation

---

## Security Headers

All API responses include:

```http
Content-Type: application/json; charset=utf-8
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

---

## Incident Response

### Reporting Process

1. Email security@rjbusinesssolutions.org
2. Include description of vulnerability
3. Include steps to reproduce
4. Expected vs actual behavior
5. Your contact information (optional)

### Response Timeline

| Severity | Response | Resolution |
|----------|----------|------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium | 1 week | 30 days |
| Low | 2 weeks | 90 days |

### Security Updates

Critical security patches will be released as hotfixes.
Regular security updates included in monthly releases.

---

## Dependencies Security

### Audit Process

```bash
# Run security audit
pnpm audit

# Fail on critical vulnerabilities
pnpm audit --audit-level critical
```

### Dependency Updates

- Monthly review of outdated dependencies
- Automated PRs for security patches (planned)
- Critical CVEs addressed within 48 hours

---

## Compliance

### GDPR (EU)

- [ ] Data export functionality
- [ ] Right to deletion implemented
- [ ] Cookie consent (if cookies used)
- [ ] Privacy policy page

### CCPA (California)

- [ ] "Do Not Sell" option
- [ ] Data access requests
- [ ] Deletion requests honored

### SOC 2 (Planned)

- [ ] Type II audit
- [ ] Annual certification

---

*Security Policy Version: 1.0.0*
*Last Updated: 2026-03-29*
*Reviewed by: Rick Jefferson*

---

**For security concerns, contact:** security@rjbusinesssolutions.org