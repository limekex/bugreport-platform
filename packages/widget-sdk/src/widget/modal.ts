/**
 * Placeholder modal architecture.
 *
 * TODO: Implement a real modal UI (HTML/CSS or React component).
 *       This file defines the interface that the modal must satisfy
 *       so that the rest of the SDK can depend on it without coupling
 *       to a specific UI framework.
 */

export interface ModalFormValues {
  summary: string;
  severity: 'blocker' | 'high' | 'medium' | 'low';
  whatHappened: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  notes?: string;
  screenshot?: File;
}

export interface ModalCallbacks {
  onSubmit: (values: ModalFormValues) => Promise<void>;
  onClose: () => void;
}

/**
 * Opens the bug report modal.
 *
 * TODO: Replace this stub with the real modal implementation.
 */
export function openModal(_callbacks: ModalCallbacks): void {
  // TODO: render the modal UI
  console.warn('[BugReporter] Modal UI not yet implemented.');
}

/**
 * Closes and removes the bug report modal from the DOM.
 *
 * TODO: Implement alongside the real modal.
 */
export function closeModal(): void {
  // TODO: clean up modal DOM/state
}
