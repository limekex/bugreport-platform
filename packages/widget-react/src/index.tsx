/**
 * React wrapper for the BugReport Widget SDK
 * 
 * Provides a declarative <BugReporter> component with SSR support.
 */

import { useEffect, useRef } from 'react';
import { initBugReporter, type BugReporterConfig } from '@limekex/bugreport-widget-sdk';

export type { BugReporterConfig } from '@limekex/bugreport-widget-sdk';

export interface BugReporterProps extends BugReporterConfig {
  /**
   * Optional className for custom styling (applied to the button container if needed)
   */
  className?: string;
}

/**
 * BugReporter React Component
 * 
 * Renders a floating bug report button that opens a modal when clicked.
 * SSR-safe: will only initialize on the client side.
 * 
 * @example
 * ```tsx
 * <BugReporter
 *   apiBaseUrl="https://gitreport.betait.no"
 *   environment="production"
 *   appVersion="1.2.3"
 * />
 * ```
 */
export function BugReporter(props: BugReporterProps) {
  const { className, ...config } = props;
  const widgetRef = useRef<ReturnType<typeof initBugReporter> | null>(null);

  useEffect(() => {
    // SSR safety: only initialize in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Skip if disabled
    if (config.enabled === false) {
      return;
    }

    // Initialize widget
    try {
      widgetRef.current = initBugReporter(config);
    } catch (err) {
      console.error('[BugReporter] Initialization failed:', err);
    }

    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.destroy();
          widgetRef.current = null;
        } catch (err) {
          console.error('[BugReporter] Cleanup failed:', err);
        }
      }
    };
  }, [config.apiBaseUrl, config.environment, config.enabled]);

  // This component doesn't render anything visible
  // The SDK injects the button and modal into the DOM
  return null;
}

/**
 * Hook for programmatic access to the widget (advanced usage)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openModal } = useBugReporter({
 *     apiBaseUrl: "https://gitreport.betait.no",
 *     environment: "production"
 *   });
 *   
 *   return <button onClick={openModal}>Report Bug</button>;
 * }
 * ```
 */
export function useBugReporter(config: BugReporterConfig) {
  const widgetRef = useRef<ReturnType<typeof initBugReporter> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || config.enabled === false) {
      return;
    }

    try {
      widgetRef.current = initBugReporter(config);
    } catch (err) {
      console.error('[useBugReporter] Initialization failed:', err);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.destroy();
          widgetRef.current = null;
        } catch (err) {
          console.error('[useBugReporter] Cleanup failed:', err);
        }
      }
    };
  }, [config]);

  return {
    /**
     * Programmatically open the bug report modal
     */
    openModal: () => {
      widgetRef.current?.open();
    },
    /**
     * Programmatically close the bug report modal
     */
    closeModal: () => {
      widgetRef.current?.close();
    },
  };
}

export default BugReporter;
