/**
 * NOTYA-ULKE-OZEL-01 — A COUNTRY'S OWN NUMBERS, TABLES, BANDS AND OPTIONS FOR A TOOL. Pure. One place turns what a
 * pack states into what a tool's arithmetic is handed, for the screen and for the server alike.
 *
 *   NUMBERS   `PaketAraci.parametreler` — a plain number, or, where the tool says the number is a laboratory value
 *             (`AracTanimi.parametreOlculeri`), a number WITH ITS UNIT. The kit converts it to the unit its arithmetic
 *             uses, with the same exact factors a typed value is converted with, so the two are always compared in
 *             one unit.
 *   TABLES    `PaketAraci.tablolar` — the rows of every table the tool leaves to the country, laboratory columns in
 *             the unit the pack states for each.
 *   BANDS     `PaketAraci.uyarlama.bantlar` — the country's own bands over ONE number of the result: other limits,
 *             another count of bands. Only where the tool says nothing else follows from its band (`bantSerbest`).
 *   OPTIONS   `PaketAraci.uyarlama.secenekler` — the country's own list for a choice the arithmetic only repeats
 *             (`secenekSerbest`).
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 — what the tools-correction job added, each used only where a tool's definition says so:
 *   MAY-BE-STATED NUMBERS AND TABLES   `secimlikParametreler`, `AracTablosu.istege` — left out where the pack does not
 *             state them: the tool then answers without what depends on them, never with a number of the kit's.
 *   OPTIONS FROM THE COUNTRY'S TABLE   `AracAlani.tablodan` — a choice the kit holds no option for.
 *   THE FIELDS OF A GROUP              `PaketAraci.uyarlama.alanlar` over `AracTanimi.alanGruplari`.
 *   BANDS THAT ARE A FIELD'S OPTIONS   `AracTanimi.bantAlani`.
 *
 * NOTHING MISSING IS EVER READ AS REASSURING. A number or a table the pack did not state, a unit the kit cannot
 * convert, a result that lacks the number the bands are read from: each gives NO result, never a result without the
 * part that could not be worked out. (The pack check refuses such a pack long before; this is the second lock.)
 */
import { birimdenKanonige, olcuTanimi } from './birimler'
import type { AracOrtami, AracSonucu, AracTabloSatiri, AracTanimi, BantTablosu, BirimliSayi, OlcuTanimi, PaketAraci } from './tipler'
import { BOS_SONUC } from './yardimci'

type Olculer = Readonly<Record<string, OlcuTanimi | undefined>> | undefined

const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export const birimliSayiMi = (x: unknown): x is BirimliSayi => Boolean(x) && typeof x === 'object' && sayiMi((x as BirimliSayi).deger) && typeof (x as BirimliSayi).birim === 'string'

/** One number of the country for one key of the tool, in the unit the arithmetic uses. null = not stated, or not convertible. */
export function parametreyiCoz(t: AracTanimi, anahtar: string, deger: unknown, olculer?: Olculer): number | null {
  const olcu = t.parametreOlculeri?.[anahtar]
  // A LABORATORY VALUE is stated with its unit: a bare number says nothing about which unit it was meant in.
  if (olcu) return birimliSayiMi(deger) ? birimdenKanonige(olcuTanimi(olcu, olculer), deger.birim, deger.deger) : null
  return sayiMi(deger) ? deger : null
}

/** Every number the tool leaves to the country, converted. `eksik` = the keys that could not be worked out. */
export function parametreleriCoz(t: AracTanimi, p: Pick<PaketAraci, 'parametreler'>, olculer?: Olculer): { p: Record<string, number>; eksik: string[] } {
  const cikti: Record<string, number> = {}
  const eksik: string[] = []
  for (const k of t.parametreler ?? []) {
    const v = parametreyiCoz(t, k, p.parametreler?.[k], olculer)
    if (v === null) eksik.push(k); else cikti[k] = v
  }
  // A NUMBER THE COUNTRY MAY STATE: left out where it is not stated (the tool then answers without what depends on
  // it); where it IS stated and cannot be worked out, the tool gives no result at all — never half of one.
  for (const k of t.secimlikParametreler ?? []) {
    const ham = p.parametreler?.[k]
    if (ham === undefined) continue
    const v = parametreyiCoz(t, k, ham, olculer)
    if (v === null) eksik.push(k); else cikti[k] = v
  }
  return { p: cikti, eksik }
}

