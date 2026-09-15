/**
 * Doctor-facing Turkish labels for Kadın-Doğum enums.
 * Keep engine tokens unchanged; only humanize what the clinician sees.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const KD_EPISODE_STATUS: Record<string, string> = {
  gebe: 'Aktif gebelik',
  lohusa: 'Lohusa',
  kapandi: 'Kapandı',
  aktif: 'Aktif gebelik',
  tamamlandi: 'Doğum ile tamamlandı',
  sonlandi: 'Sonlandı',
}

export const KD_RISK_CLASS: Record<string, string> = {
  dusuk: 'Düşük',
  orta: 'Orta',
  yuksek: 'Yüksek',
}

export const KD_PLURALITY: Record<string, string> = {
  singleton: 'Tekil',
  twins: 'İkiz',
  higher: 'Çoğul',
}

export const KD_IDC: Record<string, string> = {
  positive: 'Pozitif',
  negative: 'Negatif',
  unknown: 'Bilinmiyor',
  not_tested: 'Test edilmedi',
}

export const KD_GA_LOCK: Record<string, string> = {
  sat: 'SAT',
  crl: 'CRL (USG)',
}

export const KD_WINDOW_STATUS: Record<string, string> = {
  done: 'Yapıldı',
  open: 'Açık',
  overdue: 'Gecikmiş',
  not_yet: 'Henüz değil',
}

export const KD_USG_KIND: Record<string, string> = {
  erken_tv: 'Erken transvajinal USG',
  nt_11_14: '11–14. hafta NT',
  ayrintili_18_22: '18–22. hafta ayrıntılı USG',
  buyume: 'Büyüme USG',
  doppler: 'Doppler',
  prezentasyon: 'Prezentasyon',
  '3d4d_hatira': '3D/4D (tanısal değil)',
}

export const KD_FETUS_STATUS: Record<string, string> = {
  ongoing: 'Devam ediyor',
  demise: 'Intrauterin kayıp',
  delivered: 'Doğdu',
  unknown: 'Bilinmiyor',
}

export const KD_VISION_STATUS: Record<string, string> = {
  draft: 'Taslak',
  uzman_onayli: 'Uzman onaylı',
  red: 'Reddedildi',
}

export const KD_VISION_TASK: Record<string, string> = {
  erken_canlilik: 'Erken canlılık',
  nt_olcum: 'NT ölçümü',
  anomali_checklist: 'Anomali kontrol listesi',
  buyume_efw: 'Büyüme / EFW',
  doppler: 'Doppler',
}

export const KD_ACTOR: Record<string, string> = {
  asistan: 'Asistan',
  uzman: 'Uzman',
}

export const KD_NST_CATEGORY: Record<string, string> = {
  I: 'Kategori I',
  II: 'Kategori II',
  III: 'Kategori III',
}

export function looksLikeRecordId(value: string): boolean {
  return UUID_RE.test(value) || /^[0-9a-f]{32}$/i.test(value)
}

export function kdLabel(map: Record<string, string>, value: string | null | undefined, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (map[value]) return map[value]
  if (looksLikeRecordId(value)) return fallback
  return value
}
