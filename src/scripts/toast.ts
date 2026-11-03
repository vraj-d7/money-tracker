import { toastIcons, type ToastKind } from '../lib/toast-icons';

interface ToastOptions {
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
  /** How long it stays up, in ms */
  duration?: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Pops a toast into the shell's #toast-region (falls back to <body>).
export function showToast(text: string, { kind = 'success', action, duration = 4000 }: ToastOptions = {}) {
  const region = document.getElementById('toast-region') ?? document.body;

  const toast = document.createElement('div');
  toast.className = 'toast pop-in';
  toast.setAttribute('role', 'status');

  const icon = document.createElement('span');
  icon.className = `toast__icon toast__icon--${kind}`;
  icon.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })) {
    svg.setAttribute(k, v);
  }
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', toastIcons[kind]);
  svg.append(path);
  icon.append(svg);

  const label = document.createElement('span');
  label.className = 'toast__text';
  label.textContent = text;

  toast.append(icon, label);

  const dismiss = () => toast.remove();

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast__action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      dismiss();
    });
    toast.append(btn);
  }

  region.append(toast);
  window.setTimeout(dismiss, duration);
}
