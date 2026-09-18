/**
 * Canonical imaging / PACS modalities for hasta_goruntulemeler + Sağlığım filters.
 * UI may send display labels; we always persist the canonical `code`.
 */

import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type ImagingModalityCode =
  | 'xray'
  | 'mri'
  | 'bt'
  | 'us'
  | 'pet'
  | 'ekg'
  | 'eko'
  | 'mamografi'
  | 'diger'
  | 'dermatoskopi'
  | 'derm'
  | 'yara'
  | 'oct'
  | 'fundus'
  | 'on_segment'

export type ImagingPortalKind = 'goruntuleme' | 'ekg' | 'diger'

export type ImagingModality = {
  code: ImagingModalityCode
  /** Doctor upload chip / stored display when needed */
  label: string
  /** Short Turkish label for patient portal */
  patientLabel: string
  portalKind: ImagingPortalKind
  color: string
}

/** Popular PACS-style modalities used in Turkish outpatient practice. */
export const IMAGING_MODALITIES: ImagingModality[] = [
  { code: 'xray', label: 'Röntgen', patientLabel: 'Röntgen', portalKind: 'goruntuleme', color: '#3b82f6' },
  { code: 'mri', label: 'MRI', patientLabel: 'MR', portalKind: 'goruntuleme', color: '#a855f7' },
  { code: 'bt', label: 'BT', patientLabel: 'BT (Tomografi)', portalKind: 'goruntuleme', color: '#f59e0b' },
  { code: 'us', label: 'Ultrason', patientLabel: 'Ultrason', portalKind: 'goruntuleme', color: '#22c55e' },
  { code: 'eko', label: 'EKO', patientLabel: 'EKO', portalKind: 'goruntuleme', color: '#0d9488' },
  { code: 'pet', label: 'PET-BT', patientLabel: 'PET-BT', portalKind: 'goruntuleme', color: '#64748b' },
  { code: 'ekg', label: 'EKG', patientLabel: 'EKG', portalKind: 'ekg', color: '#ef4444' },
  { code: 'mamografi', label: 'Mamografi', patientLabel: 'Mamografi', portalKind: 'goruntuleme', color: '#ec4899' },
  { code: 'dermatoskopi', label: 'Dermatoskopi', patientLabel: 'Dermatoskopi', portalKind: 'goruntuleme', color: '#0f766e' },
  { code: 'derm', label: 'Deri fotoğrafı', patientLabel: 'Deri fotoğrafı', portalKind: 'goruntuleme', color: '#14b8a6' },
  { code: 'yara', label: 'Yara / yanık', patientLabel: 'Yara fotoğrafı', portalKind: 'goruntuleme', color: '#f97316' },
  // GOZ-CHAPTER: oftalmik görüntüleme (hasta_goruntulemeler; okuma dual-sign goz_goruntu_okumalari)
  { code: 'oct', label: 'OCT', patientLabel: 'OCT', portalKind: 'goruntuleme', color: '#6366f1' },
  { code: 'fundus', label: 'Fundus fotoğrafı', patientLabel: 'Göz dibi fotoğrafı', portalKind: 'goruntuleme', color: '#dc2626' },
  { code: 'on_segment', label: 'Ön segment fotoğrafı', patientLabel: 'Ön segment fotoğrafı', portalKind: 'goruntuleme', color: '#0891b2' },
  { code: 'diger', label: 'Diğer', patientLabel: 'Diğer görüntüleme', portalKind: 'diger', color: '#6b7280' },
]

const BY_CODE = new Map(IMAGING_MODALITIES.map((m) => [m.code, m]))

