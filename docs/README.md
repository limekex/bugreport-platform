# Stage Bug Widget Spec Package

This zip contains a complete specification package for a Copilot coding agent to build a lightweight bug reporting solution for a staging environment.

## Included files
- `TECHNICAL_SPEC.md` — full functional and technical specification
- `ARCHITECTURE_DECISION.md` — recommended architecture and deployment model
- `ISSUE_BODY_TEMPLATE.md` — deterministic GitHub issue markdown format
- `.github/ISSUE_TEMPLATE/stage-bug-report.yml` — GitHub bug issue form
- `FUTURE_ISSUES.md` — backlog ideas inspired by Marker.io-style features
- `COPILOT_MASTER_PROMPT.md` — master prompt for GitHub Copilot coding agent

## Recommended implementation model
- widget integrated into stage app
- separate reporting backend service
- GitHub issue creation from backend only