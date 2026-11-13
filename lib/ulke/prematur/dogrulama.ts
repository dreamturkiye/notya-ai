/**
 * PREMATUR-ULKE-01 — THE PROTOCOL CHECK. A pack's follow-up table and early-birth thresholds are held to the module's own
 * rule: NOTHING IS INVENTED. A rule that produces a date or a criterion must cite a source that was actually read (a
 * primary text or a reliable summary of it); a rule whose source could not be read must say `yerel` (follow your local
 * protocol) and carry no criterion and no date. Pure: used by every pack's test, and by nothing at run time.
 * Returns a list of problems; empty = the table is acceptable.
 */
import type { ErkenDogumProtokolu } from './erkenDogum'
import { GIRDI_ALANLARI, KAYNAK_DURUMLARI, KURAL_KATEGORILERI, OGE_KIMLIGI, type Kaynak, type Metin, type PrematurProtokol } from './tipler'

const KOD = /^[a-z0-9-]{1,40}$/

const metinVar = (m: Metin | undefined, formlar: readonly string[]) => !!m && formlar.every((f) => typeof m[f] === 'string' && m[f].trim().length > 0)

function kaynakSorunlari(k: Kaynak, yol: string, formlar: readonly string[], o: string[]): void {
  if (!k.kisa.trim() || !k.tam.trim()) o.push(`${yol}: a source needs a short name and a citation`)
  if (!KAYNAK_DURUMLARI.includes(k.durum)) o.push(`${yol}: unknown reading state "${k.durum}"`)
  // A source that was only cited, or only summarised, must say so in words: the screen shows that line to the doctor.
  if (k.durum !== 'birincil-okundu' && !metinVar(k.not, formlar)) o.push(`${yol}: a source that was not read in its own text needs its note (what was read and how), in every form`)
}

/** What is wrong with a country's follow-up table, in plain English. `formlar` = the pack's language forms. */
export function protokolSorunlari(p: PrematurProtokol, formlar: readonly string[]): string[] {
  const o: string[] = []
  if (!metinVar(p.ad, formlar)) o.push('protocol: the country name is missing in a form')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.surum)) o.push('protocol: `surum` must be the day the table was checked (YYYY-MM-DD)')
  if (!metinVar(p.kapsam.kaynak, formlar)) o.push('scope: the source line is missing in a form')
  if (!(p.kapsam.gestasyonHaftaKucuk >= 20 && p.kapsam.gestasyonHaftaKucuk <= 45) || !(p.kapsam.dogumKiloGrEnFazla >= 200 && p.kapsam.dogumKiloGrEnFazla <= 7000)) o.push('scope: the thresholds are out of range')
  const d = p.duzeltme
  if (!(d.baslangicHafta >= 20 && d.baslangicHafta <= 45) || d.buyumeUstAy <= 0 || d.gelisimUstAy <= 0 || !d.kaynak.trim()) o.push('correction rule: needs a start week, both upper ages and its source')
  const kodlar = new Set<string>()
  for (const k of p.kurallar) {
    const y = `rule ${k.kod}`
    if (!KOD.test(k.kod)) o.push(`${y}: the code must be lower-case letters, digits and hyphens (at most 40)`)
    if (kodlar.has(k.kod)) o.push(`${y}: duplicate code`)
    kodlar.add(k.kod)
    if (!KURAL_KATEGORILERI.includes(k.kategori)) o.push(`${y}: unknown category`)
    if (!metinVar(k.baslik, formlar) || !metinVar(k.aciklama, formlar)) o.push(`${y}: title or description missing in a form`)
    k.kaynaklar.forEach((s, i) => kaynakSorunlari(s, `${y} source ${i + 1}`, formlar, o))
    if (k.yerel) {
      if (k.kriter || k.zamanlamalar.length) o.push(`${y}: a "follow your local protocol" rule carries no criterion and no date`)
      continue
    }
    if (!k.kriter) o.push(`${y}: a rule that is not "follow your local protocol" needs a criterion`)
    // THE CORE RULE: a date or a criterion needs a source that was read.
    if (!k.kaynaklar.some((s) => s.durum !== 'dogrulanmadi')) o.push(`${y}: it states a criterion or a date but no source of it was read (mark it \`yerel\` instead)`)
    for (const g of k.kriter?.herhangiBiri ?? []) {
      if (!g.length) o.push(`${y}: an empty condition group`)
      for (const c of g) {
        if (!GIRDI_ALANLARI.includes(c.alan)) o.push(`${y}: unknown input field "${c.alan}"`)
        if (c.op !== 'dogru' && typeof c.deger !== 'number') o.push(`${y}: condition on ${c.alan} needs a number`)
        if (!metinVar(c.etiket, formlar)) o.push(`${y}: condition label missing in a form`)
      }
    }
    const zk = new Set<string>()
    for (const z of k.zamanlamalar) {
      if (!KOD.test(z.kod) || !OGE_KIMLIGI.test(`${k.kod}:${z.kod}`)) o.push(`${y}: timing code "${z.kod}" is not valid`)
      if (zk.has(z.kod)) o.push(`${y}: duplicate timing code "${z.kod}"`)
      zk.add(z.kod)
      if (!metinVar(z.etiket, formlar)) o.push(`${y}: timing "${z.kod}" label missing in a form`)
      if (!z.bas && !z.son) o.push(`${y}: timing "${z.kod}" has no start and no end`)
      for (const c of z.kosul ?? []) { if (!GIRDI_ALANLARI.includes(c.alan) || !metinVar(c.etiket, formlar)) o.push(`${y}: timing "${z.kod}" has an invalid condition`) }
    }
  }
  if (!p.kurallar.length) o.push('protocol: no rule at all')
  return o
}

