/**
 * Deri ve Zührevi Hastalıklar chapter manifest.
 * Registration in the shell is documented in README.md — this file is not imported by the app yet.
 */
import type { VisitType } from './types'
import { CLINIC_UNITS } from './schema'

export const DERMATOLOJI_MANIFEST = {
  id: 'dermatoloji' as const,
  displayName: 'Deri ve Zührevi Hastalıklar',
  books: [
    { id: 'bolognia-5', role: 'gold', title: 'Bolognia Dermatology 5th', year: 2024 },
    { id: 'andrews-14-tr', role: 'clinic-atlas', title: 'Andrews Deri Hastalıkları 14 TR', year: 2026 },
    { id: 'temel-derm', role: 'ulusal-tr', title: 'Temel Dermatoloji (Gürel, Koku Aksu, Durdu, Erdemir, Karadağ)', year: 2020 },
    { id: 'psokid-2025', role: 'society', title: 'PSOKİD Psoriasis Rehberi', year: 2025 },
    { id: 'tdd-ad-2018', role: 'society', title: 'TDD Atopik Dermatit', year: 2018 },
    { id: 'tukmos-2019', role: 'training', title: 'TUKMOS Deri ve Zührevi Hastalıkları çekirdek müfredat', year: 2019 },
  ],
  visitTypes: [
    'genel-poliklinik',
    'yandal',
    'islem',
    'fototerapi',
    'allerji-yama',
    'sac',
    'onkoloji-nevus',
    'yatis',
    'konsultasyon',
    'acil',
    'kozmetik',
    'gorsel-analiz',
    'asistan-gozden-gecirme',
  ] as const satisfies readonly VisitType[],
  units: CLINIC_UNITS,
  imagingCapabilities: {
    klinikFoto: true,
    dermoskopiManuel: true,
    dermoskopiDijital: true,
    totalBodyMap: true,
    beforeAfter: true,
    asistanVision: true,
    dualSignAsistanUzman: true,
  },
  toolsWhitelist: [
    'derm.list_series',
    'derm.get_images',
    'derm.compare_before_after',
    'derm.analyze_image',
    'derm.pin_to_body_map',
    'derm.attach_to_visit',
    'derm.request_dual_review',
  ],
  tabs: [
    'LezyonKarti',
    'VucutHaritasi',
    'FotoDermoskopiGaleri',
    'BeforeAfterCompare',
    'AsistanGorselPanel',
    'SkorPaneli',
    'FototerapiDefteri',
    'YamaTakvimi',
  ],
  bridges: ['derm-pediatri', 'derm-kadin-dogum', 'derm-romatoloji'] as const,
}

export type DermatolojiManifest = typeof DERMATOLOJI_MANIFEST
