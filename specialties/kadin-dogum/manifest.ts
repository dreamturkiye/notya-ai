/**
 * Kadın Hastalıkları ve Doğum chapter manifest.
 * Registration in the shell is documented in README.md — this file is not imported by the app yet.
 */
import type { VisitType } from './types'
import { CLINIC_UNITS } from './schema'

export const KADIN_DOGUM_MANIFEST = {
  id: 'kadin-dogum' as const,
  displayName: 'Kadın Hastalıkları ve Doğum',
  books: [
    { id: 'acog', role: 'pratik_altin_standart_tr_hekim', title: 'ACOG Practice Bulletin / Committee Opinion / Obstetric Care Consensus', year: 2024 },
    { id: 'dobyr-2026', role: 'yasal_taban_sb', title: 'T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi', year: 2026 },
    { id: 'dsbyr', role: 'yasal_taban_sb', title: 'Doğum Sonu Bakım Yönetim Rehberi', year: 2018 },
    { id: 'riskli-gebelikler', role: 'yasal_taban_sb', title: 'Riskli Gebelikler Yönetim Rehberi', year: 2014 },
    { id: 'williams-26', role: 'obstetrik_ders_kitabi', title: 'Williams Obstetrik 26', year: 2025 },
    { id: 'berek-novak-16-17', role: 'jinekoloji-gold', title: 'Berek & Novak Jinekoloji 16–17', year: 2020 },
    { id: 'temel-kd-4', role: 'ulusal-tr', title: 'Temel Kadın Hastalıkları ve Doğum Bilgisi 4. baskı (Hacettepe)', year: 2020 },
  ],
  visitTypes: [
    'gebe',
    'jinekoloji',
    'usg',
    'nst',
    'kolposkopi',
    'infertilite',
    'perinatoloji-sevk',
    'travay',
    'dogum',
    'lohusa',
    'acil',
    'gebe-okulu',
    'gorsel-analiz',
    'asistan-gozden-gecirme',
  ] as const satisfies readonly VisitType[],
  units: CLINIC_UNITS,
  imagingCapabilities: {
    usg: true,
    nstCtg: true,
    kolposkopi: true,
    hsg: true,
    asistanVision: true,
    dualSignAsistanUzman: true,
  },
  toolsWhitelist: [
    'current_ga',
    'izlem_calendar',
    'test_windows',
    'anti_d_due',
    'usg_gallery',
    'evaluate_pe',
    'evaluate_gdm',
    'evaluate_rh',
    'kd.list_usg_series',
    'kd.get_usg',
    'kd.compare_growth',
    'kd.analyze_usg',
    'kd.analyze_nst',
    'kd.request_dual_review',
  ],
  tabs: [
    'GebeKarti',
    'IzlemTimeline',
    'UsgGallery',
    'UsgCompare',
    'TaramaPencereleri',
    'JinekolojiKart',
    'AsistanGorselPanel',
    'NstStrip',
  ],
  bridges: ['dogum-yenidogan'] as const,
}

export type KadinDogumManifest = typeof KADIN_DOGUM_MANIFEST
