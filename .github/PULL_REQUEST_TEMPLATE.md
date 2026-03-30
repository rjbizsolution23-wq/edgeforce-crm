## 📋 Pull Request Summary

### What does this PR do?
<!-- Clear, concise description of the changes -->

### Why is this change needed?
<!-- Context and motivation -->

### Related Issues
Fixes #<!-- issue number -->
Closes #<!-- issue number -->

---

## ✅ Pre-Merge Checklist

### Code Quality
- [ ] TypeScript `strict: true` — no `any` types
- [ ] Functions are ≤50 lines
- [ ] No TODOs in committed code
- [ ] Comments explain WHY, not WHAT

### Testing
- [ ] Unit tests written/updated (≥80% coverage maintained)
- [ ] Integration tests pass (100% API endpoints)
- [ ] E2E tests pass for affected flows
- [ ] `pnpm test` passes locally
- [ ] `pnpm lint` passes with 0 errors

### Security
- [ ] No secrets or credentials in code
- [ ] `pnpm audit` shows 0 critical vulnerabilities
- [ ] Input validation added for any new endpoints
- [ ] Auth middleware applied to protected routes

### Frontend (if applicable)
- [ ] Mobile responsive (375px → 1920px)
- [ ] Dark mode works correctly
- [ ] Skeleton loaders on async components
- [ ] No console errors or warnings

### Documentation
- [ ] `CHANGELOG.md` updated
- [ ] `README.md` updated (if needed)
- [ ] API docs updated (if endpoints changed)
- [ ] `.env.example` updated (if new vars added)

---

## 🖼️ Screenshots / Demo

<!-- If UI changes, add before/after screenshots or a GIF -->

---

## 🧪 How to Test This PR

```bash
# Step-by-step instructions to verify the changes
```

---

### ⚠️ Breaking Changes

<!-- List any breaking changes or migrations required -->