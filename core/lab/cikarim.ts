/**
 * NOTYA-LAB-01 — EXTRACT stage (server). Faithful numbers only; two independent passes when possible:
 *   structural: CSV / XLSX rows, or digital-PDF text lines (pdfjs) parsed with a lab-row grammar
 *   vision:     Claude reads the PDF/image and returns rows in the same schema (also the only pass for scans/photos)
 * The two passes are reconciled in trend.ts (uzlastir); disagreements become 'dogrulanacak' cells for the doctor.
 * Also extracts the printed patient identity (name/DOB/TC fragment) for the identity guard — used once, not stored.
 */
import type Anthropic from '@anthropic-ai/sdk'
import * as XLSX from 'xlsx'
import type { HamSatir } from './trend'

export type CikarimSonucu = { satirlar: HamSatir[]; kaynak: 'yapi' | 'gorsel'; lab_adi: string | null; numune_tarihi: string | null; rapor_tarihi: string | null; kimlik: { ad: string | null; dogum: string | null; tc_son4: string | null } | null; sayfa: number; not: string | null }

const SAYI = String.raw`[<>]?=?\s*[-+]?\d+(?:[.,]\d+)?`
const BIRIM = String.raw`(?:%|10\^?\d\/[µu]?L|10[³⁶⁹]\/µL|10[⁹¹²]+\/L|[a-zA-ZµμÜü]+\/?[a-zA-ZµμÜü0-9.²³]*(?:\/[a-zA-Z0-9.²³]+)?)`
// "ALT (SGPT)   78   U/L   0 - 41   H"  |  "Hemoglobin 12,5 g/dL 12-16"  |  "Glukoz 105 mg/dL (70-100) ↑"
const SATIR_RE = new RegExp(String.raw`^(?<ad>[A-Za-zÇĞİÖŞÜçğıöşü0-9 ()\-./%#+]{2,60}?)\s+(?<deger>${SAYI})\s*(?<birim>${BIRIM})?\s*(?:\(?\s*(?<low>${SAYI})\s*[-–]\s*(?<high>${SAYI})\s*\)?)?\s*(?<flag>H|L|HH|LL|↑|↓|N|\*)?\s*$`, 'u')

function satirCoz(line: string, page: number): HamSatir | null {
  const m = line.trim().replace(/\s{2,}/g, '  ').match(SATIR_RE)
  if (!m?.groups) return null
  const ad = m.groups.ad.trim()
  if (/^(sonuç|sonuc|test|parametre|referans|birim|tarih|hasta|adı|no|sayfa)$/i.test(ad)) return null
  return { raw_name: ad, value: m.groups.deger.replace(/\s/g, ''), unit: m.groups.birim?.trim() || null, ref_low: m.groups.low?.replace(/\s/g, '') || null, ref_high: m.groups.high?.replace(/\s/g, '') || null, flag_printed: m.groups.flag || null, page, kaynak: 'yapi' }
}

export function csvXlsxCoz(bytes: Buffer, fileType: string): CikarimSonucu {
  // CSV: decode as UTF-8 (Turkish names) and keep cells as printed text; SheetJS number parsing would read "8,2" as 82.
  const wb = /csv/.test(fileType) ? XLSX.read(bytes.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string', raw: true }) : XLSX.read(bytes, { type: 'buffer', raw: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: '' })
  const satirlar: HamSatir[] = []
  // header detection: columns named test/parametre, sonuç/değer, birim, referans/ref
  const head = (rows[0] || []).map((c) => String(c).toLocaleLowerCase('tr-TR'))
  const col = (re: RegExp) => head.findIndex((h) => re.test(h))
  const iAd = col(/test|parametre|tetkik|ad/), iDeg = col(/sonu[çc]|de[ğg]er|value|result/), iBir = col(/birim|unit/), iRef = col(/referans|ref|aral/), iLow = col(/alt|low|min/), iHigh = col(/[üu]st|high|max/), iFlag = col(/flag|bayrak|durum/)
  const start = iAd >= 0 && iDeg >= 0 ? 1 : 0
  for (const r of rows.slice(start)) {
    const cells = r.map((c) => String(c ?? '').trim())
    if (!cells.some(Boolean)) continue
    if (iAd >= 0 && iDeg >= 0) {
      let low: string | null = iLow >= 0 ? cells[iLow] || null : null, high: string | null = iHigh >= 0 ? cells[iHigh] || null : null
      if (iRef >= 0 && !low && !high) { const rm = (cells[iRef] || '').match(new RegExp(`(${SAYI})\\s*[-–]\\s*(${SAYI})`)); if (rm) { low = rm[1]; high = rm[2] } }
      if (cells[iAd] && cells[iDeg]) satirlar.push({ raw_name: cells[iAd], value: cells[iDeg], unit: iBir >= 0 ? cells[iBir] || null : null, ref_low: low, ref_high: high, flag_printed: iFlag >= 0 ? cells[iFlag] || null : null, page: 1, kaynak: 'yapi' })
    } else {
      const s = satirCoz(cells.filter(Boolean).join('  '), 1); if (s) satirlar.push(s)
    }
  }
  return { satirlar, kaynak: 'yapi', lab_adi: null, numune_tarihi: null, rapor_tarihi: null, kimlik: null, sayfa: 1, not: fileType.includes('csv') ? 'CSV' : 'XLSX' }
}

/** Digital PDF text pass. Returns [] rows for scanned PDFs (no text layer) — vision handles those. */
export async function pdfMetinCoz(bytes: Buffer): Promise<CikarimSonucu & { metin: string }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Next bundles pdfjs into a server vendor chunk; its fake worker then imports ./pdf.worker.mjs next to that chunk and fails,
  // silently dropping this pass (only vision ran). Load the worker in-process so the bundler includes it.
  const g = globalThis as { pdfjsWorker?: unknown }
  if (!g.pdfjsWorker) g.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, disableFontFace: true }).promise
  const satirlar: HamSatir[] = []
  let metin = ''
  for (let p = 1; p <= Math.min(doc.numPages, 12); p++) {
    const page = await doc.getPage(p)
    const tc = await page.getTextContent()
    // group items into lines by y coordinate
    const items = (tc.items as { str: string; transform: number[] }[]).filter((i) => i.str && i.str.trim())
    const lines = new Map<number, { x: number; s: string }[]>()
    for (const it of items) { const y = Math.round(it.transform[5] / 2) * 2; const arr = lines.get(y) || []; arr.push({ x: it.transform[4], s: it.str }); lines.set(y, arr) }
    const ordered = [...lines.entries()].sort((a, b) => b[0] - a[0]).map(([, arr]) => arr.sort((a, b) => a.x - b.x).map((a) => a.s).join('  '))
    for (const line of ordered) { metin += line + '\n'; const s = satirCoz(line, p); if (s) satirlar.push(s) }
  }
  const tarih = metin.match(/(?:numune|örnek|alınma|kabul)[^\n]{0,30}?(\d{1,2}[./]\d{1,2}[./]\d{4})/i)?.[1] || null
  const rapor = metin.match(/(?:rapor|onay)[^\n]{0,30}?(\d{1,2}[./]\d{1,2}[./]\d{4})/i)?.[1] || null
  return { satirlar, kaynak: 'yapi', lab_adi: null, numune_tarihi: trTarihIso(tarih), rapor_tarihi: trTarihIso(rapor), kimlik: null, sayfa: doc.numPages, not: metin.trim() ? 'dijital PDF' : 'metin katmanı yok', metin }
}

