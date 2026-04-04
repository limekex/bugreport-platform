import { useEffect } from 'react';
import { initBugReporter } from '@bugreport/widget-sdk';

/**
 * Example: how stage.reginor.events would integrate the bug reporter widget.
 *
 * In a real app:
 * - Replace the placeholder values with real environment variables.
 * - Provide the actual authenticated user from your auth context.
 * - Provide a real getTraceContext if you use OpenTelemetry or Sentry.
 */
export default function App() {
  useEffect(() => {
    const widget = initBugReporter({
      apiBaseUrl: import.meta.env.VITE_BUGREPORT_API_URL ?? 'http://localhost:3001',
      environment: import.meta.env.VITE_ENVIRONMENT ?? 'staging',
      enabled: true,
      appVersion: import.meta.env.VITE_APP_VERSION,
      commitSha: import.meta.env.VITE_COMMIT_SHA,
      buildNumber: import.meta.env.VITE_BUILD_NUMBER,
      currentUser: {
        // TODO: Replace with real user from auth context (e.g. useAuth())
        id: 'tester-001',
        email: 'tester@reginor.events',
        name: 'Test User',
        role: 'qa',
      },
      getTraceContext: () => ({
        // TODO: Replace with real trace context from OpenTelemetry / Sentry
        traceId: undefined,
      }),
      theme: {
        primaryColor: '#7c3aed',
        buttonPosition: 'bottom-right',
      },
    });

    return () => {
      widget.destroy();
    };
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>stage.reginor.events — Example App</h1>
      <p>
        This page demonstrates how to integrate the <code>@bugreport/widget-sdk</code> into a React
        application.
      </p>
      <p>
        The floating <strong>🐛 Report bug</strong> button in the bottom-right corner is injected
        by the SDK.
      </p>
      <p>
        Click it to open the bug-report modal (
        <em>modal UI is a placeholder — see packages/widget-sdk/src/widget/modal.ts</em>).
      </p>
    </main>
  );
}
