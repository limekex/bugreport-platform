# API Contract

## Base URL

```
https://bugreport.betait.no
```

All endpoints are prefixed with `/api`.

---

## Endpoints

### `GET /health`

Returns the service health status.

**Response `200`**

```json
{
  "status": "ok",
  "timestamp": "2024-05-01T12:00:00.000Z",
  "uptime": 3600.5,
  "env": "production"
}
```

---

### `POST /api/reports/bug`

Submits a bug report. Creates a GitHub Issue in the configured repository.

**Content-Type:** `multipart/form-data`

#### Request fields

| Field | Type | Required | Description |
|---|---|---|---|
| `summary` | `string` (5–200) | ✅ | Short one-line summary of the bug |
| `severity` | `"blocker" \| "high" \| "medium" \| "low"` | ✅ | Impact level |
| `whatHappened` | `string` (10–5000) | ✅ | Description of the observed behaviour |
| `expectedResult` | `string` (5–2000) | ✅ | What should have happened |
| `actualResult` | `string` (5–2000) | ✅ | What actually happened |
| `stepsToReproduce` | `string` (5–5000) | ✅ | Step-by-step reproduction instructions |
| `notes` | `string` (≤2000) | ➖ | Free-form additional notes |
| `contactEmail` | `string` (email) | ➖ | Email of the tester |
| `testerId` | `string` (≤100) | ➖ | ID of the tester (e.g. user ID from auth system) |
| `testerRole` | `string` (≤100) | ➖ | Role of the tester (e.g. "qa", "pm") |
| `environment` | `string` (1–100) | ✅ | Logical environment name (e.g. "staging") |
| `appVersion` | `string` (≤100) | ➖ | Deployed app version string |
| `commitSha` | `string` (≤160) | ➖ | Git commit SHA of the running build |
| `buildNumber` | `string` (≤100) | ➖ | CI build number |
| `pageUrl` | `string` (URL) | ➖ | Full URL of the page where the bug occurred |
| `route` | `string` (≤500) | ➖ | SPA route path (e.g. `/dashboard/events/123`) |
| `browser` | `string` (≤200) | ➖ | User-agent string or browser name/version |
| `operatingSystem` | `string` (≤200) | ➖ | OS name/version |
| `viewport` | `string` (≤50) | ➖ | Viewport dimensions, e.g. `1440x900` |
| `locale` | `string` (≤20) | ➖ | Browser locale, e.g. `en-GB` |
| `traceId` | `string` (≤200) | ➖ | Distributed trace ID (OpenTelemetry / Sentry) |
| `optionalClientErrors` | `string` (≤10000) | ➖ | JSON-stringified client-side error array |
| `screenshot` | `File` (PNG/JPEG/WebP/GIF, ≤5 MB) | ➖ | Screenshot of the bug |

#### Success response `201`

```json
{
  "success": true,
  "reportId": "V1StGXR8_Z5jdHi6B-myT",
  "githubIssueNumber": 42,
  "githubIssueUrl": "https://github.com/your-org/your-repo/issues/42",
  "message": "Bug report submitted. A GitHub issue has been created."
}
```

#### Error response `400` (validation failure)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "summary": ["String must contain at least 5 character(s)"]
    },
    "formErrors": []
  }
}
```

#### Error response `429` (rate limit)

```json
{
  "success": false,
  "error": "Too many requests from this IP. Please try again later."
}
```

#### Error response `500` (internal error)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## CORS

The API only accepts requests from origins listed in the `ALLOWED_ORIGINS` environment variable. All other origins receive a CORS error.

## Rate limiting

- Per-IP: configurable via `RATE_LIMIT_PER_IP_PER_HOUR` (default: 50/hour)
- Per-user: **TODO** — tester-ID-based limiting is not yet implemented

## Authentication

There is no client-to-API authentication in the initial version. The API relies on:
- CORS allow-listing to prevent arbitrary cross-origin requests
- Rate limiting to prevent abuse

**TODO:** Add signed request tokens or API key verification for tighter control.
