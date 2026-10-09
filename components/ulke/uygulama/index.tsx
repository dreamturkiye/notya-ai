/**
 * NOTYA-ULKE-SABLON-01 — THE SCREENS of the signed-in application, for every country. The kit owns them; a country
 * brings what they say (countries/active/arayuz) and its settings (the pack). Served by the one-line *.ulke.* route
 * files through components/ulke/UlkeUygulamaSayfasi.tsx. The stylesheet is imported here, so it loads with the
 * first screen and with no other page.
 */
import './uygulama.css'
import type { ComponentType } from 'react'
import type { UygulamaEkrani } from '@/lib/ulke/tipler'
import Baslangic from './Baslangic'
import Bugun from './Bugun'
import Ayarlar from './Ayarlar'
import { HastaDosyasi, Hastalar, YeniHasta } from './Hastalar'
import Muayene from './Muayene'
import Takvim from './Takvim'

export const UYGULAMA_EKRAN_BILESENLERI: Readonly<Record<UygulamaEkrani, ComponentType>> = {
  baslangic: Baslangic,
  bugun: Bugun,
  ayarlar: Ayarlar,
  hastalar: Hastalar,
  yeniHasta: YeniHasta,
  hasta: HastaDosyasi,
  muayene: Muayene,
  // The calendar, the booking form, one appointment, the working pattern (feature `randevu`).
  takvim: Takvim,
}
