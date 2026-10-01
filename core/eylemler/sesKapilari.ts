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
  // NOTYA-AYSE-GERI-04: only an explicit "at birth". "yenidoğan" is a period of four weeks and "natal" also sits
  // inside "prenatal / postnatal" — neither is the birth DATE, and filling it was a guess stored as a fact.
  if (!/do[ğg]umda\b|do[ğg]um\s+an[ıi]nda|do[ğg]ar\s+do[ğg]maz|do[ğg]umhanede/i.test(metin)) return veri
  // The same text names another day ("doğumda Hepatit B yapılmış, ikinci doz bugün yapıldı"): the dose being
  // recorded is not provably the birth dose, so the date stays empty and the doctor fills it.
  if (BASKA_GUN.test(metin)) return veri
  return {
    ...veri,
    uygulama_tarihi: dogumTarihi,
  }
}

/** A day other than birth named in the same text: a relative day, a dated visit, an age ("2. ayda", "6 aylıkken"). */
const BASKA_GUN = /\b(bug[üu]n|d[üu]n|yar[ıi]n|az\s+[öo]nce|demin|[şs]imdi|ge[çc]en\s+(hafta|ay)|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d+\s*\.?\s*(ay|hafta|g[üu]n)(da|de|l[ıi]k\w*)?)\b/i

const TR_GUN = new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

/**
 * NOTYA-AYSE-GERI-04 — a date the way Ayşe says it before asking for "Evet": "2026-10-01" → "1 Ekim 2026 Perşembe",
 * with "bugün" / "dün" / "yarın" in front when it is one of those. The doctor hears the day the card will carry —
 * a wrong date is caught by ear, before the confirmation, not found in the chart afterwards.
 */
export function tarihOkunusu(iso: unknown, bugun?: string | null): string {
  const s = String(iso ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(`${s}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return s
  const etiket = TR_GUN.format(d)
  if (!bugun || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return etiket
  const fark = Math.round((d.getTime() - new Date(`${bugun}T12:00:00Z`).getTime()) / 86400000)
  return fark === 0 ? `bugün, ${etiket}` : fark === -1 ? `dün, ${etiket}` : fark === 1 ? `yarın, ${etiket}` : etiket
}

/** Short Turkish summary Ayşe speaks before “Onaylıyor musunuz?” — never claims kaydedildi. */
export function sesOzetMetni(g: {
  etiket: string
  hastaAd: string
  veri: Record<string, unknown>
  alanlar: readonly AlanTanimi[]
  eksik: readonly string[]
  ek?: string | null
  /** Today in the doctor's timezone (yyyy-mm-dd) — lets a date be read as "bugün, 1 Ekim 2026 Perşembe". */
  bugun?: string | null
}): string {
  const parcalar: string[] = [`${g.hastaAd} için ${g.etiket} hazırladım`]
  for (const a of g.alanlar) {
    const v = g.veri[a.anahtar]
    if (v == null || String(v).trim() === '') continue
    if (a.gizli) continue
    if (a.tip === 'uzunMetin' && String(v).length > 80) continue
    // NOTYA-AYSE-GERI-04: the date is read aloud in words, before "Onaylıyor musunuz?".
    parcalar.push(`${a.etiket}: ${a.tip === 'tarih' ? tarihOkunusu(v, g.bugun) : v}`)
  }
  const ek = g.ek ? ` ${g.ek.replace(/\s+/g, ' ').trim()}` : ''
  if (g.eksik.length) {
    const etiketler = g.eksik.map((k) => g.alanlar.find((a) => a.anahtar === k)?.etiket || k)
    return `${parcalar.join('. ')}.${ek} Ama ${etiketler.join(', ')} boş — ekrandaki karttan doldurup onaylayın.`
  }
  return `${parcalar.join('. ')}.${ek} Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?`
}
