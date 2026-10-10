/**
 * NOTYA-ULKE-ARACLAR-01 — WHO SEES WHICH TOOL, and what a tool's screen says. Pure functions over what a pack
 * brings (`UlkeAraclari`) and the kit's catalogue; the screens call them with the active pack's content.
 *
 * THE GATE. A tool is visible to an account when the pack lists it AND the kit has it AND
 *   - the pack lists it as base (`roller: null`), or
 *   - the account's role is one of the roles the pack names for it.
 * An account without a role sees base tools only. Nothing else opens a tool: not its address, not a search.
 * The same function answers the grid and the address (`?arac=`), so the two cannot disagree.
 *
 * NOTYA-ULKE-OZEL-01 — what one country may add, and where it is decided:
 *   WHICH MECHANISM   `paketinTanimi`: the kit's, or — for a key the kit does not have — the pack's own
 *                     (`kendiAraclari`), or none at all for a link-out tile; with the country's own options and bands
 *                     in place (./uyarlama.ts). The kit's mechanism always wins: a pack cannot replace one by key.
 *   EVERY DOCTOR      `hekimRolleri`: the class "every doctor role" is a role list the pack check holds complete.
 *   THE PATIENT       `hesabinAraclari(…, hasta)`: opened for a patient, a tool that is not for that patient's age or
 *                     sex is not on the grid (./hastaKapisi.ts); `aracinKapisi` answers the address and the server.
 *   THE NUMBERS       `aracCalistir`: the one way a tool is run, with the country's numbers and tables in the unit the
 *                     arithmetic uses. A missing number gives no result.
 */
import type { BicimliMetin, RolTanimi } from '../arayuz/tipler'
import type { AraclarMetni } from '../arayuz/metinTipleri'
import { yerine as yerlestir } from '../arayuz/yerTutucu'
import { alanBirimi, birimAnahtari, kanonigeCevir, type BirimOrtami } from './birimler'
import { kapiSonucu, type AracHastaBilgisi, type KapiSonucu } from './hastaKapisi'
import { kitAraci } from './katalog'
import { LISANS_ACIK, type AracGirdisi, type AracOrtami, type AracSonucu, type AracTanimi, type PaketAraci, type UlkeAraclari } from './tipler'
import { etkinTanim, ulkeOrtami } from './uyarlama'
import { gosterimOndaligi, yazilanOndalik } from './yazim'
import { alanVarMi, BOS_SONUC } from './yardimci'

export type GorunurArac = { tanim: AracTanimi; paket: PaketAraci }

/** The patient a tool is opened for, as the gate needs them, and the account's own day. */
export type AracBaglami = { hasta: AracHastaBilgisi; bugun: string }

const BOS_CIKTI = { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] } as const

/** A link-out tile has no mechanism: no field, no arithmetic, nothing to keep. */
const baglantiTanimi = (anahtar: string): AracTanimi => ({ anahtar, tur: 'baglanti', alanlar: [], cikti: BOS_CIKTI, kaynak: null, hesapla: () => BOS_SONUC })

/**
 * THE MECHANISM of a tool a pack lists, as this country has it — or null: no such tool. The kit's definition where
 * the kit has the key; otherwise the pack's own (a tool only this country has); a link-out tile has none to find.
 * The country's own options and bands are already in place.
 */
export function paketinTanimi(icerik: Pick<UlkeAraclari, 'kendiAraclari' | 'olculer'>, p: PaketAraci): AracTanimi | null {
  const kit = kitAraci(p.anahtar)
  // A link-out tile is the pack's own key and nothing else: a key of the kit is never turned into a link.
  if (p.baglanti) return kit ? null : baglantiTanimi(p.anahtar)
  const tanim = kit ?? (icerik.kendiAraclari ?? []).find((t) => t.anahtar === p.anahtar) ?? null
  return tanim ? etkinTanim(tanim, p, icerik.olculer) : null
}

/** THE DOCTOR ROLES of a pack, in its order: every role that is not an allied profession. The list behind `sinif: 'hekimler'`. */
export const hekimRolleri = (roller: readonly Pick<RolTanimi, 'anahtar' | 'taraf'>[]): string[] => roller.filter((r) => r.taraf !== 'klinik-muttefik').map((r) => r.anahtar)

/** A text of the pack in a form. '' where the pack has none: the pack check has already refused such a pack. */
export const bicimli = (m: BicimliMetin | undefined, dil: string): string => (m && Object.prototype.hasOwnProperty.call(m, dil) ? m[dil] : '')