/** Every table the tool leaves to the country, laboratory columns converted. `eksik` = the tables that could not be read. */
export function tablolariCoz(t: AracTanimi, p: Pick<PaketAraci, 'tablolar'>, olculer?: Olculer): { t: Record<string, readonly AracTabloSatiri[]>; eksik: string[] } {
  const cikti: Record<string, readonly AracTabloSatiri[]> = {}
  const eksik: string[] = []
  for (const tablo of t.tablolar ?? []) {
    const veri = p.tablolar?.[tablo.anahtar]
    // A table the country MAY supply and did not: the tool answers without it.
    if (tablo.istege === true && veri === undefined) continue
    const satirlar = Array.isArray(veri?.satirlar) ? veri!.satirlar : null
    if (!satirlar || !satirlar.length) { eksik.push(tablo.anahtar); continue }
    const cevrilen: AracTabloSatiri[] = []
    let tamam = true
    for (const satir of satirlar) {
      const yeni: Record<string, number | string> = {}
      for (const s of tablo.sutunlar) {
        const v = satir?.[s.anahtar]
        if (s.tur === 'anahtar') { if (typeof v !== 'string' || !v) { tamam = false; break } yeni[s.anahtar] = v; continue }
        if (!sayiMi(v)) { tamam = false; break }
        if (!s.lab) { yeni[s.anahtar] = v; continue }
        const k = birimdenKanonige(olcuTanimi(s.lab, olculer), veri?.birimler?.[s.anahtar], v)
        if (k === null) { tamam = false; break }
        yeni[s.anahtar] = k
      }
      if (!tamam) break
      cevrilen.push(yeni)
    }
    if (tamam) cikti[tablo.anahtar] = cevrilen; else eksik.push(tablo.anahtar)
  }
  return { t: cikti, eksik }
}

/**
 * What a tool's arithmetic is handed for this country on `bugun`. null = a number or a table of the country is
 * missing or cannot be converted: the tool then gives NO result.
 */
export function ulkeOrtami(t: AracTanimi, p: Pick<PaketAraci, 'parametreler' | 'tablolar'>, bugun: string, olculer?: Olculer): AracOrtami | null {
  const sayilar = parametreleriCoz(t, p, olculer)
  if (sayilar.eksik.length) return null
  if (!t.tablolar?.length) return { bugun, p: sayilar.p }
  const tablolar = tablolariCoz(t, p, olculer)
  if (tablolar.eksik.length) return null
  return Object.keys(tablolar.t).length ? { bugun, p: sayilar.p, t: tablolar.t } : { bugun, p: sayilar.p }
}

/** The upper limits of a country's bands in the unit the tool's number is in. null = a limit cannot be converted. */
export function bantSinirlari(t: AracTanimi, b: BantTablosu, olculer?: Olculer): (number | null)[] | null {
  const olcu = t.sayiOlculeri?.[b.sayi]
  const cikti: (number | null)[] = []
  for (const s of b.satirlar) {
    if (s.ust === null) { cikti.push(null); continue }
    if (!sayiMi(s.ust)) return null
    if (!olcu) { cikti.push(s.ust); continue }
    const k = birimdenKanonige(olcuTanimi(olcu, olculer), b.birim, s.ust)
    if (k === null) return null
    cikti.push(k)
  }
  return cikti
}

/** The band a value falls in: the first row it is below (or, with `dahil`, at or below); the last row takes the rest. */
export function bantBul(b: BantTablosu, sinirlar: readonly (number | null)[], deger: number): string | null {
  if (!Number.isFinite(deger)) return null
  for (let i = 0; i < b.satirlar.length; i++) {
    const ust = sinirlar[i]
    if (ust === null || deger < ust || (b.satirlar[i].dahil === true && deger === ust)) return b.satirlar[i].bant
  }
  return null
}

function bantla(b: BantTablosu, sinirlar: readonly (number | null)[] | null, sonuc: AracSonucu): AracSonucu {
  if (!sonuc.tamam) return sonuc
  const sayi = sonuc.sayilar.find((x) => x.anahtar === b.sayi)
  const bant = sayi && sinirlar ? bantBul(b, sinirlar, sayi.deger) : null
  // The number the bands are read from is not there, or no row takes it: nothing is interpreted at all.
  return bant === null ? BOS_SONUC : { ...sonuc, bant }
}

/** The keys a pack's table names in one of its key columns, each once, in the table's order. [] = no such table. */
export function tabloAnahtarlari(p: Pick<PaketAraci, 'tablolar'>, tablo: string, sutun: string): string[] {
  const satirlar = p.tablolar?.[tablo]?.satirlar
  if (!Array.isArray(satirlar)) return []
  return [...new Set(satirlar.map((s) => s?.[sutun]).filter((v): v is string => typeof v === 'string' && v.length > 0))]
}

