# Architecture

## Overview

Stage Bug Reporter is a monorepo that provides an **internal bug-reporting system** for staging and UAT environments. It is designed to be reused across multiple stage apps without code duplication.

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE APP (browser)                       │
│   stage.reginor.events                                       │
│   ┌─────────────────────────────────────────────┐           │
│   │  @bugreport/widget-sdk                       │           │
│   │  - Floating trigger button                   │           │
│   │  - Bug report modal                          │           │
│   │  - Payload builder (browser context)         │           │
│   │  - API client (fetch)                        │           │
│   └─────────────────┬───────────────────────────┘           │
└─────────────────────│───────────────────────────────────────┘
                      │  HTTPS POST /api/reports/bug
                      │  (multipart/form-data)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  bugreport.betait.no  (bugreport-api)                        │
│  - Express + Zod validation                                  │
│  - Rate limiting (express-rate-limit)                        │
│  - Screenshot storage (S3/R2 — TODO)                         │
│  - Issue formatter                                           │
│  - Octokit → GitHub Issues API                               │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
              github.com/your-org/your-repo
              (Issues created here)
```

---

## Why the backend lives on its own domain

**GitHub credentials must never reach the browser.**

If the widget posted directly to the GitHub API from the browser, the GitHub token would be exposed in network requests visible to any user with DevTools open. This is a hard security boundary.

By routing all GitHub API calls through a dedicated backend service:
- The token is only ever in server memory / environment variables.
- We can enforce rate limiting, input validation, and CORS at the server level.
- A single backend deployment serves multiple stage apps.
- We can add authentication / allow-listing of testers without touching client code.

---

## Why the widget runs inside the stage app

An **in-app widget** captures the full browser context at the exact moment of the bug:

| Data | How it's captured |
|---|---|
| Current URL / route | `window.location` |
| Browser & OS | `navigator.userAgent` |
| Viewport size | `window.innerWidth/Height` |
| Locale | `navigator.language` |
| Console errors | Captured by SDK hook (TODO) |
| Active trace ID | `getTraceContext()` callback |

A redirect to a separate bug-report page would lose all of this context and require the tester to copy details manually — introducing friction and inaccurate reports.

---

## Why SDK-first is preferred over an external popup / iframe

| Approach | Pros | Cons |
|---|---|---|
| External popup page | Simple to build | Loses browser context; requires manual copy-paste; blocked by popup blockers |
| Embedded iframe | Keeps context | Cross-origin restrictions; hard to style; complex message passing |
| **In-app SDK** | ✅ Full context; seamless UX; type-safe; SSR-friendly | Requires one import per consumer app |

The SDK approach is the most robust and the one chosen here.

---

## How this could support a generic embed script later

The `initBugReporter()` function is intentionally framework-agnostic. The floating button is a plain DOM element. To support a `<script>` tag embed (for apps that cannot install npm packages):

1. Bundle `widget-sdk` as a UMD/IIFE with `vite build --mode lib`.
2. Host the bundle on a CDN (e.g. `https://cdn.bugreport.betait.no/widget.js`).
3. Consumer apps add:

```html
<script
  src="https://cdn.bugreport.betait.no/widget.js"
  data-api-base-url="https://bugreport.betait.no"
  data-environment="staging"
></script>
```

4. The bundle reads `data-*` attributes and calls `initBugReporter()` automatically.

This extension is tracked in the [ROADMAP](ROADMAP.md).