/** true = this account may see the tool. */
export function aracGorunurMu(a: Pick<PaketAraci, 'roller'>, rol: string | null | undefined): boolean {
  if (a.roller === null) return true
  return typeof rol === 'string' && rol.length > 0 && a.roller.includes(rol)
}

/**
 * The tools an account sees, in the pack's order: base tools, and the tools of its own role. `baglam` = the tools
 * were opened FOR A PATIENT: a tool that is not for that patient's age or sex is then left out.
 */
export function hesabinAraclari(icerik: UlkeAraclari | null | undefined, rol: string | null | undefined, baglam?: AracBaglami | null): { temel: GorunurArac[]; rol: GorunurArac[] } {
  const temel: GorunurArac[] = [], kendi: GorunurArac[] = []
  if (!icerik) return { temel, rol: kendi }
  for (const p of icerik.araclar ?? []) {
    if (!aracGorunurMu(p, rol)) continue
    // SECOND LOCK (the pack check is the first): a tool whose licence is not free or permitted is on no screen.
    if (p.lisans && !LISANS_ACIK.includes(p.lisans.durum)) continue
    if (baglam && kapiSonucu(p.hasta, baglam.hasta, baglam.bugun) === 'degil') continue
    const tanim = paketinTanimi(icerik, p)
    if (!tanim) continue
    ;(p.roller === null ? temel : kendi).push({ tanim, paket: p })
  }
  return { temel, rol: kendi }
}

/** WHETHER A TOOL IS FOR THIS PATIENT (`hasta` null = opened without a patient). The address and the server ask this. */
export const aracinKapisi = (x: Pick<GorunurArac, 'paket'>, hasta: AracHastaBilgisi | null | undefined, bugun: string): KapiSonucu => kapiSonucu(x.paket.hasta, hasta, bugun)

/**
 * A tool by its key, WITHOUT the role gate: for reading what was kept (a result stays in the patient's file when the
 * account's role changes). null = the pack or the kit no longer has the tool. Never used to open a tool.
 */
export function paketinAraci(icerik: UlkeAraclari | null | undefined, anahtar: unknown): GorunurArac | null {
  if (!icerik || typeof anahtar !== 'string') return null
  const paket = (icerik.araclar ?? []).find((p) => p.anahtar === anahtar)
  const tanim = paket ? paketinTanimi(icerik, paket) : null
  return paket && tanim ? { tanim, paket } : null
}

/** What the tool's arithmetic is handed for this country on `bugun`; null = a number or a table of the country is missing. */
export const aracOrtami = (x: GorunurArac, bugun: string, icerik?: Pick<UlkeAraclari, 'olculer'> | null): AracOrtami | null => ulkeOrtami(x.tanim, x.paket, bugun, icerik?.olculer)

/**
 * THE ONE WAY A TOOL IS RUN, on the screen and on the server: its arithmetic, with the country's numbers and tables
 * in the unit the arithmetic uses. A number or a table the country has not stated gives NO result.
 */
export function aracCalistir(x: GorunurArac, g: AracGirdisi, bugun: string, icerik?: Pick<UlkeAraclari, 'olculer'> | null): AracSonucu {
  const ortam = aracOrtami(x, bugun, icerik)
  return ortam ? x.tanim.hesapla(g, ortam) : BOS_SONUC
}

/** One tool by its key, for this account — or null: no such tool here, or not for this role. */
export function hesabinAraci(icerik: UlkeAraclari | null | undefined, rol: string | null | undefined, anahtar: unknown): GorunurArac | null {
  if (typeof anahtar !== 'string') return null
  const { temel, rol: kendi } = hesabinAraclari(icerik, rol)
  return [...temel, ...kendi].find((x) => x.tanim.anahtar === anahtar) ?? null
}

/** Search over the title and the description, in the account's form. `katla` is the pack's own folding (scripts, apostrophes). */
export function aracAra(liste: readonly GorunurArac[], q: string, dil: string, katla: (s: string) => string = (s) => s.toLowerCase()): GorunurArac[] {
  const aranan = katla(q.trim())
  if (!aranan) return [...liste]
  return liste.filter((x) => katla(`${bicimli(x.paket.metin.ad, dil)} ${bicimli(x.paket.metin.aciklama, dil)}`).includes(aranan))
}

/** The label of a field: the pack's, or — for an item of a published questionnaire the pack does not word — its number. */
export function alanEtiketi(x: GorunurArac, alanAnahtari: string, dil: string, m: AraclarMetni): string {
  const kendi = bicimli(x.paket.metin.alanlar[alanAnahtari], dil)
  if (kendi) return kendi
  const numarali = x.tanim.alanlar.filter((a) => a.numarali)
  const sira = numarali.findIndex((a) => a.anahtar === alanAnahtari)
  return sira >= 0 ? yerlestir(m.arac.madde, String(sira + 1)) : ''
}

