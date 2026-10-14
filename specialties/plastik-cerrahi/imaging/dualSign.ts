/**
 * PLASTIK-GORUNTU-OKUMA-01 — standardize edilmiş önce/sonra foto dual-sign okuma. Mirrors the SHAPE
 * göz/KBB's dualSign.ts proved out (draft → onaylı/düzeltilmiş/reddedildi; asistan never
 * self-approves), but the fields below are plastik cerrahi's own: a standardized VIEW (not a lesion,
 * not a fundus field, not an ear side) tied to a procedure category and days-since-procedure.
 * Sourced: Patel/Karam/Lam, "Pictorial Documentation", Bailey's Head & Neck Surgery — Otolaryngology
 * (EntoKey, 2016) — see engines/plastik.ts REF_ACIKLAMA.ENTOKEY_PICTORIAL.
 *
 * Standing kilit (PLASTIK-CERRAHI-EXCEPTIONAL-01, engines/plastik.ts): tanı / komplikasyon adı /
 * doz asla üretilmez. The draft read is a DESCRIPTIVE healing-appearance observation only (ödem,
 * eritem, sütur hattı görünümü, drenaj varlığı) — never "enfekte", never a named complication, never a
 * diagnosis. dozVeyaTaniKilidiIceriyorMu() scrubs the draft the same way foto.ts already scrubs the
 * pure köprü's etiket/not — this module does NOT relax that lock, it extends it to AI-drafted text too.
 */
export const PLASTIK_GORUNTU_DISCLAIMER = 'Foto izlem gözlemi, tanı/komplikasyon tespiti değildir. Uzman onayı gerekir.' as const

export const PLASTIK_GORUNUMLER = ['frontal', 'oblik_sag', 'oblik_sol', 'lateral_sag', 'lateral_sol', 'bazal', 'posterior', 'yakin_cekim'] as const
export type PlastikGorunum = (typeof PLASTIK_GORUNUMLER)[number]

export const GORUNUM_AD: Record<PlastikGorunum, string> = {
  frontal: 'Frontal (önden)', oblik_sag: 'Oblik — sağ 45°', oblik_sol: 'Oblik — sol 45°',
  lateral_sag: 'Lateral — sağ profil', lateral_sol: 'Lateral — sol profil',
  bazal: 'Bazal (alttan, burun ucu kaş hizasında)', posterior: 'Posterior (arkadan)', yakin_cekim: 'Yakın çekim',
}

export type PlastikOkumaDurum = 'draft' | 'onayli' | 'duzeltilmis' | 'reddedildi'
export type Aktor = 'asistan' | 'uzman'

export interface PlastikOkuma { taslak: string; taslakYazan: Aktor; durum: PlastikOkumaDurum; uzmanMetin: string | null }

export function okumaGecisi(o: PlastikOkuma, eylem: 'onayla' | 'duzelt' | 'reddet', aktor: Aktor, uzmanMetin?: string): { ok: true; okuma: PlastikOkuma } | { ok: false; hata: string } {
  if (aktor !== 'uzman') return { ok: false, hata: 'Asistan onaylayamaz — uzman onayı gerekir.' }
  if (o.durum !== 'draft') return { ok: false, hata: 'Yalnız taslak okuma onaylanır / düzeltilir.' }
  if (eylem === 'duzelt' && !(uzmanMetin || '').trim()) return { ok: false, hata: 'Düzeltme metni boş olamaz.' }
  const durum: PlastikOkumaDurum = eylem === 'onayla' ? 'onayli' : eylem === 'duzelt' ? 'duzeltilmis' : 'reddedildi'
  return { ok: true, okuma: { ...o, durum, uzmanMetin: eylem === 'duzelt' ? String(uzmanMetin).trim() : o.uzmanMetin } }
}

export function taslakTaniDiliUyarisi(metin: string): string | null {
  return /(?<![\p{L}])(kesin(likle)? tan[ıi]|enfekte(dir)?|nekroz(dur|e)?|komplikasyon(dur)?|flep kayb[ıi])(?![\p{L}])/iu.test(metin)
    ? 'Taslak tanı/komplikasyon dili içeriyor — foto izlem gözlemi karar desteğidir, tanı hekimindir (112 yönlendirmesi ayrı, hekim kararı).'
    : null
}
