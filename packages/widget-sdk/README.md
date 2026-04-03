# @bugreport/widget-sdk

Reusable browser SDK for embedding the Stage Bug Reporter widget into staging/UAT applications.

## Usage

```ts
import { initBugReporter } from '@bugreport/widget-sdk';

initBugReporter({
  apiBaseUrl: 'https://bugreport.betait.no',
  environment: 'staging',
  enabled: true,
  appVersion: '1.2.3',
  commitSha: process.env.VITE_COMMIT_SHA,
  currentUser: { id: 'tester-001', email: 'tester@example.com', role: 'qa' },
});
```

This injects a floating **🐛 Report bug** button into the page. Clicking it opens the bug report modal (placeholder).

## Config

See `BugReporterConfig` in `@bugreport/shared-types` for full config options.

## React example

```bash
cd examples/react-example
pnpm dev
```

## Scripts

```bash
pnpm build        # compile TypeScript
pnpm typecheck    # type-check without emit
pnpm dev          # watch mode
```

## Architecture notes

- The `init.ts` entry point is framework-agnostic.
- The floating button is a plain DOM element — no React required for the trigger.
- The modal (`modal.ts`) is a **TODO** placeholder — replace with a real React component or Headless UI modal.
- `payloadBuilder.ts` auto-collects browser context (URL, viewport, locale, user-agent).
- `apiClient.ts` handles the multipart POST to the backend.
