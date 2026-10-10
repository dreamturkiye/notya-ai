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
 *
 * NOTYA-ULKE-OZEL-01 — what ONE COUNTRY may add (docs/COUNTRY-PACK-HOWTO.md, "Country-only tools and roles"), and what
 * is refused about each:
 *
 *   - WHOSE A KEY IS: a key that carries a country's code ("ca-…") must carry THIS pack's; a tool whose mechanism the
 *     pack brings itself (`kendiAraclari`), a link-out tile and a quantity of the pack's own must carry it, and none
 *     may take a key of the kit. A key the database could not keep is refused;
 *   - EVERY DOCTOR ROLE (`sinif: 'hekimler'`): the tool's roles are exactly the pack's doctor roles, none missing;
 *   - THE COUNTRY'S NUMBERS: a number the tool calls a laboratory value is stated with a unit the kit can convert; a
 *     table has every column in every row; the country's own bands cover every value (the last row is open) and
 *     ascend; its own options and bands only where the kit's definition allows them;
 *   - SEVERAL UNITS for one quantity: each is one the kit converts, and the catalogue holds the sentence that asks
 *     for the unit;
 *   - THE PATIENT GATE: a real limit, and the sentence that says who the tool is for, in every form;
 *   - LICENCE: A TOOL WHOSE LICENCE STATE IS NOT "FREE" OR "PERMISSION GRANTED" CANNOT BE SWITCHED ON. A tool of the
 *     country's own, a link-out tile and a placeholder of the country's own always state their licence; so does every
 *     tool and placeholder of a pack that says `lisansTam`;
 *   - A LINK-OUT TILE: a fixed https address with nothing in it but the address, and the words of its link.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 — what the tools-correction job added:
 *
 *   - A NUMBER OR A TABLE THE COUNTRY MAY STATE (`secimlikParametreler`, `AracTablosu.istege`): nothing is asked where
 *     the pack leaves it out; one that IS stated is held to every check of a required one;
 *   - OPTIONS FROM THE COUNTRY'S TABLE (`tablodan`): each key once; the pack names each as an option (and as a band,
 *     where the band is the option);
 *   - THE FIELDS OF A GROUP (`uyarlama.alanlar`): only a group the definition offers, only fields of that group, each
 *     once, at least as many as the definition asks for;
 *   - HOW A DOSE IS WRITTEN (`dozYazimi`): a pack that switches on a tool which writes an amount of a medicine says
 *     whether a zero is written after the decimal mark. A national rule: there is no default.
 */
import type { BicimliMetin, UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import type { DilKodu, UlkePaketi } from '../tipler'
import { birimdenKanonige, olcuTanimi } from './birimler'
import { kapiBosMu } from './hastaKapisi'
import { kitAraci } from './katalog'
import { hekimRolleri } from './paket'
import { LISANS_ACIK, LISANS_DURUMLARI, type AracLisansi, type AracTanimi, type OlcuTanimi, type PaketAraci } from './tipler'
import { anahtarUlkesi, ARAC_ANAHTARI, ARAC_ANAHTARI_AZAMI } from './ulkeyeOzel'
import { bantSinirlari, birimliSayiMi, etkinTanim } from './uyarlama'
import type { LabOlcusu } from './tipler'

export type AracSorunu = { yer: string; sorun: string }

const TESLIM = 'to be supplied'
const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0
const sahip = (o: unknown, k: string): boolean => typeof o === 'object' && o !== null && Object.prototype.hasOwnProperty.call(o, k)
const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Sentences of the tools area's catalogue that carry a value: path → the placeholders they must hold. */
export const ARACLAR_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['izgara.rol', ['%']], ['arac.madde', ['%']], ['arac.aralik', ['%1', '%2']], ['arac.oran', ['%1', '%2']], ['arac.kaynak', ['%']],
  ['kayit.hastaIcin', ['%']], ['kayit.takipGunu', ['%']], ['kayit.takipKapandi', ['%']],
]

/** The units a pack accepts for one laboratory quantity: its one unit, or its list. */
const kabulEdilenler = (b: unknown): string[] => (dolu(b) ? [b] : Array.isArray(b) ? b.filter(dolu) : [])

