/**
 * NOTYA-HL7-01 — HL7 v2 mapper (Hospital Integration Add-On).
 * Field reality (Kaan, 2026-09-05): Turkish hospitals overwhelmingly run HL7 v2 internally
 * (Sisoft/Fonet/Probel/Enlil-class HBYS; şehir/devlet/üniversite + Acıbadem/Memorial-class
 * private chains); FHIR is pilots. This mapper emits the two message types that deliver a
 * clinical note into an HBYS:
 *   MDM^T02 — medical document notification + content (primary: notes ARE documents)
 *   ORU^R01 — textual result + coded vitals (alternative: many HBYS ingest notes this way)
 * Per-kurum choice via config. Transport: HL7-over-HTTPS from the existing worker (serverless
 * cannot hold MLLP sockets); an MLLP relay is an onboarding adapter when a hospital insists.
 * Same zero-touch principle as the FHIR mapper: pure function, approved notes only.
 */

import type { FhirNotGirdisi } from './fhirMapper'

export interface Hl7Ayarlar {
  aliciUygulama: string // MSH-5 receiving application (kurum parametresi)
  aliciKurum: string    // MSH-6 receiving facility
  mesajTipi: 'MDM' | 'ORU'
}

const SEG = '\r' // HL7 v2 segment separator

/** HL7 v2 kaçışları: | ^ ~ \ & ve satır sonları (\.br\). */
function k(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/\\/g, '\\E\\')
    .replace(/\|/g, '\\F\\')
    .replace(/\^/g, '\\S\\')
    .replace(/~/g, '\\R\\')
    .replace(/&/g, '\\T\\')
    .replace(/\r?\n/g, '\\.br\\')
}

function ts(iso: string): string {
  const d = new Date(iso)
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function cinsiyetV2(c?: string | null): string {
  const m: Record<string, string> = { erkek: 'M', male: 'M', kadin: 'F', 'kadın': 'F', female: 'F' }
  return (c && m[c.toLowerCase()]) || 'U'
}

interface Bolum { baslik: string; metin: string }

function bolumleriTopla(g: FhirNotGirdisi): Bolum[] {
  return [
    { baslik: 'Başvuru Yakınması', metin: g.basvuruYakinmasi || '' },
    { baslik: 'Anamnez', metin: g.anamnez || g.subjektif || '' },
    { baslik: 'Fizik Muayene', metin: g.fizikMuayene || g.objektif || '' },
    { baslik: 'Tanı', metin: g.tani || g.degerlendirme || '' },
    { baslik: 'Tedavi', metin: g.tedavi || g.plan || '' },
  ].filter((b) => b.metin && b.metin.trim())
}

function ortakBaslik(g: FhirNotGirdisi, a: Hl7Ayarlar, mesajTip: string, tetikleyici: string): string[] {
  const kontrolId = `NOTYA${g.noteId.replace(/-/g, '').slice(0, 15)}`
  return [
    // MSH-18 = UNICODE UTF-8 (Türkçe karakterler için zorunlu alan)
    `MSH|^~\\&|NOTYA|DREAMTURKIYE|${k(a.aliciUygulama)}|${k(a.aliciKurum)}|${ts(g.createdAt)}||${mesajTip}^${tetikleyici}|${kontrolId}|P|2.5|||||TUR|UNICODE UTF-8`,
    `PID|1||${g.hasta.id}^^^NOTYA^PI||${k(g.hasta.adSoyad)}||${g.hasta.dogumTarihi ? ts(g.hasta.dogumTarihi).slice(0, 8) : ''}|${cinsiyetV2(g.hasta.cinsiyet)}`,
    `PV1|1|O|||||${g.doktor.id}^${k(g.doktor.adSoyad)}`,
  ]
}

/** MDM^T02 — klinik doküman bildirimi + içerik. TXA doküman üstverisi, OBX'ler bölüm metinleri. */
export function notuMdmYap(g: FhirNotGirdisi, a: Hl7Ayarlar): string {
  const seg = ortakBaslik(g, a, 'MDM', 'T02')
  seg.push(`EVN|T02|${ts(g.createdAt)}`)
  // TXA: doküman tipi CN (consultation note), tamamlanma AU (authenticated — hekim onaylı)
  seg.push(`TXA|1|CN|TX|${ts(g.createdAt)}|${g.doktor.id}^${k(g.doktor.adSoyad)}|||||||${g.noteId}||||AU`)
  let i = 1
  for (const b of bolumleriTopla(g)) {
    seg.push(`OBX|${i++}|TX|${k(b.baslik)}||${k(b.metin)}||||||F`)
  }
  return seg.join(SEG) + SEG
}

/** ORU^R01 — not metni + KODLU vitaller (LOINC + UCUM). Bazı HBYS'ler notu sonuç olarak alır. */
export function notuOruYap(g: FhirNotGirdisi, a: Hl7Ayarlar): string {
  const seg = ortakBaslik(g, a, 'ORU', 'R01')
  seg.push(`OBR|1|${g.noteId}||11488-4^Consult note^LN|||${ts(g.createdAt)}||||||||${g.doktor.id}^${k(g.doktor.adSoyad)}`)
  let i = 1
  for (const b of bolumleriTopla(g)) {
    seg.push(`OBX|${i++}|TX|${k(b.baslik)}||${k(b.metin)}||||||F`)
  }
  const v = (g.vitaller || {}) as Record<string, unknown>
  const num = (x: unknown): number | null => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : null }
  const vitalTanimlar: [string, string, string, string][] = [
    ['ates', '8310-5', 'Body temperature', 'Cel'],
    ['nabiz', '8867-4', 'Heart rate', '/min'],
    ['spo2', '2708-6', 'Oxygen saturation', '%'],
    ['kilo', '29463-7', 'Body weight', 'kg'],
    ['boy', '8302-2', 'Body height', 'cm'],
    ['solunum', '9279-1', 'Respiratory rate', '/min'],
  ]
  for (const [alan, kod, ad, birim] of vitalTanimlar) {
    const d = num(v[alan])
    if (d !== null) seg.push(`OBX|${i++}|NM|${kod}^${k(ad)}^LN||${d}|${birim}|||||F`)
  }
  return seg.join(SEG) + SEG
}

export function notuHl7Yap(g: FhirNotGirdisi, a: Hl7Ayarlar): string {
  return a.mesajTipi === 'ORU' ? notuOruYap(g, a) : notuMdmYap(g, a)
}
