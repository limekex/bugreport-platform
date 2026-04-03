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
    widget-sdk/           ← Browser SDK (DOM-based, no React dependency)
    shared-types/         ← Shared TypeScript contracts (request/response shapes)
  scripts/                ← Helper scripts (label creation, etc.)
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
2. `widget-sdk` collects browser context (URL, viewport, browser, locale, console errors, failed network requests).
3. Tester fills in the form, optionally captures a full-page screenshot or attaches a file.
4. SDK posts `multipart/form-data` to the backend.
5. Backend validates the payload (Zod), stores the screenshot (S3/R2 or local disk), then creates a GitHub Issue via Octokit.
6. Backend returns the new issue URL to the widget.

---

## Quick start

### Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20+ |
| pnpm | 8+ |
| GitHub CLI (`gh`) | any (only for label creation script) |

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the API

```bash
cp apps/bugreport-api/.env.example apps/bugreport-api/.env
```

Open `apps/bugreport-api/.env` and fill in the **required** values:

| Variable | Description |
|---|---|
| `GITHUB_OWNER` | GitHub organisation or user that owns the target repo |
| `GITHUB_REPO` | Repository where issues will be created |
| `GITHUB_TOKEN` | Personal access token or GitHub App installation token (minimum scope: `issues:write`) |

All other variables have sensible defaults for local development.

### 3. Create GitHub labels

The bug reporter expects specific labels in the target repository. Run the helper script once:

```bash
./scripts/create-github-labels.sh <owner> <repo>
```

This is idempotent — re-running it skips labels that already exist.

### 4. Run the API locally

```bash
pnpm --filter bugreport-api dev
```

The API starts at `http://localhost:3001` by default.

### 5. Embed the widget in a stage app

```ts
import { initBugReporter } from '@bugreport/widget-sdk';

initBugReporter({
  apiBaseUrl: 'http://localhost:3001',
  environment: 'staging',
  enabled: true,
  appVersion: '1.0.0',
  commitSha: process.env.VITE_COMMIT_SHA,
  currentUser: {
    id: 'tester-001',
    email: 'tester@example.com',
    role: 'qa',
  },
});
```

The widget auto-injects a floating "🐛 Report bug" button and handles everything else.

---

## Feature setup guide

### Screenshot storage (S3 / Cloudflare R2)

By default, screenshots are saved to the local `uploads/` directory (development only).

For production, set up S3-compatible storage:

```env
STORAGE_PROVIDER=s3          # or "r2" for Cloudflare R2
STORAGE_BUCKET=bugreport-screenshots
STORAGE_REGION=eu-north-1
STORAGE_ACCESS_KEY=AKIA...
STORAGE_SECRET_KEY=...

# AWS S3: leave STORAGE_ENDPOINT empty
# Cloudflare R2: set to https://<account_id>.r2.cloudflarestorage.com
STORAGE_ENDPOINT=

# Public URL base (optional). If set, screenshots are served from this domain.
# If not set, pre-signed GET URLs are generated instead.
STORAGE_PUBLIC_URL_BASE=https://cdn.bugreport.betait.no

# Pre-signed URL expiry (seconds). Default: 7 days. Only used when STORAGE_PUBLIC_URL_BASE is not set.
STORAGE_SIGNED_URL_EXPIRES=604800
```

### Per-tester rate limiting (Redis)

Per-tester rate limiting works out of the box with an **in-memory** sliding-window counter. This is fine for single-process deployments.

For multi-process / horizontally-scaled deployments, set `REDIS_URL`:

```env
REDIS_URL=redis://localhost:6379
# or with auth: redis://:password@host:6379/0
```

