import type { BugReporterConfig } from '@bugreport/shared-types';
import type { WidgetInstance, WidgetEventType, WidgetEventListener } from '../types/widget.types';
import { injectFloatingButton, removeFloatingButton } from './button';
import { openModal, closeModal } from './modal';
import { installConsoleErrorHook } from '../utils/consoleCapture';

/**
 * Initialises the bug reporter widget.
 *
 * Call this once in your stage app's entry point (e.g. main.tsx or _app.tsx).
 *
 * Stage-only guardrails — the widget renders only when ALL of the following are true:
 * - `enabled` is not explicitly `false`
 * - `environment` is `"stage"` or `"staging"` (or `enabled` is explicitly `true`)
 * - `apiBaseUrl` is provided
 * - running in a browser context
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
      if (instance.state === 'open') return;
      instance.state = 'open';
      emit('open');
      openModal(config, {
        onClose: () => {
          instance.state = 'idle';
          emit('close');
        },
      });
    },
    close: () => {
      if (instance.state === 'idle') return;
      closeModal();
      instance.state = 'idle';
      emit('close');
    },
    on: (type, listener) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type]!.push(listener);
    },
    destroy: () => {
      closeModal();
      removeFloatingButton();
    },
  };

  const shouldRender = shouldShowWidget(config);

  if (shouldRender) {
    // Install the console.error hook so recent errors are available when the
    // tester opens the modal.
    installConsoleErrorHook();
    injectFloatingButton(instance, config.theme);
  }

  return instance;
}

/**
 * Determines whether the widget should be injected into the page.
 *
 * Rules:
 * 1. If `enabled` is explicitly `false` → never render.
 * 2. If not in a browser context → never render.
 * 3. If `apiBaseUrl` is missing → never render (would fail anyway).
 * 4. If `enabled` is explicitly `true` → always render (consumer opts in).
 * 5. Otherwise render only when environment exactly matches an allowed stage value.
 */
function shouldShowWidget(config: BugReporterConfig): boolean {
  if (config.enabled === false) return false;
  if (typeof document === 'undefined') return false;
  if (!config.apiBaseUrl) return false;
  if (config.enabled === true) return true;

  // Exact-match against known staging environment names to avoid false positives
  // (e.g. "backstage", "prestage", "stage-production").
  const STAGE_ENVS = new Set(['stage', 'staging', 'uat', 'test']);
  const env = config.environment?.toLowerCase() ?? '';
  return STAGE_ENVS.has(env);
}