/** The unit codes a tool shows: its fields' own, its results', and the pack's for length, weight and laboratory values. */
export function araciBirimleri(t: AracTanimi, paket: UlkePaketi, lab: Readonly<Record<string, string | readonly string[] | undefined>>): string[] {
  const b = new Set<string>()
  const u = paket.uygulama?.birimler
  for (const a of t.alanlar) {
    if (a.birim) b.add(a.birim)
    if (a.olcu === 'boy' && u && !eksikAyarMi(u) && typeof u.boy === 'string') b.add(u.boy)
    if (a.olcu === 'agirlik' && u && !eksikAyarMi(u) && typeof u.agirlik === 'string') b.add(u.agirlik)
    if (a.lab) for (const birim of kabulEdilenler(lab[a.lab])) b.add(birim)
  }
  for (const k of t.sonucBirimleri ?? []) b.add(k)
  // a result whose unit follows the unit a laboratory value was typed in: one code for every unit the pack accepts
  for (const [olcu, ek] of Object.entries(t.sonucLabEkleri ?? {}) as [LabOlcusu, string][]) for (const birim of kabulEdilenler(lab[olcu])) b.add(`${birim}${ek}`)
  // a result written in the pack's unit of length or weight needs that unit's name
  for (const olcu of t.sonucOlculeri ?? []) if (u && !eksikAyarMi(u) && typeof u[olcu] === 'string') b.add(u[olcu])
  return [...b]
}

