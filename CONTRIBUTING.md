# Contributing to EdgeForce CRM

First off — thank you. Every contribution makes this better. 🙏

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md).
By contributing, you agree to uphold it.

---

## Getting Started

```bash
# Fork, then clone your fork
git clone https://github.com/YOUR-USERNAME/edgeforce-crm.git
cd edgeforce-crm

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start dev environment
docker-compose up -d
pnpm dev &
```

Open http://localhost:3000 to see the app.

---

## Development Workflow

1. **Always branch from main**
2. **Branch naming**: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
3. **One feature or fix per branch**
4. **Write tests alongside code** (never after)
5. **Run the full test suite before pushing:**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `chore:` | Maintenance, deps |
| `docs:` | Documentation only |
| `refactor:` | Code restructuring |
| `test:` | Tests only |
| `perf:` | Performance improvements |
| `security:` | Security fixes |

**Example**: `feat: add Stripe usage-based billing to Pro tier`

---

## Pull Request Process

1. Fill out the PR template completely
2. Link the issue your PR resolves (Fixes #123)
3. Ensure all CI checks pass
4. Request review from at least one maintainer
5. Squash commits before merging

---

## Coding Standards

- **TypeScript strict**: `true` — no `any`, ever
- **Functions max 50 lines** — extract if longer
- **Comment WHY, never WHAT**
- **No TODOs in committed code**
- **Test coverage**: ≥80% unit, 100% API endpoints

---

## Quick Commands

```bash
# Install deps
pnpm install

# Start dev servers
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck

# Build
pnpm build

# Deploy
pnpm deploy
```

---

Questions? Open a discussion or email support@rjbusinesssolutions.org.

---

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059
🌐 [rjbusinesssolutions.org](https://rjbusinesssolutions.org)