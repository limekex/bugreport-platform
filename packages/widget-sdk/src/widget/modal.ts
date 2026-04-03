import type { BugReporterConfig } from '@bugreport/shared-types';
import { buildReportPayload } from '../utils/payloadBuilder';
import { submitReport } from '../utils/apiClient';

const MODAL_ID = '__bugreport_modal__';
const OVERLAY_ID = '__bugreport_overlay__';

export interface ModalCallbacks {
  onClose: () => void;
}

/**
 * Opens the bug report modal and wires up form submission.
 *
 * The modal is a plain DOM element — no React required.
 * It collects all required fields, builds the multipart payload using
 * payloadBuilder, and submits to the backend via apiClient.
 */
export function openModal(config: BugReporterConfig, callbacks: ModalCallbacks): void {
  if (document.getElementById(MODAL_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute(
    'style',
    'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;' +
      'display:flex;align-items:center;justify-content:center;padding:16px;',
  );

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', '__bugreport_title__');
  modal.setAttribute(
    'style',
    'background:#fff;border-radius:8px;padding:24px;width:100%;max-width:560px;' +
      'max-height:90vh;overflow-y:auto;font-family:system-ui,sans-serif;font-size:14px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);',
  );

  modal.innerHTML = buildFormHtml();
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // ── Close handlers ─────────────────────────────────────────────────────────
  const closeBtn = document.getElementById('__bugreport_close__');
  closeBtn?.addEventListener('click', () => closeModal(callbacks));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(callbacks);
  });

  document.addEventListener('keydown', handleEscKey);

  // ── Form submission ────────────────────────────────────────────────────────
  const form = document.getElementById('__bugreport_form__') as HTMLFormElement | null;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit(form, config, callbacks);
  });
}

export function closeModal(callbacks?: ModalCallbacks): void {
  document.getElementById(OVERLAY_ID)?.remove();
  document.removeEventListener('keydown', handleEscKey);
  callbacks?.onClose();
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function handleEscKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeModal();
}