export type Yazici = {
  sayi: (deger: number, ondalik: number) => string; tarih: (iso: string) => string; birim: (kod: string) => string
  /** How THIS COUNTRY writes an amount of a medicine (`UlkeAraclari.dozYazimi`); absent = as any other number. */
  doz?: (deger: number, ondalik: number) => string
}

/** One number of a result as it is written: "12 / 35", "4,2 ng/mL". */
export function sayiMetni(s: AracSonucu['sayilar'][number], m: AraclarMetni, y: Yazici, o?: BirimOrtami): string {
  // A length or a weight the arithmetic worked out in cm / kg is written in the country's own unit of that measure.
  const carpan = s.olcu && o ? kanonigeCevir({ anahtar: s.anahtar, tur: 'sayi', olcu: s.olcu }, 1, o) ?? 1 : 1
  const birim = s.olcu && o ? o.birimler[s.olcu] : s.birim
  // As many places as the number states, more where its significant figures need them; an amount of a medicine by the pack's own rule for writing a dose (./yazim.ts).
  const deger = (s.doz && y.doz ? y.doz : y.sayi)(s.deger / carpan, gosterimOndaligi(s.deger / carpan, s.ondalik, s.anlamli))
  const govde = typeof s.enCok === 'number' ? yerlestir(m.arac.oran, deger, y.sayi(s.enCok, 0)) : deger
  return birim ? `${govde} ${y.birim(birim)}` : govde
}

/**
 * THE SUMMARY the doctor copies: the tool's name, what was entered, what came out, and the line that says what the
 * tool is not. Plain text, every word the pack's, in the form `dil` (the screens pass the account's NOTE language).
 * '' while the tool has no result.
 */
export function aracOzeti(x: GorunurArac, g: AracGirdisi, sonuc: AracSonucu, dil: string, m: AraclarMetni, y: Yazici, o: BirimOrtami): string {
  if (!sonuc.tamam) return ''
  const t = x.paket.metin
  const satirlar: string[] = [bicimli(t.ad, dil)]
  for (const a of x.tanim.alanlar) {
    if (!alanVarMi(a, g)) continue
    const v = g[a.anahtar]
    const etiket = alanEtiketi(x, a.anahtar, dil, m)
    if (a.tur === 'isaret') { if (v === true) satirlar.push(`- ${etiket}`); continue }
    if (v === null || v === undefined || v === '') continue
    if (a.tur === 'secim') satirlar.push(`${etiket}: ${bicimli(t.secenekler?.[a.anahtar]?.[String(v)], dil)}`)
    else if (a.tur === 'tarih') satirlar.push(`${etiket}: ${y.tarih(String(v))}`)
    else if (a.tur === 'metin') satirlar.push(`${etiket}: ${String(v)}`)
    // The unit the doctor chose travels beside the number (./girdi.ts → hamdanGosterilen); otherwise the pack's one unit.
    // A TYPED NUMBER IS REPEATED WITH EVERY PLACE IT HAS (NOTYA-ULKE-ARAC-DUZELTME-01): this line used to write one
    // place only, so a dose typed as 0.15 mg/kg went into the copied summary as "0.2 mg/kg".
    else if (typeof v === 'number') { const b = alanBirimi(a, o, g[birimAnahtari(a.anahtar)]); satirlar.push(`${etiket}: ${y.sayi(v, yazilanOndalik(v))}${b ? ` ${y.birim(b)}` : ''}`) }
  }
  for (const s of sonuc.sayilar) satirlar.push(`${bicimli(t.sayilar?.[s.anahtar], dil)}: ${sayiMetni(s, m, y, o)}`)
  if (sonuc.bant) satirlar.push(bicimli(t.bantlar?.[sonuc.bant], dil))
  for (const u of sonuc.uyarilar) satirlar.push(`! ${bicimli(t.uyarilar?.[u], dil)}`)
  for (const d of sonuc.tarihler) satirlar.push(`${bicimli(t.tarihler?.[d.anahtar], dil)}: ${y.tarih(d.tarih)}`)
  satirlar.push(bicimli(t.not, dil))
  // The rights holder's notice goes wherever the result goes.
  satirlar.push(lisansBildirimi(x, dil))
  return satirlar.filter((s) => s.trim()).join('\n')
}

/** The notice a rights holder requires under a result of this tool, in a form. '' = the tool has none. */
export const lisansBildirimi = (x: Pick<GorunurArac, 'paket'>, dil: string): string => bicimli(x.paket.lisans?.bildirim, dil)
