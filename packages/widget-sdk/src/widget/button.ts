import type { WidgetInstance } from '../types/widget.types';
import type { WidgetTheme } from '../types/shared.types';

const BUTTON_ID = '__bugreport_floating_btn__';

/**
 * Injects a minimal floating trigger button into the DOM.
 *
 * TODO: Replace with a polished design or a React-rendered component.
 *       For now this is a plain DOM element so the SDK works without React.
 */
export function injectFloatingButton(instance: WidgetInstance, theme?: WidgetTheme): void {
  if (document.getElementById(BUTTON_ID)) return;

  const position = theme?.buttonPosition ?? 'bottom-right';
  const primaryColor = theme?.primaryColor ?? '#e11d48';
  const zIndex = theme?.zIndex ?? 9999;

  const positionStyles: Record<string, string> = {
    'bottom-right': 'bottom:24px;right:24px;',
    'bottom-left': 'bottom:24px;left:24px;',
    'top-right': 'top:24px;right:24px;',
    'top-left': 'top:24px;left:24px;',
  };

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.textContent = '🐛 Report bug';
  button.setAttribute(
    'style',
    `position:fixed;${positionStyles[position]}z-index:${zIndex};` +
      `background:${primaryColor};color:#fff;border:none;border-radius:24px;` +
      `padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;` +
      `box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:opacity 0.2s;`,
  );

  button.addEventListener('click', () => instance.open());

  document.body.appendChild(button);
}

export function removeFloatingButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}
