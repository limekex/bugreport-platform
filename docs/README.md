# Stage Bug Reporter — Documentation

This folder contains the specification, architecture decisions, and operational docs for the Stage Bug Reporter platform.

## Document index

| File | Purpose |
|---|---|
| `TECHNICAL_SPEC.md` | Full functional and technical specification |
| `ARCHITECTURE.md` | System architecture diagram and rationale |
| `ARCHITECTURE_DECISION.md` | Concise ADR — why the hybrid widget+backend model was chosen |
| `API_CONTRACT.md` | Exact HTTP contract for `POST /api/reports/bug` and `GET /health` |
| `ISSUE_FORMAT.md` | GitHub Issue title format, default labels, and body template |
| `ISSUE_BODY_TEMPLATE.md` | Standalone copy of the issue body Markdown template |
| `SECURITY.md` | Security model — credentials, CORS, input sanitisation, rate limiting |
| `ROADMAP.md` | MVP checklist and future feature backlog |
| `FUTURE_ISSUES.md` | Detailed backlog ideas (Marker.io-inspired features) |
| `INITIAL_GITHUB_ISSUES.md` | Suggested GitHub Issues to open when starting the project |
| `COPILOT_MASTER_PROMPT.md` | Original Copilot agent prompt (historical reference) |

## Recommended implementation model
- Widget integrated into stage app via `@bugreport/widget-sdk`
- Separate reporting backend service (`apps/bugreport-api`)
- GitHub issue creation from backend only (credentials never in browser)