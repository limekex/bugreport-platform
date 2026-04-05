# Updating Your Test Domain to Widget SDK v0.2.0

Your test domain is still using the old version of the widget SDK. Here's how to upgrade to v0.2.0 with all the new features!

## 🆕 What's New in v0.2.0

- ✅ **Screenshot Annotation** — Draw arrows, shapes, text on screenshots
- ✅ **Authentication Modal** — Built-in login/register UI
- ✅ **Console Error Capture** — Automatically captures recent console errors
- ✅ **Network Request Tracking** — Logs failed HTTP requests
- ✅ **Bot Protection** — Honeypot and timing checks

## 📋 Update Steps

### Step 1: Update package.json

**OLD (workspace reference):**
```json
{
  "dependencies": {
    "@bugreport/widget-sdk": "workspace:*"
  }
}
```

**NEW (published npm package):**
```json
{
  "dependencies": {
    "@limekex/bugreport-widget-sdk": "^0.2.0"
  }
}
```

### Step 2: Update imports in your code

**OLD:**
```typescript
import { initBugReporter } from '@bugreport/widget-sdk';
```

**NEW:**
```typescript
import { initBugReporter } from '@limekex/bugreport-widget-sdk';
```

### Step 3: Install the new package

```bash
# Remove old package cache
rm -rf node_modules
rm package-lock.json  # or pnpm-lock.yaml, or yarn.lock

# Install fresh
npm install
# or
pnpm install
# or
yarn install
```

### Step 4: Rebuild your app

```bash
npm run build
# or
pnpm build
# or
yarn build
```

### Step 5: Start/Deploy

```bash
# Development
npm run dev

# Production - deploy the new build
```

## 🎨 Optional: Enable Authentication

If you want to require testers to log in before submitting bug reports, add the `requireAuth` option:

```typescript
initBugReporter({
  apiBaseUrl: 'https://gitreport.betait.no',
  environment: 'staging',
  requireAuth: true,  // 🆕 Shows login modal before bug report
  appVersion: '1.2.3',
});
```

## 🧪 For React Apps

If you're using React, you can also use the React wrapper:

```bash
npm install @limekex/bugreport-widget-react
```

```tsx
import { BugReporter } from '@limekex/bugreport-widget-react';

function App() {
  return (
    <>
      <h1>My App</h1>
      <BugReporter
        apiBaseUrl="https://gitreport.betait.no"
        environment="staging"
        requireAuth={false}
        appVersion="1.2.3"
      />
    </>
  );
}
```

## ✅ Verify It's Working

After updating and restarting, you should see:

1. **🐛 Report bug** button in the bottom-right corner
2. Click it → Modal opens with:
   - Title, severity, description fields
   - **📸 Capture Screenshot** button
   - After clicking screenshot:
     - **Annotation editor** opens with drawing tools:
       - ➡️ Arrow
       - ⬜ Rectangle
       - ⭕ Circle
       - ✏️ Pen (freehand)
       - 🔤 Text
       - 🎨 Color picker
       - ↩️ Undo
   - Console errors section (if any)
   - Failed network requests (if any)

## 🐛 Troubleshooting

### "Cannot find module '@limekex/bugreport-widget-sdk'"

Make sure you:
1. Changed package.json to use `@limekex/bugreport-widget-sdk`
2. Ran `npm install` / `pnpm install`
3. Restarted your dev server

### "Old modal still showing"

Your browser might be caching the old JavaScript bundle:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Verify your build process ran and generated new files

### Still not working?

Check that:
- You're importing from `@limekex/bugreport-widget-sdk` (not `@bugreport/widget-sdk`)
- Your build succeeded without errors
- The widget initialization runs (check browser console for errors)

## 📦 Version Check

To verify which version is installed:

```bash
npm list @limekex/bugreport-widget-sdk
# Should output: @limekex/bugreport-widget-sdk@0.2.0
```

## 🔗 NPM Package

View on npm: https://www.npmjs.com/package/@limekex/bugreport-widget-sdk
