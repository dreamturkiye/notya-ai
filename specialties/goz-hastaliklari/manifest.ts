/**
 * Göz Hastalıkları chapter manifest — served through lib/specialties/goz-hastaliklari.ts (registry).
 * Books are role-cited only; TR yasal/dernek sources outrank international texts (protocols/sources.ts).
 */
import type { VisitType, ClinicUnit } from './types'

export const GOZ_MANIFEST = {
  id: 'goz-hastaliklari' as const,
  displayName: 'Göz Hastalıkları',
  books: [
    { id: 'sut-4233', role: 'tr-yasal', title: 'SGK SUT 4.2.33 Göz hastalıklarında ilaç kullanım ilkeleri', year: 2026 },
    { id: 'tod-birimler', role: 'tr-dernek', title: 'TOD Retina-Vitreus / Glokom / Kornea / Pediatrik Oftalmoloji ve Şaşılık birimleri', year: 2026 },
    { id: 'temd-dm-2026', role: 'tr-dernek', title: 'TEMD Diabetes Mellitus Kılavuzu 17. baskı — retinopati taraması', year: 2026 },
    { id: 'sb-gorme-taramasi', role: 'tr-yasal', title: 'SB Ulusal Görme Taraması Programı Genelgesi 2019/17', year: 2019 },
    { id: 'ico-dr-2017', role: 'uluslararasi', title: 'ICO Guidelines for Diabetic Eye Care', year: 2017 },
    { id: 'egs-5', role: 'uluslararasi', title: 'EGS Terminology and Guidelines for Glaucoma 5th', year: 2020 },
    { id: 'kanski', role: 'ders-kitabi', title: "Kanski's Clinical Ophthalmology", year: 2024 },
    { id: 'vaughan', role: 'ders-kitabi', title: 'Vaughan & Asbury General Ophthalmology', year: 2018 },
    { id: 'aao-bcsc', role: 'ders-kitabi', title: 'AAO Basic and Clinical Science Course', year: 2025 },
  ],
  visitTypes: ['genel-poliklinik', 'glokom', 'retina', 'enjeksiyon', 'katarakt-preop', 'kornea-on-segment', 'pediatrik-sasilik', 'acil'] as const satisfies readonly VisitType[],
  units: ['genel', 'glokom', 'retina', 'katarakt-refraktif', 'kornea', 'pediatrik-sasilik'] as const satisfies readonly ClinicUnit[],
  imagingCapabilities: { oct: true, fundus: true, onSegment: true, zamanCizgisi: true, dualSignAsistanUzman: true, ayseOtomatikOkuma: false },
  tabs: ['GozSerit', 'Ozet', 'Glokom', 'DR', 'Enjeksiyon', 'Katarakt', 'Goruntu', 'OnSegment', 'Pediatrik', 'SgkRapor', 'Kontrol'],
  bridges: ['dahiliye-dm-goz-dibi', 'pediatri-gorme-taramasi'] as const,
}
export type GozManifest = typeof GOZ_MANIFEST
