/**
 * NOTYA-ULKE-ARACLAR-01 — THE PACK CHECK FOR TOOLS. Called by the pack check (lib/ulke/paketDenetimi.ts) where the
 * feature `araclar` is on; answers with a list, like every other rule there, and a country's build fails on any
 * line of it. Pure.
 *
 *   - a tool the pack lists must be a tool of the KIT (lib/ulke/araclar/katalog.ts): a key of another country's
 *     state or payer system is not in the kit, so it cannot be switched on by any pack;
 *   - every tool is classified: `roller` is null (base) or names roles of the pack, never an empty list;
 *   - every word the kit's definition needs is there in every language form: title, description, each field, each
 *     option, each number, band, warning and date, and the line that says what the tool is not;
 *   - a text for a key the kit does not have is refused too (it would never be shown: the two halves have drifted);
 *   - every unit a switched-on tool shows has a name, and every laboratory quantity it reads has a unit the kit
 *     can convert;
 *   - a slot is empty and off, says what is missing and who supplies it, and is not switched on at the same time.
 */
import type { BicimliMetin, UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import type { DilKodu, UlkePaketi } from '../tipler'
import { LAB_BIRIMLERI } from './birimler'
import { kitAraci } from './katalog'
import type { AracTanimi, PaketAraci } from './tipler'

export type AracSorunu = { yer: string; sorun: string }

const TESLIM = 'to be supplied'
const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/** Sentences of the tools area's catalogue that carry a value: path → the placeholders they must hold. */
export const ARACLAR_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['izgara.rol', ['%']], ['arac.madde', ['%']], ['arac.aralik', ['%1', '%2']], ['arac.oran', ['%1', '%2']], ['arac.kaynak', ['%']],
  ['kayit.hastaIcin', ['%']], ['kayit.takipGunu', ['%']], ['kayit.takipKapandi', ['%']],
]

/** The unit codes a tool shows: its fields' own, its results', and the pack's for length, weight and laboratory values. */
export function araciBirimleri(t: AracTanimi, paket: UlkePaketi, lab: Readonly<Record<string, string | undefined>>): string[] {
  const b = new Set<string>()
  const u = paket.uygulama?.birimler
  for (const a of t.alanlar) {
    if (a.birim) b.add(a.birim)
    if (a.olcu === 'boy' && u && !eksikAyarMi(u) && typeof u.boy === 'string') b.add(u.boy)
    if (a.olcu === 'agirlik' && u && !eksikAyarMi(u) && typeof u.agirlik === 'string') b.add(u.agirlik)
    if (a.lab && dolu(lab[a.lab])) b.add(lab[a.lab] as string)
  }
  for (const k of t.sonucBirimleri ?? []) b.add(k)
  // a result written in the pack's unit of length or weight needs that unit's name
  for (const olcu of t.sonucOlculeri ?? []) if (u && !eksikAyarMi(u) && typeof u[olcu] === 'string') b.add(u[olcu])
  return [...b]
}