/** Map free-text / legacy UI labels → canonical code. */
export function normalizeImagingModality(raw: string | null | undefined): ImagingModalityCode {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  if (!t) return 'diger'

  if (/^(x-?ray|rontgen|röntgen|xr|grafi|pa\b)/.test(t) || t.includes('rontgen') || t.includes('xray')) {
    return 'xray'
  }
  if (/^(mri|mr\b|manyetik)/.test(t) || t.includes('mri')) return 'mri'
  if (/^(bt|ct|tomo)/.test(t) || t.includes('tomografi')) return 'bt'
  if (/^(us|usg|ultrason)/.test(t)) return 'us'
  if (/^(pet)/.test(t)) return 'pet'
  if (/^(ekg|ecg)/.test(t)) return 'ekg'
  if (/^(eko|echo|ekokardiy)/.test(t)) return 'eko'
  if (/^(mamografi|mammo)/.test(t)) return 'mamografi'
  if (/dermatoskopi|dermoskopi/.test(t)) return 'dermatoskopi'
  if (/^derm$|deri foto|deri lezyon|klinik foto/.test(t)) return 'derm'
  if (/^yara|yanik|yanık/.test(t)) return 'yara'
  if (/^oct\b|^okt\b|optik koherens/.test(t)) return 'oct'
  if (/fundus|goz dibi/.test(t)) return 'fundus'
  if (/on segment|on_segment|biyomikroskop|slit/.test(t)) return 'on_segment'
  if (BY_CODE.has(t as ImagingModalityCode)) return t as ImagingModalityCode
  return 'diger'
}

export function imagingModalityMeta(raw: string | null | undefined): ImagingModality {
  const code = normalizeImagingModality(raw)
  return BY_CODE.get(code) || IMAGING_MODALITIES[IMAGING_MODALITIES.length - 1]
}

export function imagingPortalKind(raw: string | null | undefined): ImagingPortalKind {
  return imagingModalityMeta(raw).portalKind
}

export function imagingDisplayLabel(raw: string | null | undefined, audience: 'doctor' | 'patient' = 'doctor'): string {
  const meta = imagingModalityMeta(raw)
  return audience === 'patient' ? meta.patientLabel : meta.label
}

/*
 * GORUNTULEME-BRANS-SIRALI (Kaan, 2026-09-18) — modalite seçicisi hekimin branşına göre SIRALANIR, asla KISITLANMAZ.
 *
 * Bu bir brans-alan-sizmasi kapısı DEĞİLDİR ve öyle "düzeltilmemelidir". O kural bir branşa özgü İÇERİĞİN (baş çevresi,
 * "veli" hitabı) başka branşın formuna SIZMASINI engeller. Görüntüleme modaliteleri ise her hekimin dışarıdan meşru olarak
 * alabileceği ORTAK klinik sözlüktür: katarakt öncesi EKG'si gelen göz hekimi, hastanın elinde getirdiği dış merkez MR'ı
 * yükleyen kardiyolog. Branşa göre gizlemek bu yüklemeleri engeller, hekim yanlış bir modaliteye yazar ve veri kalitesi
 * sessizce bozulur. Bu yüzden: hekimin branşındaki sık modaliteler üstte, geri kalan HER modalite altında seçilebilir.
 * Hiçbir kod düşürülmez; kalıcı sınama: lib/doktor/imagingModalities.test.ts.
 *
 * Yalnız GÖSTERİM SIRASI. Kanonik kod, normalizeImagingModality, portalKind, renk ve saklanan değer değişmez.
 * Eşleme UX tercihidir (klinik eşik/sayı değil); eşlemesi olmayan branş = varsayılan IMAGING_MODALITIES sırası.
 */
