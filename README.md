# Stage Bug Reporter

> **Internal bug reporting platform for staging / UAT environments.**

Stage Bug Reporter lets approved testers report bugs from inside a stage web app — with optional screenshots, structured repro details and technical metadata — and submits each report as a GitHub Issue through a secure, server-side backend.

---

## Why is the backend separate from the target apps?

GitHub credentials (personal access token / GitHub App private key) must **never** be exposed to a browser. By hosting a dedicated backend service (e.g. `https://bugreport.betait.no`) we:

- Keep all GitHub auth server-side.
- Apply server-level rate limiting and input validation.
- Centralise screenshot / attachment handling in one place.
- Serve multiple stage apps from a single backend deployment.

## Why does the widget run inside the target app?

An in-app widget (injected via a small SDK) gives testers the full browser context at the time of the bug: the current URL, viewport, locale, console errors, etc. A separate popup page would lose that context and require the tester to copy details manually.

## Recommended first use case

| Role | URL |
|---|---|
| Backend API | `https://bugreport.betait.no` |
| Widget consumer | `https://stage.reginor.events` |

The `stage.reginor.events` app imports `@bugreport/widget-sdk`, calls `initBugReporter({ apiBaseUrl: 'https://bugreport.betait.no', ... })` and the widget handles the rest.

---

## Repository structure

```
/
  apps/
    bugreport-api/        ← Express backend – the only service with GitHub creds
  packages/
    widget-sdk/           ← Browser SDK / React widget
    shared-types/         ← Shared TypeScript contracts (request/response shapes)
  docs/                   ← Architecture, API contract, issue format, roadmap
  .github/                ← CI workflow & GitHub issue templates
```

---

## High-level architecture

```
┌─────────────────────────┐          HTTPS POST /api/reports/bug
│  stage.reginor.events   │ ──────────────────────────────────────▶ bugreport.betait.no
│  (widget-sdk embedded)  │                                         │
└─────────────────────────┘                                         │  Octokit
                                                                    ▼
                                                             GitHub Issues API
```

1. Tester clicks the floating bug-report button inside the stage app.
2. `widget-sdk` collects browser context (URL, viewport, browser, locale, etc.).
3. Tester fills in the form, optionally attaches a screenshot.
4. SDK posts `multipart/form-data` to the backend.
5. Backend validates the payload (Zod), stores the screenshot (placeholder), then creates a GitHub Issue via Octokit.
6. Backend returns the new issue URL to the widget.

---

## Local development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Install

```bash
pnpm install
```

### Configure the API

```bash
cp apps/bugreport-api/.env.example apps/bugreport-api/.env
# Fill in your GitHub token, repo, etc.
```

### Run everything

```bash
pnpm dev          # starts api + widget in watch mode (parallel)
```

### Run only the API

```bash
pnpm --filter bugreport-api dev
```

### Type-check all packages

```bash
pnpm typecheck
```

### Run all tests

```bash
pnpm test
```

---

## Future direction

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full feature backlog.

Short-term:
- Real screenshot storage (S3 / R2)
- GitHub Issue creation (Octokit integration live)
- Rate limiting hardening
- Widget modal polish

Long-term:
- Screenshot annotation (Marker.io-style)
- Console error capture
- Sentry / session-replay integration
- Admin config panel
- Multi-repo routing