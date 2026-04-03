export { initBugReporter } from './widget/init';
export type { BugReporterConfig, CurrentUser, TraceContext, WidgetTheme } from '@bugreport/shared-types';
export { installConsoleErrorHook, getCollectedErrors, clearCollectedErrors } from './utils/consoleCapture';
export type { CapturedError } from './utils/consoleCapture';
