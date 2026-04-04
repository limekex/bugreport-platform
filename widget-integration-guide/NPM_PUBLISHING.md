# Publishing @bugreport/widget-sdk to npm

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` and enter your credentials
3. **Access rights**: You need to own the `@bugreport` scope or use a different scope

## Step-by-Step Publishing Guide

### 1. Update package.json

Edit `packages/widget-sdk/package.json`:

```diff
{
  "name": "@bugreport/widget-sdk",
  "version": "0.1.0",
- "private": true,
+ "private": false,
  "description": "Browser SDK for embedding the Stage Bug Reporter widget",
  
+ "repository": {
+   "type": "git",
+   "url": "https://github.com/limekex/bugreport-platform.git",
+   "directory": "packages/widget-sdk"
+ },
+ "keywords": [
+   "bug-reporter",
+   "bug-tracking",
+   "staging",
+   "testing",
+   "github-issues"
+ ],
+ "author": "Your Name",
+ "license": "MIT"
}
```

**Alternative:** If `@bugreport` scope is unavailable, rename to:
```json
"name": "@your-username/widget-sdk"
```

### 2. Build the Package

```bash
cd /Users/bjorn-torealmas/Developer/GIT/bugreport-platform
pnpm --filter @bugreport/widget-sdk build
```

This compiles TypeScript to `dist/` folder.

### 3. Verify Package Contents

Check what will be published:

```bash
cd packages/widget-sdk
npm pack --dry-run
```

This shows all files that will be included. Should see:
- ✅ dist/index.js
- ✅ dist/index.mjs
- ✅ dist/index.d.ts
- ✅ package.json
- ✅ README.md
- ❌ src/ (excluded)
- ❌ node_modules/ (excluded)

### 4. Login to npm

```bash
npm login
```

Enter:
- Username
- Password
- Email
- One-time password (if 2FA enabled)

### 5. Publish

**First time publishing:**

```bash
cd packages/widget-sdk
npm publish --access public
```

Note: `--access public` is required for scoped packages (@bugreport/...)

**Subsequent updates:**

1. Bump version in package.json:
```bash
npm version patch  # 0.1.0 -> 0.1.1 (bug fixes)
npm version minor  # 0.1.0 -> 0.2.0 (new features)
npm version major  # 0.1.0 -> 1.0.0 (breaking changes)
```

2. Build and publish:
```bash
pnpm build
npm publish
```

### 6. Verify Publication

Check your package is live:
```bash
npm view @bugreport/widget-sdk
```

Or visit: https://www.npmjs.com/package/@bugreport/widget-sdk

### 7. Test Installation

In a separate project:
```bash
npm install @bugreport/widget-sdk
```

## Alternative: Private npm Registry

If you don't want to publish publicly, use GitHub Packages:

### 1. Update package.json

```json
{
  "name": "@limekex/widget-sdk",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### 2. Create .npmrc in package root

```
@limekex:registry=https://npm.pkg.github.com
```

### 3. Authenticate

```bash
npm login --registry=https://npm.pkg.github.com
# Username: limekex
# Password: YOUR_GITHUB_PAT
```

### 4. Publish

```bash
npm publish
```

### 5. Install in other projects

Users need a `.npmrc` file:
```
@limekex:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Then:
```bash
npm install @limekex/widget-sdk
```

## Automation (Optional)

### GitHub Actions Auto-Publish

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm --filter @bugreport/widget-sdk build
      - run: pnpm --filter @bugreport/widget-sdk publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Usage:
```bash
git tag v0.1.1
git push origin v0.1.1
```

## Troubleshooting

### Error: 403 Forbidden
- Scope `@bugreport` might be taken
- Try `npm whoami` to verify you're logged in
- Use your username: `@your-username/widget-sdk`

### Error: Package name too similar
- Choose a more unique name
- Examples: `@your-org/stage-bug-reporter`, `stage-bug-widget`

### Error: Cannot publish over existing version
- Bump version: `npm version patch`
- Or unpublish old version (within 72 hours): `npm unpublish @bugreport/widget-sdk@0.1.0`

### Files missing from package
- Add/update `.npmignore` or use `files` field in package.json:
```json
{
  "files": ["dist", "README.md"]
}
```

## Quick Reference

```bash
# One-time setup
npm login

# Every release
cd packages/widget-sdk
npm version patch
pnpm build
npm publish --access public

# Verify
npm view @limekex/bugreport-widget-sdk
```