/** What is wrong with a country's early-birth thresholds. */
export function erkenDogumSorunlari(p: ErkenDogumProtokolu, formlar: readonly string[]): string[] {
  const o: string[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.surum)) o.push('early birth: `surum` must be a day (YYYY-MM-DD)')
  if (!metinVar(p.kapsam, formlar)) o.push('early birth: the scope line is missing in a form')
  p.kaynaklar.forEach((s, i) => kaynakSorunlari(s, `early-birth source ${i + 1}`, formlar, o))
  const ad = new Set(p.kaynaklar.map((s) => s.kisa))
  for (const s of [...p.serviksKaynaklari, ...p.steroidKaynaklari]) if (!ad.has(s)) o.push(`early birth: "${s}" is named but is not in the source list`)
  const v = p.serviks
  if (v) {
    if (!p.serviksKaynaklari.length || !p.serviksKaynaklari.some((s) => p.kaynaklar.find((x) => x.kisa === s)?.durum !== 'dogrulanmadi')) o.push('early birth: cervical thresholds need a source that was read (otherwise leave `serviks` null)')
    if (!(v.pencereBasGun < v.pencereSonGun) || v.kisaMm <= 0 || (v.cokKisaMm != null && v.cokKisaMm >= v.kisaMm)) o.push('early birth: the cervical window or lengths are inconsistent')
    if (v.progesteron && !(v.progesteron.esikMm <= v.progesteron.ustMm)) o.push('early birth: progesterone range is inconsistent')
  }
  const s = p.steroid
  if (s) {
    if (!p.steroidKaynaklari.length || !p.steroidKaynaklari.some((n) => p.kaynaklar.find((x) => x.kisa === n)?.durum !== 'dogrulanmadi')) o.push('early birth: steroid windows need a source that was read (otherwise leave `steroid` null)')
    if (!(s.yasayabilirlik <= s.anaBas && s.anaBas <= s.anaSon) || (s.tekrarGun != null && s.tekrarGun <= 0)) o.push('early birth: steroid windows are inconsistent')
  }
  return o
}
