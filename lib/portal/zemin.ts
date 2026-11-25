/**
 * SAGLIGIM-ZEMIN (Kaan, 2026-11-25: "The background of the full page should have a nice faded image … It is still very
 * empty in the background") — which soft, faded photo sits behind each Sağlığım page, in ONE place.
 *
 * Core for all 30 branşlar + 10 Özel Branşlar and every country (one look, gorunum-paritesi-ulke): the choice depends on
 * the PAGE (the active nav key), never on the branş. Calm, people-free scenes go behind the dense pages (Mesajlar, Doz
 * Takvimi, Sonuçlar, Randevu); scenes with people only where the page is light.
 *
 * Child rule (Kaan, 2026-11-25, standing): a photo with a baby / child is NEVER shown to an adult patient or on an adult
 * branş page. `baby-health` is used only on the pediatric chapter pages (pediatri / çocuk cerrahisi modules) AND only when
 * the bundle says the patient is under 18 (`hasta.onSekizAlti === true`); unknown age = adult. Pinned by
 * lib/portal/zemin.test.ts.
 *
 * Images: public/portal/zemin/<ad>-masaustu.{avif,webp} and <ad>-telefon.{avif,webp}, made from the in-house
 * public/sagligim/*.jpg (commit 3ca77415) by scripts/portal-zemin-uret.cjs. Sizes: docs/audits/PERF-BUTCE-LOG.md.
 */

/** Every background photo the portal may draw. */
export const ZEMIN_GORSELLERI = [
  'hero', // misty sunrise hills — no people
  'calm-empty', // eucalyptus on linen, window light — no people
  'empty-cool', // linen + a cup — no people
  'hero-atelier', // quiet room with a bench and tall windows — no people
  'ilaclar-care', // pill organiser + water — no people
  'sonuclar-care', // two adult hands — no face
  'wellness-cycle', // adult couple cycling by the sea — soft lens blur: a warm out-of-focus seaside, no face readable
  'wellness-kitchen', // adult cooking vegetables — cut below the face (bowl, hands, vegetables)
  'baby-health', // BABY — pediatric pages for under-18 patients only
] as const
export type ZeminGorseli = (typeof ZEMIN_GORSELLERI)[number]

/** Photos that show a baby or a child. Never for an adult patient, never on an adult branş page. */
export const COCUK_GORSELLERI: ReadonlySet<ZeminGorseli> = new Set<ZeminGorseli>(['baby-health'])

/** Pediatric chapter pages (pediatri: aşı karnesi / aşı bilgilendirme; çocuk cerrahisi). */
export const PEDIATRIK_SAYFALAR: ReadonlySet<string> = new Set(['asi-karnesi', 'asi-onam', 'cocugumun-cerrahisi'])

/** The home and every page without a better fit. */
export const VARSAYILAN_ZEMIN: ZeminGorseli = 'hero'

/** Page (nav key) → photo. A key that is not here gets VARSAYILAN_ZEMIN. */
export const SAYFA_ZEMINI: Readonly<Record<string, ZeminGorseli>> = {
  ozet: 'hero', // Bugün
  randevu: 'calm-empty',
  ziyaretler: 'calm-empty',
  // Mesajlar: 'mesajlar-care' (a phone showing chat bubbles) sat as a giant blurred phone behind the message list — a
  // picture of a chat behind a chat. The calm linen + cup scene instead.
  mesajlar: 'empty-cool',
  ilaclar: 'ilaclar-care',
  'doz-takvimi': 'ilaclar-care',
  sonuclar: 'sonuclar-care',
  takip: 'wellness-cycle',
  gunluk: 'wellness-cycle',
  // Öykü: 'preventive-care' (gloved hands + a syringe at an arm) put a needle behind the medical history. A quiet room.
  gecmis: 'hero-atelier',
  karne: 'wellness-kitchen',
  // branş modules with an obvious fit (adult / neutral scenes)
  beslenmem: 'wellness-kitchen',
  // exercise modules: the blurred seaside ride ('hero-walk' would put a face behind the page title on a phone)
  sporum: 'wellness-cycle',
  fizyom: 'wellness-cycle',
  ftrm: 'wellness-cycle',
  // pediatric pages: baby-health — only through the child gate in portalZemini()
  'asi-karnesi': 'baby-health',
  'asi-onam': 'baby-health',
  'cocugumun-cerrahisi': 'baby-health',
}

/** What a pediatric page shows when the patient is not (known to be) under 18. */
const COCUK_YEDEGI: ZeminGorseli = 'calm-empty'

/**
 * The photo behind a page. `aktifKey` = the active nav key (undefined on pages outside the tab row, e.g. Tercihler);
 * `onSekizAlti` = the bundle's under-18 flag (anything but `true` counts as adult).
 */
export function portalZemini(aktifKey: string | undefined, { onSekizAlti }: { onSekizAlti?: boolean | null } = {}): ZeminGorseli {
  const secim = (aktifKey && SAYFA_ZEMINI[aktifKey]) || VARSAYILAN_ZEMIN
  if (COCUK_GORSELLERI.has(secim)) {
    return aktifKey && PEDIATRIK_SAYFALAR.has(aktifKey) && onSekizAlti === true ? secim : COCUK_YEDEGI
  }
  return secim
}
