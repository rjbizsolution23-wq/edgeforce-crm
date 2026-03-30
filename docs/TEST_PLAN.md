# EdgeForce CRM — Test Plan

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Overview

EdgeForce CRM uses a tiered testing strategy to ensure quality at every level:
- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Accessibility tests for WCAG 2.1 AA compliance
- Performance tests for speed requirements

---

## Test Pyramid

```
         ┌────────────────────┐
         │       E2E          │  ← Critical user flows (Playwright)
         │   (10-20 tests)    │
         ├────────────────────┤
         │    Integration     │  ← API endpoints (Jest + Supertest)
         │   (50-100 tests)   │
         ├────────────────────┤
         │       Unit         │  ← Functions, utilities (Jest)
         │  (200+ tests)      │
         └────────────────────┘
```

---

## Unit Tests

### Location
- `tests/unit/` - Frontend unit tests
- `apps/worker/src/**/*.test.ts` - Backend unit tests

### Coverage Requirements

| Category | Target Coverage |
|----------|-----------------|
| Functions | 100% |
| Conditionals | 95% |
| Branches | 90% |
| Lines | 80% |

### Test Structure

```typescript
// Example: lib/utils.test.ts
import { describe, it, expect } from 'vitest'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
})
```

### Key Unit Tests

#### API Client
- Token storage/retrieval
- Error handling for network failures
- Request/response transformation

#### Auth Utilities
- JWT parsing
- Token expiry checking
- Refresh token handling

#### Data Utilities
- Contact scoring logic
- Pipeline stage calculations
- Date formatting

#### Validation Schemas (Zod)
- Email validation
- Password strength
- Required field validation

---

## Integration Tests

### Location
- `tests/integration/` - API integration tests

### Tools
- Jest (test runner)
- Supertest (HTTP assertions)
- Test database (D1 mock)

### Test Structure

```typescript
describe('Contacts API', () => {
  let authToken: string

  beforeAll(async () => {
    // Setup: create user, get token
    const response = await api.post('/api/auth/login')
    authToken = response.body.token
  })

  describe('GET /api/contacts', () => {
    it('returns 401 without auth', async () => {
      const response = await api.get('/api/contacts')
      expect(response.status).toBe(401)
    })

    it('returns contacts list', async () => {
      const response = await api.get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('filters by status', async () => {
      const response = await api.get('/api/contacts?status=qualified')
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.body.data.every(c => c.lead_status === 'qualified')).toBe(true)
    })
  })

  describe('POST /api/contacts', () => {
    it('creates contact with required fields', async () => {
      const response = await api.post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'John', lastName: 'Doe' })
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('validates required fields', async () => {
      const response = await api.post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'John' }) // missing lastName
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('lastName')
    })
  })
})
```

