# Publishing npm Packages

## Overview

This workspace uses pnpm with the workspace protocol for local development. When publishing packages to npm, follow this guide to avoid common pitfalls.

## Important Rules

### ✅ DO: Keep `workspace:*` in Source

```json
{
  "dependencies": {
    "@limekex/bugreport-widget-sdk": "workspace:*"
  }
}
```

- pnpm **automatically converts** `workspace:*` to actual version ranges during `npm publish`
- This keeps local development working while ensuring published packages have proper dependencies
- Never commit hardcoded version numbers like `^0.2.2` in place of `workspace:*`

### ❌ DON'T: Manually Change workspace:* to Version Numbers

```json
{
  "dependencies": {
    "@limekex/bugreport-widget-sdk": "^0.2.2"  // ❌ Breaks CI
  }
}
```

This breaks `pnpm install --frozen-lockfile` in CI because the lockfile expects `workspace:*`.

## Publishing Workflow

### 1. Bump Version

```bash
cd packages/widget-sdk
npm version patch  # or minor, or major

cd ../widget-react
npm version patch
```

### 2. Build Packages

```bash
cd ../..  # Back to workspace root
pnpm build
```

### 3. Publish to npm

```bash
cd packages/widget-sdk
npm publish --access public

cd ../widget-react
npm publish --access public
```

**Note:** pnpm will automatically convert `workspace:*` to the actual version (e.g., `^0.2.2`) in the published tarball.

### 4. Commit Version Bumps

```bash
cd ../..
git add packages/*/package.json
git commit -m "chore: bump to vX.Y.Z"
git push origin main
```

## Verifying Published Package

After publishing, you can verify the published package has proper dependencies:

```bash
npm view @limekex/bugreport-widget-react
```

Look for the `dependencies` field - it should show the actual version range, not `workspace:*`.

## Common Issues

### Issue: "Cannot install with frozen-lockfile"

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" 
because pnpm-lock.yaml is not up to date with packages/widget-react/package.json
```

**Cause:** Someone manually changed `workspace:*` to a version number in package.json

**Solution:** 
```bash
# Revert to workspace:*
git checkout packages/widget-react/package.json

# Or manually change back:
"@limekex/bugreport-widget-sdk": "workspace:*"
```

### Issue: Published Package Has workspace:* Dependency

This shouldn't happen with modern pnpm, but if it does:

**Cause:** Very old version of pnpm or corrupt publish

**Solution:** 
1. Check pnpm version: `pnpm --version` (should be >=8)
2. Unpublish broken version: `npm unpublish @limekex/package@version`
3. Republish with latest pnpm

## Current Package Versions

- **@limekex/bugreport-widget-sdk**: 0.2.2
- **@limekex/bugreport-widget-react**: 0.2.3

## publishConfig

Both packages have `publishConfig` for consistency:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

This ensures packages are published as public without needing `--access public` flag.
