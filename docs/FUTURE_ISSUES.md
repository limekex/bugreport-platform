# Future GitHub Issues / Backlog Ideas

These are intentionally out of scope for v1 but inspired by Marker.io-style capabilities.

---

## 1. Screenshot annotation UI
**Goal:** Allow testers to draw arrows, boxes, highlights, or notes directly on screenshots before submission.

### Notes
- Could use a canvas-based editor
- Store both original and annotated version
- Nice for communication clarity

### Labels
- enhancement
- future
- ux

---

## 2. Built-in full-page screenshot capture
**Goal:** Capture viewport or full-page screenshot directly from the app without requiring manual upload.

### Notes
- Start with viewport capture
- Full-page capture can be tricky with complex apps, sticky headers, virtualized lists, and cross-origin assets

### Labels
- enhancement
- future
- frontend

---

## 3. Lightweight console error capture
**Goal:** Capture recent frontend console errors and attach sanitized excerpts to bug reports.

### Notes
- Only capture current page lifetime
- Avoid noisy logs
- Filter out irrelevant warnings
- Never include secrets

### Labels
- enhancement
- future
- debugging

---

## 4. Network request summary
**Goal:** Include a sanitized list of recent failed API requests related to the current page/session.

### Notes
- Include method, route, status code, timestamp
- Exclude bodies, tokens, and sensitive headers
- Potentially very useful for backend debugging

### Labels
- enhancement
- future
- debugging
- backend

---

## 5. Sentry integration
**Goal:** Link a bug report to a Sentry event, issue, or trace when available.

### Notes
- Great multiplier if Sentry already exists in the stack
- Add Sentry event ID, replay ID, or issue URL into GitHub issue body

### Labels
- enhancement
- future
- sentry
- observability

---

## 6. Session replay linking
**Goal:** Attach or link a session replay for the moments around the bug report.

### Notes
- Very helpful but more invasive and privacy-sensitive
- Strong consent and retention controls required

### Labels
- enhancement
- future
- privacy-review

---

## 7. DOM element context capture
**Goal:** Attach metadata about the UI element that triggered the report, such as button label, selector, component name, or route context.

### Notes
- Avoid brittle selectors
- Works best if app has stable data attributes

### Labels
- enhancement
- future
- frontend

---

## 8. Duplicate issue detection
**Goal:** Warn the user if a similar issue was recently submitted.

### Notes
- Basic fuzzy matching on summary + route + severity
- Could reduce issue noise

### Labels
- enhancement
- future
- triage

---

## 9. Reporter dashboard for internal testers
**Goal:** Let testers see issues they submitted, status, and links to GitHub.

### Notes
- Useful for internal QA rounds
- Not needed for MVP

### Labels
- enhancement
- future
- qa

---

## 10. Project / component routing rules
**Goal:** Route bug reports to different repositories, labels, or assignees based on environment, route prefix, or app module.

### Notes
- Useful if the app grows into multiple systems or repos

### Labels
- enhancement
- future
- routing

---

## 11. Auto-assignment rules
**Goal:** Automatically assign issues based on route, label, area, or feature ownership.

### Notes
- Could map `/billing/*` to billing owner, `/admin/*` to admin owner, etc.

### Labels
- enhancement
- future
- triage

---

## 12. Video capture / screen recording attachment
**Goal:** Let tester attach a short video clip instead of only screenshots.

### Notes
- Bigger storage requirements
- More UX complexity
- Often valuable for “hard to explain” UI bugs

### Labels
- enhancement
- future
- media

---

## 13. Privacy-safe PII redaction pipeline
**Goal:** Redact emails, IDs, or sensitive fields from screenshots or text automatically before submission.

### Notes
- Advanced feature
- Very useful if stage contains realistic data

### Labels
- enhancement
- future
- security
- privacy

---

## 14. Admin configuration panel
**Goal:** Internal settings UI for repo, labels, severity mapping, environment names, and feature flags.

### Notes
- Nice once the system is used by more than one team

### Labels
- enhancement
- future
- admin

---

## 15. Slack or Teams notification on submission
**Goal:** Send a message to a team channel when a new bug report is created.

### Notes
- Nice operational improvement
- Should include title, severity, environment, GitHub link

### Labels
- enhancement
- future
- integrations