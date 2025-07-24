# Final Code & Security Review Checklist

## Backend
- [ ] All API endpoints require authentication (JWT/session/cookie)
- [ ] Role-based access control (RBAC) enforced for all protected routes
- [ ] Input validation and sanitization for all user input (file uploads, queries, etc.)
- [ ] Error messages do not leak sensitive info
- [ ] Data isolation: user_id and workspace_id always scoped in queries
- [ ] Rate limiting and brute-force protection enabled
- [ ] All secrets/keys loaded from environment variables (never hard-coded)
- [ ] Dependency audit: no known vulnerabilities in npm packages
- [ ] Logging does not expose PII or secrets
- [ ] File uploads restricted to allowed types and size
- [ ] All file deletions remove associated memory/embeddings

## Frontend
- [ ] Auth tokens stored securely (httpOnly cookies or secure storage)
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] Error boundaries in place for all major components
- [ ] User input validated client-side before sending to backend
- [ ] No direct exposure of secrets or internal API URLs
- [ ] UI does not leak other users’ data (multi-tenant isolation)
- [ ] All async actions show loading/error/success states

## General
- [ ] .env and config files are not committed to version control
- [ ] CORS configured correctly for all environments
- [ ] HTTPS enforced in production
- [ ] Regular dependency and security updates scheduled

---

**Review this checklist before every major release for a secure, production-grade SaaS!** 