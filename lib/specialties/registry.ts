/**
 * NOTYA-REGISTRY-01 — single lookup: `specialtyProfile('dermatoloji')` returns that chapter,
 * or the baseline chapter when the specialty hasn't been built yet. Callers never branch on
 * the key themselves.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { resmiUzmanlikAdi } from '@/lib/doktor/bransAdlari'
import { baselineProfile, type SpecialtyProfile } from './profile'
import { PEDIATRI_PROFILE } from './pediatri'
import { KADIN_DOGUM_PROFILE } from './kadin-dogum'

const CHAPTERS: Partial<Record<SpecialtyKey, SpecialtyProfile>> = {
  pediatri: PEDIATRI_PROFILE,
  'kadin-hastaliklari-dogum': KADIN_DOGUM_PROFILE,
}

export function specialtyProfile(keyHam: string | null | undefined): SpecialtyProfile {
  const key = (keyHam || 'pediatri') as SpecialtyKey
  const chapter = CHAPTERS[key]
  if (chapter) return chapter
  return baselineProfile(key, BRANS_ETIKETLERI[key] || key, resmiUzmanlikAdi(key))
}

/** For dashboards/ledger: which chapters exist and how mature each is. */
export function chapterMaturity(): Array<{ key: SpecialtyKey; olgunluk: SpecialtyProfile['olgunluk'] }> {
  return (Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]).map((key) => ({
    key, olgunluk: CHAPTERS[key]?.olgunluk ?? 'baseline',
  }))
}

export type { SpecialtyProfile } from './profile'
