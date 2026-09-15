/**
 * Kadın Hastalıkları ve Doğum chapter manifest.
 * Registration in the shell is documented in README.md — this file is not imported by the app yet.
 */
import type { VisitType } from './types'

export const KADIN_DOGUM_MANIFEST = {
  id: 'kadin-dogum' as const,
  displayName: 'Kadın Hastalıkları ve Doğum',
  books: [
    { id: 'williams-26', role: 'obstetrik-gold', title: 'Williams Obstetrik 26', year: 2025 },
    { id: 'berek-novak-16-17', role: 'jinekoloji-gold', title: 'Berek & Novak Jinekoloji 16–17', year: 2020 },
    { id: 'temel-kd-4', role: 'ulusal-tr', title: 'Temel Kadın Hastalıkları ve Doğum Bilgisi 4. baskı (Hacettepe)', year: 2020 },
    { id: 'dobyr-2026', role: 'zorunlu-kamu', title: 'T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi', year: 2026 },
    { id: 'dsbyr', role: 'zorunlu-kamu', title: 'Doğum Sonu Bakım Yönetim Rehberi', year: 2018 },
    { id: 'riskli-gebelikler', role: 'zorunlu-kamu', title: 'Riskli Gebelikler Yönetim Rehberi', year: 2014 },
  ],
  visitTypes: ['gebe', 'jinekoloji', 'usg', 'dogum', 'lohusa'] as const satisfies readonly VisitType[],
  toolsWhitelist: [
    'current_ga',
    'izlem_calendar',
    'test_windows',
    'anti_d_due',
    'usg_gallery',
    'evaluate_pe',
    'evaluate_gdm',
    'evaluate_rh',
  ],
  tabs: ['GebeKarti', 'IzlemTimeline', 'UsgGallery', 'TaramaPencereleri', 'JinekolojiKart'],
  bridges: ['dogum-yenidogan'] as const,
}

export type KadinDogumManifest = typeof KADIN_DOGUM_MANIFEST
