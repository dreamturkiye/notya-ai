/**
 * ESNEK-MUAYENE-A — Muayene Derleyici (pure parts): a muayene note built from ANY mix of sources, with or without a
 * transcript. Gökhan: many doctors never record, or record AND write — the best note blends both.
 *
 * Authority (never auto-resolved between sources):
 *  - the doctor's HANDWRITING (el notu, typed note) decides findings, diagnosis and plan;
 *  - the TRANSCRIPT decides the anamnesis and the patient's own words;
 *  - DOCUMENTS give measurements and results;
 *  - Ayşe's own suggestions stay in the separate advisory block (unchanged soapUret behaviour).
 * Two sources that disagree on the same fact → a conflict question (Doğrula 'celiski'); the note body leaves that fact out
 * until it is answered. Every sentence carries its source tags ‹K1.3› while generated; they are stripped into the note's
 * provenance map (tap a sentence → the line / crop it came from).
 */

export type KaynakTuru = 'transkript' | 'el_notu' | 'yazili_not' | 'belge' | 'sekreter_yukleme'
export type SoapAlani = 'subjektif' | 'objektif' | 'degerlendirme' | 'plan'
export const SOAP_ALANLARI: SoapAlani[] = ['subjektif', 'objektif', 'degerlendirme', 'plan']

export type DerlemeKaynagi = {
  id: string
  tur: KaynakTuru
  /** Human label of the source (in the build's language), e.g. "El notu, sayfa 1–2". */
  baslik: string
  metin: string
  /** Idempotency key of the source (content hash). */
  isleme: string
}

/** Which sections a source type may change (authority map). A late source regenerates only these. */
export const ETKILEDIGI_ALANLAR: Record<KaynakTuru, SoapAlani[]> = {
  transkript: ['subjektif', 'objektif', 'degerlendirme', 'plan'],
  el_notu: ['subjektif', 'objektif', 'degerlendirme', 'plan'],
  sekreter_yukleme: ['subjektif', 'objektif', 'degerlendirme', 'plan'],
  yazili_not: ['subjektif', 'objektif', 'degerlendirme', 'plan'],
  belge: ['objektif'],
}

const TUR_ROLU: Record<KaynakTuru, string> = {
  transkript: 'TRANSCRIPT of the visit (authority for the anamnesis and the patient\'s own words)',
  el_notu: 'the PHYSICIAN\'S HANDWRITTEN NOTE (authority for findings, diagnosis and plan)',
  sekreter_yukleme: 'the PHYSICIAN\'S HANDWRITTEN NOTE, uploaded by the front desk (authority for findings, diagnosis and plan)',
  yazili_not: 'the PHYSICIAN\'S TYPED NOTE (authority for findings, diagnosis and plan)',
  belge: 'a DOCUMENT / report (authority for measurements and results)',
}

/** Sources as one labelled block: K<n> per source, every line numbered K<n>.<line> for provenance. */
export function kaynakBlogu(kaynaklar: DerlemeKaynagi[]): string {
  return kaynaklar.map((k, i) => {
    const etiket = `K${i + 1}`
    const satirlar = k.metin.split('\n').map((s) => s.trim()).filter(Boolean).map((s, j) => `[${etiket}.${j + 1}] ${s}`)
    return `=== ${etiket}: ${TUR_ROLU[k.tur]} — ${k.baslik} ===\n${satirlar.join('\n') || '(empty)'}`
  }).join('\n\n')
}

export const DERLEME_KURALLARI = `SOURCES — this visit is documented by the labelled sources below (not only a transcript). Build the note from ALL of them.
AUTHORITY: the physician's handwritten / typed note decides findings (objektif), diagnosis (degerlendirme) and plan; the transcript decides the anamnesis (subjektif) and the patient's own words; documents give measurements and results.
- Abbreviations in the handwritten note are already expanded where known; keep anything you do not understand as written.
- Tokens like ⟦s1-l3-w2|word?⟧ are UNCONFIRMED readings: copy each one EXACTLY, in place, wherever you use that information. Never replace one with a guess.
- CONFLICT: if two sources state different values for the same fact (side, a number, a dose, presence vs absence, a diagnosis), DO NOT choose: leave that fact out of the body and list it in "celiskiler".
- PROVENANCE: end EVERY sentence / numbered item of subjektif, objektif, degerlendirme and plan with the line tags it came from, like ‹K1.3› or ‹K1.3,K2.7›.
- Never add a finding, diagnosis, drug, dose or side that no source states.
Add two more fields to the JSON:
"celiskiler": [{"konu": "", "alan": "subjektif|objektif|degerlendirme|plan", "secenekler": [{"deger": "", "kaynak": "K1.3"}]}] (empty array when none);
"dosyaOnerileri": [{"tur": "alerji|aliskanlik|kronik|surekli_ilac", "metin": "", "kaynak": "K1.3"}] — ONLY facts a source states about the patient's allergies, habits (smoking, alcohol), chronic diseases or regular medicines, to be confirmed by the physician before they enter the patient file (empty array when none).`

const ETIKET_RE = /\s*‹\s*(K\d+(?:\.\d+)?(?:\s*,\s*K\d+(?:\.\d+)?)*)\s*›/g

