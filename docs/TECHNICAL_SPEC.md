# Stage Bug Reporting Widget — Technical Specification

## Purpose

Build a lightweight bug reporting solution for a staging environment that allows approved test users to report bugs from inside the web app and send them to GitHub Issues with a structured, developer-friendly format.

The solution should intentionally cover the core value of tools like Marker.io at a much lower cost:
- in-app bug reporting
- screenshot attachment
- structured repro details
- automatic environment and browser metadata
- GitHub issue creation
- stage-only exposure

This solution is **not** intended to replicate the full Marker.io feature set in v1.

---

## Product Scope

### In scope for v1
- Stage-only widget embedded in the staging app
- Bug report modal
- Optional screenshot upload
- Automatic collection of technical context
- Secure backend API for issue creation
- GitHub issue creation through GitHub REST API
- Standardized issue title/body/labels
- Admin-configurable repository owner/repo/labels/environment
- Feature flag / allowlist / basic access control for test users
- Basic rate limiting and spam protection
- Confirmation state after successful submission

### Out of scope for v1
- Session replay
- Automatic DOM annotation tools
- Automatic network HAR upload
- Automatic console log stream collection from entire session
- Full workflow management UI
- Cross-project routing dashboard
- Multi-tenant customer support workflow

---

## Recommended Architecture

## Decision

**Recommended approach for v1: integrate the widget into the stage app frontend, but keep the reporting backend as a separate service.**

This gives the best balance of:
- low friction for testers
- reuse of app context already available inside stage
- security isolation for GitHub credentials
- future reusability across multiple stage apps

### Why this is the recommended model
1. The widget needs direct access to app context:
   - current route
   - build/version
   - logged-in test user or role
   - frontend errors or relevant trace IDs
   - browser state
2. GitHub credentials must never live in the frontend.
3. A separate backend service makes the solution portable if additional apps or staging environments are added later.
4. The stage app can load the widget as:
   - an internal component, or
   - a small embeddable SDK package that points to the reporting API

### Recommended deployment model
- **Frontend widget**: embedded inside the stage application
- **Backend reporting API**: separate service on its own subdomain, for example:
  - `https://bugreport-api.example.com`
- **Optional uploaded screenshot storage**:
  - S3-compatible bucket, or server filesystem in early development
- **GitHub**:
  - target repo issues via API

### Alternative models considered

#### A. Fully separate external app on its own domain
Example:
- tester clicks “Report bug”
- modal or popup opens external app
- tester fills form there

Pros:
- strong separation
- reusable across many apps

Cons:
- poor UX
- harder to capture in-page context and screenshots
- more friction for test users

**Not recommended for v1.**

#### B. Fully integrated in stage app, no separate backend service
Pros:
- simple deployment

Cons:
- dangerous because GitHub tokens would need unsafe exposure or proxying through the main app backend
- harder to isolate responsibility
- less reusable later

**Not recommended unless the existing stage backend already has a secure server environment and API surface suitable for this feature.**

### Best practical design
Use a **hybrid model**:
- widget rendered inside stage app
- widget communicates with a dedicated backend service
- dedicated backend service creates GitHub issues

---

## System Components

1. **Stage Widget Frontend**
2. **Bug Reporting Backend API**
3. **Screenshot/Object Storage**
4. **GitHub Issue Integration**
5. **Configuration + Auth Layer**
6. **Optional Observability Layer**

---

## Tech Stack

## Frontend
Recommended:
- React 18+ or framework-native equivalent if stage app already uses React/Next.js
- TypeScript
- CSS modules / Tailwind / app-native design system
- `html2canvas` for optional client-side screenshot capture
- `react-hook-form` + `zod` for form handling and validation
- `@tanstack/react-query` optional for mutation state handling

If the app is already a Next.js app:
- implement widget as a client component
- use internal feature flags and environment detection

## Backend
Recommended:
- Node.js 20+
- TypeScript
- Express or Fastify
- `zod` for validation
- `octokit` for GitHub API integration
- `multer` or `busboy` for multipart uploads
- `pino` for structured logging
- `dotenv` for configuration
- `helmet` for secure headers
- `cors` with strict allowlist
- `express-rate-limit` or equivalent
- `uuid` for internal report IDs

## Storage
Recommended v1:
- S3-compatible object storage (AWS S3, Cloudflare R2, Supabase Storage, MinIO)
- Presigned upload URLs optional for scaling later

## Deployment
Recommended:
- Frontend stays in the stage app deployment
- Backend on:
  - Vercel serverless functions
  - Railway
  - Render
  - Fly.io
  - existing VPS/container platform
- Object storage:
  - S3 / R2 / Supabase Storage

