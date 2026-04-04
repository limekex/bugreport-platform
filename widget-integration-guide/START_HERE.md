# Widget Integration Guide for Coding Agents

This folder contains everything needed to integrate the Stage Bug Reporter widget into your staging application.

## 📁 Files in this folder

1. **INTEGRATION_INSTRUCTIONS.md** - Complete step-by-step guide for integration
2. **NPM_PUBLISHING.md** - How to publish the widget to npm
3. **integration-code-template.tsx** - Ready-to-use code snippets
4. **react-example.tsx** - Working example from the monorepo
5. **widget-sdk-exports.ts** - What the SDK exports
6. **types.ts** - TypeScript type definitions
7. **README.md** - Original widget SDK readme
8. **START_HERE.md** - This file (overview)

## 🚀 Quick Start for Coding Agents

### What to tell your coding agent:

```
Install and integrate the Stage Bug Reporter widget into our staging app.

Configuration:
- API URL: https://gitreport.betait.no
- Environment: staging only (not production)
- Auth system: [specify your auth: NextAuth/Supabase/Auth0/Clerk/other]

Reference files are in the widget-integration-guide/ folder:
- See INTEGRATION_INSTRUCTIONS.md for full setup
- See integration-code-template.tsx for code examples
- Use the auth integration that matches our stack

Requirements:
1. Install @limekex/bugreport-widget-sdk package
2. Add environment variables to .env
3. Initialize widget in root layout/app component
4. Pass authenticated user data from our auth system
5. Only enable in staging environment
6. Test by submitting a bug report
```

## 📦 Publishing to npm

Before the widget can be installed, you need to publish it:

1. Read **NPM_PUBLISHING.md** for full instructions
2. Quick version:
   ```bash
   cd packages/widget-sdk
   # Edit package.json: remove "private": true
   npm login
   pnpm build
   npm publish --access public
   ```

## 🔧 Integration Code

The **integration-code-template.tsx** file includes:

✅ Basic React integration  
✅ Next.js App Router example  
✅ Next.js Pages Router example  
✅ Vanilla JavaScript example  
✅ NextAuth integration  
✅ Supabase integration  
✅ Auth0 integration  
✅ Clerk integration  

**For the coding agent:** Copy the appropriate template based on your project's:
- Framework (React/Next.js/Vanilla)
- Auth system (NextAuth/Supabase/Auth0/Clerk/custom)

## 🎯 Key Configuration Values

Your specific setup:

```typescript
{
  apiBaseUrl: 'https://gitreport.betait.no',
  environment: 'staging',
  enabled: true,
  currentUser: {
    // Get from your auth system
    id: session?.user?.id,
    email: session?.user?.email,
    name: session?.user?.name,
    role: 'tester'
  }
}
```

## ✅ Checklist for Agent

Before considering integration complete:

- [ ] Package installed (`@limekex/bugreport-widget-sdk`)
- [ ] Environment variables added
- [ ] Widget initialized in root component
- [ ] User data pulled from auth system (not hardcoded)
- [ ] Widget only loads in staging (not production)
- [ ] Tested: floating bug button appears
- [ ] Tested: can submit bug report
- [ ] Tested: GitHub issue created successfully

## 🧪 Testing

After integration:

1. Open your staging app
2. Look for 🐛 button in bottom-right
3. Click and submit test bug report
4. Check GitHub repo: limekex/bugreport-platform
5. Verify issue has correct labels and user info

## 📞 Need Help?

If the agent encounters issues:

1. **CORS errors** → Domain needs to be registered in admin panel
2. **Widget not showing** → Check `enabled: true` and environment
3. **Type errors** → See types.ts for full TypeScript definitions
4. **Build errors** → Make sure package is published to npm first

## 🔗 Production Configuration

**API:** https://gitreport.betait.no  
**Admin Panel:** https://gitreport.betait.no/admin/  
**GitHub Repo:** limekex/bugreport-platform  
**Issues created with labels:** bug, stage, needs-triage  

---

**Note:** The widget is currently private in the monorepo. You must publish to npm (see NPM_PUBLISHING.md) before it can be installed in other projects.
