# Stage Bug Reporter - Integration Guide

## 🎯 Goal
Add the Stage Bug Reporter widget to your staging application so testers can submit bug reports directly to GitHub.

## 📦 Installation

### Option 1: Install from npm
```bash
npm install @limekex/bugreport-widget-sdk
# or
pnpm add @limekex/bugreport-widget-sdk
# or
yarn add @limekex/bugreport-widget-sdk
```

### Option 2: Install from GitHub (before npm publish)
```bash
npm install github:limekex/bugreport-platform#main
```

## 🔧 Integration Steps

### 1. Add Environment Variables

Add to your `.env.local` or deployment config:

```bash
# Required
NEXT_PUBLIC_BUGREPORT_API_URL=https://gitreport.betait.no
NEXT_PUBLIC_ENVIRONMENT=staging

# Optional but recommended
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_COMMIT_SHA=abc123
```

### 2. Initialize the Widget

#### For React/Next.js Apps

Add this to your root layout or app component (e.g., `app/layout.tsx` or `pages/_app.tsx`):

```typescript
'use client'; // if using Next.js 13+ App Router

import { useEffect } from 'react';
import { initBugReporter } from '@limekex/bugreport-widget-sdk';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Only enable in staging/development
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging') {
      const widget = initBugReporter({
        apiBaseUrl: process.env.NEXT_PUBLIC_BUGREPORT_API_URL!,
        environment: 'staging',
        enabled: true,
        
        // App metadata
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
        commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA,
        
        // Current user (replace with your actual user data)
        currentUser: {
          id: 'your-user-id',      // From your auth system
          email: 'user@example.com', // From your auth system
          name: 'Test User',         // From your auth system
          role: 'tester',            // From your auth system
        },
        
        // Optional: Customize appearance
        theme: {
          primaryColor: '#7c3aed',
          buttonPosition: 'bottom-right',
        },
      });

      return () => widget.destroy();
    }
  }, []);

  return children;
}
```

#### For Vanilla JavaScript Apps

Add this to your main entry point:

```javascript
import { initBugReporter } from '@limekex/bugreport-widget-sdk';

if (window.location.hostname.includes('staging')) {
  initBugReporter({
    apiBaseUrl: 'https://gitreport.betait.no',
    environment: 'staging',
    enabled: true,
    currentUser: {
      id: getCurrentUserId(),
      email: getCurrentUserEmail(),
      name: getCurrentUserName(),
      role: 'tester',
    },
  });
}
```

### 3. Replace Placeholder User Data

**IMPORTANT:** The widget needs real user information. Replace the placeholder `currentUser` with actual data from your authentication system:

```typescript
// Example with NextAuth
import { useSession } from 'next-auth/react';

const { data: session } = useSession();

currentUser: {
  id: session?.user?.id ?? 'anonymous',
  email: session?.user?.email ?? undefined,
  name: session?.user?.name ?? undefined,
  role: 'tester',
}
```

```typescript
// Example with Supabase
import { useUser } from '@supabase/auth-helpers-react';

const user = useUser();

currentUser: {
  id: user?.id ?? 'anonymous',
  email: user?.email ?? undefined,
  name: user?.user_metadata?.name ?? undefined,
  role: 'tester',
}
```

```typescript
// Example with Auth0
import { useAuth0 } from '@auth0/auth0-react';

const { user } = useAuth0();

currentUser: {
  id: user?.sub ?? 'anonymous',
  email: user?.email ?? undefined,
  name: user?.name ?? undefined,
  role: 'tester',
}
```

### 4. Verify Configuration

Before deploying, make sure:

- ✅ The domain is registered in the admin panel at `https://gitreport.betait.no/admin/`
- ✅ `NEXT_PUBLIC_BUGREPORT_API_URL` points to `https://gitreport.betait.no`
- ✅ Widget only loads in staging environment, not production
- ✅ `currentUser` contains real authenticated user data
- ✅ CORS is configured (domain should already be registered)

## 🧪 Testing

1. Deploy to your staging environment
2. Look for a floating **🐛 Report bug** button in the bottom-right corner
3. Click it and fill out a test bug report
4. Submit with a screenshot
5. Check GitHub repository `limekex/bugreport-platform` for the new issue
6. Verify the issue has:
   - Correct labels (bug, stage, needs-triage)
   - User information
   - Screenshot attached
   - Browser/environment details

## 🎨 Customization

### Theme Options

```typescript
theme: {
  primaryColor: '#7c3aed',        // Your brand color
  buttonPosition: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}
```

### Disable in Production

**CRITICAL:** Never enable the widget in production!

```typescript
enabled: process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging',
```

## 📚 API Reference

See `types.ts` in this folder for full TypeScript definitions of:
- `BugReporterConfig`
- `CurrentUser`
- `WidgetTheme`
- `TraceContext`

## 🔍 Troubleshooting

### Widget Doesn't Appear
1. Check browser console for errors
2. Verify `enabled: true` in config
3. Confirm environment is set to 'staging'
4. Check that the widget isn't blocked by CSP headers

### CORS Errors
1. Verify domain is registered in admin panel
2. Check network tab for preflight OPTIONS request
3. Confirm `apiBaseUrl` is correct

### Bug Reports Not Creating GitHub Issues
1. Check network tab for 500 errors
2. Verify GitHub token has correct permissions
3. Check PM2 logs on server: `pm2 logs bugreport-api`
4. Verify S3 credentials if using screenshots

## 📞 Support

For issues or questions, check the main README.md or create an issue in the repository.
