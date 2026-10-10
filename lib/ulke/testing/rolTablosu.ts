/**
 * NOTYA-ULKE-OZEL-01 — THE ROLE TABLE (countries/rol-eslemesi.json) AGAINST A PACK. Tests only (lib/ulke/testing/).
 *
 * The table's forty rows are the roles the countries share, one column of keys per family of packs (`en` for the
 * English-speaking packs, `uz` for Uzbekistan, `tr` for the Turkish product). Its section `ulkeyeOzel` says, per
 * country, where that country's list differs from its column: the shared roles it does not have (`cikar`) and the
 * roles only it has (`ekle`), each with its kind and the role of the column it behaves like (`gibi`, or null).
 *
 * One function answers for every pack — a real one (lib/ulke/rolEslemesi.paket.test.ts, once per country folder) and
 * the kit's test country (lib/ulke/ornekUlke.test.ts) — so a country cannot change its roles without the table
 * saying so, and a core fix made for one specialty can still be traced to the key that carries it everywhere.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RolTanimi } from '../arayuz/tipler'

export type RolSutunu = 'en' | 'tr' | 'uz'
export type RolSatiri = { en: string; tr: string; uz: string; taraf: string }
export type UlkeRolFarki = { sutun: RolSutunu; cikar: string[]; ekle: { anahtar: string; taraf: string; gibi: string | null }[] }
export type RolTablosu = { aciklama: string; roller: RolSatiri[]; ulkeyeOzel?: Record<string, UlkeRolFarki> }

const KOK = resolve(__dirname, '../../..')

export const rolTablosunuOku = (): RolTablosu => JSON.parse(readFileSync(join(KOK, 'countries/rol-eslemesi.json'), 'utf8')) as RolTablosu

/** The role keys the table gives a country: its column, without what it takes out, then what it adds. */
export function tablodakiRoller(t: RolTablosu, kod: string, sutun: RolSutunu): string[] {
  const fark = t.ulkeyeOzel?.[kod]
  const temel = t.roller.map((r) => r[sutun])
  if (!fark) return temel
  return [...temel.filter((k) => !fark.cikar.includes(k)), ...fark.ekle.map((r) => r.anahtar)]
}

/** Whether the section itself is well-formed for one country. */
export function rolFarkiSorunlari(t: RolTablosu, kod: string): string[] {
  const s: string[] = []
  const fark = t.ulkeyeOzel?.[kod]
  if (!fark) return s
  if (!['en', 'tr', 'uz'].includes(fark.sutun)) { s.push(`${kod}: "sutun" names the column the country's keys are read from (en, tr or uz)`); return s }
  const sutun = t.roller.map((r) => r[fark.sutun])
  if (!Array.isArray(fark.cikar) || !Array.isArray(fark.ekle)) { s.push(`${kod}: "cikar" and "ekle" are lists (empty where there is nothing)`); return s }
  for (const k of fark.cikar) if (!sutun.includes(k)) s.push(`${kod}: "${k}" is taken out and is no role of the column "${fark.sutun}"`)
  if (new Set(fark.cikar).size !== fark.cikar.length) s.push(`${kod}: a role is taken out twice`)
  const eklenen = fark.ekle.map((r) => r.anahtar)
  if (new Set(eklenen).size !== eklenen.length) s.push(`${kod}: a role is added twice`)
  for (const r of fark.ekle) {
    if (!/^[a-z]+(-[a-z]+)*$/.test(String(r.anahtar)) || r.anahtar.length > 60) s.push(`${kod}: "${r.anahtar}" is not a role key`)
    if (sutun.includes(r.anahtar)) s.push(`${kod}: "${r.anahtar}" is added and is already a role of the column`)
    if (!['doktor', 'klinik-hekim', 'klinik-muttefik'].includes(r.taraf)) s.push(`${kod}: "${r.anahtar}" has no kind (doktor, klinik-hekim, klinik-muttefik)`)
    // a role behaves like a SHARED role: the one whose template and questions it uses, and the row a core fix is traced through
    if (r.gibi !== null && !sutun.includes(r.gibi)) s.push(`${kod}: "${r.anahtar}" behaves like "${r.gibi}", which is no role of the column "${fark.sutun}"`)
  }
  return s
}

/**
 * Everything in which a pack's roles and the table disagree. `paketRolleri` = the pack's `uygulama.roller`;
 * `tanimlar` = the roles as the pack defines them for the screens (kind, and the role each behaves like).
 */
export function rolTablosuSorunlari(t: RolTablosu, kod: string, sutun: RolSutunu, paketRolleri: readonly string[], tanimlar: readonly Pick<RolTanimi, 'anahtar' | 'taraf' | 'gibi'>[]): string[] {
  const s = rolFarkiSorunlari(t, kod)
  const fark = t.ulkeyeOzel?.[kod]
  if (fark && fark.sutun !== sutun) s.push(`${kod}: the table reads this country's keys from "${fark.sutun}", the pack is of "${sutun}"`)
  const beklenen = tablodakiRoller(t, kod, sutun)
  // A country the section does not list has EXACTLY its column, in its order. One that is listed has its own order.
  if (!fark) { if (JSON.stringify([...paketRolleri]) !== JSON.stringify(beklenen)) s.push(`${kod}: the pack's roles are not the column "${sutun}" of the table, in its order (a country that differs is listed under "ulkeyeOzel")`) }
  else {
    for (const k of beklenen) if (!paketRolleri.includes(k)) s.push(`${kod}: the table has the role "${k}" and the pack does not`)
    for (const k of paketRolleri) if (!beklenen.includes(k)) s.push(`${kod}: the pack has the role "${k}" and the table does not (add it under "ulkeyeOzel.${kod}.ekle", with the role it behaves like)`)
  }
  const tanimAnahtarlari = tanimlar.map((r) => r.anahtar)
  if (JSON.stringify(tanimAnahtarlari) !== JSON.stringify([...paketRolleri])) s.push(`${kod}: the roles the pack defines for the screens are not its role list`)
  for (const r of tanimlar) {
    const eklenen = fark?.ekle.find((x) => x.anahtar === r.anahtar)
    if (eklenen) {
      if (eklenen.taraf !== r.taraf) s.push(`${kod}: "${r.anahtar}" is "${r.taraf}" in the pack and "${eklenen.taraf}" in the table`)
      if ((eklenen.gibi ?? null) !== (r.gibi ?? null)) s.push(`${kod}: "${r.anahtar}" behaves like "${r.gibi ?? 'no role'}" in the pack and like "${eklenen.gibi ?? 'no role'}" in the table`)
    } else {
      const satir = t.roller.find((x) => x[sutun] === r.anahtar)
      if (satir && satir.taraf !== r.taraf) s.push(`${kod}: "${r.anahtar}" is "${r.taraf}" in the pack and "${satir.taraf}" in the table`)
      // a shared role stands on its own: only a role the table lists as the country's own may behave like another
      if (r.gibi !== undefined) s.push(`${kod}: "${r.anahtar}" behaves like "${r.gibi}" in the pack; the table does not list it as a role of the country's own`)
    }
  }
  return s
}