### Integration Test Matrix

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| /api/auth/* | ✓ | ✓ | - | - |
| /api/contacts | ✓ | ✓ | ✓ | ✓ |
| /api/deals | ✓ | ✓ | ✓ | ✓ |
| /api/tasks | ✓ | ✓ | ✓ | ✓ |
| /api/pipelines | ✓ | ✓ | ✓ | - |
| /api/dashboard | ✓ | - | - | - |
| /api/analytics | ✓ | - | - | - |

### Test Data

Use fixture files for consistent test data:
```
tests/fixtures/
├── users.json
├── contacts.json
├── deals.json
└── pipelines.json
```

---

## E2E Tests (Playwright)

### Location
- `tests/e2e/specs/` - Playwright test specs
- `tests/e2e/fixtures/` - Test fixtures

### Critical Flows

#### 1. User Registration & Login
```typescript
test('user can register and login', async ({ page }) => {
  await page.goto('/register')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'SecurePass123')
  await page.fill('[name="firstName"]', 'John')
  await page.fill('[name="lastName"]', 'Doe')
  await page.click('button[type="submit"]')

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

#### 2. Create Contact
```typescript
test('user can create contact', async ({ page }) => {
  // Login first
  await login(page)

  // Navigate to contacts
  await page.click('text=Contacts')
  await page.click('text=Add Contact')

  // Fill form
  await page.fill('[name="firstName"]', 'Jane')
  await page.fill('[name="lastName"]', 'Smith')
  await page.fill('[name="email"]', 'jane@example.com')
  await page.fill('[name="company"]', 'Acme Corp')

  // Submit
  await page.click('button:has-text("Save")')

  // Verify
  await expect(page.locator('text=Jane Smith')).toBeVisible()
})
```

#### 3. Pipeline Kanban
```typescript
test('user can drag deal between stages', async ({ page }) => {
  await login(page)
  await page.click('text=Pipelines')

  const dealCard = page.locator('[data-testid="deal-card"]').first()
  const targetColumn = page.locator('[data-testid="stage-qualified"]')

  await dealCard.dragTo(targetColumn)

  await expect(page.locator('text=Deal moved successfully')).toBeVisible()
})
```

#### 4. Dashboard Stats
```typescript
test('dashboard displays correct stats', async ({ page }) => {
  await login(page)
  await page.goto('/dashboard')

  await expect(page.locator('[data-testid="stat-contacts"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-deals"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-tasks"]')).toBeVisible()
})
```

### E2E Test Matrix

| Feature | Test Case | Priority |
|---------|-----------|----------|
| Auth | Login with valid credentials | P0 |
| Auth | Login with invalid credentials | P0 |
| Auth | Registration flow | P0 |
| Contacts | View contact list | P0 |
| Contacts | Create new contact | P0 |
| Contacts | Edit contact | P1 |
| Contacts | Delete contact | P1 |
| Deals | View pipeline | P0 |
| Deals | Create deal | P0 |
| Deals | Move deal stages | P0 |
| Tasks | View tasks | P1 |
| Tasks | Create task | P1 |
| Tasks | Complete task | P1 |
| Dashboard | View stats | P0 |

---

## Accessibility Tests

### Tools
- axe-core (automated a11y checks)
- Lighthouse CI (performance + a11y)

### Required Checks

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('login page has no accessibility violations', async () => {
  const { container } = render(<LoginPage />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Critical Checks
- Color contrast (WCAG AA)
- Keyboard navigation
- Focus management
- ARIA labels
- Form error announcements
- Image alt text

### Test Commands

```bash
# Run a11y checks
pnpm test:a11y

# Run Lighthouse CI
pnpm lighthouse
```

---

## Performance Tests

### Benchmarks

| Metric | Target | Threshold |
|--------|--------|-----------|
| TTFB | <200ms | <500ms |
| LCP | <2.5s | <4s |
| INP | <200ms | <500ms |
| CLS | <0.1 | <0.25 |
| API p95 | <100ms | <500ms |
| Bundle size | <250KB | <500KB |

### Lighthouse CI Config

```yaml
ci:
  collect:
    url: https://edgeforce-crm.pages.dev
    numberOfRuns: 3
  assert:
    performance: [0.9, 0.9, 0.9]  # 90% score target
    accessibility: 1.0
    best-practices: 1.0
    seo: 1.0
```

---

## Test Execution

### CI Pipeline Order

```bash
# 1. Lint
pnpm lint

# 2. Type check
pnpm typecheck

# 3. Unit tests
pnpm test:unit

# 4. Integration tests
pnpm test:integration

# 5. E2E tests (Playwright)
pnpm test:e2e

# 6. Lighthouse
pnpm lighthouse
```

### Local Development

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Specific test file
pnpm test:unit -- --grep "contacts"

# E2E with UI
pnpm test:e2e -- --ui
```

---

## Coverage Reports

Generate coverage after tests:
```bash
pnpm test --coverage
pnpm view-coverage  # Opens HTML report
```

Target: **80% overall line coverage**

---

## Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | http://localhost:8787 | Development |
| Staging | staging.edgeforce-crm.pages.dev | QA |
| Production | edgeforce-crm.pages.dev | Release |

---

*Document Version: 1.0.0 | Generated: 2026-03-29*