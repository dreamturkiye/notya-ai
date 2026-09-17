/**
 * Doktor Araçları catalog — shared spine + chapter-only tiles.
 *
 * Rule (.cursor/skills/specialty-doktor-araclari/SKILL.md):
 * Doktor araçları specific specialty için olmalı.
 * Göz hastalıkları araçlarında dahiliye olmamalı; KD'de göz hastalıkları araçları olmamalı.
 *
 * Shared tools (e-reçete, ICD-10, …) appear for every branş.
 * Chapter tiles (audit HTML, dahiliye kohort, …) appear only for that doctor's specialty.
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

/** Universal tools — every specialty. */
export const ORTAK_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#0F9B8E', icon: 'Rx', title: 'e-Reçete Asistanı', desc: 'Elektronik reçete oluştur ve SGK entegrasyonunu tamamla', route: '/doktor-tools/erecete', branslar: null },
  { circleColor: '#8B5CF6', icon: 'EP', title: 'Epikriz Üretici', desc: 'Hasta özetlerini otomatik oluştur ve profesyonel epikriz raporları hazırla', route: '/doktor-tools/epikriz', branslar: null },
  { circleColor: '#F59E0B', icon: 'IK', title: 'ICD-10 Kodlayıcı', desc: 'Türkçe tanı girişiyle anlık ICD-10 kodlama', route: '/doktor-tools/icd10', branslar: null },
  { circleColor: '#EF4444', icon: 'II', title: 'İlaç Etkileşimi', desc: 'Reçetedeki ilaç etkileşimlerini kontrol et ve uyarıları görüntüle', route: '/doktor-tools/ilac-interaksiyon', branslar: null },
  { circleColor: '#166534', icon: 'HR', title: 'Hasta Raporları', desc: 'SGK e-İstirahat / e-Rapor + muayenehane belgesi (Gökhan pediatri revizyonu)', route: '/doktor-tools/sgk-rapor', branslar: null },
  { circleColor: '#EA580C', icon: 'TX', title: 'Tetkik İstek', desc: 'Lab ve görüntüleme istek formu oluştur', route: '/doktor-tools/tetkik', branslar: null },
  { circleColor: '#0284C7', icon: 'HP', title: 'Hasta Portalı', desc: 'Hastalara güvenli portal erişimi ver', route: '/doktor-tools/hasta-portali', branslar: null },
  { circleColor: '#DC2626', icon: 'SG', title: 'SGK Medula', desc: 'E-reçete ve provizyon sorgulama entegrasyonu', route: '/doktor-tools/sgk-medula', branslar: null },
  { circleColor: '#0F9B8E', icon: 'EN', title: 'e-Nabız Format', desc: 'FHIR/Medula/USS paketleri — canlı bağlantı yok, format-hazır çıktı', route: '/doktor-tools/enabiz', branslar: null },
]

/** Chapter-owned tiles — never shown outside that branş. */
export const BRANS_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#F59E0B', icon: 'KD', title: 'KD Audit (pre-sprint)', desc: 'Gaps + comments before wow sprint — Gökhan paylaşımı', route: '/kd-jine-presprint-audit.html', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#7C3AED', icon: 'KD+', title: 'KD Audit (post-sprint)', desc: 'After JINE-04: all domains Strong', route: '/kd-jine-post-sprint-audit.html', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#0F9B8E', icon: 'DAH', title: 'Dahiliye Audit (pre-wow)', desc: 'DAH-01 vs TR private wow bar — TİHUD/Harrison/TEMD + HYP', route: '/dahiliye-presprint-audit.html', branslar: ['dahiliye'] },
  { circleColor: '#7C3AED', icon: 'DAH+', title: 'Dahiliye Audit (post-sprint)', desc: 'DAH-WOW Waves 0–4 — domain rating by the Strong rubric', route: '/dahiliye-post-sprint-audit.html', branslar: ['dahiliye'] },
  { circleColor: '#F59E0B', icon: 'DAH!', title: 'Dahiliye Gaps (remaining)', desc: 'After 22/22 Strong — OP/Diabetes, PROMPTS-FU, WOW-NEXT, field beta', route: '/dahiliye-gaps-audit.html', branslar: ['dahiliye'] },
  { circleColor: '#0891B2', icon: 'KH', title: 'Dahiliye Kohort Paneli', desc: 'HbA1c >9 · KB/LDL hedef dışı · eGFR <45 · gecikmiş görevler · 1-tap hatırlatma', route: '/doktor-tools/dahiliye-kohort', branslar: ['dahiliye'] },
  { circleColor: '#3B82F6', icon: 'GÖZ', title: 'Göz Audit (pre-sprint)', desc: 'Before the Göz chapter — TOD/SB/SGK × 8-hour poliklinik', route: '/goz-presprint-audit.html', branslar: ['goz-hastaliklari'] },
  { circleColor: '#7C3AED', icon: 'GÖZ+', title: 'Göz Audit (post-sprint)', desc: 'Göz chapter + Sağlığım Gözlerim — domain depth, portal honesty pass', route: '/goz-post-sprint-audit.html', branslar: ['goz-hastaliklari'] },
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
