/**
 * GORSEL-YAKALAMA-01 — universal (chapter-agnostic) capture → attach-to-visit mechanism.
 *
 * Pure helpers shared by every specialty's inline capture UI (components/doktor/gorsel/
 * GorselYakalaPaneli.tsx) and by the server route that persists the upload
 * (app/api/doktor/goruntuleme/yukle/route.ts). No clinical content lives here — PASI/EASI, lesion
 * cards, body map, fundus fields etc. stay in their own specialty's folder. This file only answers:
 * "is this a photo or a PDF, is it a sane size, and does the visit this upload claims actually
 * belong to this patient?" — the ownership question itself is answered by seansSahibi() (hastaSahipligi.ts),
 * this just applies its result.
 */

export const GORSEL_YAKALAMA_FOTO_KENAR_AZAMI = 2400
export const GORSEL_YAKALAMA_FOTO_TIPLERI = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const
export const GORSEL_YAKALAMA_PDF_TIPI = 'application/pdf' as const
/** Phone photo after downscale is a few hundred KB; a PDF (multi-page scan) can run larger. Matches the
 * generic Belge Kasası guard order of magnitude — not a hard backend limit, just a sane client-side guard
 * so a doctor on a slow connection gets an immediate, clear error instead of a silent hang. */
export const GORSEL_YAKALAMA_PDF_AZAMI_BAYT = 20 * 1024 * 1024

export type GorselYakalamaTur = 'foto' | 'pdf'

export function gorselYakalamaTuru(mime: string | null | undefined): GorselYakalamaTur | null {
  const m = String(mime || '').toLowerCase()
  if (m === GORSEL_YAKALAMA_PDF_TIPI) return 'pdf'
  if ((GORSEL_YAKALAMA_FOTO_TIPLERI as readonly string[]).includes(m) || m.startsWith('image/')) return 'foto'
  return null
}

export function gorselYakalamaBoyutGecerliMi(tur: GorselYakalamaTur, bayt: number): { ok: true } | { ok: false; hata: string } {
  if (tur === 'pdf' && bayt > GORSEL_YAKALAMA_PDF_AZAMI_BAYT) {
    return { ok: false, hata: `PDF ${Math.round(GORSEL_YAKALAMA_PDF_AZAMI_BAYT / 1024 / 1024)} MB sınırını aşıyor.` }
  }
  return { ok: true }
}

/**
 * A visit (session) resolved by seansSahibi() belongs to the doctor by construction; this only
 * checks the SECOND thing a capture-at-a-visit upload must prove — that the visit's own patient is
 * the SAME patient the upload names. Without this, a doctor could (by a stale tab / copy-paste bug,
 * not necessarily malice) tag patient A's photo onto patient B's visit even though both patients are
 * the doctor's own — a cross-patient mix-up inside one doctor's practice, which is the same class of
 * bug HASTA-IZOLASYON-01 guards against one level up (cross-doctor).
 */
export function vizitHastayaUygunMu(visitPatientId: string | null, hastaId: string): boolean {
  if (!hastaId) return false
  if (!visitPatientId) return true // visit with no patient link yet (rare) — nothing to contradict
  return visitPatientId === hastaId
}

export interface GorselYakalamaGirdi {
  tur: GorselYakalamaTur | null
  bayt: number
  hastaId: string
  visitId: string | null
  /** Result of seansSahibi(supabase, doktorId, visitId) — null means "not this doctor's visit" or no visitId given. */
  visit: { id: string; patient_id: string | null } | null
}

/** Single gate the route calls after hastaSahibiMi() has already passed. Fails closed. */
export function gorselYakalamaDogrula(g: GorselYakalamaGirdi): { ok: true } | { ok: false; hata: string; durum: 400 | 404 } {
  if (!g.tur) return { ok: false, hata: 'Desteklenmeyen dosya türü — yalnız fotoğraf veya PDF.', durum: 400 }
  const boyut = gorselYakalamaBoyutGecerliMi(g.tur, g.bayt)
  if (!boyut.ok) return { ok: false, hata: boyut.hata, durum: 400 }
  if (g.visitId) {
    if (!g.visit) return { ok: false, hata: 'Vizit bulunamadı.', durum: 404 }
    if (!vizitHastayaUygunMu(g.visit.patient_id, g.hastaId)) {
      return { ok: false, hata: 'Vizit bu hastaya ait değil.', durum: 400 }
    }
  }
  return { ok: true }
}
