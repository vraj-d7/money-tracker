// Smooth mouse-wheel scrolling (Lenis). Phones keep their own native scrolling, and anyone who has
// asked their device to reduce motion gets normal scrolling too.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const lenis = new Lenis({
    autoRaf: true,
    // Scrolling over the sidebar, the coach chat or a pop-up moves that, not the page behind it
    allowNestedScroll: true,
    // The landing page's "How it works" and "Pricing" links glide there
    anchors: true,
  });
  // Pages rebuild themselves after loading (scan results, spends). Without re-measuring,
  // Lenis keeps the old page height and can refuse to scroll at all.
  new ResizeObserver(() => lenis.dimensions.resize()).observe(document.body);
}
