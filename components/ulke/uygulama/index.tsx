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
import Araclar from './Araclar'
import Klinik from './Klinik'
import OnBuro from './OnBuro'
import Fatura from './Fatura'
import GizlilikTalepleri from './GizlilikTalepleri'
import Asistan from './AsistanSayfasi'

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
  // The tools area: the grid and each tool's own screen (feature `araclar`).
  araclar: Araclar,
  // The clinic, "who can help with my patients", what was shared with the account (feature `klinikHesaplari`).
  klinik: Klinik,
  // The front-desk workspace (features `klinikHesaplari` and `randevu`).
  onBuro: OnBuro,
  // AU-BETA-01 — only where the pack brings the extension (components/ulke/UlkeUygulamaSayfasi.tsx).
  fatura: Fatura,
  gizlilikTalepleri: GizlilikTalepleri,
  // AU-CANLI-02 — the assistant page (the pack's `canliAsistan`; components/ulke/UlkeUygulamaSayfasi.tsx).
  asistan: Asistan,
}
