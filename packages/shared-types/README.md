# @bugreport/shared-types

Shared TypeScript contracts used by both `bugreport-api` (backend) and `widget-sdk` (frontend).

## Contents

| File | Description |
|---|---|
| `api.ts` | `BugReportRequest`, `BugReportResponse`, `HealthResponse` |
| `issue.ts` | GitHub Issue payload / result types and label unions |
| `widget.ts` | `BugReporterConfig`, `CurrentUser`, `TraceContext`, `WidgetTheme` |

## Usage

```ts
import type { BugReportRequest, BugReportSuccessResponse } from '@bugreport/shared-types';
```

## Build

```bash
pnpm --filter @bugreport/shared-types build
```
