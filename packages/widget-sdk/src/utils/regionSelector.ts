/**
 * Screenshot Region Selector
 * 
 * Allows users to select a specific region of the screen to capture,
 * or capture the full screen.
 */

export type ScreenshotMode = 'fullscreen' | 'region';

export interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Shows a region selector overlay and returns the selected region.
 * Returns null if user cancels.
 */
export async function selectScreenRegion(): Promise<RegionSelection | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = '__bugreport-region-selector__';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      cursor: crosshair;
      user-select: none;
    `;

    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 2147483648;
      pointer-events: none;
    `;
    instructions.textContent = 'Click and drag to select a region, or press ESC to cancel';

    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      display: none;
      pointer-events: none;
      z-index: 2147483648;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(instructions);
    document.body.appendChild(selectionBox);

    let startX = 0;
    let startY = 0;
    let isSelecting = false;

    const cleanup = () => {
      overlay.remove();
      instructions.remove();
      selectionBox.remove();
    };

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      isSelecting = true;
      selectionBox.style.display = 'block';
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox.style.left = left + 'px';
      selectionBox.style.top = top + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelecting) return;
      isSelecting = false;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      cleanup();

      // Require minimum 20x20 pixel selection
      if (width < 20 || height < 20) {
        resolve(null);
        return;
      }

      resolve({ x: left, y: top, width, height });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };

    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * Captures a specific region of the screen.
 */
export async function captureRegion(region: RegionSelection): Promise<string | null> {
  try {
    // Import the full page screenshot utility which handles html2canvas loading
    const { capturePageScreenshot } = await import('./screenshotCapture');
    
    // Capture the full page first
    const fullPageDataUrl = await capturePageScreenshot();
    if (!fullPageDataUrl) return null;

    // Create an image from the data URL
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = fullPageDataUrl;
    });

    // Create a new canvas with just the selected region
    const regionCanvas = document.createElement('canvas');
    const scale = img.width / window.innerWidth;
    
    regionCanvas.width = region.width * scale;
    regionCanvas.height = region.height * scale;
    
    const ctx = regionCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      img,
      region.x * scale,
      region.y * scale,
      region.width * scale,
      region.height * scale,
      0,
      0,
      region.width * scale,
      region.height * scale
    );

    return regionCanvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to capture region:', err);
    return null;
  }
}