export const BRANS_GORUNTULEME_ONCELIGI: Partial<Record<SpecialtyKey, readonly ImagingModalityCode[]>> = {
  'goz-hastaliklari': ['oct', 'fundus', 'on_segment', 'us'], // us = B-scan
  kardiyoloji: ['ekg', 'eko', 'bt', 'xray'], // bt = koroner BT anjiyo
  'kalp-damar-cerrahisi': ['eko', 'bt', 'ekg', 'us', 'xray'], // us = Doppler
  dermatoloji: ['dermatoskopi', 'derm', 'yara'],
  'plastik-cerrahi': ['yara', 'derm'],
  'kadin-hastaliklari-dogum': ['us', 'mamografi', 'mri'],
  dahiliye: ['xray', 'us', 'bt', 'ekg'],
  pediatri: ['xray', 'us', 'ekg'],
  ortopedi: ['xray', 'mri', 'bt', 'us'],
  'fizik-tedavi': ['xray', 'mri', 'us'],
  noroloji: ['mri', 'bt'], // EEG/EMG kanonik modalite değil — OPEN: GORUNTULEME-EEG-EMG
  'beyin-cerrahisi': ['mri', 'bt', 'xray'],
  'gogus-hastaliklari': ['xray', 'bt', 'pet'],
  onkoloji: ['pet', 'bt', 'mri', 'us'],
  radyoloji: ['xray', 'bt', 'mri', 'us', 'mamografi', 'pet'],
  'acil-tip': ['xray', 'bt', 'us', 'ekg'],
  uroloji: ['us', 'bt', 'xray'],
  'genel-cerrahi': ['us', 'bt', 'xray'],
  // Kaan (2026-09-18): aile hekimliği EKG'yi çok kullanır; eşlemesi yokken varsayılan sırada
  // EKG 7. sıraya (PET-BT / mamografi arkasına) düşüyordu. Birinci basamakta sık istenen
  // tetkikler öne alındı. Aşağıdaki dahili branşlar da aynı nedenle eklendi.
  'aile-hekimligi': ['ekg', 'xray', 'us'],
  endokrinoloji: ['us', 'ekg', 'xray'], // us = tiroid USG
  nefroloji: ['us', 'ekg', 'xray'],
  gastroenteroloji: ['us', 'bt', 'mri'],
  romatoloji: ['xray', 'mri', 'us'],
  'enfeksiyon-hastaliklari': ['xray', 'bt', 'us'],
  'spor-hekimligi': ['mri', 'us', 'xray', 'ekg'],
  'gogus-cerrahisi': ['xray', 'bt', 'pet'],
  'cocuk-cerrahisi': ['us', 'xray', 'bt'],
  'kulak-burun-bogaz': ['bt', 'mri', 'us'],
}

export type BransGoruntulemeGruplari = {
  /** Hekimin branşında sık kullanılanlar — eşleme yoksa boş (boş grup başlığı çizilmez). */
  oncelikli: ImagingModality[]
  /** Geri kalan TÜM kanonik modaliteler, varsayılan sırada ('diger' dahil, en sonda). */
  digerleri: ImagingModality[]
}

/**
 * Seçici için iki grup. `brans` kanonik branş anahtarıdır (bkz. bransAnahtari); boş / bilinmeyen / eşlemesiz → oncelikli
 * boş, digerleri = IMAGING_MODALITIES. oncelikli ∪ digerleri her zaman IMAGING_MODALITIES'in tamamıdır — kısıtlamaz.
 */
export function bransGoruntulemeGruplari(brans: string | null | undefined): BransGoruntulemeGruplari {
  const tercih = brans ? BRANS_GORUNTULEME_ONCELIGI[brans as SpecialtyKey] ?? [] : []
  const oncelikli = tercih
    .filter((code, i) => code !== 'diger' && tercih.indexOf(code) === i)
    .map((code) => BY_CODE.get(code))
    .filter((m): m is ImagingModality => !!m)
  const secili = new Set(oncelikli.map((m) => m.code))
  return { oncelikli, digerleri: IMAGING_MODALITIES.filter((m) => !secili.has(m.code)) }
}

/** Branşa göre sıralanmış TAM kod listesi: önce branşın sık modaliteleri, sonra geri kalan her şey. */
export function bransGoruntulemeSirasi(brans: string | null | undefined): ImagingModalityCode[] {
  const { oncelikli, digerleri } = bransGoruntulemeGruplari(brans)
  return [...oncelikli, ...digerleri].map((m) => m.code)
}
