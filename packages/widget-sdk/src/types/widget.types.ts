import type { BugReporterConfig } from '@bugreport/shared-types';

export type WidgetState = 'idle' | 'open' | 'submitting' | 'success' | 'error';

export type WidgetEventType = 'open' | 'close' | 'submit' | 'success' | 'error';

export interface WidgetEvent {
  type: WidgetEventType;
  payload?: unknown;
}

export type WidgetEventListener = (event: WidgetEvent) => void;

/**
 * Internal state container for the widget instance.
 * Framework adapters (React, vanilla) wrap this state in their own reactivity model.
 */
export interface WidgetInstance {
  config: BugReporterConfig;
  state: WidgetState;
  destroy: () => void;
  open: () => void;
  close: () => void;
  on: (type: WidgetEventType, listener: WidgetEventListener) => void;
}
