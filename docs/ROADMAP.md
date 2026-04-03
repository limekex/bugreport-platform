# Roadmap

This roadmap is inspired by the feature set of tools like Marker.io, adapted to our internal use case.

---

## Now (MVP)

- [x] Repository scaffold
- [x] Shared TypeScript types
- [x] Backend: Express + Zod + Helmet + CORS + Pino + rate limiting
- [x] Backend: GitHub Issue creation via Octokit
- [x] Backend: Issue body formatter
- [x] Widget SDK: `initBugReporter()` init flow
- [x] Widget SDK: floating trigger button (DOM-based)
- [x] Widget SDK: payload builder with browser context
- [x] Widget SDK: API client
- [ ] Widget SDK: real modal UI
- [ ] Screenshot storage: S3 / Cloudflare R2 integration
- [ ] CI: GitHub Actions workflow
- [ ] GitHub labels: create labels in target repository

---

## Next

- [ ] **Per-tester rate limiting** — rate limit by `testerId` in addition to IP
- [ ] **Tester allow-listing** — optionally restrict submissions to a set of known tester IDs
- [ ] **Widget modal UI polish** — styled form with React (Headless UI or Radix)
- [ ] **Console error capture** — auto-attach recent `console.error` calls to the report
- [ ] **Failed network request summary** — capture XHR/fetch errors via `PerformanceObserver`
- [ ] **Full-page screenshot** — use `html2canvas` or similar to capture a full-page snapshot

---

## Future

- [ ] **Screenshot annotation** — draw arrows and highlight areas before submitting (Marker.io-style)
- [ ] **Sentry integration** — auto-link Sentry error IDs and session replay URLs
- [ ] **Duplicate detection** — detect similar open issues before creating a new one
- [ ] **Slack / Teams notifications** — post a message to a channel when a new issue is created
- [ ] **Admin config panel** — web UI for configuring labels, assignees, and notification rules
- [ ] **Multi-repo routing** — route issues to different repositories based on the reporting app
- [ ] **Generic embed script** — `<script>` tag integration for apps that can't install npm packages
- [ ] **Session replay links** — auto-attach PostHog / LogRocket session replay URL
- [ ] **Customisable issue templates** — per-app Markdown templates
- [ ] **Webhook support** — fire webhooks on issue creation for custom integrations
