/**
 * SES-OMURGA-V2 (C, Kaan 2026-10-29) — per-call ASR keywords (ElevenLabs `overrides.asr.keywords`, at most 50).
 *
 * Scribe misheard "Ayşe Hocam" as "Aşı hocam" and a patient's name as an unrelated word on 10-25/26. Boosting the words
 * this call will contain: the assistant's name and address form, the OPEN patient's name, their active medicines and
 * diagnoses, and the drug names pediatric doctors say most. HASTA-IZOLASYON-01: the patient's words come only from the
 * doctor-scoped chart package of a patient the caller has already proved is this doctor's. Pure helpers + one builder.
 */
import type { HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart'

export const ASR_ANAHTAR_AZAMI = 50

/** Drug names Turkish pediatric doctors say most (generic + common brand forms). Static, no patient data. */
export const PEDIATRI_ILACLARI = [
  'amoksisilin', 'klavulanik asit', 'Augmentin', 'parasetamol', 'Calpol', 'ibuprofen', 'Pedifen', 'azitromisin',
  'klaritromisin', 'sefdinir', 'sefiksim', 'sefuroksim', 'seftriakson', 'salbutamol', 'Ventolin', 'budesonid',
  'Pulmicort', 'prednizolon', 'deksametazon', 'setirizin', 'desloratadin', 'montelukast', 'demir sülfat',
  'D vitamini', 'ondansetron', 'domperidon', 'probiyotik', 'nistatin', 'oral rehidratasyon',
]

function temizle(k: string): string {
  return String(k || '').replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s'-]/gu, '').trim().slice(0, 40)
}

/** Drug names out of the card's "Sürekli ilaç" line ("Ventolin 2 puf, Augmentin 5 ml · …"). */
export function ilacAdlari(satir: string | null | undefined): string[] {
  return String(satir || '')
    .split(/[,;·\n]|\s+-\s+/)
    .map((p) => p.trim().split(/\s+/).filter((w) => !/\d/.test(w) && !/^(mg|ml|gr|g|puf|damla|tablet|ölçek|olcek|günde|gunde|x)$/i.test(w)).slice(0, 2).join(' '))
    .map(temizle)
    .filter((w) => w.length >= 3)
}

/** Diagnosis words out of the card's "Kronik" / "Son tanı" lines ("Astım (J45) · Atopik dermatit"). */
export function taniAdlari(satir: string | null | undefined): string[] {
  return String(satir || '')
    .split(/[,;·\n]/)
    .map((p) => temizle(p.replace(/\([^)]*\)/g, '')))
    .filter((w) => w.length >= 3 && !/^(kayıt yok|kayıtlı değil)$/i.test(w))
}

/** The call's keyword list: assistant first, then the patient, then common drugs. De-duplicated, ≤ 50. */
export function asrAnahtarKelimeleri(g: { asistanAdi?: string | null; temel?: string[]; hastaAdi?: string | null; kart?: Partial<HastaDosyaKart> | null }): string[] {
  const out: string[] = []
  const ekle = (k: string) => {
    const t = temizle(k)
    if (t.length >= 2 && !out.some((x) => x.toLocaleLowerCase('tr-TR') === t.toLocaleLowerCase('tr-TR'))) out.push(t)
  }
  for (const k of g.temel || []) ekle(k)
  if (g.asistanAdi) { ekle(g.asistanAdi); ekle(`${g.asistanAdi} Hocam`) }
  if (g.hastaAdi) {
    ekle(g.hastaAdi)
    for (const p of String(g.hastaAdi).split(/\s+/)) ekle(p)
  }
  for (const k of ilacAdlari(g.kart?.ilaclar)) ekle(k)
  for (const k of ilacAdlari(g.kart?.sonRecete)) ekle(k)
  for (const k of taniAdlari(g.kart?.kronik)) ekle(k)
  for (const k of taniAdlari(g.kart?.sonTani)) ekle(k)
  for (const k of PEDIATRI_ILACLARI) ekle(k)
  return out.slice(0, ASR_ANAHTAR_AZAMI)
}
