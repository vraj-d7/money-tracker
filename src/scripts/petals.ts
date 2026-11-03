// Mango-petal confetti. burst() fires once and clears itself; the CSS for .petal lives in global.css.
const COLORS = ['#FFB21E', '#FF9A1F', '#FFC94D', '#F98B0B', '#FFD27A'];

export function burstPetals(box: HTMLElement, count = 30, fall = 720): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  box.replaceChildren();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.style.cssText = [
      `left: ${(Math.random() * 100).toFixed(1)}%`,
      `width: ${10 + Math.random() * 10}px`,
      `height: ${16 + Math.random() * 12}px`,
      `background: ${COLORS[i % COLORS.length]}`,
      `--dur: ${(1.5 + Math.random() * 1.1).toFixed(2)}s`,
      `--delay: ${(Math.random() * 0.35).toFixed(2)}s`,
      `--dx: ${((Math.random() - 0.5) * 160).toFixed(0)}px`,
      `--rot: ${((Math.random() - 0.5) * 900).toFixed(0)}deg`,
      `--fall: ${fall}px`,
    ].join(';');
    box.append(p);
  }
  window.setTimeout(() => box.replaceChildren(), 2900);
}
