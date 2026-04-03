import type { BugReporterConfig } from '@bugreport/shared-types';
import type { WidgetInstance, WidgetEventType, WidgetEventListener } from '../types/widget.types';
import { injectFloatingButton, removeFloatingButton } from './button';

/**
 * Initialises the bug reporter widget.
 *
 * Call this once in your stage app's entry point (e.g. main.tsx or _app.tsx).
 *
 * @example
 * ```ts
 * import { initBugReporter } from '@bugreport/widget-sdk';
 *
 * initBugReporter({
 *   apiBaseUrl: 'https://bugreport.betait.no',
 *   environment: 'staging',
 *   enabled: true,
 *   appVersion: '1.2.3',
 *   commitSha: process.env.VITE_COMMIT_SHA,
 * });
 * ```
 */
export function initBugReporter(config: BugReporterConfig): WidgetInstance {
  const listeners: Partial<Record<WidgetEventType, WidgetEventListener[]>> = {};

  const emit = (type: WidgetEventType, payload?: unknown) => {
    listeners[type]?.forEach((fn) => fn({ type, payload }));
  };

  const instance: WidgetInstance = {
    config,
    state: 'idle',
    open: () => {
      instance.state = 'open';
      emit('open');
    },
    close: () => {
      instance.state = 'idle';
      emit('close');
    },
    on: (type, listener) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type]!.push(listener);
    },
    destroy: () => {
      removeFloatingButton();
    },
  };

  if (config.enabled !== false && typeof document !== 'undefined') {
    injectFloatingButton(instance, config.theme);
  }

  return instance;
}
