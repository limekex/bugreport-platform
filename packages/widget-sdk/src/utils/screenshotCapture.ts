/**
 * Full-page screenshot capture utility.
 *
 * Uses html2canvas when available to capture a client-side screenshot of the
 * current page. html2canvas is loaded lazically from a CDN to keep the SDK
 * bundle size small — it is only fetched when the user clicks "Capture screen".
 *
 * If html2canvas is not available (blocked by CSP, network error, etc.) the
 * capture silently fails and the user can still attach a manual screenshot.
 *
 * @see https://html2canvas.hertzen.com/
 */

/** html2canvas function signature (minimal typing) */
type Html2CanvasFunction = (
  element: HTMLElement,
  options?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    windowWidth?: number;
    windowHeight?: number;
    ignoreElements?: (el: Element) => boolean;
  },
) => Promise<HTMLCanvasElement>;

const CDN_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

let cachedHtml2Canvas: Html2CanvasFunction | null = null;

/**
 * Lazily loads html2canvas from CDN.
 *
 * Returns `null` if the library cannot be loaded (CSP, offline, etc.).
 */
async function loadHtml2Canvas(): Promise<Html2CanvasFunction | null> {
  if (cachedHtml2Canvas) return cachedHtml2Canvas;

  // Guard: not in a browser environment
  if (typeof window === 'undefined') return null;

  // Check if it's already on the page (e.g. consumer bundled it)
  const win = window as unknown as Record<string, unknown>;
  if (typeof win.html2canvas === 'function') {
    cachedHtml2Canvas = win.html2canvas as Html2CanvasFunction;
    return cachedHtml2Canvas;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CDN_URL;
      script.async = true;
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('html2canvas load timed out'));
      }, 3000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load html2canvas')); };
      document.head.appendChild(script);
    });

    if (typeof win.html2canvas === 'function') {
      cachedHtml2Canvas = win.html2canvas as Html2CanvasFunction;
      return cachedHtml2Canvas;
    }
  } catch {
    // Silently fail — user can still attach a file manually
  }

  return null;
}

/**
 * Captures a screenshot of the current page as a data URL.
 *
 * Returns `null` if html2canvas is unavailable or the capture fails.
 *
 * The overlay element (if any) is hidden during capture and restored after.
 */
export async function capturePageScreenshot(): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const html2canvas = await loadHtml2Canvas();
  if (!html2canvas) return null;

  const canvas = await html2canvas(document.body, {
    scale: Math.min(window.devicePixelRatio, 2),
    useCORS: true,
    logging: false,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    ignoreElements: (el) => {
      // Ignore the bug reporter's own overlay so it doesn't appear in the screenshot
      return el.id === '__bugreport_overlay__' || el.id === '__bugreport_styles__';
    },
  });

  return canvas.toDataURL('image/png');
}
