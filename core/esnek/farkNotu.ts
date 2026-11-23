/**
 * ESNEK-MUAYENE-B4 — fark notu for a follow-up (pure, deterministic, never inventing).
 *
 * On a kontrol the doctor writes only what changed ("taş ↓, ağrı Ø, sialendoskopi 12.12"). Notya knows the previous muayene
 * and merges the two into a full kontrol note:
 *   - a previous statement the change line names → CHANGED: the doctor's new state, with the previous statement beside it;
 *   - a previous statement the change line does not name → stated as UNCHANGED (anamnesis, findings, diagnosis);
 *   - previous PLAN items are past actions: never restated as today's plan (only named ones are reported as changed);
 *   - a change item that names nothing previous → NEW (a date / procedure goes to the plan, the rest is reported as the
 *     doctor wrote it, labelled "Kontrolde (hekimin notu)").
 * Every sentence keeps its provenance (previous note line / change-line item). The output contains only words from the two
 * sources plus the build's fixed connective words — tested (no new word, number, side or drug can appear).
 */
import { olgulariCikar, kavramBenzerligi, type Genisletici, type Olgu } from './olgu'
import { katla, kelimeler, kok } from './metinAraclari'

export type SoapBolum = 'subjektif' | 'objektif' | 'degerlendirme' | 'plan'
export const FARK_BOLUMLERI: SoapBolum[] = ['subjektif', 'objektif', 'degerlendirme', 'plan']

export type Degisim = 'azaldi' | 'artti' | 'yok' | 'var' | 'ayni' | 'normal' | 'serbest'

export type FarkOgesi = { no: number; metin: string; degisim: Degisim; kavram: string[]; kavramMetni: string; tarihli: boolean }

