// Restart a one-shot CSS animation class (e.g. "boing", "pop-in") on an element.
export function replayClass(el: Element | null, cls: string): void {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}
