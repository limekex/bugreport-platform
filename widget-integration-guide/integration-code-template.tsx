/**
 * Stage Bug Reporter Integration
 * 
 * Copy this code into your root layout or app component.
 * Replace the TODO sections with your actual implementation.
 */

'use client'; // Remove if not using Next.js App Router

import { useEffect } from 'react';
import { initBugReporter } from '@limekex/bugreport-widget-sdk';

export function BugReporterWidget() {
  useEffect(() => {
    // Only enable in staging environment
    const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
    
    if (!isStaging) {
      return; // Don't load widget in production
    }

    const widget = initBugReporter({
      // API endpoint for bug reports
      apiBaseUrl: process.env.NEXT_PUBLIC_BUGREPORT_API_URL || 'https://gitreport.betait.no',
      
      // Environment name
      environment: 'staging',
      
      // Enable the widget
      enabled: true,
      
      // App version info (optional but recommended)
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA,
      buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER,
      
      // Current user information
      // TODO: Replace with actual user from your auth system
      currentUser: {
        id: 'TODO-GET-FROM-AUTH',        // e.g., session?.user?.id
        email: 'TODO-GET-FROM-AUTH',      // e.g., session?.user?.email
        name: 'TODO-GET-FROM-AUTH',       // e.g., session?.user?.name
        role: 'tester',                   // or 'qa', 'developer', etc.
      },
      
      // Optional: Add trace context for error tracking
      getTraceContext: () => ({
        traceId: undefined, // TODO: Add Sentry/OpenTelemetry trace ID if available
      }),
      
      // Optional: Customize appearance
      theme: {
        primaryColor: '#7c3aed',          // Your brand color
        buttonPosition: 'bottom-right',   // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      },
    });

    // Cleanup on unmount
    return () => {
      widget.destroy();
    };
  }, []); // TODO: Add dependencies if currentUser changes, e.g., [session]

  return null; // This component doesn't render anything
}


// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE USAGE IN DIFFERENT FRAMEWORKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Next.js 13+ App Router (app/layout.tsx)
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BugReporterWidget />
        {children}
      </body>
    </html>
  );
}

/**
 * Next.js Pages Router (pages/_app.tsx)
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <BugReporterWidget />
      <Component {...pageProps} />
    </>
  );
}

/**
 * React SPA (main.tsx or App.tsx)
 */
function App() {
  return (
    <>
      <BugReporterWidget />
      <YourAppContent />
    </>
  );
}

/**
 * Vanilla JavaScript (no React)
 */
import { initBugReporter } from '@limekex/bugreport-widget-sdk';

if (window.location.hostname.includes('staging')) {
  initBugReporter({
    apiBaseUrl: 'https://gitreport.betait.no',
    environment: 'staging',
    enabled: true,
    currentUser: {
      id: getCurrentUserId(),      // Your function to get user ID
      email: getCurrentUserEmail(), // Your function to get user email
      name: getCurrentUserName(),   // Your function to get user name
      role: 'tester',
    },
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION WITH DIFFERENT AUTH SYSTEMS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WITH NEXTAUTH
 */
import { useSession } from 'next-auth/react';

function BugReporterWithNextAuth() {
  const { data: session } = useSession();
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') return;
    
    const widget = initBugReporter({
      apiBaseUrl: 'https://gitreport.betait.no',
      environment: 'staging',
      enabled: true,
      currentUser: {
        id: session?.user?.id ?? 'anonymous',
        email: session?.user?.email ?? undefined,
        name: session?.user?.name ?? undefined,
        role: 'tester',
      },
    });
    
    return () => widget.destroy();
  }, [session]);
  
  return null;
}

/**
 * WITH SUPABASE
 */
import { useUser } from '@supabase/auth-helpers-react';

function BugReporterWithSupabase() {
  const user = useUser();
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') return;
    
    const widget = initBugReporter({
      apiBaseUrl: 'https://gitreport.betait.no',
      environment: 'staging',
      enabled: true,
      currentUser: {
        id: user?.id ?? 'anonymous',
        email: user?.email ?? undefined,
        name: user?.user_metadata?.name ?? undefined,
        role: 'tester',
      },
    });
    
    return () => widget.destroy();
  }, [user]);
  
  return null;
}

/**
 * WITH AUTH0
 */
import { useAuth0 } from '@auth0/auth0-react';

function BugReporterWithAuth0() {
  const { user } = useAuth0();
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') return;
    
    const widget = initBugReporter({
      apiBaseUrl: 'https://gitreport.betait.no',
      environment: 'staging',
      enabled: true,
      currentUser: {
        id: user?.sub ?? 'anonymous',
        email: user?.email ?? undefined,
        name: user?.name ?? undefined,
        role: 'tester',
      },
    });
    
    return () => widget.destroy();
  }, [user]);
  
  return null;
}

/**
 * WITH CLERK
 */
import { useUser } from '@clerk/nextjs';

function BugReporterWithClerk() {
  const { user } = useUser();
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') return;
    
    const widget = initBugReporter({
      apiBaseUrl: 'https://gitreport.betait.no',
      environment: 'staging',
      enabled: true,
      currentUser: {
        id: user?.id ?? 'anonymous',
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        name: user?.fullName ?? undefined,
        role: 'tester',
      },
    });
    
    return () => widget.destroy();
  }, [user]);
  
  return null;
}