export function araclarSorunlari(paket: UlkePaketi, arayuz: UlkeArayuzu | null, diller: readonly DilKodu[]): AracSorunu[] {
  const s: AracSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  if (!paket.ozellikler.araclar) return s
  if (!paket.ozellikler.cekirdekMuayene) ekle('ozellikler.araclar', 'the tools area needs the signed-in application (cekirdekMuayene)')
  if (paket.rotalar !== 'hepsi' && !paket.rotalar.sayfalar.includes('/tools')) ekle('rotalar.sayfalar', 'the tools area is on and "/tools" is not listed')
  const a = arayuz?.araclar
  if (!a) { ekle('arayuz.araclar', 'the tools area is on and the pack brings no content for it (araclar)'); return s }
  if (eksikAyarMi(a)) { ekle('arayuz.araclar', `${TESLIM}: ${a.__eksikAyar}`); return s }

  // who wrote the texts, and who read them
  if (eksikAyarMi(a.inceleme)) ekle('arayuz.araclar.inceleme', `${TESLIM}: ${(a.inceleme as unknown as { __eksikAyar: string }).__eksikAyar}`)
  else if (!a.inceleme || typeof a.inceleme.makineYazimi !== 'boolean' || !(a.inceleme.klinisyen === null || dolu(a.inceleme.klinisyen))) ekle('arayuz.araclar.inceleme', 'must say who wrote the tool texts ({ makineYazimi: true | false, klinisyen: null | "name" })')

  const metinVar = (yer: string, m: BicimliMetin | undefined) => {
    for (const d of diller) {
      const v = m && Object.prototype.hasOwnProperty.call(m, d) ? m[d] : undefined
      if (!dolu(v)) ekle(`${yer}.${d}`, 'no text in this language form')
      else if (eksikMetinMi(v)) ekle(`${yer}.${d}`, TESLIM)
    }
  }

  const araclar: readonly PaketAraci[] = Array.isArray(a.araclar) ? a.araclar : []
  if (eksikAyarMi(a.araclar)) ekle('arayuz.araclar.araclar', `${TESLIM}: ${(a.araclar as unknown as { __eksikAyar: string }).__eksikAyar}`)
  const roller = Array.isArray(paket.uygulama?.roller) ? paket.uygulama!.roller! : []
  const gorulen = new Set<string>()
  const lab = (a.labBirimleri && !eksikAyarMi(a.labBirimleri) ? a.labBirimleri : {}) as Readonly<Record<string, string | undefined>>
  const birimler = (a.birimler && !eksikAyarMi(a.birimler) ? a.birimler : {}) as Readonly<Record<string, BicimliMetin>>
  if (eksikAyarMi(a.birimler)) ekle('arayuz.araclar.birimler', `${TESLIM}: ${(a.birimler as unknown as { __eksikAyar: string }).__eksikAyar}`)
  if (eksikAyarMi(a.labBirimleri)) ekle('arayuz.araclar.labBirimleri', `${TESLIM}: ${(a.labBirimleri as unknown as { __eksikAyar: string }).__eksikAyar}`)
  const gerekenBirimler = new Set<string>()

  for (const p of araclar) {
    const yer = `arayuz.araclar.${p?.anahtar ?? '?'}`
    if (!p || !dolu(p.anahtar)) { ekle('arayuz.araclar.araclar', 'an entry without a key'); continue }
    if (gorulen.has(p.anahtar)) ekle(yer, 'the tool is listed twice')
    gorulen.add(p.anahtar)
    const t = kitAraci(p.anahtar)
    if (!t) { ekle(yer, 'is not a tool of the kit (lib/ulke/araclar/katalog.ts): a pack cannot switch on a tool the kit does not have'); continue }
    // CLASSIFIED: base, or these roles — said for every tool, never left open.
    if (eksikAyarMi(p.roller)) ekle(`${yer}.roller`, `${TESLIM}: ${p.roller.__eksikAyar}`)
    else if (p.roller !== null) {
      if (!Array.isArray(p.roller) || !p.roller.length) ekle(`${yer}.roller`, 'must be null (a base tool: every role sees it) or name at least one role')
      else {
        for (const r of p.roller) if (!roller.includes(r)) ekle(`${yer}.roller`, `"${r}" is not a role of the pack`)
        if (new Set(p.roller).size !== p.roller.length) ekle(`${yer}.roller`, 'a role is named twice')
      }
    }
    const m = p.metin
    if (!m || eksikAyarMi(m)) { ekle(`${yer}.metin`, m ? `${TESLIM}: ${(m as unknown as { __eksikAyar: string }).__eksikAyar}` : 'the tool has no text'); continue }
    metinVar(`${yer}.ad`, m.ad); metinVar(`${yer}.aciklama`, m.aciklama); metinVar(`${yer}.not`, m.not)
    for (const al of t.alanlar) {
      // An item of a published questionnaire may stay unworded: the screen shows its number.
      if (!(al.numarali && !m.alanlar?.[al.anahtar])) metinVar(`${yer}.alanlar.${al.anahtar}`, m.alanlar?.[al.anahtar])
      for (const o of al.secenekler ?? []) metinVar(`${yer}.secenekler.${al.anahtar}.${o}`, m.secenekler?.[al.anahtar]?.[o])
    }
    for (const [grup, anahtarlar] of [['sayilar', t.cikti.sayilar], ['bantlar', t.cikti.bantlar], ['uyarilar', t.cikti.uyarilar], ['tarihler', t.cikti.tarihler]] as const) {
      for (const k of anahtarlar) metinVar(`${yer}.${grup}.${k}`, m[grup]?.[k])
      for (const k of Object.keys(m[grup] ?? {})) if (!anahtarlar.includes(k)) ekle(`${yer}.${grup}.${k}`, 'a text for a key this tool does not have')
    }
    for (const k of Object.keys(m.alanlar ?? {})) if (!t.alanlar.some((al) => al.anahtar === k)) ekle(`${yer}.alanlar.${k}`, 'a text for a field this tool does not have')
    for (const [k, secenekler] of Object.entries(m.secenekler ?? {})) {
      const al = t.alanlar.find((x) => x.anahtar === k)
      if (!al?.secenekler) { ekle(`${yer}.secenekler.${k}`, 'option names for a field that has no options'); continue }
      for (const o of Object.keys(secenekler)) if (!al.secenekler.includes(o)) ekle(`${yer}.secenekler.${k}.${o}`, 'a name for an option this field does not have')
    }
    // NUMBERS THE COUNTRY DECIDES: every one stated, a number, and none the tool does not have
    for (const k of t.parametreler ?? []) { const v = p.parametreler?.[k]; if (eksikAyarMi(v)) ekle(`${yer}.parametreler.${k}`, `${TESLIM}: ${v.__eksikAyar}`); else if (typeof v !== 'number' || !Number.isFinite(v)) ekle(`${yer}.parametreler.${k}`, 'the tool leaves this number to the country and the pack does not state it') }
    for (const k of Object.keys(p.parametreler ?? {})) if (!(t.parametreler ?? []).includes(k)) ekle(`${yer}.parametreler.${k}`, 'a number for a key this tool does not have')
    // units and laboratory quantities this tool reads
    for (const al of t.alanlar) if (al.lab) {
      const b = lab[al.lab]
      if (!dolu(b)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, `the tool "${p.anahtar}" reads this laboratory value and the pack does not say which unit the country reports it in`)
      else if (!(b in LAB_BIRIMLERI[al.lab].birimler)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, `"${b}" is not a unit the kit can convert (${Object.keys(LAB_BIRIMLERI[al.lab].birimler).join(', ')})`)
    }
    for (const b of araciBirimleri(t, paket, lab)) gerekenBirimler.add(b)
  }
  for (const b of gerekenBirimler) metinVar(`arayuz.araclar.birimler.${b}`, birimler[b])

  // slots: empty, off, explained — and not switched on at the same time
  const yuvalar = Array.isArray(a.yuvalar) ? a.yuvalar : []
  if (!Array.isArray(a.yuvalar)) ekle('arayuz.araclar.yuvalar', 'must be a list (empty where nothing is missing)')
  const yuvaGorulen = new Set<string>()
  for (const y of yuvalar) {
    const yer = `arayuz.araclar.yuvalar.${y?.anahtar ?? '?'}`
    if (!y || !dolu(y.anahtar)) { ekle('arayuz.araclar.yuvalar', 'a slot without a key'); continue }
    if (yuvaGorulen.has(y.anahtar)) ekle(yer, 'the slot is listed twice')
    yuvaGorulen.add(y.anahtar)
    if (y.acik !== false || y.icerik !== null) ekle(yer, 'a slot is empty and switched off (acik: false, icerik: null) until its content is supplied; then it leaves this list')
    if (!dolu(y.eksik) || !dolu(y.kimden)) ekle(yer, 'a slot says what is missing and who must supply it')
    if (gorulen.has(y.anahtar)) ekle(yer, 'is a slot and a switched-on tool at once')
    if (y.mekanizmaHazir === true && !kitAraci(y.anahtar)) ekle(yer, 'says the kit holds its mechanism, and the kit has no tool of this key')
    if (y.roller !== null) for (const r of Array.isArray(y.roller) ? y.roller : []) if (!roller.includes(r)) ekle(`${yer}.roller`, `"${r}" is not a role of the pack`)
  }
  return s
}
