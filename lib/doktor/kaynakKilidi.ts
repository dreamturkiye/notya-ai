/**
 * KD-KAYNAK-KILIDI — code-level citation lock (same pattern as the dose lock in ./dozKilidi).
 * KD notes / chat answers cited guideline document numbers from memory ("ACOG Practice Bulletin No. 183", "SMFM Consult
 * Series #76", "RCOG Green-top No. 52"). The prompt rule ("Kaynak kilidi") is the first line; this is the backstop.
 *
 * A numbered external guideline citation (ACOG PB / CO / CC / OCC / Committee Statement, SMFM Consult Series, RCOG Green-top,
 * NICE NG/CG) or a dated Turkish society / SB guideline (TJOD 2019, DÖBYR 2021, Yayın No. …) is kept only when the exact
 * number / year is in the verified list the caller passes AND the text (answer / note field) discusses that list entry's topic. Anything else
 * is replaced with the organisation name alone ("ACOG önerileri") and listed in a hekim-review line.
 * Pure functions, no I/O.
 */

export type DogrulanmisKaynak = {
  /** 'ACOG:PB' | 'ACOG:CO' | 'ACOG:CC' | 'ACOG:CS' | 'SMFM:CS' | 'TJOD' | 'DÖBYR' | 'SB-YAYIN' … */
  aile: string
  /** Document number or publication year, as written in the verified source. */
  numara: number
  /** Human label for the prompt list. */
  etiket: string
  /** Lower-case topic keywords (TR + EN); at least one must appear in the citing text. */
  konu: string[]
}

export type KaynakBulgusu = { alinti: string; neden: 'dogrulanmamis' | 'konu-uyusmuyor' }

const NO = String.raw`(?:\s*(?:No\.?|Nr\.?|Number|Sayı|numaralı)\s*:?\s*|\s*#\s*|\s+)(\d{1,4})\b`
/** ACOG / SMFM / RCOG long document-type names (org prefix optional) and short forms (org prefix required). */
const ACOG_TUR: [RegExp, string][] = [
  [/^(?:practice\s+bulletin|uygulama\s+bülteni|pb)$/i, 'PB'],
  [/^(?:committee\s+opinion|komite\s+görüşü|co)$/i, 'CO'],
  [/^(?:obstetric\s+care\s+consensus|occ)$/i, 'OCC'],
  [/^(?:clinical\s+consensus|cc)$/i, 'CC'],
  [/^(?:committee\s+statement)$/i, 'CS'],
  [/^(?:clinical\s+practice\s+update|cpu)$/i, 'CPU'],
]
const UZUN_TUR = String.raw`Practice\s+Bulletin|Uygulama\s+Bülteni|Committee\s+Opinion|Komite\s+Görüşü|Obstetric\s+Care\s+Consensus|Clinical\s+Consensus|Committee\s+Statement|Clinical\s+Practice\s+Update|Consult\s+Series|Green[-\s]?top(?:\s+Guideline)?`
const KISA_TUR = String.raw`PB|CO|CC|OCC|CPU|GTG`
const ORG = String.raw`ACOG|SMFM|RCOG`

const ULUSLARARASI_RE = new RegExp(
  String.raw`(?:\b(${ORG})(?:'(?:nin|nın|un|ün|in|ın))?[\s,]+)?(?:\b(${UZUN_TUR})|(?<=\b(?:${ORG})\b[^.\n]{0,60}?)\b(${KISA_TUR}))${NO}`,
  'giu'
)
/** "ACOG 188": org + a bare 3-digit number (gestational weeks "ACOG 34. hafta" and years "ACOG 2020" are not document numbers). */
const CIPLAK_RE = new RegExp(String.raw`\b(${ORG})\s+(\d{3})\b(?![.,+\-–/]?\d)(?!\.?\s*(?:hafta|gün|saat|mg|mcg))`, 'gu')
const NICE_RE = /\bNICE\s+(?:guideline\s+|kılavuzu\s+)?\(?((?:NG|CG|QS)\s?\d{1,3})\)?/giu
/** TJOD / TMFTP + a year within the same clause; DÖBYR / SB rehber + year; "Yayın No. N". */
const TR_YIL_RE = /\b(TJOD|TMFTP|DÖBYR|DOBYR)\b([^.\n;]{0,60}?)\(?\b((?:19|20)\d{2})\b\)?/gu
const YAYIN_RE = /\bYayın\s+No\.?\s*:?\s*(\d{2,5})\b/giu

const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR')

function aileBul(org: string | undefined, tur: string): string {
  const t = tur.replace(/\s+/g, ' ')
  if (/consult\s+series/i.test(t)) return 'SMFM:CS'
  if (/green|gtg/i.test(t)) return 'RCOG:GTG'
  for (const [re, kod] of ACOG_TUR) if (re.test(t)) return `${(org || 'ACOG').toUpperCase() === 'SMFM' ? 'SMFM' : 'ACOG'}:${kod}`
  return `${(org || '?').toUpperCase()}:${t}`
}

const GENEL_AD: Record<string, string> = { ACOG: 'ACOG önerileri', SMFM: 'SMFM önerileri', RCOG: 'RCOG kılavuzu', NICE: 'NICE kılavuzu', TJOD: 'TJOD önerileri', TMFTP: 'TMFTP önerileri', DÖBYR: 'SB DÖBYR', DOBYR: 'SB DÖBYR', 'SB-YAYIN': 'ilgili SB rehberi' }

