/**
 * DEMO-1121 bug 4 (2026-11-21) — the content the muayene report's document stamp (BelgeKunyesi, BELGE-NO-01) hashes.
 *
 * The print page used to hash the WHOLE note API object plus the edit-log count: approvedAt (a new timestamp on every
 * approval), the check-list / applied-rule metadata, the aşı kartı snapshot and the edit counter. Re-approving a note
 * without changing a word therefore produced a new hash and the red "kayıtlı Rev. 0 sürümünden farklı" banner.
 *
 * The stamp certifies what is PRINTED, so only the printed clinical content goes in — never timestamps, counters or
 * side data. Approval state is a boolean (a draft prints "TASLAK"), not the approval time. Same printed content =
 * same hash = same revision; a real change in any printed field = a new revision (reason asked, as before).
 */

type Obje = Record<string, unknown>

/** Fields of the note API object that the muayene report prints. */
export const MUAYENE_RAPORU_BASILAN_ALANLAR = [
  'specialty', 'createdAt', 'protokolNo', 'basvuruYakinmasi', 'subjektif', 'objektif', 'degerlendirme', 'plan', 'tani',
  'receteOnerisi', 'icdKodlari', 'alarmBulgulari', 'vitaller', 'hastaOzeti',
] as const

const BUYUME_BASILAN = ['kilo', 'boy', 'basCevresi', 'vki', 'vkiSinif', 'uyari'] as const

function sec(o: unknown, anahtarlar: readonly string[]): Obje | null {
  if (!o || typeof o !== 'object') return null
  const k: Obje = {}
  for (const a of anahtarlar) {
    const v = (o as Obje)[a]
    if (v !== undefined && v !== null && v !== '') k[a] = v
  }
  return Object.keys(k).length ? k : null
}

export function muayeneRaporuKunyeIcerigi(not: unknown, hasta: { ad?: string | null; dogum?: string | null } | null | undefined): Obje {
  const n = (not && typeof not === 'object' ? not : {}) as Obje
  const eriskin = n.eriskinVki && typeof n.eriskinVki === 'object' ? (n.eriskinVki as Obje).ozet : null
  return {
    not: sec(n, MUAYENE_RAPORU_BASILAN_ALANLAR) || {},
    buyume: sec(n.buyumePersentilleri, BUYUME_BASILAN),
    eriskinVki: typeof eriskin === 'string' ? eriskin : null,
    onayli: Boolean(n.approvedAt),
    hasta: { ad: hasta?.ad || '', dogum: hasta?.dogum || '' },
  }
}