export function trTarihIso(s: string | null): string | null {
  if (!s) return null
  const m = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/); if (!m) return null
  const d = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return isNaN(new Date(d).getTime()) ? null : d
}

const CIKARIM_SISTEM = `Sen bir laboratuvar raporu çıkarım motorusun. Görevin SADECE sayfada basılı olanı aynen JSON'a aktarmak.
KURALLAR: Hiçbir değer, birim veya referans aralığı UYDURMA; sayfada yoksa null yaz. Sayfadaki referans aralığını aynen al; yaş/cinsiyete göre yeni aralık ÜRETME. Virgüllü ondalıkları olduğu gibi yaz ("12,5"). Metin sonuçları (Negatif, Pozitif, +, ++) value alanına metin olarak yaz. Her satır için sayfa numarasını yaz. Yalnızca JSON döndür.
ŞEMA: {"lab_adi": string|null, "numune_tarihi": "YYYY-MM-DD"|null, "rapor_tarihi": "YYYY-MM-DD"|null, "kimlik": {"ad": string|null, "dogum": "YYYY-MM-DD"|null, "tc_son4": string|null}, "satirlar": [{"raw_name": string, "value": string, "unit": string|null, "ref_low": string|null, "ref_high": string|null, "flag_printed": string|null, "page": number}], "not": string|null}
Mikrobiyoloji/kültür: organizma ve duyarlılıkları "not" alanına düz metin olarak yaz, satır uydurma.`

export async function gorselCikar(anthropic: Anthropic, girdi: { tip: 'pdf'; base64: string } | { tip: 'image'; mime: string; base64: string }, model = 'claude-sonnet-4-6'): Promise<CikarimSonucu> {
  const icerik: unknown[] = []
  if (girdi.tip === 'pdf') icerik.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: girdi.base64 } })
  else icerik.push({ type: 'image', source: { type: 'base64', media_type: girdi.mime, data: girdi.base64 } })
  icerik.push({ type: 'text', text: 'Bu laboratuvar raporundaki TÜM satırları şemaya göre çıkar. Yalnızca JSON.' })
  const y = await anthropic.messages.create({ model, max_tokens: 6000, temperature: 0, system: CIKARIM_SISTEM, messages: [{ role: 'user', content: icerik as Anthropic.Messages.MessageParam['content'] }] })
  const ham = y.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text).join('\n').replace(/```json|```/g, '')
  const j = JSON.parse(ham.slice(ham.indexOf('{'), ham.lastIndexOf('}') + 1)) as Partial<CikarimSonucu> & { satirlar?: Partial<HamSatir>[] }
  const satirlar: HamSatir[] = (j.satirlar || []).filter((s) => s && typeof s.raw_name === 'string' && s.value != null).map((s) => ({ raw_name: String(s.raw_name), value: String(s.value), unit: s.unit ? String(s.unit) : null, ref_low: s.ref_low != null ? String(s.ref_low) : null, ref_high: s.ref_high != null ? String(s.ref_high) : null, flag_printed: s.flag_printed ? String(s.flag_printed) : null, page: typeof s.page === 'number' ? s.page : null, kaynak: 'gorsel' }))
  return { satirlar, kaynak: 'gorsel', lab_adi: j.lab_adi ? String(j.lab_adi) : null, numune_tarihi: trTarihIso(j.numune_tarihi ? String(j.numune_tarihi).split('-').reverse().join('.') : null) || (j.numune_tarihi ? String(j.numune_tarihi) : null), rapor_tarihi: j.rapor_tarihi ? String(j.rapor_tarihi) : null, kimlik: j.kimlik ? { ad: j.kimlik.ad || null, dogum: j.kimlik.dogum || null, tc_son4: j.kimlik.tc_son4 || null } : null, sayfa: 1, not: j.not ? String(j.not) : null }
}
