/**
 * NOTYA-FISILTI-UNIVERSAL (Kaan, 2026-09-24) — shared shape + branş routing for the universal
 * "Fısıltı" reminder layer. Sprint 1 (doktor). Deliberately reuses each branş's EXISTING,
 * already-correct kohort route rather than re-implementing 29 clinical algorithms here — this
 * file only maps a doctor's own branş to the right existing route and normalizes whatever shape
 * that route returns into one common shape the UI (and later Ayşe) can read without caring which
 * branş it came from.
 *
 * Verified before writing this (not assumed): the 29 branş kohort routes do NOT share one exact
 * response shape -- pediatri/dermatoloji/dahiliye use `bayraklar`+`detay`, kardiyoloji instead
 * returns `acikRiskBayraklari`; not every branş computes a `sekme` (deep-link tab) the way
 * pediatri does. `normalizeKohortSatiri` below is defensive on purpose: it reads several possible
 * field names and never throws on a shape it doesn't fully recognize -- it just returns less.
 */

export interface FisiltiItem {
  /** Stable across reloads: brans + patientId, so the UI/Ayşe can reference "this one" consistently. */
  id: string
  brans: string
  patientId: string
  ad: string
  /** Human label for the flag, in the branş's own words -- not re-translated here. */
  baslik: string
  detay: string[]
  enErkenTarih: string | null
  /** Where to go to actually see/fix this. Falls back to the patient file's Özet tab when the
   * branş route doesn't compute its own target tab (most don't yet -- only pediatri does today). */
  hedefYol: string
  toplamBekleyen: number
  /** NOTYA-FISILTI-MESAJ (Kaan, 2026-09-24): 'klinik' = from a branş kohort engine (the original
   * source); 'mesaj' = an unread patient-portal message the practice hasn't answered in a while.
   * Same card, same self-clearing rule, different resolving eylem (mesaj_hasta_ile_konusuldu vs.
   * the clinical actions) -- kaynak tells the UI/Ayşe which one applies. */
  kaynak: 'klinik' | 'mesaj'
  /** Only set when kaynak === 'mesaj': the hasta_mesaj_konulari.id the resolving action needs. */
  konuId?: string
}

/** SpecialtyKey (lib/doktor/specialties.ts) -> kohort API route slug. Identical for all but two. */
const BRANS_ROTA_ISTISNA: Record<string, string> = {
  'goz-hastaliklari': 'goz',
  'kadin-hastaliklari-dogum': 'gebelik',
}

export function bransKohortRotasi(bransKey: string): string {
  return BRANS_ROTA_ISTISNA[bransKey] || bransKey
}

/** Every branş this sprint has a live kohort route for (verified via `find`, not assumed). */
export const FISILTI_DESTEKLI_BRANSLAR = new Set([
  'pediatri', 'dermatoloji', 'dahiliye', 'kardiyoloji', 'noroloji', 'uroloji', 'anestezi',
  'gastroenteroloji', 'fizik-tedavi', 'acil-tip', 'plastik-cerrahi', 'gogus-cerrahisi',
  'kalp-damar-cerrahisi', 'genel-cerrahi', 'cocuk-cerrahisi', 'nefroloji', 'psikiyatri',
  'kulak-burun-bogaz', 'spor-hekimligi', 'ortopedi', 'gogus-hastaliklari', 'romatoloji',
  'enfeksiyon-hastaliklari', 'aile-hekimligi', 'onkoloji', 'goz-hastaliklari', 'endokrinoloji',
  'beyin-cerrahisi', 'kadin-hastaliklari-dogum', 'radyoloji',
])

/**
 * Defensive normalizer. `satir` is one row from ANY branş kohort route's `{ satirlar: [...] }`
 * response, typed loosely on purpose (crossing an HTTP boundary -- not worth importing 29
 * different branş-specific row types for this). Returns null only if the row is missing the
 * bare minimum (patientId + a name) to be shown at all.
 */
export function normalizeKohortSatiri(satir: Record<string, unknown>, brans: string): FisiltiItem | null {
  const patientId = String(satir.patientId || satir.patient_id || '')
  const ad = String(satir.ad || satir.name || '')
  if (!patientId || !ad) return null

  // Flag list: most branş use `bayraklar` (array of codes) or `acikRiskBayraklari` (kardiyoloji).
  const bayrakListesi = (satir.bayraklar || satir.acikRiskBayraklari || []) as unknown[]
  const ilkBayrak = bayrakListesi.length ? String(bayrakListesi[0]) : ''

  // Detail lines: `detay` (string[]) in most branş.
  const detay = Array.isArray(satir.detay) ? (satir.detay as unknown[]).map(String) : []

  // Human label for the flag: prefer a `baslik`/`bayrakAd` field if the branş route already
  // resolved one server-side; otherwise fall back to the raw flag code (readable enough --
  // Turkish snake_case like 'tbse_gecikti' reads plainly) or the first detay line.
  const baslik = String(satir.baslik || satir.bayrakAd || ilkBayrak.replace(/_/g, ' ') || detay[0] || 'Bekleyen kontrol')

  const enErkenTarih = (satir.enErkenTarih as string | null | undefined) ?? null

  // Deep-link: only pediatri computes its own `sekme` today. Everyone else lands on the
  // patient file's Özet tab -- correct, just not as precise; branş-by-branş `sekme` support is
  // exactly the kind of small follow-up this normalizer is built to absorb without a rewrite.
  const sekme = typeof satir.sekme === 'string' ? satir.sekme : 'ozet'
  const hedefYol = `/dashboard/doktor/hastalar/${patientId}?tab=${sekme}`

  return {
    id: `${brans}:${patientId}`,
    brans,
    patientId,
    ad,
    baslik,
    detay,
    enErkenTarih,
    hedefYol,
    toplamBekleyen: 0, // filled in by the caller, which knows the full satirlar.length
    kaynak: 'klinik',
  }
}

/** Unread portal messages the practice hasn't answered in this long become a fısıltı candidate too. */
export const MESAJ_GECIKME_SAAT = 24

export function normalizeMesajOgesi(thread: {
  id: string
  patientId: string
  hastaAdi: string
  ozet: string
  sonMesajAt: string
}): FisiltiItem {
  return {
    id: `mesaj:${thread.patientId}:${thread.id}`,
    brans: '',
    patientId: thread.patientId,
    ad: thread.hastaAdi,
    baslik: 'yanıt bekleyen mesaj',
    detay: thread.ozet ? [thread.ozet] : [],
    enErkenTarih: thread.sonMesajAt,
    hedefYol: `/dashboard/doktor/mesajlar?konu=${thread.id}`,
    toplamBekleyen: 0,
    kaynak: 'mesaj',
    konuId: thread.id,
  }
}
