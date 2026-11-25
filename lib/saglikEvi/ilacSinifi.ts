/**
 * HASTA-MODULLERI — server-side bridge from written prescription lines to drug classes for the module resolver
 * (lib/saglikEvi/moduller.ts). Reuses the assistant's drug table (lib/asistan/turkishDrugs.ts: `enIyiIlacAnahtari`, the
 * molecule's `siniflar`) so "Beloc Zok", "Amlodipin 5 mg" and "Lantus" resolve exactly as the drug-interaction check
 * resolves them. Server only: the table is large and the patient's browser never needs it (the resolver only sees class
 * labels). Unknown lines resolve to no class (conservative — nothing is turned on by a guess).
 */
import { TURKISH_DRUGS, enIyiIlacAnahtari } from '@/lib/asistan/turkishDrugs'
import { notAlanlariCoz, kronikListe } from '@/lib/doktor/hastaKayitAlanlari'
import type { IlacGirdisi, KlinikGirdi } from './moduller'

export function ilacGirdileri(adlar: Iterable<string>): IlacGirdisi[] {
  const out: IlacGirdisi[] = []
  for (const ad of adlar) {
    const a = String(ad || '').trim()
    if (!a) continue
    const anahtar = enIyiIlacAnahtari(a)
    out.push({ ad: a, anahtar, siniflar: anahtar ? TURKISH_DRUGS[anahtar]?.siniflar ?? [] : [] })
  }
  return out
}

/** ICD-10 codes of approved notes (notes.icd10_codes = [{ code, … }]). */
export function notIcdKodlari(satirlar: Array<Record<string, unknown>>): string[] {
  const out = new Set<string>()
  for (const r of satirlar) for (const i of Array.isArray(r.icd10_codes) ? r.icd10_codes : []) {
    const c = String((i as Record<string, unknown>)?.code || '').trim()
    if (c) out.add(c)
  }
  return [...out]
}

/** Doctor-approved, active, not ended prescriptions (the rows Doz Takvimi reads) → names. */
export function aktifIlacAdlari(ilaclar: Array<Record<string, any>>, bugun: string): string[] {
  return ilaclar.filter((i) => i.aktif !== false && !(i.bitis_tarihi && String(i.bitis_tarihi) < bugun)).map((i) => String(i.ilac_adi || '')).filter(Boolean)
}

/** The patient file as the resolver needs it. */
export function klinikGirdi(notesEncrypted: unknown, notSatirlari: Array<Record<string, unknown>>, ilacAdlari: string[]): KlinikGirdi {
  return { tanilar: kronikListe(notAlanlariCoz(notesEncrypted as string | null)), icdKodlari: notIcdKodlari(notSatirlari), ilaclar: ilacGirdileri(ilacAdlari) }
}

/**
 * EV-ACIL-SEKER — is any of these medicines an insulin? The drug table's class first ('İnsülin'); then the common insulin
 * molecule / brand names the table does not resolve (it misses e.g. Humalog / NovoRapid / Tresiba, and its fuzzy match
 * reads "Levemir" as levetirasetam), so a ketone reminder is never lost to a table gap. Pure name check, conservative:
 * it only ADDS the reminder line — never a dose, never a module.
 */
export const INSULIN_ADI = /ins[uü]lin|glarjin|glargin|detemir|degludek|degludec|aspart|lispro|gl[uü]lisin|glulisine|lantus|levemir|tresiba|toujeo|abasaglar|basaglar|semglee|humalog|novorapid|fiasp|apidra|lyumjev|humulin|insuman|actrapid|mixtard|novomix|humamix|ryzodeg|xultophy|soliqua/i
export function insulinVarMi(ilaclar: Array<Pick<IlacGirdisi, 'ad' | 'siniflar'>>): boolean {
  return ilaclar.some((i) => i.siniflar.includes('İnsülin') || INSULIN_ADI.test(i.ad))
}
