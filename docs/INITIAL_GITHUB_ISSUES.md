# Initial GitHub Issues

Open these issues manually after the repository is created. They form the initial project backlog.

---

## Issue 1: Scaffold bugreport-api MVP

**Goal:** Get the backend API running end-to-end so testers can submit their first bug report.

**Scope:**
- Express app with health endpoint
- `POST /api/reports/bug` route with Zod validation
- Pino logging, Helmet, CORS, rate limiting
- GitHub Issue creation via Octokit (live, not mocked)
- Basic error handling

**Acceptance criteria:**
- `curl -X POST https://bugreport.betait.no/api/reports/bug` with valid multipart data creates a real GitHub Issue
- Invalid payloads return `400` with structured Zod errors
- Health endpoint returns `200`

**Labels:** `enhancement`, `backend`, `priority:high`

---

## Issue 2: Define and stabilise shared API contract

**Goal:** Lock down the `POST /api/reports/bug` request/response shape so both the SDK and backend can implement against it without breaking each other.

**Scope:**
- Finalise `BugReportRequest` fields (add/remove based on first testing round)
- Finalise `BugReportSuccessResponse` and `BugReportErrorResponse`
- Update `docs/API_CONTRACT.md` and `packages/shared-types`
- Version the contract (v1)

**Acceptance criteria:**
- `@bugreport/shared-types` exports a stable `BugReportRequest` type
- API_CONTRACT.md is accurate and complete
- Both SDK and backend import types from shared-types (no duplication)

**Labels:** `documentation`, `shared-types`, `priority:high`

---

## Issue 3: Implement GitHub issue creation service

**Goal:** Replace the placeholder `github.service.ts` with a fully working Octokit integration.

**Scope:**
- Verify `GITHUB_TOKEN` scopes at startup
- Handle Octokit errors (rate limit, auth failure, 404) gracefully
- Return structured `GitHubIssueResult` on success
- Log issue creation with Pino

**Acceptance criteria:**
- Submitting a valid bug report via curl creates a GitHub Issue in the configured repo
- Auth errors return a clear `500` with no token leaked in the response
- Rate limit errors from GitHub are surfaced as `503`

**Labels:** `enhancement`, `backend`, `github`

---

## Issue 4: Add screenshot storage support

**Goal:** Replace the placeholder `storage.service.ts` with real S3/R2 upload support.

**Scope:**
- Implement `uploadScreenshot` using the AWS SDK v3 (S3-compatible)
- Support `STORAGE_PROVIDER=s3` and `STORAGE_PROVIDER=r2`
- Return a public URL after upload
- Delete the `tmp/` file after upload completes
- Add server-side MIME validation via file magic bytes

**Acceptance criteria:**
- Submitting a bug report with a screenshot stores the file in the configured bucket
- The GitHub Issue body contains a working `![Screenshot](url)` link
- Files with invalid MIME types are rejected with `400`

**Labels:** `enhancement`, `backend`, `storage`

---

## Issue 5: Build widget-sdk init flow

**Goal:** Make `initBugReporter()` production-ready.

**Scope:**
- Wire `initBugReporter()` → `openModal()` on button click
- Pass resolved config (appVersion, commitSha, currentUser, traceId) to the modal
- Handle `enabled: false` gracefully (no DOM injection)
- Export `WidgetInstance.open()` / `.close()` for programmatic control

**Acceptance criteria:**
- Calling `initBugReporter({ enabled: true, ... })` injects the button
- Calling `initBugReporter({ enabled: false, ... })` does nothing
- `widget.destroy()` removes the button from the DOM
- TypeScript types are exported correctly

**Labels:** `enhancement`, `sdk`, `priority:high`

---

## Issue 6: Build modal UI for bug report submission

**Goal:** Implement the actual bug report form inside the widget modal.

**Scope:**
- React component with all required fields (summary, severity, what happened, expected, actual, steps)
- File input for optional screenshot
- Submit button that calls `apiClient.submitReport()`
- Success state showing the GitHub Issue URL
- Error state with retry button

**Acceptance criteria:**
- Tester can fill in and submit a bug report without leaving the page
- Screenshot upload works (file selected, sent as multipart)
- Success message links to the created GitHub Issue
- Form is accessible (keyboard nav, ARIA labels)

**Labels:** `enhancement`, `sdk`, `ui`, `react`

---

## Issue 7: Add React example integration

**Goal:** Validate that `widget-sdk` integrates cleanly into a Vite + React app.

**Scope:**
- Update `packages/widget-sdk/examples/react-example` to use the live modal
- Show integration pattern for auth context (useAuth → currentUser)
- Show integration pattern for trace context (Sentry / OTel)
- README for the example

**Acceptance criteria:**
- `pnpm --filter react-example dev` runs a working example app
- The bug reporter button appears and the modal opens
- A test submission reaches the local `bugreport-api`

**Labels:** `enhancement`, `sdk`, `react`, `documentation`

---

## Issue 8: Add backend validation and rate limiting hardening

**Goal:** Harden the API against abuse and edge cases.

**Scope:**
- Per-tester rate limiting (based on `testerId` header or body field)
- Stricter file upload validation (magic bytes)
- Input sanitisation audit
- Add `pino` log redaction for secrets

**Acceptance criteria:**
- A single IP cannot submit more than `RATE_LIMIT_PER_IP_PER_HOUR` reports per hour
- A single tester cannot submit more than `RATE_LIMIT_PER_USER_PER_HOUR` reports per hour
- Pino does not log the GitHub token in any log line

**Labels:** `enhancement`, `backend`, `security`

---

## Issue 9: Write CI workflow

**Goal:** Set up GitHub Actions to keep the codebase healthy.

**Scope:**
- Install dependencies with pnpm
- Type-check all packages
- Run all tests (vitest)
- Run ESLint
- Cache `node_modules` and `~/.pnpm-store`

**Acceptance criteria:**
- CI passes on every PR
- CI fails if tests or typecheck fails
- CI runs in under 3 minutes on a standard GitHub-hosted runner

**Labels:** `ci`, `infrastructure`

---

## Issue 10: Draft GitHub labels and triage conventions

**Goal:** Create the required GitHub labels in the repository and document triage conventions.

**Scope:**
- Create labels: `stage`, `needs-triage`, `severity:blocker`, `severity:high`, `severity:medium`, `severity:low`
- Document triage flow in a TRIAGE.md or in the repo wiki
- Assign a default assignee for stage bugs (optional)

**Acceptance criteria:**
- All labels defined in `docs/ISSUE_FORMAT.md` exist in the repository
- Team agrees on triage SLAs (e.g. triage within 1 business day, blockers within 2 hours)

**Labels:** `documentation`, `infrastructure`, `process`
