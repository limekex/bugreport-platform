# Copilot Coding Agent — Master Prompt

You are implementing a **Stage Bug Reporting Widget** system for a web application.

Your goal is to build an MVP bug-reporting flow for the staging environment that allows approved testers to submit structured bug reports with optional screenshots, and automatically create GitHub Issues in a configured repository.

## Core intent
We want a lightweight internal alternative to Marker.io for staging/UAT, focused on:
- low friction for testers
- structured bug reports
- screenshot support
- automatic technical metadata
- GitHub Issues as the source of truth

Do **not** try to replicate all enterprise feedback tooling or full Marker.io functionality in v1.

---

## Read these files first
- `TECHNICAL_SPEC.md`
- `ARCHITECTURE_DECISION.md`
- `ISSUE_BODY_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/stage-bug-report.yml`
- `FUTURE_ISSUES.md`

Treat those files as the project specification.

---

## What to build

### Frontend
Build an embeddable stage-only widget that:
- renders a `Report bug` button
- opens a modal or drawer
- collects required bug fields
- supports optional screenshot upload
- automatically includes technical metadata:
  - environment
  - URL
  - route
  - browser
  - OS
  - viewport
  - app version
  - commit SHA
  - build number
  - tester ID/role if available
  - trace ID if available

The widget must:
- only be visible in stage
- be accessible by keyboard
- work on desktop and mobile
- not expose secrets

### Backend
Build a secure backend API that:
- validates payloads with zod
- accepts multipart form data
- uploads screenshots if present
- sanitizes report content
- creates GitHub Issues using Octokit
- applies default and conditional labels
- returns created issue number and URL
- rate-limits submissions
- logs activity safely

### GitHub
The backend must create issues with a consistent markdown structure using the provided issue body template.

---

## Tech preferences
Use:
- TypeScript
- React for frontend if relevant
- Node.js backend
- Express or Fastify
- Zod for validation
- Octokit for GitHub
- clean modular architecture
- environment-based configuration
- sensible tests

---

## Architectural preference
Preferred architecture:
- widget embedded in stage app frontend
- dedicated backend reporting service on a separate domain/subdomain
- GitHub credentials only in backend

Do not build a standalone external reporting website as the primary user flow unless there is a clear reason.

---

## Constraints
- Keep v1 intentionally lean
- Never send cookies, tokens, or sensitive storage contents
- Never expose GitHub token in client code
- Make the implementation reusable for future apps
- Avoid over-engineering
- Focus on reliability and clean issue formatting

---

## Deliverables expected from the implementation
1. widget frontend component(s)
2. backend API route(s)
3. validation schemas
4. GitHub issue formatter module
5. screenshot upload handling
6. environment/config handling
7. test coverage for critical paths
8. setup documentation
9. example `.env.example` file

---

## Suggested repo structure

```text
/apps
  /stage-app
  /bug-report-api
/packages
  /stage-bug-widget
/shared
  /types
```

If this repo is not a monorepo, adapt the structure sensibly without changing the architectural intent.

---

## Implementation priorities
1. working issue creation
2. correct metadata capture
3. screenshot handling
4. stage-only visibility
5. security and validation
6. tests and docs

---

## Non-goals for v1
Do not build:
- session replay
- admin dashboards
- roadmap tooling
- feature voting
- multi-tenant support
- complex annotation editor

These belong in future backlog issues only.