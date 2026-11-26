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
 * EV-ACIL-SEKER — is any of these medicines an insulin? Driven by the drug table: the line's own classes, or the table's
 * resolution of the written name (`enIyiIlacAnahtari` → `siniflar` includes 'İnsülin'). Since ILAC-TABLOSU-INSULIN
 * (2026-11-25) the table carries every insulin on the Turkish market (Humalog, NovoRapid, Tresiba, Levemir → insülin
 * detemir, never levetirasetam). `INSULIN_ADI` stays as a belt-and-braces name fallback for names the table does not
 * carry (e.g. Xultophy, Awiqli) — it only ADDS the ketone reminder line, never a dose, never a module.
 */
export const INSULIN_ADI = /ins[uü]lin|glarjin|glargin|detemir|degludek|degludec|aspart|lispro|gl[uü]lisin|glulisine|ikodek|icodec|lantus|levemir|tresiba|toujeo|abasaglar|basaglar|glarin\b|glaritus|semglee|humalog|novorapid|fiasp|apidra|lyumjev|admelog|humulin|insuman|insulatard|actrapid|mixtard|novomix|humamix|ryzodeg|xultophy|soliqua|suliqua|awiqli/i

function tablodaInsulinMi(ad: string): boolean {
  const anahtar = enIyiIlacAnahtari(ad)
  return Boolean(anahtar && TURKISH_DRUGS[anahtar]?.siniflar.includes('İnsülin'))
}

export function insulinVarMi(ilaclar: Array<Pick<IlacGirdisi, 'ad' | 'siniflar'>>): boolean {
  return ilaclar.some((i) => i.siniflar.includes('İnsülin') || tablodaInsulinMi(i.ad) || INSULIN_ADI.test(i.ad))
}
