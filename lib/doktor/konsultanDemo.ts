/**
 * Konsültan portalı demo dilimi — canlı jeton olmadan tam görünüm önizlemesi.
 * Sentetik; gerçek hasta / sevk satırı değil.
 */
import type { KonsultanDilim } from '@/lib/doktor/konsultanPortal'

export const KONSULTAN_DEMO_DILIM: KonsultanDilim = {
  brans: 'Kulak Burun Boğaz',
  hekimAdi: 'Dr. Gökhan Mamur',
  hastaAdi: 'Ali Kara',
  soru:
    '24 aylık erkek. Yenidoğan işitme taraması sonrası KBB değerlendirmesi isteniyor. ' +
    'Aile tarafta geç cevap / şüphe bildiriyor. Saf ses odyometri veya ABR gerekir mi? ' +
    'Şimdilik takip yeterli mi?',
  ozgecmis:
    'Term doğum · Yenidoğan işitme taraması (sol şüpheli) · Bilinen kronik hastalık yok · İlaç: D vitamini + probiyotik',
  onayliCumleler: [
    'Başvuru: 24 aylık çocuk sağlığı izlemi; aile işitme kaygısı bildirdi.',
    'Fizik muayene: bilateral kulak zarları doğal; dış kulak yolu açık.',
    'Plan: KBB konsültasyonu; aileye işitme testi gerekebileceği anlatıldı.',
  ],
  istemTarihi: '3 Ekim 2026',
  beklenenGun: '10 Ekim 2026',
}

export const KONSULTAN_DEMO_JETON = 'demo'
