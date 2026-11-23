/**
 * ESNEK-MUAYENE-B3 — field-level autonomy ladder, per doctor and per note field (pure).
 *
 *   B0 taslak       every field reviewed (default for a new doctor / a new field);
 *   B1 vurgulu      green = confident, only yellow needs a look            (after 5 uncorrected notes in a row);
 *   B2 tek dokunuş  the field is auto-accepted: uncorrected in the last 20 notes                          (after 20);
 *   B3 toplu onay   daily batch approval: each note opened, then batch approve (after 40, and only with the doctor's yes).
 *
 * NEVER automatic, whatever the step: allergies, drugs / doses, right / left, diagnosis code changes, e-Reçete, reports.
 * Drug and diagnosis-code FIELDS never rise above B1; a sentence carrying a side / dose / allergy token is always yellow,
 * in any field, at any step. Any correction of a field drops it one step and restarts its count; the doctor can lower any
 * field any time (his ceiling), and only he can open B3.
 */
import { korumaliSiniflar } from '@/core/elNotu/korumali'
import { cumleler, kelimeler } from './metinAraclari'

export type Basamak = 0 | 1 | 2 | 3
export const ESIK: Record<1 | 2 | 3, number> = { 1: 5, 2: 20, 3: 40 }

/** Note fields on the ladder (approval-log names of lib/doktor/notOnayla.ts). */
export const OZERK_ALANLAR = ['basvuruYakinmasi', 'subjektif', 'objektif', 'degerlendirme', 'plan', 'hastaOzeti', 'alarm_bulgulari', 'vitaller', 'content_tetkikler', 'content_asilar', 'content_ilaclar', 'icd10_codes'] as const
export type OzerkAlan = (typeof OZERK_ALANLAR)[number]
/** Fields that are never automatic: their ceiling is B1 (highlighted, always a look). */
export const KORUMALI_ALANLAR: ReadonlySet<OzerkAlan> = new Set<OzerkAlan>(['content_ilaclar', 'icd10_codes', 'content_asilar'])
export const alanTavani = (a: OzerkAlan): Basamak => (KORUMALI_ALANLAR.has(a) ? 1 : 3)

export type AlanDurumu = { alan: OzerkAlan; basamak: Basamak; seri: number; hekimTavani: Basamak }

export const yeniAlan = (alan: OzerkAlan): AlanDurumu => ({ alan, basamak: 0, seri: 0, hekimTavani: 3 })

/**
 * One approved note: fields present in it, fields corrected in it. Corrected → one step down, count restarts. Present and
 * uncorrected → count +1, promotion when the count reaches the next threshold (B3 only when `b3Izni`), never above the
 * field's ceiling or the doctor's.
 */
export function notIsle(d: AlanDurumu, duzeltildi: boolean, b3Izni: boolean): AlanDurumu {
  if (duzeltildi) return { ...d, basamak: Math.max(0, d.basamak - 1) as Basamak, seri: 0 }
  const seri = d.seri + 1
  let basamak = d.basamak
  const tavan = Math.min(alanTavani(d.alan), d.hekimTavani, b3Izni ? 3 : 2) as Basamak
  while (basamak < tavan && seri >= ESIK[(basamak + 1) as 1 | 2 | 3]) basamak = (basamak + 1) as Basamak
  return { ...d, seri, basamak }
}

/** The doctor lowers a field (his ceiling becomes that step; the count restarts so it does not jump back at once). */
export function hekimIndir(d: AlanDurumu, hedef: Basamak): AlanDurumu {
  const h = Math.max(0, Math.min(hedef, d.basamak)) as Basamak
  return { ...d, basamak: h, hekimTavani: h, seri: 0 }
}

/** The doctor lifts his own ceiling again (the step itself still has to be earned by uncorrected notes). */
export function hekimTavaniKaldir(d: AlanDurumu): AlanDurumu {
  return { ...d, hekimTavani: 3 }
}

/** Every field earned the B3 count (or sits at its ceiling) → the B3 offer can be shown. */
export function b3TeklifUygun(alanlar: AlanDurumu[]): boolean {
  const serbest = alanlar.filter((a) => !KORUMALI_ALANLAR.has(a.alan) && a.hekimTavani >= 3)
  return serbest.length >= 3 && serbest.every((a) => a.basamak >= 2 && a.seri >= ESIK[3])
}

// ── what the doctor sees on one note ──────────────────────────────────────────────────────────────────────────────

