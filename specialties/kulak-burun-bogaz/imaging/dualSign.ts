/**
 * KBB-GORUNTU-OKUMA-01 — oto-/naso-/laringoskopi dual-sign okuma. Mirrors the SHAPE göz's dualSign.ts
 * proved out (draft → onaylı/düzeltilmiş/reddedildi; asistan never self-approves), but every field,
 * disclaimer and vocabulary word below is KBB's own — never dermatoloji's or göz's. Sourced:
 * specialties/kulak-burun-bogaz/protocols/sources.ts (TKBBD for otoscopy terms already in use by
 * engines/otoskopi.ts; LITFL_NASOLARYNGOSCOPY for the naso-/laryngoscopy exam sequence/terminology).
 */
export const KBB_GORUNTU_DISCLAIMER = 'Bulgu kontrol listesi, tanı değildir. Uzman onayı gerekir.' as const
export const KBB_GORUNTU_MODALITELERI = ['otoskopi', 'nazoendoskopi', 'laringoskopi'] as const
export type KbbGoruntuModalite = (typeof KBB_GORUNTU_MODALITELERI)[number]
export type KbbOkumaDurum = 'draft' | 'onayli' | 'duzeltilmis' | 'reddedildi'
export type Aktor = 'asistan' | 'uzman'

/** Only otoskopi is per-ear; naso-/laringoskopi have no left/right. */
export function modaliteTarafliMi(m: KbbGoruntuModalite): boolean {
  return m === 'otoskopi'
}

export interface KbbOkuma { taslak: string; taslakYazan: Aktor; durum: KbbOkumaDurum; uzmanMetin: string | null }

export function okumaGecisi(o: KbbOkuma, eylem: 'onayla' | 'duzelt' | 'reddet', aktor: Aktor, uzmanMetin?: string): { ok: true; okuma: KbbOkuma } | { ok: false; hata: string } {
  if (aktor !== 'uzman') return { ok: false, hata: 'Asistan onaylayamaz — uzman onayı gerekir.' }
  if (o.durum !== 'draft') return { ok: false, hata: 'Yalnız taslak okuma onaylanır / düzeltilir.' }
  if (eylem === 'duzelt' && !(uzmanMetin || '').trim()) return { ok: false, hata: 'Düzeltme metni boş olamaz.' }
  const durum: KbbOkumaDurum = eylem === 'onayla' ? 'onayli' : eylem === 'duzelt' ? 'duzeltilmis' : 'reddedildi'
  return { ok: true, okuma: { ...o, durum, uzmanMetin: eylem === 'duzelt' ? String(uzmanMetin).trim() : o.uzmanMetin } }
}

/** Taslak metinde kesin tanı dili yakalanır (hekim yine yazabilir; uyarı) — TM bulgusu "tanı" değildir. */
export function taslakTaniDiliUyarisi(metin: string): string | null {
  return /(?<![\p{L}])(kesin(likle)? tan[ıi]|tan[ıi]s[ıi] konmu[şs]tur|kesin olarak|otitis medyadır|kolesteatomdur)(?![\p{L}])/iu.test(metin)
    ? 'Taslak kesin tanı dili içeriyor — bulgu kontrol listesi karar desteğidir, tanı hekimindir.'
    : null
}