/** The fields of a group as this country chose them: the kit's own definitions of the keys it names, in the kit's order. null = the group is not restated. */
export function grupAlanlari(t: AracTanimi, p: Pick<PaketAraci, 'uyarlama'>, grup: string): AracTanimi['alanlar'] | null {
  const tanim = t.alanGruplari?.[grup], liste = p.uyarlama?.alanlar?.[grup]
  if (!tanim || !Array.isArray(liste) || !liste.length) return null
  return tanim.secenekler.filter((a) => liste.includes(a.anahtar))
}

/**
 * THE DEFINITION A COUNTRY'S SCREEN, CHECK AND SERVER WORK WITH: the kit's (or the pack's own), with this country's
 * options, bands, chosen fields and table-given options in place. A pack that restates nothing gets THE SAME OBJECT
 * back — nothing is wrapped.
 */
export function etkinTanim(t: AracTanimi, p: Pick<PaketAraci, 'uyarlama' | 'tablolar'>, olculer?: Olculer): AracTanimi {
  const u = p.uyarlama
  const secenekler = u?.secenekler && Object.keys(u.secenekler).length ? u.secenekler : null
  const bantlar = u?.bantlar ?? null
  let alanlar = t.alanlar
  // Only what the definition itself allows is restated; anything else is left as the kit has it (the pack check names it).
  if (secenekler) alanlar = alanlar.map((a) => (a.tur === 'secim' && a.secenekSerbest === true && Array.isArray(secenekler[a.anahtar]) && secenekler[a.anahtar].length ? { ...a, secenekler: secenekler[a.anahtar] } : a))
  // OPTIONS THE COUNTRY'S TABLE GIVES: the kit holds none, so without the table the field stays without options (and is not there).
  if (t.alanlar.some((a) => a.tablodan && tabloAnahtarlari(p, a.tablodan.tablo, a.tablodan.sutun).length)) alanlar = alanlar.map((a) => { const k = a.tablodan ? tabloAnahtarlari(p, a.tablodan.tablo, a.tablodan.sutun) : []; return k.length ? { ...a, secenekler: k } : a })
  // THE FIELDS OF A GROUP, as the country chose them: they take the place of the kit's, and the arithmetic is told which they are.
  const secilen: Record<string, readonly string[]> = {}
  for (const grup of Object.keys(t.alanGruplari ?? {})) {
    const kendi = grupAlanlari(t, p, grup)
    if (!kendi || !kendi.length) continue
    const hepsi = t.alanGruplari![grup].secenekler.map((a) => a.anahtar)
    const ilk = alanlar.findIndex((a) => hepsi.includes(a.anahtar))
    const kalan = alanlar.filter((a) => !hepsi.includes(a.anahtar))
    const yer = ilk < 0 ? kalan.length : alanlar.slice(0, ilk).filter((a) => !hepsi.includes(a.anahtar)).length
    alanlar = [...kalan.slice(0, yer), ...kendi, ...kalan.slice(yer)]
    secilen[grup] = kendi.map((a) => a.anahtar)
  }
  let cikti = t.cikti
  let hesapla = t.hesapla
  // WHERE THE BAND IS THE OPTION CHOSEN IN A FIELD, the bands are that field's options — the country's, where it restated them.
  if (t.bantAlani && alanlar !== t.alanlar) {
    const kit = t.alanlar.find((a) => a.anahtar === t.bantAlani), simdi = alanlar.find((a) => a.anahtar === t.bantAlani)
    if (simdi && simdi !== kit) cikti = { ...cikti, bantlar: [...(simdi.secenekler ?? [])] }
  }
  if (Object.keys(secilen).length) { const onceki = hesapla; hesapla = (g, ortam) => onceki(g, { ...ortam, alanlar: { ...(ortam.alanlar ?? {}), ...secilen } }) }
  if (bantlar && t.bantSerbest === true) {
    const sinirlar = bantSinirlari(t, bantlar, olculer)
    const onceki = hesapla
    hesapla = (g, ortam) => bantla(bantlar, sinirlar, onceki(g, ortam))
    cikti = { ...cikti, bantlar: [...new Set(bantlar.satirlar.map((s) => s.bant))] }
  }
  if (alanlar === t.alanlar && cikti === t.cikti && hesapla === t.hesapla) return t
  return { ...t, alanlar, cikti, hesapla }
}
