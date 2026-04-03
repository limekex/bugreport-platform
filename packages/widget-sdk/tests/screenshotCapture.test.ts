// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { capturePageScreenshot } from '../src/utils/screenshotCapture';

describe('capturePageScreenshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when html2canvas is not available', async () => {
    // In a jsdom environment, html2canvas is not loaded and the CDN script
    // injection will time out, so capturePageScreenshot should return null.
    const result = await capturePageScreenshot();
    expect(result).toBeNull();
  }, 5000);

  it('returns a data URL when html2canvas is available on window', async () => {
    // Mock html2canvas on window
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgo='),
    } as unknown as HTMLCanvasElement;

    const mockHtml2Canvas = vi.fn().mockResolvedValue(mockCanvas);
    (window as unknown as Record<string, unknown>).html2canvas = mockHtml2Canvas;

    const result = await capturePageScreenshot();
    expect(result).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(mockHtml2Canvas).toHaveBeenCalled();

    // Cleanup
    delete (window as unknown as Record<string, unknown>).html2canvas;
  });
});