export type CumleRengi = 'yesil' | 'sari'
export type AlanGorunumu = {
  alan: OzerkAlan
  basamak: Basamak
  /** 'otomatik' = auto-accepted (B2+, nothing protected); 'yesil' = confident; 'sari' = needs a look; 'taslak' = B0. */
  durum: 'otomatik' | 'yesil' | 'sari' | 'taslak'
  /** Sentences that must be looked at (protected tokens or no source provenance), for highlighting. */
  sariCumleler: string[]
  /** Of those, the ones that are yellow for a reason OTHER than a protected token (unconfirmed reading, no provenance). */
  digerSari: number
  korumali: boolean
}

const KORUMALI_GORUNUM = new Set(['taraf', 'doz', 'alerji', 'ilac'])
/** A sentence with a side, dose or allergy token is always yellow. */
export function cumleKorumaliMi(c: string): boolean {
  let alerji = false
  for (const w of kelimeler(c)) {
    const s = korumaliSiniflar(w, { oncekiAlerji: alerji })
    if (/alerj|allerg/i.test(w)) alerji = true
    if (s.some((x) => KORUMALI_GORUNUM.has(x))) return true
  }
  return false
}

/**
 * One field of one note. `izli` = sentences that carry source provenance (handwriting / transcript line tags); a sentence
 * without provenance on a source-built note is yellow too. `kaynakli` = the note was built with provenance at all.
 */
export function alanGorunumu(alan: OzerkAlan, metin: string, basamak: Basamak, o: { izli?: Set<string>; kaynakli?: boolean; acikOkuma?: boolean } = {}): AlanGorunumu {
  const korumaliAlan = KORUMALI_ALANLAR.has(alan)
  const cs = cumleler(metin)
  const diger = (c: string) => /⟦[^⟧]*⟧/.test(c) || Boolean(o.kaynakli && o.izli && !o.izli.has(c.trim()))
  const sari = cs.filter((c) => cumleKorumaliMi(c) || diger(c))
  const digerSari = cs.filter(diger).length
  if (korumaliAlan) return { alan, basamak: Math.min(basamak, 1) as Basamak, durum: 'sari', sariCumleler: cs, digerSari: 0, korumali: true }
  if (basamak === 0) return { alan, basamak, durum: 'taslak', sariCumleler: sari, digerSari, korumali: false }
  if (o.acikOkuma || sari.length) return { alan, basamak, durum: 'sari', sariCumleler: sari, digerSari: o.acikOkuma ? Math.max(1, digerSari) : digerSari, korumali: false }
  return { alan, basamak, durum: basamak >= 2 ? 'otomatik' : 'yesil', sariCumleler: [], digerSari: 0, korumali: false }
}

export type NotGorunumu = { alanlar: AlanGorunumu[]; tekDokunus: boolean; topluUygun: boolean; bakilacak: number }

/**
 * Whole note. One tap (B2): every non-protected field at B2+ with nothing yellow except protected-token sentences, no open
 * reading; the protected items stay visible in yellow and are approved by that same explicit tap. Batch (B3): the same at B3;
 * the protected items are acknowledged one by one in the batch list before the batch approval.
 */
export function notGorunumu(alanlar: AlanGorunumu[], acikOkuma: boolean): NotGorunumu {
  const serbest = alanlar.filter((a) => !a.korumali)
  const bakilacak = alanlar.filter((a) => a.durum === 'sari' || a.durum === 'taslak').length
  const temiz = (a: AlanGorunumu, b: Basamak) => a.basamak >= b && a.durum !== 'taslak' && a.digerSari === 0
  const tekDokunus = !acikOkuma && serbest.length > 0 && serbest.every((a) => temiz(a, 2))
  const topluUygun = !acikOkuma && serbest.length > 0 && serbest.every((a) => temiz(a, 3))
  return { alanlar, tekDokunus, topluUygun, bakilacak }
}

/** The items of a note that must be acknowledged one by one before a batch approval (never automatic). */
export function onayliOlmasiGerekenler(alanlar: AlanGorunumu[]): { alan: OzerkAlan; metin: string }[] {
  const out: { alan: OzerkAlan; metin: string }[] = []
  for (const a of alanlar) for (const c of a.korumali ? a.sariCumleler : a.sariCumleler.filter(cumleKorumaliMi)) out.push({ alan: a.alan, metin: c })
  return out
}
