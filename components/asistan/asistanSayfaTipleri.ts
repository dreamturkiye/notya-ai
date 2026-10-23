/**
 * AU-DEPTH-PARITY-03 — the vocabulary the assistant page view (AsistanSayfaGorunumu) and the written-chat view
 * (YaziliSohbetGorunumu) are driven with. Türkiye's /asistan page and every country's /asistan page render through the
 * SAME two views; what differs is only what is handed in here: the words (a catalogue per language), the persona, and
 * the pieces that belong to one country's backend (patient-action cards, links). Pure types — no React, no country.
 */
import type { ReactNode } from 'react'
import type { SesDurumu } from '@/lib/asistan/yuzenPanel'

/** Every sentence of the assistant page. Türkiye's are in components/asistan/AsistanSayfaTR.tsx, a country's in its language set. */
export interface AsistanSayfaMetni {
  /** The status line (under the persona, above the microphone). */
  durum: { idle: string; connecting: string; listening: string; speaking: (etiket: string) => string; error: string; sessiz: string }
  /** Under the big microphone. */
  dokunBaslat: string
  dokunBitir: string
  /** aria-label of the "back" arrow. */
  geri: string
  /** On the empty idle screen, under the persona. */
  bosIpucu: string
  sureUyari: string
  sureUzat: string
}

/** Every sentence of the written chat under the page. */
export interface YaziliSohbetMetni {
  /** The collapsed button. `acEk` is the small grey remark after it (Türkiye: "with the patient file in view"). */
  ac: (ad: string) => string
  acEk?: string
  baslik: string
  /** "· active patient: X" — only where the written chat knows a patient. */
  aktifHasta?: string
  kapat: string
  bos: (ad: string) => string
  bekliyor: (ad: string) => string
  mikrofonAc: string
  mikrofonDurdur: string
  yerTutucu: string
  yerTutucuDinliyor: string
  gonder: string
}

export interface SayfaPersona {
  /** Alt text of the photograph. */
  ad: string
  /** The name as the headers show it (Türkiye: "Ayşe Kaya Hocam"). */
  etiket: string
  unvan: string
  renk: string
  foto?: string
  /** Short name: its first letters are the initials where there is no photograph. */
  kisaAd: string
}

export interface SayfaMesaj { id: string; role: 'user' | 'ai'; text: string }

export interface PersonaSecenegi { key: string; etiket: string; baslik: string; renk: string; aktif: boolean }

export interface YaziliSatir { sira: number; rol: 'doktor' | 'asistan'; icerik: string; /** Cards / a link under the bubble: the caller's own. */ ek?: ReactNode }

export type { SesDurumu }
