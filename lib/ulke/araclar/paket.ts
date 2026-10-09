/**
 * NOTYA-ULKE-ARACLAR-01 — WHO SEES WHICH TOOL, and what a tool's screen says. Pure functions over what a pack
 * brings (`UlkeAraclari`) and the kit's catalogue; the screens call them with the active pack's content.
 *
 * THE GATE. A tool is visible to an account when the pack lists it AND the kit has it AND
 *   - the pack lists it as base (`roller: null`), or
 *   - the account's role is one of the roles the pack names for it.
 * An account without a role sees base tools only. Nothing else opens a tool: not its address, not a search.
 * The same function answers the grid and the address (`?arac=`), so the two cannot disagree.
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { AraclarMetni } from '../arayuz/metinTipleri'
import { yerine as yerlestir } from '../arayuz/yerTutucu'
import { alanBirimi, type BirimOrtami } from './birimler'
import { kitAraci } from './katalog'
import type { AracGirdisi, AracSonucu, AracTanimi, PaketAraci, UlkeAraclari } from './tipler'
import { alanVarMi } from './yardimci'

export type GorunurArac = { tanim: AracTanimi; paket: PaketAraci }

/** A text of the pack in a form. '' where the pack has none: the pack check has already refused such a pack. */
export const bicimli = (m: BicimliMetin | undefined, dil: string): string => (m && Object.prototype.hasOwnProperty.call(m, dil) ? m[dil] : '')

/** true = this account may see the tool. */
export function aracGorunurMu(a: Pick<PaketAraci, 'roller'>, rol: string | null | undefined): boolean {
  if (a.roller === null) return true
  return typeof rol === 'string' && rol.length > 0 && a.roller.includes(rol)
}

/** The tools an account sees, in the pack's order: base tools, and the tools of its own role. */
export function hesabinAraclari(icerik: UlkeAraclari | null | undefined, rol: string | null | undefined): { temel: GorunurArac[]; rol: GorunurArac[] } {
  const temel: GorunurArac[] = [], kendi: GorunurArac[] = []
  for (const p of icerik?.araclar ?? []) {
    const tanim = kitAraci(p.anahtar)
    if (!tanim || !aracGorunurMu(p, rol)) continue
    ;(p.roller === null ? temel : kendi).push({ tanim, paket: p })
  }
  return { temel, rol: kendi }
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

export type Yazici = { sayi: (deger: number, ondalik: number) => string; tarih: (iso: string) => string; birim: (kod: string) => string }

/** One number of a result as it is written: "12 / 35", "4,2 ng/mL". */
export function sayiMetni(s: AracSonucu['sayilar'][number], m: AraclarMetni, y: Yazici): string {
  const deger = y.sayi(s.deger, s.ondalik)
  const govde = typeof s.enCok === 'number' ? yerlestir(m.arac.oran, deger, y.sayi(s.enCok, 0)) : deger
  return s.birim ? `${govde} ${y.birim(s.birim)}` : govde
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
    else if (typeof v === 'number') { const b = alanBirimi(a, o); satirlar.push(`${etiket}: ${y.sayi(v, Number.isInteger(v) ? 0 : 1)}${b ? ` ${y.birim(b)}` : ''}`) }
  }
  for (const s of sonuc.sayilar) satirlar.push(`${bicimli(t.sayilar?.[s.anahtar], dil)}: ${sayiMetni(s, m, y)}`)
  if (sonuc.bant) satirlar.push(bicimli(t.bantlar?.[sonuc.bant], dil))
  for (const u of sonuc.uyarilar) satirlar.push(`! ${bicimli(t.uyarilar?.[u], dil)}`)
  for (const d of sonuc.tarihler) satirlar.push(`${bicimli(t.tarihler?.[d.anahtar], dil)}: ${y.tarih(d.tarih)}`)
  satirlar.push(bicimli(t.not, dil))
  return satirlar.filter((s) => s.trim()).join('\n')
}