async function handleSubmit(
  form: HTMLFormElement,
  config: BugReporterConfig,
  callbacks: ModalCallbacks,
): Promise<void> {
  setFormState(form, 'loading');

  try {
    const values = collectFormValues(form);
    const formData = buildReportPayload(
      {
        summary: values.summary,
        severity: values.severity as 'blocker' | 'high' | 'medium' | 'low',
        whatHappened: values.whatHappened,
        expectedResult: values.expectedResult,
        actualResult: values.actualResult,
        stepsToReproduce: values.stepsToReproduce,
        notes: values.notes || undefined,
        environment: config.environment,
      },
      config,
    );

    if (values.screenshot) {
      formData.append('screenshot', values.screenshot);
    }

    const result = await submitReport({ apiBaseUrl: config.apiBaseUrl, formData });

    setFormState(form, 'success', result.githubIssueUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setFormState(form, 'error', message);
  }
}

function collectFormValues(form: HTMLFormElement): {
  summary: string;
  severity: string;
  whatHappened: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  notes: string;
  screenshot: File | null;
} {
  const data = new FormData(form);
  const screenshot = (form.querySelector('#__br_screenshot__') as HTMLInputElement)?.files?.[0] ?? null;
  return {
    summary: String(data.get('summary') ?? ''),
    severity: String(data.get('severity') ?? 'medium'),
    whatHappened: String(data.get('whatHappened') ?? ''),
    expectedResult: String(data.get('expectedResult') ?? ''),
    actualResult: String(data.get('actualResult') ?? ''),
    stepsToReproduce: String(data.get('stepsToReproduce') ?? ''),
    notes: String(data.get('notes') ?? ''),
    screenshot,
  };
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

function setFormState(form: HTMLFormElement, state: FormState, message?: string): void {
  const submitBtn = form.querySelector('#__bugreport_submit__') as HTMLButtonElement | null;
  const statusEl = document.getElementById('__bugreport_status__');

  if (!submitBtn || !statusEl) return;

  statusEl.innerHTML = '';
  submitBtn.disabled = false;

  if (state === 'loading') {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
  } else if (state === 'success') {
    submitBtn.textContent = 'Submit bug report';
    statusEl.setAttribute(
      'style',
      'margin-top:12px;padding:10px 14px;border-radius:6px;background:#d1fae5;color:#065f46;font-size:13px;',
    );
    statusEl.innerHTML = `✅ Bug report submitted! <a href="${message}" target="_blank" rel="noopener" style="color:#065f46;font-weight:600;">View GitHub issue →</a>`;

    // Auto-close after 4 seconds on success
    setTimeout(() => closeModal(), 4000);
  } else if (state === 'error') {
    submitBtn.textContent = 'Submit bug report';
    statusEl.setAttribute(
      'style',
      'margin-top:12px;padding:10px 14px;border-radius:6px;background:#fee2e2;color:#991b1b;font-size:13px;',
    );
    statusEl.textContent = `❌ ${message ?? 'Something went wrong. Please try again.'}`;
  }
}

function label(text: string, htmlFor: string, required = false): string {
  return `<label for="${htmlFor}" style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">${text}${required ? ' <span style="color:#dc2626;">*</span>' : ''}</label>`;
}

function textarea(id: string, name: string, rows = 3, placeholder = ''): string {
  return `<textarea id="${id}" name="${name}" rows="${rows}" placeholder="${placeholder}" required
    style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;font-family:inherit;"></textarea>`;
}

function buildFormHtml(): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2 id="__bugreport_title__" style="margin:0;font-size:18px;color:#111827;">🐛 Report a bug</h2>
      <button id="__bugreport_close__" type="button" aria-label="Close"
        style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280;line-height:1;">✕</button>
    </div>

    <form id="__bugreport_form__" novalidate>

      <div style="margin-bottom:14px;">
        ${label('Summary', '__br_summary__', true)}
        <input id="__br_summary__" name="summary" type="text" required maxlength="200"
          placeholder="One-line summary of the bug"
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;" />
      </div>

      <div style="margin-bottom:14px;">
        ${label('Severity', '__br_severity__', true)}
        <select id="__br_severity__" name="severity" required
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;background:#fff;">
          <option value="low">Low — minor / cosmetic</option>
          <option value="medium" selected>Medium — feature partially broken</option>
          <option value="high">High — major feature broken</option>
          <option value="blocker">Blocker — app unusable / data loss</option>
        </select>
      </div>

      <div style="margin-bottom:14px;">
        ${label('What happened?', '__br_whatHappened__', true)}
        ${textarea('__br_whatHappened__', 'whatHappened', 3, 'Describe what you observed…')}
      </div>

      <div style="margin-bottom:14px;">
        ${label('Expected result', '__br_expectedResult__', true)}
        ${textarea('__br_expectedResult__', 'expectedResult', 2, 'What should have happened?')}
      </div>

      <div style="margin-bottom:14px;">
        ${label('Actual result', '__br_actualResult__', true)}
        ${textarea('__br_actualResult__', 'actualResult', 2, 'What actually happened?')}
      </div>

      <div style="margin-bottom:14px;">
        ${label('Steps to reproduce', '__br_stepsToReproduce__', true)}
        ${textarea('__br_stepsToReproduce__', 'stepsToReproduce', 4, '1. Go to /login\n2. Enter credentials\n3. Click Submit')}
      </div>

      <div style="margin-bottom:14px;">
        ${label('Screenshot (optional)', '__br_screenshot__')}
        <input id="__br_screenshot__" name="screenshot" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          style="display:block;font-size:13px;color:#374151;" />
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">PNG, JPG, WebP or GIF · max 5 MB</p>
      </div>

      <div style="margin-bottom:14px;">
        ${label('Additional notes (optional)', '__br_notes__')}
        ${textarea('__br_notes__', 'notes', 2, 'Anything else worth mentioning?')}
      </div>

      <div id="__bugreport_status__"></div>

      <button id="__bugreport_submit__" type="submit"
        style="margin-top:16px;width:100%;padding:10px 16px;background:#e11d48;color:#fff;border:none;
               border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">
        Submit bug report
      </button>

    </form>
  `;
}
