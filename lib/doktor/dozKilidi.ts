/**
 * KD-DERM-SAFETY-FINDINGS F1 — code-level dose lock for the prompt-locked branches (dahiliye, kadın doğum, dermatoloji).
 * The prompt rule ("Doz yazma — doz hekim tarafından belirlenir") is the first line; this is the backstop, because
 * KD / derm test notes still carried doses from memory (anti-D 300 mcg, aspirin 81 mg, izotretinoin 0,5 mg/kg).
 *
 * 1. receteOnerisi: doz / kullanım are always stripped; doses in ticariOrnek removed (was dahiliyeReceteDozsuz).
 * 2. Everything else (note body, aiDegerlendirme, hasta özeti, ilaclar, chat speech): a dose-looking token whose
 *    numbers do not appear in the source the hekim gave (transcript, patient file, doctor's chat messages) is replaced
 *    with DOZ_YER_TUTUCU and listed in a hekim-review line. A dose the hekim actually said is left untouched.
 * Pure functions, no I/O.
 */

export const DOZ_YER_TUTUCU = '[doz hekim tarafından belirlenir]'

const SAYI = String.raw`\d+(?:[.,]\d+)?`
const BIRIM = String.raw`(?:mikrogram|miligram|gram|ünite|unite|mcg|µg|μg|mg|mIU|mU|IU|İU|mL|gr|g|U|ü)`
const EK = String.raw`(?:\s*\/\s*(?:kg|gün|gun|hafta|doz|saat|dk|dakika))*`
/** number (or range) + drug unit (+ /kg/gün …). Lab units (mg/dL, g/L, mL/dk eGFR, mIU/mL) and the 50/75 g glucose test are not doses. */
const DOZ_RE = new RegExp(
  String.raw`(?<![\p{L}\d.,])(?:≈|~)?(${SAYI})(?:\s*[-–]\s*(${SAYI}))?\s*${BIRIM}(?![\p{L}])(?!\s*\/\s*(?:dl|l|ml|m2|m²)(?![\p{L}]))(?!${EK}\s*(?:\/\s*1[.,]73|OGTT|OGT|glukoz|glikoz|yükleme testi))${EK}`,
  'giu'
)

const sayiAnahtari = (s: string) => String(Number(s.replace(',', '.')))

/** Every number in the source, normalised ("0,5" = "0.5"; Turkish thousands "1.500" also counts as 1500). */
export function kaynakSayilari(...kaynaklar: (string | null | undefined)[]): Set<string> {
  const set = new Set<string>()
  for (const k of kaynaklar) {
    for (const m of String(k || '').matchAll(/\d+(?:[.,]\d+)*/g)) {
      set.add(sayiAnahtari(m[0].replace(/[.,](?=\d{3}(?:\D|$))/g, '')))
      if (/^\d+[.,]\d+$/.test(m[0])) set.add(sayiAnahtari(m[0]))
    }
  }
  return set
}

/**
 * Blood-loss / PPH volume thresholds (e.g. "≥500 mL", "≥1000 mL kan kaybı") look like dose tokens because
 * mL is a drug unit, but they are clinical cut-offs — never replace them with DOZ_YER_TUTUCU.
 */
function kanKaybiHacimEsik(metin: string, offset: number, tam: string): boolean {
  if (!/(?:mL|ml)\b/.test(tam)) return false
  const once = metin.slice(Math.max(0, offset - 48), offset)
  const baglam = once + metin.slice(offset, offset + tam.length + 48)
  if (/[≥≤<>]|>=|<=|en\s+az|en\s+fazla|\büzeri\b|\balti\b|\baltı\b/.test(once)) return true
  return /(?:kan\s*kayb|kanama\s+e[sş]i[gğ]|postpartum\s+hemor|\bPPH\b|doğum\s+sonu\s+kanama)/i.test(baglam)
}