## GitHub Integration
Recommended:
- GitHub App preferred for long-term security and scalability
- Fine-grained personal access token acceptable for v1 if restricted to:
  - single repository
  - issues write access only

---

## Dependency List

## Frontend dependencies
- react
- react-dom
- typescript
- react-hook-form
- zod
- @hookform/resolvers
- html2canvas
- optional: @tanstack/react-query
- optional: clsx
- optional: lucide-react

## Backend dependencies
- express or fastify
- typescript
- zod
- @octokit/rest
- multer
- cors
- helmet
- pino
- pino-http
- express-rate-limit
- dotenv
- uuid

## Dev dependencies
- eslint
- prettier
- tsx or ts-node
- vitest or jest
- supertest
- @types/node
- @types/express
- @types/multer

---

## Frontend Widget Requirements

## Visibility rules
The widget must only appear when all of the following are true:
- current environment is `stage`
- feature flag `BUG_WIDGET_ENABLED=true`
- user is authenticated as allowed tester, or app is in an approved open-testing mode

### Suggested visibility gates
At least one of:
- allowlisted user email
- allowlisted user ID
- test-role claim in JWT/session
- secret tester access code
- IP allowlist for internal team usage

## Widget UI
A floating button or subtle fixed action button:
- label: `Report bug`
- visible bottom-right by default
- accessible with keyboard
- mobile-friendly

On click:
- open modal or drawer

## Modal fields
Required:
- Summary
- What happened?
- Steps to reproduce
- Expected result
- Actual result

Optional:
- Severity
- Screenshot upload
- Contact email
- Additional notes

### Severity options
- blocker
- high
- medium
- low

## Automatically collected metadata
The widget must capture:
- environment (`stage`)
- full URL
- route/pathname
- page title
- browser user agent
- OS if inferable
- viewport width/height
- locale
- timestamp (ISO 8601)
- app version
- git commit SHA
- build number
- current user ID or tester ID if available
- current user role if available
- release channel if available
- latest frontend request ID / trace ID if available
- optional console error summary collected locally during current page lifetime only

### Important privacy rule
The widget must **not** capture or transmit:
- access tokens
- cookies
- authorization headers
- raw localStorage/sessionStorage dumps
- personal data beyond explicitly approved fields
- password fields
- payment information
- full session recordings in v1

## Screenshot support
Recommended v1:
- allow manual upload of image files
- optional “Capture current screen” using `html2canvas`

### Screenshot constraints
- supported types: PNG, JPG, WEBP
- max file size: configurable, default 5 MB
- image compression/resizing optional before upload
- user must explicitly review or confirm screenshot before submit

---

## Backend API Requirements

## Endpoint
`POST /api/reports/bug`

Consumes:
- `multipart/form-data` for screenshot uploads
or
- JSON payload if screenshot is not included

## Responsibilities
The backend must:
1. authenticate or validate the caller
2. validate payload schema
3. sanitize text fields
4. upload screenshot if present
5. generate GitHub issue title/body/labels
6. create GitHub issue via API
7. optionally attach screenshot URL in issue body
8. return success payload with issue number and URL
9. log internal audit event

## Authentication options
Recommended priority:
1. session/JWT validation from stage app
2. signed short-lived client token from stage app backend
3. shared secret header only for internal deployments

## Rate limiting
Recommended:
- 5 submissions per user per hour
- 20 submissions per IP per hour
- stricter limits for anonymous/open testing

## Validation rules
Use `zod` schemas for:
- field presence
- max lengths
- allowed severity values
- allowed screenshot mime types
- environment checks

---

## GitHub Issue Creation

## Target
Create issues in a predefined repository, for example:
- owner: configurable
- repo: configurable

## GitHub auth
Preferred:
- GitHub App installation token

Acceptable v1:
- fine-grained PAT with:
  - Issues: Read and Write
  - single repository scope

## Labels
Default labels:
- `bug`
- `stage`
- `needs-triage`

Conditional labels:
- `severity:blocker`
- `severity:high`
- `severity:medium`
- `severity:low`
- `area:frontend`
- `area:backend`
- `browser:chrome`
- `browser:safari`
- `browser:firefox`
- `browser:edge`

## Title format
Recommended:
`[Stage Bug]: <summary>`

Alternative with area:
`[Stage Bug][Frontend]: <summary>`

## Issue body format
Use a deterministic markdown structure so developers can parse it quickly.

See `ISSUE_BODY_TEMPLATE.md` below.

---

## Recommended Issue Body Template

