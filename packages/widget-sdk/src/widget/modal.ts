import type { BugReporterConfig } from '../types/shared.types';
import { buildReportPayload } from '../utils/payloadBuilder';
import { submitReport } from '../utils/apiClient';
import { capturePageScreenshot } from '../utils/screenshotCapture';
import { openAnnotationEditor } from './annotationEditor';

const SUCCESS_AUTO_CLOSE_DELAY_MS = 4000;
const MODAL_ID = '__bugreport_modal__';
const OVERLAY_ID = '__bugreport_overlay__';
const STYLE_ID = '__bugreport_styles__';

export interface ModalCallbacks {
  onClose: () => void;
}

// ── CSS ──────────────────────────────────────────────────────────────────────
// Injected once as a <style> tag so the modal has a polished, production-ready
// look without requiring a CSS framework or React.

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Overlay ─────────────────────────────────────────────── */
    #${OVERLAY_ID} {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: __br_fade_in 0.15s ease-out;
    }
    @keyframes __br_fade_in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Modal panel ────────────────────────────────────────── */
    #${MODAL_ID} {
      background: #fff;
      border-radius: 12px;
      padding: 28px 24px 24px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1f2937;
      box-shadow: 0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
      animation: __br_slide_up 0.2s ease-out;
    }
    @keyframes __br_slide_up {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Header ─────────────────────────────────────────────── */
    .__br_header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .__br_title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    .__br_close_btn {
      background: none; border: none;
      font-size: 18px; cursor: pointer;
      color: #9ca3af;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }
    .__br_close_btn:hover { background: #f3f4f6; color: #374151; }

    /* ── Form fields ────────────────────────────────────────── */
    .__br_field {
      margin-bottom: 16px;
    }
    .__br_label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
      color: #374151;
      font-size: 13px;
    }
    .__br_required {
      color: #dc2626;
      margin-left: 2px;
    }
    .__br_input,
    .__br_select,
    .__br_textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 9px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .__br_input:focus,
    .__br_select:focus,
    .__br_textarea:focus {
      outline: none;
      border-color: #e11d48;
      box-shadow: 0 0 0 3px rgba(225,29,72,0.1);
    }
    .__br_textarea {
      resize: vertical;
      min-height: 60px;
    }
    .__br_select {
      appearance: auto;
    }
    .__br_hint {
      margin: 4px 0 0;
      font-size: 12px;
      color: #9ca3af;
    }

    /* ── Screenshot section ──────────────────────────────────── */
    .__br_screenshot_row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .__br_capture_btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      color: #374151;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .__br_capture_btn:hover { background: #e5e7eb; border-color: #9ca3af; }
    .__br_capture_btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .__br_capture_preview {
      margin-top: 8px;
      max-width: 100%;
      max-height: 120px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .__br_or_divider {
      font-size: 12px;
      color: #9ca3af;
    }

    /* ── Status messages ─────────────────────────────────────── */
    .__br_status_success {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #d1fae5;
      color: #065f46;
      font-size: 13px;
    }
    .__br_status_success a { color: #065f46; font-weight: 600; }
    .__br_status_error {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #fee2e2;
      color: #991b1b;
      font-size: 13px;
    }

    /* ── Verification ────────────────────────────────────────── */
    .__br_honeypot {
      position: absolute !important;
      left: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
    .__br_checkbox_label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }
    .__br_checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #e11d48;
    }
    .__br_math_challenge {
      margin-bottom: 16px;
    }

    /* ── Submit button ───────────────────────────────────────── */
    .__br_submit_btn {
      margin-top: 18px;
      width: 100%;
      padding: 11px 16px;
      background: #e11d48;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    .__br_submit_btn:hover:not(:disabled) { background: #be123c; }
    .__br_submit_btn:active:not(:disabled) { transform: scale(0.99); }
    .__br_submit_btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    /* ── Responsive (narrow viewports) ──────────────────────── */
    @media (max-width: 480px) {
      #${MODAL_ID} {
        padding: 20px 16px 16px;
        border-radius: 12px 12px 0 0;
        max-height: 95vh;
      }
      #${OVERLAY_ID} {
        align-items: flex-end;
        padding: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── Open / close ──────────────────────────────────────────────────────────────

/**
 * Opens the bug report modal and wires up form submission.
 *
 * The modal is a plain DOM element with production-ready CSS injected into the
 * page. No React or CSS framework required — works in any web app.
 *
 * Features:
 * - Focus trap (Tab/Shift-Tab cycle within modal)
 * - Animated overlay + slide-up entrance
 * - Responsive layout (stacks on mobile)
 * - "Capture current screen" button (html2canvas when available)
 * - Accessible: aria roles, keyboard dismiss, label associations
 */
// Track when modal was opened (for timing bot check)
let modalOpenedAt = 0;

export function openModal(config: BugReporterConfig, callbacks: ModalCallbacks): void {
  if (document.getElementById(MODAL_ID)) return;

  injectStyles();
  modalOpenedAt = Date.now();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', '__bugreport_title__');

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

  // ── Focus trap ─────────────────────────────────────────────────────────────
  trapFocus(modal);

  // ── Screenshot capture button ──────────────────────────────────────────────
  const captureBtn = document.getElementById('__br_capture_btn__');
  captureBtn?.addEventListener('click', async () => {
    await handleCaptureScreenshot(captureBtn);
  });

  // ── Form submission ────────────────────────────────────────────────────────
  const form = document.getElementById('__bugreport_form__') as HTMLFormElement | null;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit(form, config, callbacks);
  });

  // Focus the first input
  const firstInput = modal.querySelector('input, select, textarea') as HTMLElement | null;
  firstInput?.focus();
}

export function closeModal(callbacks?: ModalCallbacks): void {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.12s ease-in';
    setTimeout(() => overlay.remove(), 120);
  }
  document.removeEventListener('keydown', handleEscKey);
  callbacks?.onClose();
}

// ── Focus trap ────────────────────────────────────────────────────────────────

function trapFocus(container: HTMLElement): void {
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const focusable = container.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function handleEscKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeModal();
}

async function handleCaptureScreenshot(captureBtn: HTMLElement): Promise<void> {
  const preview = document.getElementById('__br_capture_preview__') as HTMLImageElement | null;
  const fileInput = document.getElementById('__br_screenshot__') as HTMLInputElement | null;
  const captureContainer = document.getElementById('__br_capture_data__') as HTMLInputElement | null;

  captureBtn.setAttribute('disabled', 'true');
  captureBtn.textContent = '📸 Capturing…';

  try {
    // Hide the modal overlay temporarily so it's not in the screenshot
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.style.display = 'none';

    const dataUrl = await capturePageScreenshot();

    if (overlay) overlay.style.display = '';

    if (dataUrl && preview && captureContainer) {
      // Open annotation editor
      openAnnotationEditor({
        imageDataUrl: dataUrl,
        onSave: (annotatedDataUrl: string) => {
          // Save annotated screenshot
          preview.src = annotatedDataUrl;
          preview.style.display = 'block';
          captureContainer.value = annotatedDataUrl;
          // Clear the file input so the capture takes precedence
          if (fileInput) fileInput.value = '';
        },
        onCancel: () => {
          // User cancelled annotation, don't save screenshot
          // Just reset the button
        },
      });
    }
  } catch {
    // Silently fail — the user can still upload manually
  }

  captureBtn.removeAttribute('disabled');
  captureBtn.textContent = '📸 Capture screen';
}

async function handleSubmit(
  form: HTMLFormElement,
  config: BugReporterConfig,
  callbacks: ModalCallbacks,
): Promise<void> {
  setFormState(form, 'loading');

  try {
    const values = collectFormValues(form);
    
    // Bot protection: honeypot + math challenge + timing
    const timeSpent = Math.floor((Date.now() - modalOpenedAt) / 1000);
    const botCheck = {
      honeypot: values.honeypot,
      mathAnswer: values.mathAnswer,
      timeSpent,
    };
    
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
        botCheck: JSON.stringify(botCheck),
      },
      config,
    );

    // Attach screenshot — prefer captured screenshot, fall back to file upload
    if (values.capturedScreenshot) {
      const blob = dataUrlToBlob(values.capturedScreenshot);
      formData.append('screenshot', blob, 'screenshot.png');
    } else if (values.screenshot) {
      formData.append('screenshot', values.screenshot);
    }

    const result = await submitReport({ apiBaseUrl: config.apiBaseUrl, formData });

    setFormState(form, 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setFormState(form, 'error', message);
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: mime });
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
  capturedScreenshot: string;
  honeypot: string;
  mathAnswer: string;
} {
  const data = new FormData(form);
  const screenshot = (form.querySelector('#__br_screenshot__') as HTMLInputElement)?.files?.[0] ?? null;
  const capturedScreenshot = (form.querySelector('#__br_capture_data__') as HTMLInputElement)?.value ?? '';
  return {
    summary: String(data.get('summary') ?? ''),
    severity: String(data.get('severity') ?? 'medium'),
    whatHappened: String(data.get('whatHappened') ?? ''),
    expectedResult: String(data.get('expectedResult') ?? ''),
    actualResult: String(data.get('actualResult') ?? ''),
    stepsToReproduce: String(data.get('stepsToReproduce') ?? ''),
    notes: String(data.get('notes') ?? ''),
    screenshot,
    capturedScreenshot,
    honeypot: String(data.get('website') ?? ''),
    mathAnswer: String(data.get('mathAnswer') ?? ''),
  };
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

function setFormState(form: HTMLFormElement, state: FormState, message?: string): void {
  const submitBtn = form.querySelector('#__bugreport_submit__') as HTMLButtonElement | null;
  const statusEl = document.getElementById('__bugreport_status__');

  if (!submitBtn || !statusEl) return;

  statusEl.innerHTML = '';
  statusEl.className = '';
  submitBtn.disabled = false;

  if (state === 'loading') {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
  } else if (state === 'success') {
    submitBtn.textContent = 'Submit bug report';
    statusEl.className = '__br_status_success';
    statusEl.textContent = '✅ Bug report submitted successfully!';
    setTimeout(() => closeModal(), SUCCESS_AUTO_CLOSE_DELAY_MS);
  } else if (state === 'error') {
    submitBtn.textContent = 'Submit bug report';
    statusEl.className = '__br_status_error';
    statusEl.textContent = `❌ ${message ?? 'Something went wrong. Please try again.'}`;
  }
}

function buildFormHtml(): string {
  // Generate random math challenge
  const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
  const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
  const mathQuestion = `${num1} + ${num2}`;
  const mathAnswer = num1 + num2;
  
  return `
    <div class="__br_header">
      <h2 id="__bugreport_title__" class="__br_title">🐛 Report a bug</h2>
      <button id="__bugreport_close__" type="button" aria-label="Close" class="__br_close_btn">✕</button>
    </div>

    <form id="__bugreport_form__" novalidate>

      <!-- Honeypot field (hidden from users, bots will fill it) -->
      <input name="website" type="text" class="__br_honeypot" tabindex="-1" autocomplete="off" />

      <div class="__br_field">
        <label for="__br_summary__" class="__br_label">Summary<span class="__br_required">*</span></label>
        <input id="__br_summary__" name="summary" type="text" required minlength="5" maxlength="200"
          placeholder="One-line summary of the bug" class="__br_input" />
      </div>

      <div class="__br_field">
        <label for="__br_severity__" class="__br_label">Severity<span class="__br_required">*</span></label>
        <select id="__br_severity__" name="severity" required class="__br_select">
          <option value="low">Low — minor / cosmetic</option>
          <option value="medium" selected>Medium — feature partially broken</option>
          <option value="high">High — major feature broken</option>
          <option value="blocker">Blocker — app unusable / data loss</option>
        </select>
      </div>

      <div class="__br_field">
        <label for="__br_whatHappened__" class="__br_label">What happened?<span class="__br_required">*</span></label>
        <textarea id="__br_whatHappened__" name="whatHappened" rows="3"
          placeholder="Describe what you observed…" required minlength="10" class="__br_textarea"></textarea>
      </div>

      <div class="__br_field">
        <label for="__br_expectedResult__" class="__br_label">Expected result<span class="__br_required">*</span></label>
        <textarea id="__br_expectedResult__" name="expectedResult" rows="2"
          placeholder="What should have happened?" required minlength="5" class="__br_textarea"></textarea>
      </div>

      <div class="__br_field">
        <label for="__br_actualResult__" class="__br_label">Actual result<span class="__br_required">*</span></label>
        <textarea id="__br_actualResult__" name="actualResult" rows="2"
          placeholder="What actually happened?" required minlength="5" class="__br_textarea"></textarea>
      </div>

      <div class="__br_field">
        <label for="__br_stepsToReproduce__" class="__br_label">Steps to reproduce<span class="__br_required">*</span></label>
        <textarea id="__br_stepsToReproduce__" name="stepsToReproduce" rows="4"
          placeholder="1. Go to /login\n2. Enter credentials\n3. Click Submit" required minlength="5" class="__br_textarea"></textarea>
      </div>

      <div class="__br_field">
        <label class="__br_label">Screenshot (optional)</label>
        <div class="__br_screenshot_row">
          <button id="__br_capture_btn__" type="button" class="__br_capture_btn">📸 Capture screen</button>
          <span class="__br_or_divider">or</span>
          <input id="__br_screenshot__" name="screenshot" type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style="font-size:13px;color:#374151;max-width:200px;" />
        </div>
        <input id="__br_capture_data__" type="hidden" value="" />
        <img id="__br_capture_preview__" alt="Captured screenshot preview"
          class="__br_capture_preview" style="display:none;" />
        <p class="__br_hint">PNG, JPG, WebP or GIF · max 5 MB</p>
      </div>

      <div class="__br_field">
        <label for="__br_notes__" class="__br_label">Additional notes (optional)</label>
        <textarea id="__br_notes__" name="notes" rows="2"
          placeholder="Anything else worth mentioning?" class="__br_textarea"></textarea>
      </div>

      <!-- Bot protection: Math challenge -->
      <div class="__br_field __br_math_challenge">
        <label for="__br_mathAnswer__" class="__br_label">Quick check: What is ${mathQuestion}?<span class="__br_required">*</span></label>
        <input id="__br_mathAnswer__" name="mathAnswer" type="number" 
          required 
          data-answer="${mathAnswer}" 
          placeholder="Enter the answer" 
          class="__br_input" 
          style="max-width: 120px;" />
        <p class="__br_hint">Help us prevent spam</p>
      </div>

      <div class="__br_field">
        <label class="__br_checkbox_label">
          <input id="__br_confirm__" type="checkbox" required class="__br_checkbox" />
          <span>I confirm this is a legitimate bug report</span>
        </label>
      </div>

      <div id="__bugreport_status__"></div>

      <button id="__bugreport_submit__" type="submit" class="__br_submit_btn">
        Submit bug report
      </button>

    </form>
  `;
}