/** true = a fixed https address and nothing else: no account, no query, no fragment — nothing a value could be put into. */
export function disAdresGecerliMi(ham: unknown): boolean {
  if (typeof ham !== 'string' || !/^https:\/\/[^\s]+$/.test(ham) || ham.length > 300) return false
  try {
    const u = new URL(ham)
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) && !/[%{}<>$]/.test(ham)
  } catch { return false }
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
  const lab = (a.labBirimleri && !eksikAyarMi(a.labBirimleri) ? a.labBirimleri : {}) as Readonly<Record<string, string | readonly string[] | undefined>>
  const birimler = (a.birimler && !eksikAyarMi(a.birimler) ? a.birimler : {}) as Readonly<Record<string, BicimliMetin>>
  if (eksikAyarMi(a.birimler)) ekle('arayuz.araclar.birimler', `${TESLIM}: ${(a.birimler as unknown as { __eksikAyar: string }).__eksikAyar}`)
  if (eksikAyarMi(a.labBirimleri)) ekle('arayuz.araclar.labBirimleri', `${TESLIM}: ${(a.labBirimleri as unknown as { __eksikAyar: string }).__eksikAyar}`)
  const gerekenBirimler = new Set<string>()

  // ── NOTYA-ULKE-OZEL-01: what the pack brings of its own ──
  const kod = paket.kod
  const lisansTam = a.lisansTam === true
  if (a.lisansTam !== undefined && typeof a.lisansTam !== 'boolean') ekle('arayuz.araclar.lisansTam', 'must be true or false')
  /** A key that carries a country's code must carry this pack's, and be a key the database can keep. */
  const anahtarSorunu = (anahtar: string, yer: string) => {
    if (!ARAC_ANAHTARI.test(anahtar) || anahtar.length > ARAC_ANAHTARI_AZAMI) ekle(yer, `a tool key is lower-case letters and digits joined by hyphens, at most ${ARAC_ANAHTARI_AZAMI} characters (the database keeps it in that form)`)
    const sahibi = anahtarUlkesi(anahtar, kod)
    if (sahibi !== null && sahibi !== kod) ekle(yer, `the key carries the code "${sahibi}": a tool of another country does not exist in this country's build`)
  }
  const olculer = (a.olculer && typeof a.olculer === 'object' ? a.olculer : {}) as Readonly<Record<string, OlcuTanimi | undefined>>
  for (const [k, t] of Object.entries(olculer)) {
    const yer = `arayuz.araclar.olculer.${k}`
    if (anahtarUlkesi(k, kod) !== kod) ekle(yer, `a quantity of the pack's own carries the country's code ("${kod}-..."): it can then never be taken for a quantity of the kit`)
    if (olcuTanimi(k) !== null) ekle(yer, 'is a quantity of the kit: a pack cannot redefine it')
    if (!t || !dolu(t.kanonik) || !t.birimler || typeof t.birimler !== 'object') { ekle(yer, 'must state the unit the arithmetic uses (kanonik) and every unit with its conversion (birimler)'); continue }
    const kendi = t.birimler[t.kanonik]
    if (!(kendi === 1 || (typeof kendi === 'object' && kendi !== null && kendi.carpan === 1 && kendi.kaydirma === 0))) ekle(`${yer}.birimler.${t.kanonik}`, 'the unit the arithmetic uses converts to itself: factor 1')
    for (const [birim, d] of Object.entries(t.birimler)) {
      const tamam = typeof d === 'number' ? Number.isFinite(d) && d > 0 : Boolean(d) && sayiMi(d.carpan) && d.carpan > 0 && sayiMi(d.kaydirma)
      if (!dolu(birim) || !tamam) ekle(`${yer}.birimler.${birim}`, 'a conversion is a positive factor, or a positive factor and a shift ({ carpan, kaydirma })')
    }
  }
  const kendiAraclari: readonly AracTanimi[] = Array.isArray(a.kendiAraclari) ? a.kendiAraclari : []
  if (a.kendiAraclari !== undefined && !Array.isArray(a.kendiAraclari)) ekle('arayuz.araclar.kendiAraclari', 'must be a list of the tools only this country has')
  const kendiGorulen = new Set<string>()
  for (const t of kendiAraclari) {
    const yer = `arayuz.araclar.kendiAraclari.${t?.anahtar ?? '?'}`
    if (!t || !dolu(t.anahtar)) { ekle('arayuz.araclar.kendiAraclari', 'a tool without a key'); continue }
    if (kendiGorulen.has(t.anahtar)) ekle(yer, 'the tool is defined twice')
    kendiGorulen.add(t.anahtar)
    anahtarSorunu(t.anahtar, yer)
    if (anahtarUlkesi(t.anahtar, kod) !== kod) ekle(yer, `a tool only this country has carries the country's code ("${kod}-...")`)
    if (kitAraci(t.anahtar)) ekle(yer, 'is a tool of the kit: a pack cannot bring a mechanism of its own under a key of the kit')
    if (t.tur === 'ekran' || t.ekran !== undefined) ekle(yer, 'a screen of the kit is the kit\'s: a pack brings a formula, a scale, a list or dates')
    if (t.tur === 'baglanti') ekle(yer, 'a link-out tile has no mechanism: list it in `araclar` with `baglanti`')
    if (typeof t.hesapla !== 'function' || !Array.isArray(t.alanlar) || !t.cikti) ekle(yer, 'a tool has fields, the keys it can return, and its arithmetic')
    if (!araclar.some((p) => p?.anahtar === t.anahtar) && !(Array.isArray(a.yuvalar) ? a.yuvalar : []).some((y) => y?.anahtar === t.anahtar)) ekle(yer, 'the pack brings this mechanism and neither switches the tool on nor keeps it as a placeholder')
  }
  const kendiAraci = (anahtar: string): AracTanimi | null => kendiAraclari.find((t) => t?.anahtar === anahtar) ?? null
  const hekimler = hekimRolleri(Array.isArray(arayuz?.roller) ? arayuz!.roller : [])

  /** The licence of a tool or a placeholder: its shape, and — for a tool — whether it may be switched on at all. */
  const lisansSorunlari = (l: AracLisansi | undefined, yer: string, zorunlu: boolean, acik: boolean) => {
    if (l === undefined) { if (zorunlu) ekle(`${yer}.lisans`, 'must state its licence ({ durum: serbest | izin-gerekli | ucretli | belirsiz | izin-alindi, ... })'); return }
    if (eksikAyarMi(l)) { ekle(`${yer}.lisans`, `${TESLIM}: ${l.__eksikAyar}`); return }
    if (!l || !(LISANS_DURUMLARI as readonly string[]).includes(l.durum)) { ekle(`${yer}.lisans.durum`, `must be one of ${LISANS_DURUMLARI.join(', ')}`); return }
    if (l.durum !== 'serbest' && !dolu(l.hakSahibi)) ekle(`${yer}.lisans.hakSahibi`, 'must name who holds the rights')
    if (l.durum === 'izin-alindi' && !dolu(l.kaynak)) ekle(`${yer}.lisans.kaynak`, 'a permission that was granted says where it is recorded')
    if (l.bildirim !== undefined) metinVar(`${yer}.lisans.bildirim`, l.bildirim)
    // THE RULE: only "free to implement" and "permission granted" may be on a doctor's screen.
    if (acik && !LISANS_ACIK.includes(l.durum)) ekle(`${yer}.lisans.durum`, `"${l.durum}": a tool whose licence is not "serbest" or "izin-alindi" cannot be switched on: keep it as a placeholder (yuvalar) until the rights holder's terms allow it`)
  }

  for (const p of araclar) {
    const yer = `arayuz.araclar.${p?.anahtar ?? '?'}`
    if (!p || !dolu(p.anahtar)) { ekle('arayuz.araclar.araclar', 'an entry without a key'); continue }
    if (gorulen.has(p.anahtar)) ekle(yer, 'the tool is listed twice')
    gorulen.add(p.anahtar)
    anahtarSorunu(p.anahtar, yer)
    const kit = kitAraci(p.anahtar)
    const kendi = kit ? null : kendiAraci(p.anahtar)
    const baglantiMi = p.baglanti !== undefined
    const ulkeninMi = anahtarUlkesi(p.anahtar, kod) !== null
    let t: AracTanimi | null = kit ?? kendi
    if (baglantiMi) {
      // A LINK-OUT TILE: the pack's own key, a fixed https address, the words of the link. Nothing else.
      if (kit || kendi) ekle(`${yer}.baglanti`, 'a link-out tile has no mechanism: its key is neither a tool of the kit nor one of the pack\'s own mechanisms')
      if (anahtarUlkesi(p.anahtar, kod) !== kod) ekle(`${yer}.baglanti`, `a link-out tile is the country's own: its key carries the country's code ("${kod}-...")`)
      if (!disAdresGecerliMi(p.baglanti?.adres)) ekle(`${yer}.baglanti.adres`, 'must be a fixed https address with no account, no query and no fragment: nothing of a patient is ever put into it')
      t = { anahtar: p.anahtar, tur: 'baglanti', alanlar: [], cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] }, kaynak: null, hesapla: () => ({ tamam: false, sayilar: [], bant: null, uyarilar: [], tarihler: [] }) }
      for (const k of ['parametreler', 'tablolar', 'uyarlama'] as const) if (p[k] !== undefined) ekle(`${yer}.${k}`, 'a link-out tile works nothing out')
    }
    if (!t) {
      ekle(yer, ulkeninMi
        ? 'is not a tool of the kit, and the pack brings no mechanism of its own for it (kendiAraclari)'
        : 'is not a tool of the kit (lib/ulke/araclar/katalog.ts): a pack cannot switch on a tool the kit does not have')
      continue
    }
    // CLASSIFIED: base, or these roles — said for every tool, never left open.
    if (eksikAyarMi(p.roller)) ekle(`${yer}.roller`, `${TESLIM}: ${p.roller.__eksikAyar}`)
    else if (p.roller !== null) {
      if (!Array.isArray(p.roller) || !p.roller.length) ekle(`${yer}.roller`, 'must be null (a base tool: every role sees it) or name at least one role')
      else {
        for (const r of p.roller) if (!roller.includes(r)) ekle(`${yer}.roller`, `"${r}" is not a role of the pack`)
        if (new Set(p.roller).size !== p.roller.length) ekle(`${yer}.roller`, 'a role is named twice')
      }
    }
    // EVERY DOCTOR ROLE: the class is a promise the list keeps — also on the day a doctor role is added to the pack.
    if (p.sinif !== undefined) {
      if (p.sinif !== 'hekimler') ekle(`${yer}.sinif`, 'the only class is "hekimler" (every doctor role); a base tool says roller: null')
      else if (!Array.isArray(p.roller)) ekle(`${yer}.sinif`, 'a tool of every doctor role lists the pack\'s doctor roles (hekimRolleri); roller: null is a base tool, which the allied professions see too')
      else {
        for (const r of hekimler) if (!p.roller.includes(r)) ekle(`${yer}.sinif`, `a tool of every doctor role, and the doctor role "${r}" is not on its list`)
        for (const r of p.roller) if (roller.includes(r) && !hekimler.includes(r)) ekle(`${yer}.sinif`, `a tool of every doctor role, and "${r}" is not a doctor role`)
      }
    }
    // LICENCE: stated where the tool is the country's own or the pack says every licence is stated; never on with a state that is not open.
    lisansSorunlari(p.lisans, yer, lisansTam || ulkeninMi, true)

    const m = p.metin
    if (!m || eksikAyarMi(m)) { ekle(`${yer}.metin`, m ? `${TESLIM}: ${(m as unknown as { __eksikAyar: string }).__eksikAyar}` : 'the tool has no text'); continue }

    // THE COUNTRY'S OWN OPTIONS AND BANDS: only where the definition allows them; then the definition the texts are held to is the reshaped one.
    const u = p.uyarlama
    if (u !== undefined && !baglantiMi) {
      for (const [alan, secenekler] of Object.entries(u.secenekler ?? {})) {
        const al = t.alanlar.find((x) => x.anahtar === alan)
        const y = `${yer}.uyarlama.secenekler.${alan}`
        if (!al || al.tur !== 'secim') { ekle(y, 'options for a field that is not a choice of this tool'); continue }
        if (al.secenekSerbest !== true) ekle(y, 'the tool\'s arithmetic reads the options of this field: a country cannot restate them (the kit marks a field whose choice is only repeated as secenekSerbest)')
        if (!Array.isArray(secenekler) || secenekler.length < 2 || !secenekler.every(dolu)) ekle(y, 'a choice needs at least two options, each a key')
        else if (new Set(secenekler).size !== secenekler.length) ekle(y, 'an option is listed twice')
      }
      const b = u.bantlar
      if (b !== undefined) {
        const y = `${yer}.uyarlama.bantlar`
        if (t.bantSerbest !== true) ekle(y, 'a warning, a date or a number of this tool may follow from its band: a country cannot restate the bands (the kit marks a tool where nothing does as bantSerbest)')
        if (!b || !dolu(b.sayi) || !t.cikti.sayilar.includes(b.sayi)) ekle(`${y}.sayi`, 'must name the number of the result the bands are read from')
        const satirlar = Array.isArray(b?.satirlar) ? b.satirlar : []
        if (!satirlar.length) ekle(`${y}.satirlar`, 'a table of bands has at least one row')
        else {
          // EVERY VALUE FALLS IN A BAND: the last row is open, and only the last.
          if (satirlar[satirlar.length - 1].ust !== null) ekle(`${y}.satirlar`, 'the last row has no upper limit (ust: null): a value above the last limit must never be left without a band')
          satirlar.forEach((satir, i) => {
            if (!dolu(satir?.bant)) ekle(`${y}.satirlar[${i}].bant`, 'a row names its band')
            if (i < satirlar.length - 1 && !sayiMi(satir?.ust)) ekle(`${y}.satirlar[${i}].ust`, 'every row but the last states its upper limit')
            if (i > 0 && sayiMi(satir?.ust) && sayiMi(satirlar[i - 1]?.ust) && satir.ust <= (satirlar[i - 1].ust as number)) ekle(`${y}.satirlar[${i}].ust`, 'the limits ascend')
          })
          if (new Set(satirlar.map((x) => x?.bant)).size !== satirlar.length) ekle(`${y}.satirlar`, 'a band is named twice')
        }
        const olcu = dolu(b?.sayi) ? t.sayiOlculeri?.[b.sayi] : undefined
        if (olcu) {
          const tanim = olcuTanimi(olcu, olculer)
          if (!dolu(b.birim)) ekle(`${y}.birim`, `the number is a laboratory value (${olcu}): the limits are stated with their unit${tanim ? ` (${Object.keys(tanim.birimler).join(', ')})` : ''}`)
          else if (birimdenKanonige(tanim, b.birim, 1) === null) ekle(`${y}.birim`, `"${b.birim}" is not a unit the kit can convert${tanim ? ` (${Object.keys(tanim.birimler).join(', ')})` : ''}`)
        } else if (b?.birim !== undefined) ekle(`${y}.birim`, 'the number is not a laboratory value: the limits are plain numbers')
        if (b && satirlar.length && bantSinirlari(t, b, olculer) === null && !(olcu && !dolu(b.birim))) ekle(`${y}.satirlar`, 'a limit cannot be converted to the unit the tool works in')
      }
    }
    // THE FIELDS OF A GROUP, as the country chose them: only where the definition offers the group.
    if (u?.alanlar !== undefined && !baglantiMi) {
      for (const [grup, liste] of Object.entries(u.alanlar)) {
        const y = `${yer}.uyarlama.alanlar.${grup}`
        const tanim = t.alanGruplari?.[grup]
        if (!tanim) { ekle(y, 'the tool offers no such group of fields: a country chooses its fields only where the kit\'s definition offers a group (alanGruplari)'); continue }
        if (!Array.isArray(liste) || !liste.every(dolu)) { ekle(y, 'must list the keys of the fields this country has'); continue }
        if (new Set(liste).size !== liste.length) ekle(y, 'a field is listed twice')
        for (const k of liste) if (!tanim.secenekler.some((al) => al.anahtar === k)) ekle(y, `"${k}" is not a field of this group (${tanim.secenekler.map((al) => al.anahtar).join(', ')})`)
        if (liste.length < tanim.enAz) ekle(y, `the tool needs at least ${tanim.enAz} field(s) of this group`)
      }
    }
    const e = baglantiMi ? t : etkinTanim(t, p, olculer)

    metinVar(`${yer}.ad`, m.ad); metinVar(`${yer}.aciklama`, m.aciklama); metinVar(`${yer}.not`, m.not)
    for (const al of e.alanlar) {
      // An item of a published questionnaire may stay unworded: the screen shows its number.
      if (!(al.numarali && !m.alanlar?.[al.anahtar])) metinVar(`${yer}.alanlar.${al.anahtar}`, m.alanlar?.[al.anahtar])
      for (const o of al.secenekler ?? []) metinVar(`${yer}.secenekler.${al.anahtar}.${o}`, m.secenekler?.[al.anahtar]?.[o])
    }
    for (const [grup, anahtarlar] of [['sayilar', e.cikti.sayilar], ['bantlar', e.cikti.bantlar], ['uyarilar', e.cikti.uyarilar], ['tarihler', e.cikti.tarihler]] as const) {
      for (const k of anahtarlar) metinVar(`${yer}.${grup}.${k}`, m[grup]?.[k])
      for (const k of Object.keys(m[grup] ?? {})) if (!anahtarlar.includes(k)) ekle(`${yer}.${grup}.${k}`, 'a text for a key this tool does not have')
    }
    for (const k of Object.keys(m.alanlar ?? {})) if (!e.alanlar.some((al) => al.anahtar === k)) ekle(`${yer}.alanlar.${k}`, 'a text for a field this tool does not have')
    for (const [k, secenekler] of Object.entries(m.secenekler ?? {})) {
      const al = e.alanlar.find((x) => x.anahtar === k)
      if (!al?.secenekler) { ekle(`${yer}.secenekler.${k}`, 'option names for a field that has no options'); continue }
      for (const o of Object.keys(secenekler)) if (!al.secenekler.includes(o)) ekle(`${yer}.secenekler.${k}.${o}`, 'a name for an option this field does not have')
    }
    // A LINK-OUT TILE says what its link is called; no other tool has such words.
    if (baglantiMi) metinVar(`${yer}.baglanti`, m.baglanti)
    else if (m.baglanti !== undefined) ekle(`${yer}.metin.baglanti`, 'the words of a link, and the tool is not a link-out tile')
    // THE PATIENT GATE: a real limit, and the sentence that says who the tool is for.
    if (p.hasta !== undefined) {
      const h = p.hasta
      const yas = (x: unknown) => x === undefined || (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 130)
      if (!h || typeof h !== 'object' || kapiBosMu(h)) ekle(`${yer}.hasta`, 'a patient gate states an age limit, a sex, or both')
      else {
        if (!yas(h.enAzYas) || !yas(h.enCokYas)) ekle(`${yer}.hasta`, 'an age limit is a whole number of years from 0 to 130')
        else if (typeof h.enAzYas === 'number' && typeof h.enCokYas === 'number' && h.enAzYas > h.enCokYas) ekle(`${yer}.hasta`, 'the youngest age is above the oldest')
        if (h.cinsiyet !== undefined && h.cinsiyet !== 'female' && h.cinsiyet !== 'male') ekle(`${yer}.hasta.cinsiyet`, 'must be female or male')
      }
      if (e.tur === 'ekran') ekle(`${yer}.hasta`, 'a screen of the kit is not a tool for one patient: it cannot be held back by age or sex')
      metinVar(`${yer}.hastaKapisi`, m.hastaKapisi)
    } else if (m.hastaKapisi !== undefined) ekle(`${yer}.metin.hastaKapisi`, 'a sentence about who the tool is for, and the tool has no patient gate (hasta)')

    // NUMBERS THE COUNTRY DECIDES: every one stated, a number, and none the tool does not have
    for (const k of t.parametreler ?? []) {
      const v = p.parametreler?.[k]
      const olcu = t.parametreOlculeri?.[k]
      if (eksikAyarMi(v)) ekle(`${yer}.parametreler.${k}`, `${TESLIM}: ${v.__eksikAyar}`)
      else if (olcu) {
        // A LABORATORY VALUE: with its unit, converted by the kit before anything is compared.
        const tanim = olcuTanimi(olcu, olculer)
        const birimleri = tanim ? Object.keys(tanim.birimler).join(', ') : ''
        if (v === undefined) ekle(`${yer}.parametreler.${k}`, 'the tool leaves this number to the country and the pack does not state it')
        else if (!birimliSayiMi(v)) ekle(`${yer}.parametreler.${k}`, `this number is a laboratory value (${olcu}): state it with its unit, { deger, birim }${birimleri ? `, in one of ${birimleri}` : ''}`)
        else if (birimdenKanonige(tanim, v.birim, v.deger) === null) ekle(`${yer}.parametreler.${k}`, `"${v.birim}" is not a unit the kit can convert${birimleri ? ` (${birimleri})` : ''}`)
      } else if (birimliSayiMi(v)) ekle(`${yer}.parametreler.${k}`, 'this number is not a laboratory value: state it as a plain number')
      else if (typeof v !== 'number' || !Number.isFinite(v)) ekle(`${yer}.parametreler.${k}`, 'the tool leaves this number to the country and the pack does not state it')
    }
    // NUMBERS THE COUNTRY MAY STATE: nothing is asked where one is left out; one that is stated is a number (a laboratory value with its unit)
    for (const k of t.secimlikParametreler ?? []) {
      const v = p.parametreler?.[k]
      if (v === undefined) continue
      const olcu = t.parametreOlculeri?.[k]
      if (eksikAyarMi(v)) ekle(`${yer}.parametreler.${k}`, `${TESLIM}: ${v.__eksikAyar}`)
      else if (olcu) {
        const tanim = olcuTanimi(olcu, olculer)
        const birimleri = tanim ? Object.keys(tanim.birimler).join(', ') : ''
        if (!birimliSayiMi(v)) ekle(`${yer}.parametreler.${k}`, `this number is a laboratory value (${olcu}): state it with its unit, { deger, birim }${birimleri ? `, in one of ${birimleri}` : ''}`)
        else if (birimdenKanonige(tanim, v.birim, v.deger) === null) ekle(`${yer}.parametreler.${k}`, `"${v.birim}" is not a unit the kit can convert${birimleri ? ` (${birimleri})` : ''}`)
      } else if (birimliSayiMi(v)) ekle(`${yer}.parametreler.${k}`, 'this number is not a laboratory value: state it as a plain number')
      else if (typeof v !== 'number' || !Number.isFinite(v)) ekle(`${yer}.parametreler.${k}`, 'a number the country may state must be a number where it is stated; leave the key out to state none')
    }
    for (const k of Object.keys(p.parametreler ?? {})) if (!(t.parametreler ?? []).includes(k) && !(t.secimlikParametreler ?? []).includes(k)) ekle(`${yer}.parametreler.${k}`, 'a number for a key this tool does not have')
    // TABLES THE COUNTRY SUPPLIES: every column in every row; a laboratory column with its unit
    for (const tablo of t.tablolar ?? []) {
      const y = `${yer}.tablolar.${tablo.anahtar}`
      const veri = p.tablolar?.[tablo.anahtar]
      // A TABLE THE COUNTRY MAY SUPPLY: nothing is asked where it is left out.
      if (tablo.istege === true && veri === undefined) continue
      if (eksikAyarMi(veri)) { ekle(y, `${TESLIM}: ${veri.__eksikAyar}`); continue }
      const satirlar = Array.isArray(veri?.satirlar) ? veri!.satirlar : null
      if (!satirlar || !satirlar.length) { ekle(y, 'the tool leaves this table to the country and the pack does not supply it'); continue }
      for (const sutun of tablo.sutunlar) {
        if (sutun.lab) {
          const tanim = olcuTanimi(sutun.lab, olculer), birim = veri?.birimler?.[sutun.anahtar]
          if (!dolu(birim)) ekle(`${y}.birimler.${sutun.anahtar}`, `the column is a laboratory value (${sutun.lab}): the table states its unit`)
          else if (birimdenKanonige(tanim, birim, 1) === null) ekle(`${y}.birimler.${sutun.anahtar}`, `"${birim}" is not a unit the kit can convert${tanim ? ` (${Object.keys(tanim.birimler).join(', ')})` : ''}`)
        }
        satirlar.forEach((satir, i) => {
          const v = satir?.[sutun.anahtar]
          if (sutun.tur === 'sayi' ? !sayiMi(v) : !dolu(v)) ekle(`${y}.satirlar[${i}].${sutun.anahtar}`, sutun.tur === 'sayi' ? 'the column is a number' : 'the column is a key')
        })
      }
      for (const k of Object.keys(veri?.birimler ?? {})) if (!tablo.sutunlar.some((x) => x.anahtar === k && x.lab)) ekle(`${y}.birimler.${k}`, 'a unit for a column that is not a laboratory value of this table')
      satirlar.forEach((satir, i) => { for (const k of Object.keys(satir ?? {})) if (!tablo.sutunlar.some((x) => x.anahtar === k)) ekle(`${y}.satirlar[${i}].${k}`, 'a column this table does not have') })
      // WHERE A FIELD'S OPTIONS ARE THIS TABLE'S KEYS, each key names one row: an option listed twice would be two rules for one choice.
      for (const al of t.alanlar) if (al.tablodan?.tablo === tablo.anahtar) {
        const anahtarlar = satirlar.map((satir) => satir?.[al.tablodan!.sutun]).filter(dolu)
        if (new Set(anahtarlar).size !== anahtarlar.length) ekle(`${y}.satirlar`, `the column "${al.tablodan.sutun}" names the options of the field "${al.anahtar}": a key is listed twice`)
        if (anahtarlar.length < 2) ekle(`${y}.satirlar`, `the column "${al.tablodan.sutun}" names the options of the field "${al.anahtar}": a choice needs at least two`)
      }
    }
    for (const k of Object.keys(p.tablolar ?? {})) if (!(t.tablolar ?? []).some((x) => x.anahtar === k)) ekle(`${yer}.tablolar.${k}`, 'a table this tool does not have')
    // units and laboratory quantities this tool reads
    for (const al of t.alanlar) if (al.lab) {
      const b = lab[al.lab]
      const tanim = olcuTanimi(al.lab, olculer)
      if (!tanim) { ekle(`${yer}.alanlar.${al.anahtar}`, `reads the quantity "${al.lab}", which neither the kit nor the pack (olculer) defines`); continue }
      if (Array.isArray(b)) {
        // SEVERAL UNITS: each one the kit converts; the doctor chooses, so nothing here is a default.
        if (!b.length || !b.every(dolu)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, 'a list of accepted units names at least one unit')
        else if (new Set(b).size !== b.length) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, 'a unit is listed twice')
        for (const birim of b.filter(dolu)) if (!sahip(tanim.birimler, birim)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, `"${birim}" is not a unit the kit can convert (${Object.keys(tanim.birimler).join(', ')})`)
      } else if (!dolu(b)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, `the tool "${p.anahtar}" reads this laboratory value and the pack does not say which unit the country reports it in`)
      else if (!sahip(tanim.birimler, b)) ekle(`arayuz.araclar.labBirimleri.${al.lab}`, `"${b}" is not a unit the kit can convert (${Object.keys(tanim.birimler).join(', ')})`)
    }
    for (const b of araciBirimleri(t, paket, lab)) gerekenBirimler.add(b)
  }
  for (const b of gerekenBirimler) metinVar(`arayuz.araclar.birimler.${b}`, birimler[b])
  // HOW A DOSE IS WRITTEN: a national rule. A pack with a tool that writes an amount of a medicine states it; the kit has no default.
  if (a.dozYazimi !== undefined && (eksikAyarMi(a.dozYazimi) || !a.dozYazimi || typeof a.dozYazimi.sondaSifir !== 'boolean')) ekle('arayuz.araclar.dozYazimi', eksikAyarMi(a.dozYazimi) ? `${TESLIM}: ${a.dozYazimi.__eksikAyar}` : 'must say whether a zero is written after the decimal mark of a dose ({ sondaSifir: true | false })')
  const dozYazan = araclar.find((p) => { const t = p && (kitAraci(p.anahtar) ?? kendiAraci(p.anahtar)); return Boolean(t?.dozYazar) })
  if (dozYazan && a.dozYazimi === undefined) ekle('arayuz.araclar.dozYazimi', `the tool "${dozYazan.anahtar}" writes an amount of a medicine and the pack does not say how this country writes a dose ({ sondaSifir: true | false }, with the national source beside it): where a zero after the decimal mark is forbidden, "5.0" can be read as 50`)
  // WHERE A UNIT IS CHOSEN ON THE SCREEN, the catalogue holds the sentence that asks for it — in every form.
  const secilenVar = araclar.some((p) => { const t = p && (kitAraci(p.anahtar) ?? kendiAraci(p.anahtar)); return Boolean(t) && t!.alanlar.some((al) => al.lab && kabulEdilenler(lab[al.lab]).length > 1) })
  if (secilenVar) for (const d of diller) {
    const cumle = a.metinler?.[d]?.arac?.birimSec
    if (!dolu(cumle)) ekle(`arayuz.araclar.metinler[${d}].arac.birimSec`, 'a tool accepts more than one unit for a value: the catalogue needs the sentence that asks the doctor to choose the unit')
    else if (eksikMetinMi(cumle)) ekle(`arayuz.araclar.metinler[${d}].arac.birimSec`, TESLIM)
  }

  // slots: empty, off, explained — and not switched on at the same time
  const yuvalar = Array.isArray(a.yuvalar) ? a.yuvalar : []
  if (!Array.isArray(a.yuvalar)) ekle('arayuz.araclar.yuvalar', 'must be a list (empty where nothing is missing)')
  const yuvaGorulen = new Set<string>()
  for (const y of yuvalar) {
    const yer = `arayuz.araclar.yuvalar.${y?.anahtar ?? '?'}`
    if (!y || !dolu(y.anahtar)) { ekle('arayuz.araclar.yuvalar', 'a slot without a key'); continue }
    if (yuvaGorulen.has(y.anahtar)) ekle(yer, 'the slot is listed twice')
    yuvaGorulen.add(y.anahtar)
    anahtarSorunu(y.anahtar, yer)
    if (y.acik !== false || y.icerik !== null) ekle(yer, 'a slot is empty and switched off (acik: false, icerik: null) until its content is supplied; then it leaves this list')
    if (!dolu(y.eksik) || !dolu(y.kimden)) ekle(yer, 'a slot says what is missing and who must supply it')
    if (gorulen.has(y.anahtar)) ekle(yer, 'is a slot and a switched-on tool at once')
    if (y.mekanizmaHazir === true && !kitAraci(y.anahtar) && !kendiAraci(y.anahtar)) ekle(yer, 'says the kit holds its mechanism, and the kit has no tool of this key')
    if (y.roller !== null) for (const r of Array.isArray(y.roller) ? y.roller : []) if (!roller.includes(r)) ekle(`${yer}.roller`, `"${r}" is not a role of the pack`)
    // A placeholder of the country's own says what stands between it and a tool; so does every placeholder of a pack that states every licence.
    lisansSorunlari(y.lisans, yer, lisansTam || anahtarUlkesi(y.anahtar, kod) !== null, false)
  }
  return s
}