/** Replace dose tokens whose numbers are not in the hekim's source. Returns the cleaned text and what was removed. */
export function uydurmaDozTemizle(metin: string, kaynak: Set<string>): { metin: string; dozlar: string[] } {
  const dozlar: string[] = []
  const temiz = metin.replace(DOZ_RE, (tam: string, a: string, b: string | undefined, offset: number) => {
    if (kanKaybiHacimEsik(metin, offset, tam)) return tam
    if ([a, b].every((n) => !n || kaynak.has(sayiAnahtari(n)))) return tam
    dozlar.push(tam.trim())
    return DOZ_YER_TUTUCU
  })
  return { metin: temiz, dozlar }
}

/** Locked safety §1 (dahiliye system.md #2, KD / derm Doz kilidi): drug class / etken madde only in reçete önerisi. */
export function receteDozsuz<T extends { doz?: string; kullanim?: string; ticariOrnek?: string; not?: string }>(liste: T[]): T[] {
  return liste.map((r) => {
    const { doz: _d, kullanim: _k, ...kalan } = r
    const ticari = r.ticariOrnek ? r.ticariOrnek.replace(DOZ_RE, '').replace(/\s{2,}/g, ' ').trim() : r.ticariOrnek
    return { ...kalan, ...(ticari ? { ticariOrnek: ticari } : {}), not: [r.not, 'Doz hekim yazar'].filter(Boolean).join(' · ') } as T
  })
}

export function dozKontrolSatiri(bulunan: { alan: string; doz: string }[]): string {
  const liste = bulunan.slice(0, 8).map((b) => `"${b.doz}" (${b.alan})`).join(', ')
  return `⚠ Doz kontrolü (hekim onayı): transkriptte geçmeyen doz ifadesi taslaktan çıkarıldı — ${liste}. Doz hekim tarafından belirlenir; notu onaylamadan önce kontrol edin.`
}

const METIN_ALANLARI = ['basvuruYakinmasi', 'anamnez', 'fizik_muayene', 'tani', 'tedavi', 'takip_suresi', 'hasta_ozeti', 'aiDegerlendirme'] as const
const LISTE_ALANLARI = ['alarmBulgulari', 'kritik_bulgular'] as const

/** Apply the dose lock to a generated SOAP note in place-safe copy. `kaynak` = transcript + kimliksiz klinik bağlam. */
export function soapDozKilidi<T extends object>(veri: T, ...kaynak: (string | null | undefined)[]): T & { aiDegerlendirme?: string } {
  const sayilar = kaynakSayilari(...kaynak)
  const bulunan: { alan: string; doz: string }[] = []
  const temizle = (alan: string, v: unknown): unknown => {
    if (typeof v !== 'string') return v
    const r = uydurmaDozTemizle(v, sayilar)
    for (const doz of r.dozlar) bulunan.push({ alan, doz })
    return r.metin
  }
  const out = { ...veri } as Record<string, unknown>
  if (out.soap && typeof out.soap === 'object') {
    out.soap = Object.fromEntries(Object.entries(out.soap as Record<string, unknown>).map(([k, v]) => [k, temizle(k, v)]))
  }
  for (const alan of METIN_ALANLARI) if (alan in out) out[alan] = temizle(alan, out[alan])
  for (const alan of LISTE_ALANLARI) if (Array.isArray(out[alan])) out[alan] = (out[alan] as unknown[]).map((x) => temizle(alan, x))
  if (Array.isArray(out.ilaclar)) {
    out.ilaclar = out.ilaclar.map((i) => (i && typeof i === 'object' ? Object.fromEntries(Object.entries(i as Record<string, unknown>).map(([k, v]) => [k, temizle('ilaclar', v)])) : i))
  }
  if (Array.isArray(out.receteOnerisi)) out.receteOnerisi = receteDozsuz(out.receteOnerisi as { doz?: string }[])
  if (bulunan.length) out.aiDegerlendirme = [out.aiDegerlendirme, dozKontrolSatiri(bulunan)].filter(Boolean).join('\n\n')
  return out as T & { aiDegerlendirme?: string }
}
