/**
 * Doktor Araçları catalog — commercial product surface for every paying doctor.
 *
 * Rules (.cursor/skills/specialty-doktor-araclari/SKILL.md):
 * - Shared spine tools → every branş.
 * - Chapter clinical tools → that doctor's specialty only (no cross-leak).
 * - Never put internal sprint audits, gap HTML, or named beta-doctor copy in this grid.
 *   Notya is a commercial app — not one clinic's private toolbox.
 */
import { portalBransAnahtari } from '@/lib/portal/moduller'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type DoktorArac = {
  circleColor: string
  icon: string
  title: string
  desc: string
  route: string
  /** null = universal spine tool; otherwise only those SpecialtyKey values see the tile. */
  branslar: SpecialtyKey[] | null
}

/** Universal tools — every specialty. Doctor-facing copy only. */
export const ORTAK_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#0F9B8E', icon: 'Rx', title: 'e-Reçete Asistanı', desc: 'Elektronik reçete oluştur ve SGK entegrasyonunu tamamla', route: '/doktor-tools/erecete', branslar: null },
  { circleColor: '#8B5CF6', icon: 'EP', title: 'Epikriz Üretici', desc: 'Hasta özetlerini otomatik oluştur ve profesyonel epikriz raporları hazırla', route: '/doktor-tools/epikriz', branslar: null },
  { circleColor: '#F59E0B', icon: 'IK', title: 'ICD-10 Kodlayıcı', desc: 'Türkçe tanı girişiyle anlık ICD-10 kodlama', route: '/doktor-tools/icd10', branslar: null },
  { circleColor: '#EF4444', icon: 'II', title: 'İlaç Etkileşimi', desc: 'Reçetedeki ilaç etkileşimlerini kontrol et ve uyarıları görüntüle', route: '/doktor-tools/ilac-interaksiyon', branslar: null },
  { circleColor: '#166534', icon: 'HR', title: 'Hasta Raporları', desc: 'SGK e-İstirahat / e-Rapor ve muayenehane belgesi oluştur', route: '/doktor-tools/sgk-rapor', branslar: null },
  { circleColor: '#EA580C', icon: 'TX', title: 'Tetkik İstek', desc: 'Lab ve görüntüleme istek formu oluştur', route: '/doktor-tools/tetkik', branslar: null },
  { circleColor: '#0284C7', icon: 'HP', title: 'Hasta Portalı', desc: 'Hastalara güvenli portal erişimi ver', route: '/doktor-tools/hasta-portali', branslar: null },
  { circleColor: '#DC2626', icon: 'SG', title: 'SGK Medula', desc: 'E-reçete ve provizyon sorgulama entegrasyonu', route: '/doktor-tools/sgk-medula', branslar: null },
  { circleColor: '#0F9B8E', icon: 'EN', title: 'e-Nabız Format', desc: 'FHIR/Medula/USS paketleri — canlı bağlantı yok, format-hazır çıktı', route: '/doktor-tools/enabiz', branslar: null },
]

/**
 * Chapter clinical tools only (kohort, specialty calculators, …).
 * Internal audit HTML / pre-sprint / post-sprint / wow-gap pages do NOT belong here —
 * keep those in docs/ or repo paths, never on /doktor-tools.
 */
export const BRANS_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#0891B2', icon: 'KH', title: 'Dahiliye Kohort Paneli', desc: 'HbA1c >9 · KB/LDL hedef dışı · eGFR <45 · gecikmiş görevler · 1-tap hatırlatma', route: '/doktor-tools/dahiliye-kohort', branslar: ['dahiliye'] },
]

export const TUM_DOKTOR_ARACLARI: readonly DoktorArac[] = [...ORTAK_DOKTOR_ARACLARI, ...BRANS_DOKTOR_ARACLARI]

export function doktorAracBransi(ham: string | null | undefined): SpecialtyKey | null {
  return portalBransAnahtari(ham)
}

/** True when this doctor may open a chapter-only araç route (deep-link guard). */
export function doktorAraciBransaUygun(
  route: string,
  doktorBransi: string | null | undefined,
): boolean {
  const arac = TUM_DOKTOR_ARACLARI.find((a) => a.route === route)
  if (!arac) return true // unknown / shared subpages (hedef-boy, hatirlatma, …) use their own gates
  if (!arac.branslar) return true
  const key = doktorAracBransi(doktorBransi)
  return !!key && arac.branslar.includes(key)
}

/** Filtered Araçlar grid for /doktor-tools. */
export function doktorAraclariListesi(doktorBransi: string | null | undefined): DoktorArac[] {
  const key = doktorAracBransi(doktorBransi)
  return TUM_DOKTOR_ARACLARI.filter((a) => {
    if (!a.branslar) return true
    return !!key && a.branslar.includes(key)
  })
}
