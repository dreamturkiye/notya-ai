/**
 * NOTYA-REGISTRY-01 — single lookup: `specialtyProfile('dermatoloji')` returns that chapter,
 * or the baseline chapter when the specialty hasn't been built yet. Callers never branch on
 * the key themselves.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { resmiUzmanlikAdi } from '@/lib/doktor/bransAdlari'
import { baselineProfile, type SpecialtyProfile } from './profile'
import { bransAnahtari } from './bransAnahtari'
import { PEDIATRI_PROFILE } from './pediatri'
import { KADIN_DOGUM_PROFILE } from './kadin-dogum'
import { DERMATOLOJI_PROFILE } from './dermatoloji'
import { DAHILIYE_PROFILE } from './dahiliye'
import { GOZ_PROFILE } from './goz-hastaliklari'
import { PSIKIYATRI_PROFILE } from './psikiyatri'
import { KULAK_BURUN_BOGAZ_PROFILE } from './kulak-burun-bogaz'

const CHAPTERS: Partial<Record<SpecialtyKey, SpecialtyProfile>> = {
  pediatri: PEDIATRI_PROFILE,
  'kadin-hastaliklari-dogum': KADIN_DOGUM_PROFILE,
  dermatoloji: DERMATOLOJI_PROFILE,
  dahiliye: DAHILIYE_PROFILE,
  'goz-hastaliklari': GOZ_PROFILE,
  psikiyatri: PSIKIYATRI_PROFILE,
  'kulak-burun-bogaz': KULAK_BURUN_BOGAZ_PROFILE,
}

export function specialtyProfile(keyHam: string | null | undefined): SpecialtyProfile {
  // BRANS-ALAN-SIZMASI: branşı bilinmeyen hekim pediatri DEĞİLDİR — "genel" baseline'a düşer
  // (eskiden `|| 'pediatri'` idi: branşsız hesap pediatri bölümünü miras alıyordu).
  const raw = (keyHam || '').trim() || 'genel'
  // KD-ISIMLENDIRME-01: 'kadin-dogum' (canlı users.specialty) ve serbest metin tek çözücüden kanonik anahtara gelir.
  const key = (bransAnahtari(raw) ?? raw) as SpecialtyKey
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
