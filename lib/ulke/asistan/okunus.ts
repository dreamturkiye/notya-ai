/**
 * AU-CANLI-01 — how written clinical text is SAID. The screen keeps the abbreviation; the voice says the natural
 * English. Deterministic (a dictionary and a few patterns), never left to the model: the same rule Türkiye applies
 * before its voice (lib/asistan/elevenMetni.ts), here for English.
 *
 * Spelling is the pack's spoken variety: "millilitres", "per cent". A rule a country needs differently is a
 * parameter, not a fork.
 */

export type OkunusSecenegi = { litre?: 'litre' | 'liter'; yuzde?: string }

const BIRIM: ReadonlyArray<[RegExp, (n: string, o: Required<OkunusSecenegi>) => string]> = [
  [/(\d(?:[.,]\d+)?)\s?(?:mcg|µg|μg)\b/gi, (n) => `${n} ${bir(n) ? 'microgram' : 'micrograms'}`],
  [/(\d(?:[.,]\d+)?)\s?ng\b/gi, (n) => `${n} ${bir(n) ? 'nanogram' : 'nanograms'}`],
  [/(\d(?:[.,]\d+)?)\s?mg\b/gi, (n) => `${n} ${bir(n) ? 'milligram' : 'milligrams'}`],
  [/(\d(?:[.,]\d+)?)\s?kg\b/gi, (n) => `${n} ${bir(n) ? 'kilogram' : 'kilograms'}`],
  [/(\d(?:[.,]\d+)?)\s?g\b(?!\/)/g, (n) => `${n} ${bir(n) ? 'gram' : 'grams'}`],
  [/(\d(?:[.,]\d+)?)\s?mmol\/L\b/gi, (n) => `${n} millimoles per litre`],
  [/(\d(?:[.,]\d+)?)\s?mmHg\b/g, (n) => `${n} millimetres of mercury`],
  [/(\d(?:[.,]\d+)?)\s?mL\b/g, (n, o) => `${n} ${o.litre === 'litre' ? (bir(n) ? 'millilitre' : 'millilitres') : (bir(n) ? 'milliliter' : 'milliliters')}`],
  [/(\d(?:[.,]\d+)?)\s?L\b/g, (n, o) => `${n} ${o.litre === 'litre' ? (bir(n) ? 'litre' : 'litres') : (bir(n) ? 'liter' : 'liters')}`],
  [/(\d(?:[.,]\d+)?)\s?cm\b/g, (n) => `${n} ${bir(n) ? 'centimetre' : 'centimetres'}`],
  [/(\d(?:[.,]\d+)?)\s?mm\b/g, (n) => `${n} ${bir(n) ? 'millimetre' : 'millimetres'}`],
  [/(\d(?:[.,]\d+)?)\s?bpm\b/gi, (n) => `${n} beats per minute`],
  [/(\d(?:[.,]\d+)?)\s?IU\b/g, (n) => `${n} international units`],
  [/(\d(?:[.,]\d+)?)\s?°\s?C\b/g, (n) => `${n} degrees Celsius`],
  [/(\d(?:[.,]\d+)?)\s?%/g, (n, o) => `${n} ${o.yuzde}`],
]

function bir(n: string): boolean {
  return n === '1'
}

const KISALTMA: ReadonlyArray<[RegExp, string]> = [
  [/\bq(\d{1,2})h\b/gi, 'every $1 hours'],
  [/\bbd\b/gi, 'twice daily'],
  [/\bbid\b/gi, 'twice daily'],
  [/\btds\b/gi, 'three times daily'],
  [/\btid\b/gi, 'three times daily'],
  [/\bqid\b/gi, 'four times daily'],
  [/\bqds\b/gi, 'four times daily'],
  [/\bnocte\b/gi, 'at night'],
  [/\bmane\b/gi, 'in the morning'],
  [/\bprn\b/gi, 'as needed'],
  [/\bstat\b/gi, 'immediately'],
  [/\bPO\b/g, 'orally'],
  [/\beGFR\b/g, 'e G F R'],
  [/\bECG\b/g, 'E C G'],
  [/\bIV\b/g, 'I V'],
  [/\bIM\b/g, 'I M'],
  [/\bCT\b/g, 'C T'],
  [/\bMRI\b/g, 'M R I'],
  [/\bHbA1c\b/g, 'H B A one C'],
  [/\bBP\b/g, 'blood pressure'],
  [/\bHR\b/g, 'heart rate'],
  [/\bGP\b/g, 'G P'],
  [/\bPBS\b/g, 'P B S'],
  [/\bMBS\b/g, 'M B S'],
  [/\bICD-10\b/g, 'I C D ten'],
]

/** The spoken form of one finished sentence. Pure. */
export function sesMetni(ham: string, secenek: OkunusSecenegi = {}): string {
  const o: Required<OkunusSecenegi> = { litre: secenek.litre ?? 'litre', yuzde: secenek.yuzde ?? 'per cent' }
  let t = ham
  for (const [desen, yaz] of BIRIM) t = t.replace(desen, (_m, n: string) => yaz(n, o))
  for (const [desen, yaz] of KISALTMA) t = t.replace(desen, yaz)
  // "5-10" → "5 to 10": a range read as a minus sign is a dosing error said aloud.
  t = t.replace(/(\d)\s?[–-]\s?(\d)/g, '$1 to $2')
  return t.replace(/\s{2,}/g, ' ').trim()
}