const OP: { re: RegExp; d: Degisim }[] = [
  { re: /^(↓|azald[ıi]|azalm[ıi]ş|azalmis|gerilemi[sş]|geriledi|küçüldü|kuculdu|kücülmüş|decreased|smaller|less|kamaygan|уменьш\S*)$/i, d: 'azaldi' },
  { re: /^(↑|artt[ıi]|artm[ıi]ş|artmis|büyüdü|buyudu|büyümüş|increased|larger|more|oshgan|увелич\S*)$/i, d: 'artti' },
  { re: /^(ø|∅|yok|yoktur|kayboldu|geçti|gecti|geçmiş|gecmis|\(-\)|-|none|resolved|gone|absent|yo['ʻ’]?q|нет)$/i, d: 'yok' },
  { re: /^(\+|\(\+\)|var|yeni|başladı|basladi|new|present|bor|есть)$/i, d: 'var' },
  { re: /^(=|aynı|ayni|değişmedi|degismedi|stabil|sabit|unchanged|stable|same|o['ʻ’]?zgarmagan|без изменений)$/i, d: 'ayni' },
  { re: /^(n|normal|doğal|dogal|normale döndü|wnl|normal\.)$/i, d: 'normal' },
]
const TARIH = /\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?\b/
const PLAN_SOZ = /^(planland\S*|kontrol|ktr|op|operasyon|ameliyat|randevu|sevk|konsült\S*|biyopsi|bx|endoskopi|sialendoskopi|tetkik|grafi|usg|bt|mr|mrg|reçete|tedavi|ilaç|plan|follow|surgery|referral|scan)$/i

/** The change line → items (comma / semicolon / newline separated). The operator may stand anywhere in the item. */
export function farkOgeleri(fark: string, genislet: Genisletici = (s) => s): FarkOgesi[] {
  const out: FarkOgesi[] = []
  const parcalar = String(fark || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean)
  parcalar.forEach((p, i) => {
    const ws = kelimeler(p)
    let degisim: Degisim = 'serbest'
    const kavramW: string[] = []
    for (const w of ws) {
      const op = OP.find((o) => o.re.test(w))
      if (op && degisim === 'serbest') { degisim = op.d; continue }
      kavramW.push(w)
    }
    const kavramMetni = kavramW.join(' ').trim()
    const g = genislet(kavramMetni)
    const kavram = [...new Set(kelimeler(g).filter((w) => !/^\d/.test(w) && katla(w).length >= 2).map(kok))]
    out.push({ no: i + 1, metin: p, degisim, kavram, kavramMetni: kavramMetni || p, tarihli: TARIH.test(p) })
  })
  return out
}

export type FarkSatiri = { metin: string; durum: 'degisti' | 'degismedi' | 'yeni'; iz: string[] }
export type FarkSonucu = { bolumler: Record<SoapBolum, FarkSatiri[]>; sayim: { degisti: number; degismedi: number; yeni: number }; eslesmeyen: number[] }

export type FarkKelimeleri = {
  degisim: Record<Exclude<Degisim, 'serbest'>, string>
  /** "(önceki: …)" */
  onceki: (metin: string) => string
  degisen: string
  degismeyen: (tarih: string) => string
  yeni: string
  hekiminNotu: string
}

/** Previous facts per section, each with its provenance tag (K1.<section>.<n>). */
function oncekiOlgular(onceki: Partial<Record<SoapBolum, string | null>>, genislet: Genisletici): { bolum: SoapBolum; olgu: Olgu; iz: string }[] {
  const out: { bolum: SoapBolum; olgu: Olgu; iz: string }[] = []
  for (const b of FARK_BOLUMLERI) olgulariCikar(String(onceki[b] || ''), genislet).forEach((o, i) => out.push({ bolum: b, olgu: o, iz: `K1.${b}.${i + 1}` }))
  return out
}

/** Merge. `onceki` = the previous approved note's four sections; `fark` = what the doctor wrote on this kontrol. */
export function farkNotuBirlestir(onceki: Partial<Record<SoapBolum, string | null>>, fark: string, k: FarkKelimeleri, genislet: Genisletici = (s) => s): FarkSonucu {
  const olgular = oncekiOlgular(onceki, genislet)
  const ogeler = farkOgeleri(fark, genislet)
  const eslesen = new Map<number, number>() // item no → previous fact index
  const kullanilan = new Set<number>()
  // best previous fact per item (each previous fact is changed by at most one item)
  const adaylar: { no: number; j: number; s: number }[] = []
  for (const o of ogeler) olgular.forEach((p, j) => { const s = kavramBenzerligi(o.kavram, p.olgu.kavram); if (s >= 0.5 && o.kavram.length) adaylar.push({ no: o.no, j, s }) })
  adaylar.sort((a, b) => b.s - a.s || a.no - b.no || a.j - b.j)
  for (const a of adaylar) { if (eslesen.has(a.no) || kullanilan.has(a.j)) continue; eslesen.set(a.no, a.j); kullanilan.add(a.j) }

  const bolumler: Record<SoapBolum, FarkSatiri[]> = { subjektif: [], objektif: [], degerlendirme: [], plan: [] }
  const sayim = { degisti: 0, degismedi: 0, yeni: 0 }
  // changed
  for (const o of ogeler) {
    const j = eslesen.get(o.no)
    if (j === undefined) continue
    const p = olgular[j]
    const yeniHal = o.degisim === 'serbest' ? o.metin : `${o.kavramMetni}: ${k.degisim[o.degisim]}`
    bolumler[p.bolum].push({ metin: `${yeniHal} ${k.onceki(p.olgu.metin)}`, durum: 'degisti', iz: [`K2.${o.no}`, p.iz] })
    sayim.degisti++
  }
  // unchanged (never the previous plan)
  olgular.forEach((p, j) => {
    if (kullanilan.has(j) || p.bolum === 'plan') return
    bolumler[p.bolum].push({ metin: p.olgu.metin, durum: 'degismedi', iz: [p.iz] })
    sayim.degismedi++
  })
  // new
  const eslesmeyen: number[] = []
  for (const o of ogeler) {
    if (eslesen.has(o.no)) continue
    eslesmeyen.push(o.no)
    const planMi = o.tarihli || kelimeler(o.metin).some((w) => PLAN_SOZ.test(w))
    const metin = o.degisim === 'serbest' ? o.metin : `${o.kavramMetni}: ${k.degisim[o.degisim]}`
    bolumler[planMi ? 'plan' : 'objektif'].push({ metin: planMi ? metin : `${k.hekiminNotu}: ${metin}`, durum: 'yeni', iz: [`K2.${o.no}`] })
    sayim.yeni++
  }
  return { bolumler, sayim, eslesmeyen }
}

/** The four sections as note text: changed first (highlighted heading), then new, then unchanged with the previous date. */
export function farkMetni(s: FarkSonucu, k: FarkKelimeleri, oncekiTarih: string): Record<SoapBolum, string> {
  const out = {} as Record<SoapBolum, string>
  for (const b of FARK_BOLUMLERI) {
    const satir = s.bolumler[b]
    const grup = (d: FarkSatiri['durum']) => satir.filter((x) => x.durum === d).map((x) => `• ${x.metin}`)
    const parca: string[] = []
    const dg = grup('degisti'), yn = grup('yeni'), ay = grup('degismedi')
    if (dg.length) parca.push(`${k.degisen}:`, ...dg)
    if (yn.length) parca.push(`${k.yeni}:`, ...yn)
    if (ay.length) parca.push(`${k.degismeyen(oncekiTarih)}:`, ...ay)
    out[b] = parca.join('\n')
  }
  return out
}

/** Provenance map in the note's format (notes.kaynak_izleri): sentence → tags. */
export function farkIzleri(s: FarkSonucu): Partial<Record<SoapBolum, { cumle: string; etiketler: string[] }[]>> {
  const out: Partial<Record<SoapBolum, { cumle: string; etiketler: string[] }[]>> = {}
  for (const b of FARK_BOLUMLERI) if (s.bolumler[b].length) out[b] = s.bolumler[b].map((x) => ({ cumle: x.metin, etiketler: x.iz }))
  return out
}
