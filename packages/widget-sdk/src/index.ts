export { initBugReporter } from './widget/init';
export type { BugReporterConfig, CurrentUser, TraceContext, WidgetTheme } from '@bugreport/shared-types';
export { installConsoleErrorHook, getCollectedErrors, clearCollectedErrors } from './utils/consoleCapture';
export type { CapturedError } from './utils/consoleCapture';
export { installNetworkCaptureHook, getFailedNetworkRequests, clearFailedNetworkRequests } from './utils/networkCapture';
export type { FailedNetworkEntry } from './utils/networkCapture';
export { capturePageScreenshot } from './utils/screenshotCapture';
