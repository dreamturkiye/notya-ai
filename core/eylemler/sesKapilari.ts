/**
 * NOTYA-EYLEM-19 — voice (ses) gates for spoken prepare → read-back → “Evet” commit.
 *
 * Spoken “Evet” IS the hekim commit (same spine as the tap), but only when these pure checks pass.
 * The model never writes; the client tool only calls the API after a clear affirm.
 */
import { ciddiUyariVarMi, type IlacUyarisi } from './ilacUyari'
import type { AlanKaynakKaydi, AlanTanimi } from './types'

/** Clear spoken affirm — one word “Evet” / “Onaylıyorum” / “Kaydet”. Ambiguous → never write. */
export function sesOnayMetniGecerliMi(metin: string): boolean {
  const t = String(metin || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[.!?…]+$/g, '')
    .trim()
  if (!t || t.length > 80) return false
  return /^(evet|onayl[ıi]yorum|onayla|kaydet|tamam|olur|kabul|yaz|ge[çc]ir)(\s+(hocam|l[üu]tfen))?$/i.test(t)
}

/** Spoken reject → vazgeç the taslak. */
export function sesVazgecMetniMi(metin: string): boolean {
  const t = String(metin || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[.!?…]+$/g, '')
    .trim()
  if (!t || t.length > 80) return false
  return /^(hay[ıi]r|vazge[çc]|iptal|yapma|kaydetme|olmaz)(\s+(hocam|l[üu]tfen))?$/i.test(t)
}

/** Serious drug warnings need the deliberate second tap — not a one-word Evet. */
export function sesCiddiUyariEngeli(uyariDetay: IlacUyarisi[] | null | undefined): string | null {
  if (ciddiUyariVarMi(uyariDetay || [])) {
    return 'Ciddi bir ilaç uyarısı var — bunu sesle onaylayamam. Ekrandaki kartta “Uyarıyı gördüm, kaydet” ile onaylayın.'
  }
  return null
}

/** Voice commit needs every required field filled (no empty yellow box). */
export function sesEksikAlanEngeli(
  zorunlu: readonly string[],
  veri: Record<string, unknown>,
  alanlar: readonly AlanTanimi[]
): string | null {
  const eksik = zorunlu.filter((k) => veri[k] === undefined || veri[k] === null || String(veri[k]).trim() === '')
  if (!eksik.length) return null
  const etiketler = eksik.map((k) => alanlar.find((a) => a.anahtar === k)?.etiket || k)
  return `Şu alanlar boş: ${etiketler.join(', ')}. Ekrandan doldurup onaylayın, ya da tarihi söyleyin.`
}

/**
 * Epikriz often says “doğumda” with no calendar date. If uygulama_tarihi is empty and the quote
 * (or value text) mentions birth, fill DOB so voice read-back can ask for one-word Evet.
 */
export function dogumdaTarihDoldur(
  veri: Record<string, unknown>,
  kaynaklar: Record<string, AlanKaynakKaydi>,
  dogumTarihi: string | null | undefined
): Record<string, unknown> {
  if (!dogumTarihi || !/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi)) return veri
  if (veri.uygulama_tarihi != null && String(veri.uygulama_tarihi).trim() !== '') return veri
  const alinti = String(kaynaklar.uygulama_tarihi?.alinti || kaynaklar.asi_adi?.alinti || '')
  const metin = `${alinti} ${veri.notlar || ''} ${veri.asi_adi || ''}`
  if (!/do[ğg]umda|do[ğg]um\s*(an[ıi]|nda)|yenido[ğg]an|natal/i.test(metin)) return veri
  return {
    ...veri,
    uygulama_tarihi: dogumTarihi,
  }
}

/** Short Turkish summary Ayşe speaks before “Onaylıyor musunuz?” — never claims kaydedildi. */
export function sesOzetMetni(g: {
  etiket: string
  hastaAd: string
  veri: Record<string, unknown>
  alanlar: readonly AlanTanimi[]
  eksik: readonly string[]
  ek?: string | null
}): string {
  const parcalar: string[] = [`${g.hastaAd} için ${g.etiket} hazırladım`]
  for (const a of g.alanlar) {
    const v = g.veri[a.anahtar]
    if (v == null || String(v).trim() === '') continue
    if (a.tip === 'uzunMetin' && String(v).length > 80) continue
    parcalar.push(`${a.etiket}: ${v}`)
  }
  const ek = g.ek ? ` ${g.ek.replace(/\s+/g, ' ').trim()}` : ''
  if (g.eksik.length) {
    const etiketler = g.eksik.map((k) => g.alanlar.find((a) => a.anahtar === k)?.etiket || k)
    return `${parcalar.join('. ')}.${ek} Ama ${etiketler.join(', ')} boş — ekrandaki karttan doldurup onaylayın.`
  }
  return `${parcalar.join('. ')}.${ek} Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?`
}
