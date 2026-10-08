/**
 * NOTYA-UZ-MUAYENE-01 — the screens of the signed-in application Uzbekistan brings itself. Reached only through
 * countries/active/sayfalar (by way of ../acilis/index, the pack's page entry). The stylesheet is imported here,
 * not in the components, so the components render in a plain Node test.
 */
import './uygulama.css'
import type { UlkeSayfalari } from '@/lib/ulke/tipler'
import Baslangic from './Baslangic'
import Bugun from './Bugun'
import Ayarlar from './Ayarlar'
import { HastaDosyasi, Hastalar, YeniHasta } from './Hastalar'
import Muayene from './Muayene'

export const UZ_UYGULAMA: NonNullable<UlkeSayfalari['uygulama']> = {
  baslangic: Baslangic,
  bugun: Bugun,
  ayarlar: Ayarlar,
  hastalar: Hastalar,
  yeniHasta: YeniHasta,
  hasta: HastaDosyasi,
  muayene: Muayene,
}
