# Security

This document describes the security model of Stage Bug Reporter.

---

## GitHub credentials

**Rule: GitHub tokens must never be exposed to client-side code.**

- The `GITHUB_TOKEN` lives only in the backend's environment variables.
- It is never included in HTTP responses.
- It is never logged (Pino's `redact` option should be added for production).
- The token should use **fine-grained permissions**: `issues:write` only, scoped to the specific repository. Never use a token with `repo` (full) access when `issues:write` is sufficient.

---

## Cookie and session data

**Rule: Never capture cookies, session tokens, or authentication credentials.**

The widget SDK explicitly omits `credentials: 'include'` from fetch calls (`credentials: 'omit'`). This ensures that cookies belonging to the stage app are never sent to the bug-report backend.

Do not add any mechanism to the SDK that reads `document.cookie` or `localStorage` auth tokens and includes them in the report payload.

---

## Input sanitisation

All incoming request fields are validated with Zod before use:
- String length limits are enforced.
- Email fields use `z.string().email()`.
- URL fields use `z.string().url()`.

When formatting the GitHub Issue body, user-supplied content is inserted as-is into Markdown. For the current use case (internal testers only) this is acceptable. If the system is ever opened to untrusted users, add HTML / Markdown sanitisation before inserting user content into the issue body.

---

## File upload validation

Screenshots are validated on the backend:
- MIME type must be one of: `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
- File size is limited by `MAX_UPLOAD_MB` (default: 5 MB).
- Files are stored in `tmp/` and must be moved to permanent storage by the storage service before the response is returned.

**TODO:** Add server-side MIME type verification using file magic bytes (not just the declared MIME type) before the real storage service is implemented.

---

## CORS

The API restricts cross-origin requests to a whitelist defined in `ALLOWED_ORIGINS`. Any origin not in the list receives a `403`-equivalent CORS rejection before the request body is even parsed.

Keep `ALLOWED_ORIGINS` as narrow as possible:
- Development: `http://localhost:3000,http://localhost:5173`
- Production: `https://stage.reginor.events` (only the specific stage app)

---

## Rate limiting

Rate limiting is applied at the IP level using `express-rate-limit`. This reduces the risk of the GitHub API being flooded.

**TODO:** Implement per-tester rate limiting once tester authentication is in place.

---

## Signed upload URLs (future)

When the screenshot storage service is implemented, consider using **signed upload URLs** so that the client uploads directly to S3/R2 without the file passing through the Node.js process. This reduces backend memory pressure and attack surface.

---

## Dependency security

- Dependencies are pinned to minor versions in `package.json`.
- Run `pnpm audit` regularly and before deployments.
- Enable Dependabot in the GitHub repository settings.

---

## Secrets in logs

Pino does not automatically redact sensitive fields. Before production, configure log redaction:

```ts
pino({
  redact: ['req.headers.authorization', 'github.token'],
})
```
