# bugreport-api

Backend Express service for the Stage Bug Reporter platform.

## Responsibilities

- Accept bug reports via `POST /api/reports/bug` (multipart/form-data)
- Validate payloads with Zod
- Optionally store screenshots (placeholder → S3/R2)
- Create GitHub Issues via Octokit
- Enforce IP-level rate limiting
- Log structured JSON with Pino

## Configuration

Copy `.env.example` → `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | PAT or GitHub App token with `issues:write` |
| `GITHUB_OWNER` | Repository owner (org or user) |
| `GITHUB_REPO` | Repository name |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

## Scripts

```bash
pnpm dev          # tsx watch — hot reload
pnpm build        # compile to dist/
pnpm start        # run compiled dist/server.js
pnpm typecheck    # type-check without emitting
pnpm test         # vitest run
pnpm lint         # eslint
```

## Placeholder services

| Service | Status |
|---|---|
| `storage.service.ts` | **TODO** — real S3/R2 upload not implemented |
| `github.service.ts` | ✅ Octokit wired; requires valid `GITHUB_TOKEN` |
