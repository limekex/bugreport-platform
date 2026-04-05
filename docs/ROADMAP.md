# Roadmap

This roadmap is inspired by the feature set of tools like Marker.io, adapted to our internal use case.

---

## Now (MVP) ✅

- [x] Repository scaffold
- [x] Shared TypeScript types
- [x] Backend: Express + Zod + Helmet + CORS + Pino + rate limiting
- [x] Backend: GitHub Issue creation via Octokit
- [x] Backend: Issue body formatter
- [x] Widget SDK: `initBugReporter()` init flow
- [x] Widget SDK: floating trigger button (DOM-based)
- [x] Widget SDK: payload builder with browser context
- [x] Widget SDK: API client
- [x] Widget SDK: real modal UI (DOM-based, all required fields)
- [x] Screenshot storage: `LocalStorageAdapter` (dev) + `CloudStorageAdapter` (S3/R2)
- [x] Per-tester rate limiting (in-memory sliding window, alongside IP limiter)
- [x] Console error capture (`installConsoleErrorHook` + auto-attach to payload)
- [x] CI: GitHub Actions workflow (typecheck + test + lint)
- [x] GitHub labels: `scripts/create-github-labels.sh` helper script

---

## Completed (post-MVP) ✅

- [x] **Widget modal UI polish** — production-ready CSS (focus trap, animations, responsive, accessible)
- [x] **Per-tester rate limiting with Redis** — ioredis adapter selectable via `REDIS_URL` env var, fails open
- [x] **Failed network request capture** — fetch/XHR interceptors + PerformanceObserver, auto-attached to reports
- [x] **Full-page screenshot** — "Capture screen" button using lazy-loaded html2canvas from CDN
- [x] **Console error capture** — auto-attach recent `console.error` calls to the report
- [x] **Signed upload URLs** — pre-signed S3 GET URLs when `STORAGE_PUBLIC_URL_BASE` is not configured
- [x] **Comprehensive setup instructions** — README covers all features, env vars, and integration guide
- [x] **Screenshot annotation** — draw arrows, rectangles, circles, freehand, and add text labels with color picker and undo
- [x] **Tester authentication (core)** — JWT-based login/register system, token management, authenticated bug reports with tester identity in GitHub issues

---

## Next

- [ ] **Tester management UI** — admin interface for creating, viewing, and managing tester accounts
- [ ] **Widget login UI** — in-widget registration and login forms for testers
- [ ] **React wrapper component** — `<BugReporter />` component for React apps (Headless UI or Radix)

---

## Future

- [ ] **Sentry integration** — auto-link Sentry error IDs and session replay URLs
- [ ] **Duplicate detection** — detect similar open issues before creating a new one
- [ ] **Slack / Teams notifications** — post a message to a channel when a new issue is created
- [ ] **Admin config panel** — web UI for configuring labels, assignees, and notification rules
- [ ] **Multi-repo routing** — route issues to different repositories based on the reporting app
- [ ] **Generic embed script** — `<script>` tag integration for apps that can't install npm packages
- [ ] **Session replay links** — auto-attach PostHog / LogRocket session replay URL
- [ ] **Customisable issue templates** — per-app Markdown templates
- [ ] **Webhook support** — fire webhooks on issue creation for custom integrations
