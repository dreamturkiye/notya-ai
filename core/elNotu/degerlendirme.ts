/**
 * ESNEK-READER-2 — scoring of one page reading against clinical-only ground truth (pure). Shared by the evaluation harness
 * (scripts/el-notu-degerlendir.mts) and the admin evaluation route (app/api/kurucu/el-notu-degerlendir), so the production
 * model and the local regression model are measured with the same rules. No identity is involved: the ground truth holds
 * clinical facts only and the reading is of a masked page.
 *
 * A fact is matched when every key group has one alternative in the text (folded; one- or two-letter keys as whole tokens;
 * longer words fuzzy ≥ 0.8). Stages, cumulative:
 *  - kesin       accepted text only (no placeholder, no "(?)" flag, no "[okunamadı]");
 *  - dogrulamada + the readings shown in the Doğrula questions ("Doğru" answers);
 *  - adayda      + the tappable candidates of those questions;
 *  - isaretli    + the "(?)"-flagged words shown beyond the budget (visible, NOT confirmed — reported apart, never counted
 *                  as correct);
 *  - kacan       nowhere.
 * Invented: content words of the accepted text that neither the raw reads, the ground truth nor the lexicon carry
 * (catches words added by normalisation or consensus insertion; a misread that every read shares cannot be caught here).
 */
import { benzerlik, kelimeAnahtari } from './uzlastir'
import type { DogrulaSorusu } from './tipler'

export type DegerlendirmeGercegi = { id: string; metin: string; anahtarlar: string[][]; korumali?: boolean; belirsiz?: boolean }

export function icerir(metin: string, aday: string): boolean {
  const k = kelimeAnahtari(aday)
  if (!k) return false
  // a number ("8,8", "4-5", "2") must be a whole number token of the text ("x5,7x10mm" carries 5,7 and 10)
  if (/\d/.test(aday)) {
    const sayi = aday.replace(/\s+/g, '').replace('.', ',')
    // a range written "2,5-3" carries both ends: the key "2,5" matches it, as does the key "2,5-3"
    return (metin.match(/\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)?/g) || []).some((t) => { const n = t.replace(/\./g, ','); return n === sayi || (!sayi.includes('-') && n.split('-').includes(sayi)) })
  }
  // a one- or two-letter key ("N", "E", "K", "SD") must be a whole token — as a substring it would match almost any text
  if (k.length <= 2) return metin.split(/[^\p{L}\p{N}]+/u).some((w) => kelimeAnahtari(w) === k)
  if (kelimeAnahtari(metin).includes(k)) return true
  return metin.split(/[^\p{L}\p{N},.\-]+/u).some((w) => kelimeAnahtari(w).length >= 3 && k.length >= 4 && benzerlik(w, aday) >= 0.8)
}

const eslesir = (metin: string, g: DegerlendirmeGercegi) => g.anahtarlar.every((grup) => grup.some((a) => icerir(metin, a)))

export type SayfaPuani = {
  gercek: number; kesin: number; dogrulamada: number; adayda: number; isaretli: number; kacan: number
  korumali: { gercek: number; kesin: number; dogrulaIle: number }
  dogrula: number; korumaliSoru: number; uydurma: string[]
  /** per fact: the stage it was found at (ids only, no text) */
  gercekler: { id: string; asama: 'kesin' | 'dogrulamada' | 'adayda' | 'isaretli' | 'kacan'; korumali: boolean }[]
}

