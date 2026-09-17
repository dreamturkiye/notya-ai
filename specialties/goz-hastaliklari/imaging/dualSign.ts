/**
 * GOZ-CHAPTER — OCT / fundus / ön segment okuma dual-sign. Pixels stay in core hasta_goruntulemeler; this is the read record.
 * Taslak (asistan hekim veya dikte) → uzman onay / düzeltme / red. Asistan kendi taslağını onaylayamaz. Karar desteği, tanı değildir.
 * Ayşe otomatik görüntü okuması bu sürümde bağlı değil (manifest.imagingCapabilities.ayseOtomatikOkuma=false) — kasıtlı dış kapsam.
 */
export const GOZ_GORUNTU_DISCLAIMER = 'Karar desteği, tanı değildir. Uzman onayı gerekir.' as const
export const GOZ_MODALITELER = ['oct', 'fundus', 'on_segment'] as const
export type GozModalite = (typeof GOZ_MODALITELER)[number]
export type OkumaDurum = 'draft' | 'onayli' | 'duzeltilmis' | 'reddedildi'
export type Aktor = 'asistan' | 'uzman'

export interface Okuma { taslak: string; taslakYazan: Aktor; durum: OkumaDurum; uzmanMetin: string | null }

export function okumaGecisi(o: Okuma, eylem: 'onayla' | 'duzelt' | 'reddet', aktor: Aktor, uzmanMetin?: string): { ok: true; okuma: Okuma } | { ok: false; hata: string } {
  if (aktor !== 'uzman') return { ok: false, hata: 'Asistan onaylayamaz — uzman onayı gerekir.' }
  if (o.durum !== 'draft') return { ok: false, hata: 'Yalnız taslak okuma onaylanır / düzeltilir.' }
  if (eylem === 'duzelt' && !(uzmanMetin || '').trim()) return { ok: false, hata: 'Düzeltme metni boş olamaz.' }
  const durum: OkumaDurum = eylem === 'onayla' ? 'onayli' : eylem === 'duzelt' ? 'duzeltilmis' : 'reddedildi'
  return { ok: true, okuma: { ...o, durum, uzmanMetin: eylem === 'duzelt' ? String(uzmanMetin).trim() : o.uzmanMetin } }
}

/** Taslak metinde tanı kesinliği dili yakalanır (hekim yine yazabilir; uyarı). */
export function taslakTaniDiliUyarisi(metin: string): string | null {
  return /(?<![\p{L}])(kesin(likle)? tanı|tanısı konmuştur|kesin olarak)(?![\p{L}])/iu.test(metin) ? 'Taslak kesin tanı dili içeriyor — okuma karar desteğidir.' : null
}