When `REDIS_URL` is set, the rate limiter uses Redis `INCR` + `EXPIRE` for atomic, distributed counting. It fails open — if Redis goes down, requests are allowed (the IP limiter still applies).

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_PER_USER_PER_HOUR` | `20` | Max bug reports per tester per hour |
| `RATE_LIMIT_PER_IP_PER_HOUR` | `50` | Max bug reports per IP per hour |
| `REDIS_URL` | *(empty)* | Redis connection URL for distributed rate limiting |

### Full-page screenshot capture

The widget includes a **"📸 Capture screen"** button that captures the current page using [`html2canvas`](https://html2canvas.hertzen.com/). The library is lazy-loaded from a CDN the first time the button is clicked — zero impact on initial page load.

**No setup required.** The feature works automatically. If `html2canvas` fails to load (e.g. CSP restrictions), the user can still attach a screenshot file manually.

To bundle `html2canvas` yourself instead of loading from CDN:

```bash
npm install html2canvas
# The SDK will detect window.html2canvas and use it directly.
```

### Console error capture

The SDK automatically hooks `console.error` when the widget is enabled, keeping a rolling buffer of the last 20 errors. These are serialised as JSON and attached to every bug report as `optionalClientErrors`.

**No setup required.** Captured automatically by `initBugReporter()`.

### Failed network request capture

The SDK intercepts `fetch()` and `XMLHttpRequest` to record any requests that return 4xx/5xx status codes or fail entirely. A `PerformanceObserver` catches additional edge cases. Results are attached as `failedNetworkRequests`.

**No setup required.** Captured automatically by `initBugReporter()`.

### GitHub labels

The API creates issues with these labels:

| Label | Purpose |
|---|---|
| `bug` | Standard GitHub bug label |
| `stage` | Marks the issue as coming from a staging environment |
| `needs-triage` | Signals that it needs human review |
| `severity:blocker` / `severity:high` / `severity:medium` / `severity:low` | Severity level |

Create them with:

```bash
./scripts/create-github-labels.sh <owner> <repo>
```

### CI workflow

The repository includes `.github/workflows/ci.yml` which runs:

1. **Typecheck** — `pnpm typecheck`
2. **Tests** — `pnpm test`
3. **Lint** — `pnpm lint` (continue-on-error)

Triggered on pushes to `main` and `copilot/**` branches, and on pull requests to `main`.

---

## Development commands

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Start API + widget in watch mode (parallel) |
| `pnpm --filter bugreport-api dev` | Start only the API |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests (67 tests across 11 files) |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |

---

## Environment variables reference

See [`apps/bugreport-api/.env.example`](apps/bugreport-api/.env.example) for the full list with descriptions.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_OWNER` | ✅ | — | GitHub org/user |
| `GITHUB_REPO` | ✅ | — | Target repository |
| `GITHUB_TOKEN` | ✅ | — | PAT or GitHub App token |
| `PORT` | | `3001` | API port |
| `ALLOWED_ORIGINS` | | `http://localhost:3000` | CORS origins (comma-separated) |
| `STORAGE_PROVIDER` | | `local` | `local`, `s3`, or `r2` |
| `STORAGE_BUCKET` | | — | S3 bucket name |
| `STORAGE_REGION` | | — | AWS region |
| `STORAGE_ENDPOINT` | | — | Custom S3 endpoint (R2/MinIO) |
| `STORAGE_ACCESS_KEY` | | — | S3 access key |
| `STORAGE_SECRET_KEY` | | — | S3 secret key |
| `STORAGE_PUBLIC_URL_BASE` | | — | Public URL base for screenshots |
| `STORAGE_SIGNED_URL_EXPIRES` | | `604800` | Pre-signed URL TTL (seconds) |
| `REDIS_URL` | | — | Redis URL for distributed rate limiting |
| `RATE_LIMIT_PER_USER_PER_HOUR` | | `20` | Per-tester limit |
| `RATE_LIMIT_PER_IP_PER_HOUR` | | `50` | Per-IP limit |
| `MAX_UPLOAD_MB` | | `5` | Max screenshot size (MB) |

---

## Future direction

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full feature backlog.