```md
## Summary
<short summary>

## Environment
- Environment: stage
- App version: <version>
- Commit: <sha>
- Build: <build number>
- URL: <url>
- Route: <route>
- Timestamp: <iso timestamp>

## Reporter
- Tester ID: <tester id or unknown>
- Tester role: <role or unknown>
- Contact: <email or omitted>

## Severity
<severity>

## What happened
<actual user description>

## Expected result
<expected behavior>

## Actual result
<actual behavior>

## Steps to reproduce
1. ...
2. ...
3. ...

## Technical context
- Browser: <browser>
- OS: <os>
- Viewport: <width>x<height>
- Locale: <locale>
- User agent: <ua>
- Trace ID: <trace id if available>

## Screenshot
<image link or "No screenshot attached">

## Optional client errors
```text
<sanitized console error summary>
```

## Notes
<additional notes or omitted>
```

---

## Suggested GitHub Issue Form Template

Store in:
`.github/ISSUE_TEMPLATE/stage-bug-report.yml`

See accompanying file in this package.

---

## Security Requirements

- Never expose GitHub credentials in frontend code
- Strict CORS allowlist to stage domains only
- Sanitize markdown and text fields
- Strip scripts, HTML, and dangerous content from user fields
- Validate file type and file size server-side
- Store screenshots with randomized object keys
- Use signed or private URLs if screenshots may contain sensitive data
- Log only sanitized metadata
- Keep retention policy configurable for uploaded screenshots

---

## Configuration

Example environment variables for backend:

```env
NODE_ENV=production
PORT=3000

ALLOWED_ORIGINS=https://stage.example.com
BUG_WIDGET_ENVIRONMENTS=stage

GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
GITHUB_TOKEN=replace_me
GITHUB_DEFAULT_LABELS=bug,stage,needs-triage

STORAGE_PROVIDER=s3
STORAGE_BUCKET=bug-widget
STORAGE_REGION=eu-central-1
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

MAX_UPLOAD_MB=5
RATE_LIMIT_PER_USER_PER_HOUR=5
RATE_LIMIT_PER_IP_PER_HOUR=20
```

---

## Frontend Integration Strategy

## Recommended integration
Package the widget as either:
1. an internal reusable component inside the stage app repo, or
2. a small private npm package / workspace package such as:
   - `@your-org/stage-bug-widget`

### Why package form is useful
- keeps widget logic isolated
- reusable across stage apps
- versioned independently
- easy to feature-flag

### Suggested frontend API
```ts
initBugWidget({
  environment: "stage",
  apiBaseUrl: "https://bugreport-api.example.com",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA,
  buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER,
  currentUser: {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  },
  enabled: isStage && isTester,
  traceProvider: getCurrentTraceContext,
})
```

---

## Data Model (internal backend)

Optional internal persistence table if desired:
`bug_reports`

Fields:
- id
- created_at
- reporter_id
- reporter_email
- summary
- severity
- github_issue_number
- github_issue_url
- screenshot_url
- environment
- app_version
- commit_sha
- browser
- route
- status (`submitted`, `failed`)
- error_message

This is optional for v1, but useful for audit/debugging.

---

## Testing Requirements

## Unit tests
- schema validation
- issue body generation
- label generation
- browser label mapping
- screenshot validation

## Integration tests
- report submission without screenshot
- report submission with screenshot
- GitHub API success response
- GitHub API failure handling
- auth rejection
- rate limit rejection

## Manual acceptance tests
- widget visible only in stage
- widget hidden in production
- screenshot upload works
- issue appears in GitHub with correct fields
- labels applied correctly
- errors shown gracefully to tester
- malicious HTML/script input sanitized

---

## UX Notes

The widget should be deliberately simple:
- fast to open
- minimal friction
- plain language
- clear success state
- no “enterprise” complexity

Success message example:
`Thanks — your bug report was submitted to GitHub.`

Failure message example:
`Something went wrong while sending the report. Please try again or contact the team.`

---

## Observability

Recommended:
- backend request logs via `pino`
- error tracking via Sentry optional
- correlation ID in responses
- GitHub API errors logged with sanitized metadata only

---

## Suggested Milestones

### Milestone 1 — MVP
- widget UI
- backend API
- GitHub issue creation
- screenshot upload
- stage-only visibility
- labels and issue format

### Milestone 2 — Hardening
- better auth
- improved screenshot capture
- optional internal audit DB
- retry logic
- better admin configuration

### Milestone 3 — Advanced reporting
- console error excerpts
- trace links
- optional Sentry linking
- richer browser classification
- bulk duplicate detection ideas

---

## Non-Goals

This project should not turn into a full product-management platform.
Avoid building:
- roadmap tools
- feature voting
- customer CRM
- full session analytics
- enterprise feedback dashboards

Keep the scope tightly aligned to stage bug reporting.