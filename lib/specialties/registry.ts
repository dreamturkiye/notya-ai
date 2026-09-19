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
import { KARDIOLOJI_PROFILE } from './kardiyoloji'
import { NOROLOJI_PROFILE } from './noroloji'
import { GOGUS_HASTALIKLARI_PROFILE } from './gogus-hastaliklari'
import { UROLOJI_PROFILE } from './uroloji'
import { FIZIK_TEDAVI_PROFILE } from './fizik-tedavi'
import { ORTOPEDI_PROFILE } from './ortopedi'
import { AILE_HEKIMLIGI_PROFILE } from './aile-hekimligi'
import { SPOR_HEKIMLIGI_PROFILE } from './spor-hekimligi'
import { ENDOKRINOLOJI_PROFILE } from './endokrinoloji'
import { GASTROENTEROLOJI_PROFILE } from './gastroenteroloji'
import { NEFROLOJI_PROFILE } from './nefroloji'
import { ENFEKSIYON_HASTALIKLARI_PROFILE } from './enfeksiyon-hastaliklari'
import { ROMATOLOJI_PROFILE } from './romatoloji'
import { ONKOLOJI_PROFILE } from './onkoloji'
import { GENEL_CERRAHI_PROFILE } from './genel-cerrahi'
import { PLASTIK_CERRAHI_PROFILE } from './plastik-cerrahi'
import { GOGUS_CERRAHISI_PROFILE } from './gogus-cerrahisi'
import { BEYIN_CERRAHISI_PROFILE } from './beyin-cerrahisi'
import { COCUK_CERRAHISI_PROFILE } from './cocuk-cerrahisi'

const CHAPTERS: Partial<Record<SpecialtyKey, SpecialtyProfile>> = {
  pediatri: PEDIATRI_PROFILE,
  'kadin-hastaliklari-dogum': KADIN_DOGUM_PROFILE,
  dermatoloji: DERMATOLOJI_PROFILE,
  dahiliye: DAHILIYE_PROFILE,
  'goz-hastaliklari': GOZ_PROFILE,
  psikiyatri: PSIKIYATRI_PROFILE,
  'kulak-burun-bogaz': KULAK_BURUN_BOGAZ_PROFILE,
  kardiyoloji: KARDIOLOJI_PROFILE,
  noroloji: NOROLOJI_PROFILE,
  'gogus-hastaliklari': GOGUS_HASTALIKLARI_PROFILE,
  uroloji: UROLOJI_PROFILE,
  'fizik-tedavi': FIZIK_TEDAVI_PROFILE,
  ortopedi: ORTOPEDI_PROFILE,
  endokrinoloji: ENDOKRINOLOJI_PROFILE,
  gastroenteroloji: GASTROENTEROLOJI_PROFILE,
  nefroloji: NEFROLOJI_PROFILE,
  'enfeksiyon-hastaliklari': ENFEKSIYON_HASTALIKLARI_PROFILE,
  romatoloji: ROMATOLOJI_PROFILE,
  onkoloji: ONKOLOJI_PROFILE,
  'genel-cerrahi': GENEL_CERRAHI_PROFILE,
  'plastik-cerrahi': PLASTIK_CERRAHI_PROFILE,
  'gogus-cerrahisi': GOGUS_CERRAHISI_PROFILE,
  'beyin-cerrahisi': BEYIN_CERRAHISI_PROFILE,
  'cocuk-cerrahisi': COCUK_CERRAHISI_PROFILE,
  'aile-hekimligi': AILE_HEKIMLIGI_PROFILE,
  'spor-hekimligi': SPOR_HEKIMLIGI_PROFILE,
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