export function sayfaPuanla(g: {
  metin: string
  dogrula: Pick<DogrulaSorusu, 'okunan' | 'adaylar' | 'sinif'>[]
  gercekler: DegerlendirmeGercegi[]
  /** every word any raw read gave (before consensus) */
  hamKelimeler: string[]
  /** words that may appear without being on the page: lexicon, connectives, template labels */
  izinli: string[]
  okunamadi?: string
}): SayfaPuani {
  const isaret = g.okunamadi || '[okunamadı]'
  const satirlar = g.metin.split('\n')
  // a drawing finding beyond the budget ends its line with " (?)": the whole finding is unconfirmed
  const kesinMetin = satirlar.filter((l) => !/ \(\?\)$/.test(l)).join('\n').replace(/⟦[^⟧]*⟧/g, ' ').replace(/\S+\(\?\)/g, ' ').split(isaret).join(' ')
  const bekleyen = [...g.metin.matchAll(/⟦[^|⟧]*\|([^⟧]*)⟧/g)].map((m) => m[1]).join(' ') + ' ' + g.dogrula.map((d) => d.okunan).join(' ')
  const adaylar = g.dogrula.flatMap((d) => d.adaylar).join(' ')
  const isaretli = [...g.metin.matchAll(/(\S+)\(\?\)/g)].map((m) => m[1]).join(' ') + ' ' + satirlar.filter((l) => / \(\?\)$/.test(l)).join(' ')
  const p: SayfaPuani = { gercek: g.gercekler.length, kesin: 0, dogrulamada: 0, adayda: 0, isaretli: 0, kacan: 0, korumali: { gercek: 0, kesin: 0, dogrulaIle: 0 }, dogrula: g.dogrula.length, korumaliSoru: g.dogrula.filter((d) => d.sinif === 'korumali').length, uydurma: [], gercekler: [] }
  for (const f of g.gercekler) {
    let asama: SayfaPuani['gercekler'][number]['asama']
    if (eslesir(kesinMetin, f)) asama = 'kesin'
    else if (eslesir(`${kesinMetin} ${bekleyen}`, f)) asama = 'dogrulamada'
    else if (eslesir(`${kesinMetin} ${bekleyen} ${adaylar}`, f)) asama = 'adayda'
    else if (eslesir(`${kesinMetin} ${bekleyen} ${adaylar} ${isaretli}`, f)) asama = 'isaretli'
    else asama = 'kacan'
    p[asama]++
    if (f.korumali) { p.korumali.gercek++; if (asama === 'kesin') p.korumali.kesin++; if (asama === 'kesin' || asama === 'dogrulamada' || asama === 'adayda') p.korumali.dogrulaIle++ }
    p.gercekler.push({ id: f.id, asama, korumali: !!f.korumali })
  }
  const izinli = new Set([...g.gercekler.flatMap((f) => `${f.metin} ${f.anahtarlar.flat().join(' ')}`.split(/[^\p{L}\p{N}]+/u)), ...g.izinli.flatMap((x) => x.split(/[^\p{L}\p{N}]+/u)), ...g.hamKelimeler.flatMap((x) => x.split(/[^\p{L}\p{N}]+/u)), ...isaret.split(/[^\p{L}\p{N}]+/u)].map(kelimeAnahtari).filter(Boolean))
  const liste = [...izinli].filter((z) => z.length >= 4)
  p.uydurma = kesinMetin.split(/[^\p{L}\p{N}]+/u).filter((w) => {
    const k = kelimeAnahtari(w)
    if (!k || k.length < 4 || /^\d/.test(k) || izinli.has(k)) return false
    return !liste.some((z) => benzerlik(z, k) >= 0.75)
  })
  return p
}

export type ToplamPuan = { sayfa: number; gercek: number; kesinYuzde: number; dogrulaIleYuzde: number; isaretliDahilYuzde: number; kacan: number; uydurma: number; dogrulaSayfaBasina: number; enCokDogrula: number; korumali: { gercek: number; kesin: number; dogrulaIle: number } }

export function toplamPuan(s: SayfaPuani[]): ToplamPuan {
  const t = (f: (x: SayfaPuani) => number) => s.reduce((a, x) => a + f(x), 0)
  const gercek = t((x) => x.gercek) || 1
  const yuzde = (n: number) => Math.round((n / gercek) * 1000) / 10
  return {
    sayfa: s.length, gercek: t((x) => x.gercek),
    kesinYuzde: yuzde(t((x) => x.kesin)),
    dogrulaIleYuzde: yuzde(t((x) => x.kesin + x.dogrulamada + x.adayda)),
    isaretliDahilYuzde: yuzde(t((x) => x.kesin + x.dogrulamada + x.adayda + x.isaretli)),
    kacan: t((x) => x.kacan), uydurma: t((x) => x.uydurma.length),
    dogrulaSayfaBasina: s.length ? Math.round((t((x) => x.dogrula) / s.length) * 10) / 10 : 0,
    enCokDogrula: Math.max(0, ...s.map((x) => x.dogrula)),
    korumali: { gercek: t((x) => x.korumali.gercek), kesin: t((x) => x.korumali.kesin), dogrulaIle: t((x) => x.korumali.dogrulaIle) },
  }
}