export type KaynakIzi = { cumle: string; etiketler: string[] }
export type KaynakIzleri = Partial<Record<SoapAlani, KaynakIzi[]>>

/** Strip the ‹K…› tags from the four sections; return the clean text and the provenance map (sentence → tags). */
export function izleriAyikla(soap: Partial<Record<SoapAlani, string>> | undefined | null): { soap: Partial<Record<SoapAlani, string>>; izler: KaynakIzleri } {
  const temiz: Partial<Record<SoapAlani, string>> = {}
  const izler: KaynakIzleri = {}
  for (const alan of SOAP_ALANLARI) {
    const v = soap?.[alan]
    if (typeof v !== 'string') continue
    const liste: KaynakIzi[] = []
    for (const satir of v.split('\n')) {
      // split a line into sentences ending with a tag group
      let son = 0
      for (const m of satir.matchAll(ETIKET_RE)) {
        const cumle = satir.slice(son, m.index).replace(ETIKET_RE, '').trim()
        if (cumle) liste.push({ cumle, etiketler: m[1].split(',').map((x) => x.trim()) })
        son = (m.index ?? 0) + m[0].length
      }
    }
    if (liste.length) izler[alan] = liste
    temiz[alan] = v.replace(ETIKET_RE, '').replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
  }
  return { soap: temiz, izler }
}

/** Any tag left anywhere in a text (defensive, before saving any field). */
export const etiketleriSil = (s: string) => s.replace(ETIKET_RE, '')

export type Celiski = { konu: string; alan: SoapAlani; secenekler: { deger: string; kaynak: string }[] }

export function celiskileriAyikla(ham: unknown): Celiski[] {
  if (!Array.isArray(ham)) return []
  const out: Celiski[] = []
  for (const x of ham as Record<string, unknown>[]) {
    const alan = SOAP_ALANLARI.includes(x?.alan as SoapAlani) ? (x.alan as SoapAlani) : 'objektif'
    const secenekler = (Array.isArray(x?.secenekler) ? x.secenekler : [])
      .map((s: Record<string, unknown>) => ({ deger: String(s?.deger ?? '').trim().slice(0, 200), kaynak: String(s?.kaynak ?? '').trim().slice(0, 20) }))
      .filter((s: { deger: string }) => s.deger)
    const konu = String(x?.konu ?? '').trim().slice(0, 120)
    if (konu && secenekler.length >= 2) out.push({ konu, alan, secenekler: secenekler.slice(0, 4) })
  }
  return out.slice(0, 12)
}

/** Tag "K2.5" → { kaynak index 1, line 5 }. */
export function etiketCoz(etiket: string): { kaynak: number; satir: number | null } | null {
  const m = /^K(\d+)(?:\.(\d+))?$/.exec(etiket.trim())
  return m ? { kaynak: Number(m[1]) - 1, satir: m[2] ? Number(m[2]) : null } : null
}

/**
 * A late source: regenerate, then take ONLY the sections that source type may change; a section the doctor (or the
 * secretary) already edited by hand is not overwritten — the new text is offered next to it instead.
 */
export function bolumleriBirlestir(
  eski: Partial<Record<SoapAlani, string | null>>,
  yeni: Partial<Record<SoapAlani, string>>,
  alanlar: SoapAlani[],
  elleDuzenlenen: Set<SoapAlani>,
): { soap: Partial<Record<SoapAlani, string>>; oneriler: { alan: SoapAlani; metin: string }[] } {
  const soap: Partial<Record<SoapAlani, string>> = {}
  const oneriler: { alan: SoapAlani; metin: string }[] = []
  for (const alan of SOAP_ALANLARI) {
    const e = eski[alan] ?? ''
    const y = yeni[alan] ?? ''
    if (!alanlar.includes(alan) || !y || y === e) { if (e) soap[alan] = e; continue }
    if (elleDuzenlenen.has(alan) && e) { soap[alan] = e; oneriler.push({ alan, metin: y }); continue }
    soap[alan] = y
  }
  return { soap, oneriler }
}

/** Stable short hash (FNV-1a, hex) for idempotency keys and "section as generated" fingerprints. */
export function ozet(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

export type DosyaOnerisi = { tur: 'alerji' | 'aliskanlik' | 'kronik' | 'surekli_ilac'; metin: string; kaynak: string }
const DOSYA_TURLERI = ['alerji', 'aliskanlik', 'kronik', 'surekli_ilac'] as const

export function dosyaOnerileriniAyikla(ham: unknown): DosyaOnerisi[] {
  if (!Array.isArray(ham)) return []
  const out: DosyaOnerisi[] = []
  for (const x of ham as Record<string, unknown>[]) {
    const tur = DOSYA_TURLERI.includes(x?.tur as DosyaOnerisi['tur']) ? (x.tur as DosyaOnerisi['tur']) : null
    const metin = etiketleriSil(String(x?.metin ?? '')).replace(/⟦[^⟧]*⟧/g, '').trim().slice(0, 200)
    if (tur && metin) out.push({ tur, metin, kaynak: String(x?.kaynak ?? '').slice(0, 20) })
  }
  return out.slice(0, 12)
}
