/**
 * NOTYA-ULKE-01 — the pages Uzbekistan brings itself. Reached only through countries/active/sayfalar.
 * The stylesheet is imported here, not in the component, so the component renders in a plain Node test.
 */
import './acilis.css'
import type { UlkeSayfalari } from '@/lib/ulke/tipler'
import { AcilisSayfasi } from './AcilisSayfasi'
import { UZ_UYGULAMA } from '../uygulama'

export const UZ_SAYFALARI: UlkeSayfalari = {
  acilis: AcilisSayfasi,
  uygulama: UZ_UYGULAMA,
}