export function uydurmaKaynakTemizle(metin: string, dogrulanmis: DogrulanmisKaynak[]): { metin: string; bulgular: KaynakBulgusu[] } {
  const bulgular: KaynakBulgusu[] = []
  // Topic = the whole text (one chat answer / one note field): answers cite in a closing "Kaynak" line or table, far from
  // the heading that names the topic. Catches a verified number used for a topic the text never discusses (PB 222 for GBS).
  const butun = kucuk(metin)
  const karar = (aile: string, numara: number): KaynakBulgusu['neden'] | null => {
    const adaylar = dogrulanmis.filter((d) => (aile.endsWith(':*') ? d.aile.startsWith(aile.slice(0, -1)) : d.aile === aile) && d.numara === numara)
    if (!adaylar.length) return 'dogrulanmamis'
    return adaylar.some((d) => d.konu.some((k) => butun.includes(k))) ? null : 'konu-uyusmuyor'
  }
  const degistir = (re: RegExp, coz: (m: RegExpExecArray) => { aile: string; numara: number; genel: string } | null) => {
    const parcalar: string[] = []
    let son = 0
    const kaynak = metin
    for (const m of kaynak.matchAll(re)) {
      const c = coz(m as RegExpExecArray)
      if (!c) continue
      const neden = karar(c.aile, c.numara)
      if (!neden) continue
      bulgular.push({ alinti: m[0].trim(), neden })
      parcalar.push(kaynak.slice(son, m.index!), c.genel)
      son = m.index! + m[0].length
    }
    parcalar.push(kaynak.slice(son))
    metin = parcalar.join('')
  }

  degistir(ULUSLARARASI_RE, (m) => {
    const org = m[1]
    const tur = m[2] || m[3]
    const aile = aileBul(org, tur)
    const kurum = aile.split(':')[0]
    // "(ACOG Practice Bulletin No. 183)" → "(ACOG önerileri)"; an org-less "Practice Bulletin 183" → "ilgili uluslararası kılavuz"
    return { aile, numara: Number(m[4]), genel: org || kurum !== '?' ? GENEL_AD[kurum] || 'ilgili uluslararası kılavuz' : 'ilgili uluslararası kılavuz' }
  })
  degistir(CIPLAK_RE, (m) => ({ aile: `${m[1].toUpperCase()}:*`, numara: Number(m[2]), genel: GENEL_AD[m[1].toUpperCase()] }))
  degistir(NICE_RE, (m) => ({ aile: `NICE:${m[1].slice(0, 2).toUpperCase()}`, numara: Number(m[1].slice(2).trim()), genel: GENEL_AD.NICE }))
  degistir(TR_YIL_RE, (m) => {
    // only the year goes: "TJOD 2019 preeklampsi önerileri" → "TJOD preeklampsi önerileri"
    const org = m[1].toUpperCase() === 'DOBYR' ? 'DÖBYR' : m[1]
    return { aile: org === 'DÖBYR' ? org : org.toUpperCase(), numara: Number(m[3]), genel: `${org}${m[2].replace(/[\s(,]+$/, '')}` }
  })
  degistir(YAYIN_RE, (m) => ({ aile: 'SB-YAYIN', numara: Number(m[1]), genel: GENEL_AD['SB-YAYIN'] }))
  return { metin: metin.replace(/[ \t]{2,}/g, ' '), bulgular }
}

export function kaynakKontrolSatiri(bulgular: { alan: string; alinti: string }[]): string {
  const liste = bulgular.slice(0, 8).map((b) => `"${b.alinti}" (${b.alan})`).join(', ')
  return `⚠ Kaynak kontrolü (hekim onayı): doğrulanamayan kılavuz numarası / yılı taslaktan çıkarıldı — ${liste}. Kaynağı hekim doğrular; notu onaylamadan önce kontrol edin.`
}

const METIN_ALANLARI = ['basvuruYakinmasi', 'anamnez', 'fizik_muayene', 'tani', 'tedavi', 'takip_suresi', 'hasta_ozeti', 'aiDegerlendirme'] as const
const LISTE_ALANLARI = ['alarmBulgulari', 'kritik_bulgular'] as const

/** Apply the citation lock to a generated SOAP note (copy). The review line goes into aiDegerlendirme. */
export function soapKaynakKilidi<T extends object>(veri: T, dogrulanmis: DogrulanmisKaynak[]): T & { aiDegerlendirme?: string } {
  const bulunan: { alan: string; alinti: string }[] = []
  const temizle = (alan: string, v: unknown): unknown => {
    if (typeof v !== 'string') return v
    const r = uydurmaKaynakTemizle(v, dogrulanmis)
    for (const b of r.bulgular) bulunan.push({ alan, alinti: b.alinti })
    return r.metin
  }
  const out = { ...veri } as Record<string, unknown>
  if (out.soap && typeof out.soap === 'object') {
    out.soap = Object.fromEntries(Object.entries(out.soap as Record<string, unknown>).map(([k, v]) => [k, temizle(k, v)]))
  }
  for (const alan of METIN_ALANLARI) if (alan in out) out[alan] = temizle(alan, out[alan])
  for (const alan of LISTE_ALANLARI) if (Array.isArray(out[alan])) out[alan] = (out[alan] as unknown[]).map((x) => temizle(alan, x))
  if (Array.isArray(out.receteOnerisi)) {
    out.receteOnerisi = out.receteOnerisi.map((r) => (r && typeof r === 'object' ? Object.fromEntries(Object.entries(r as Record<string, unknown>).map(([k, v]) => [k, temizle('receteOnerisi', v)])) : r))
  }
  if (bulunan.length) out.aiDegerlendirme = [out.aiDegerlendirme, kaynakKontrolSatiri(bulunan)].filter(Boolean).join('\n\n')
  return out as T & { aiDegerlendirme?: string }
}
