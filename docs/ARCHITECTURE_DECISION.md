# Architecture Decision

## Recommended approach
Embed the widget **inside the stage app**, but run the bug-reporting backend as a **separate service**.

### Final recommendation
- **Widget/UI location:** integrated in the stage app
- **Reporting API:** separate backend service
- **Screenshot storage:** separate object storage or backend-managed storage
- **GitHub credentials:** backend only

## Why this is the best fit
This model combines:
- low friction for testers
- direct access to app context
- strong credential isolation
- reusability across more than one stage app later

## Stage integration model
The stage app should load the bug widget only when:
- environment is stage
- feature flag is enabled
- user is an approved tester

This can be done via:
- internal component import
- lazy-loaded widget package
- script injection from a private package or CDN only if needed later

## Recommended first implementation
Use an **internal component or shared private package**, not an external popup domain.

That means:
- a button appears inside stage
- the modal opens inside stage
- submission goes to separate API service
- the API creates GitHub issue

## Domain suggestion
- Stage app: `https://stage.example.com`
- Reporting API: `https://bugreport-api.example.com`

## Why not a fully separate bug-report website?
Because it adds friction and loses context:
- harder screenshot capture
- worse route awareness
- worse UX
- harder auth alignment

## Why not fully embed backend logic in stage frontend?
Because GitHub credentials must stay on the server and the reporting system should remain reusable and isolated.

## Best long-term path
Start with:
- embedded widget
- separate reporting API

Later, if needed, promote the widget into:
- a reusable private package
- a multi-app internal QA tool