// Shared phone-layout helpers for the doctor screens (NOTYA MOBIL-PERSONEL).
// CSS is emitted into DoktorChrome's <style>; every rule sits inside the phone breakpoint, so desktop is untouched.
export const TELEFON_ESIK_PX = 899

/** Tap-target floor (px) for the phone layout; matches WCAG 2.5.5 / Apple HIG. */
export const DOKUNMA_MIN_PX = 44

export const TELEFON_DOKUNMA_CSS = `
  .notya-icerik button:not([data-kucuk-ok]),
  .notya-icerik select,
  .notya-icerik input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
  .notya-icerik [role="button"] {
    min-height: ${DOKUNMA_MIN_PX}px !important;
    box-sizing: border-box;
  }
  .notya-icerik button:not([data-kucuk-ok]) { min-width: ${DOKUNMA_MIN_PX}px; }
  .notya-icerik a[href]:not(p a):not(li a):not(td a) {
    display: inline-flex; align-items: center; min-height: ${DOKUNMA_MIN_PX}px; box-sizing: border-box;
  }
  .notya-icerik img, .notya-icerik video, .notya-icerik canvas { max-width: 100%; }
  .notya-icerik table { display: block; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .notya-icerik [role="dialog"], .notya-icerik .notya-modal {
    max-width: calc(100vw - 24px) !important; max-height: calc(100dvh - 24px) !important; overflow-y: auto;
  }
  .notya-ana-eylem {
    position: fixed !important; right: 16px; bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    z-index: 30; min-height: 48px !important; box-shadow: 0 6px 18px rgba(30,51,54,0.28);
  }
`
