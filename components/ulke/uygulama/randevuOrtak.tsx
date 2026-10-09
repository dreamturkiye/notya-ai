/**
 * NOTYA-UZ-RANDEVU-01 — what the appointment screens share with the home, the patient file and the visit screen:
 * the shape of an appointment as the API answers it, the addresses of the calendar, and two small pieces of display.
 * A leaf: it imports no screen, so every screen can import it.
 */
import React from 'react'
import { gunYazDesenle, haftaGunu, saatCoz, saatYazDk } from '@/lib/ulke/uygulama/zaman'
import { saatGoster } from '@/lib/ulke/arayuz/bicim'
import { YOL } from './Kabuk'
import { gunAdi, type RandevuMetni } from '@/lib/ulke/arayuz'
import { tarihDeseni } from '@/lib/ulke/arayuz/hatirlatma'

export type RandevuDurumu = 'planlandi' | 'geldi' | 'tamamlandi' | 'gelmedi' | 'iptal'
export type RandevuKaydi = {
  id: string; hastaId: string; hastaAdi: string; baslangic: string; bitis: string
  /** The start in the country's own clock: 'YYYY-MM-DD', 'HH:MM'. */
  gun: string; saat: string
  sureDk: number; neden: string; durum: RandevuDurumu; mesaiDisi: boolean; seansId: string | null
  /** Only on one appointment read by itself: the patient's own language, for the reminder. */
  hastaDili?: string
}
export type DuzenKaydi = { gunler: number[]; baslangic: string; bitis: string; sureDk: number; molalar: { baslangic: string; bitis: string }[] }
export type Gorunum = 'gun' | 'hafta'

/** An address of the calendar. Empty values are left out. */
export function takvimYolu(p: Record<string, string | undefined | null> = {}): string {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v) s.set(k, v)
  const q = s.toString()
  return q ? `${YOL.takvim}?${q}` : YOL.takvim
}

/** "Start the visit" for an appointment: the visit screen for that patient, carrying the appointment. */
export const muayeneBaslatYolu = (r: Pick<RandevuKaydi, 'id' | 'hastaId'>) => `${YOL.muayene}?hasta=${r.hastaId}&randevu=${r.id}`
/** A visit can be started from an appointment that is planned or has arrived and has no visit yet. */
export const muayeneBaslatilabilir = (r: Pick<RandevuKaydi, 'durum' | 'seansId'>) => (r.durum === 'planlandi' || r.durum === 'geldi') && !r.seansId

const gunYaz = (gun: string) => gunYazDesenle(gun, tarihDeseni())
/** "Juma, 09.10.2026" */
export const gunBasligi = (r: RandevuMetni, gun: string) => `${gunAdi(r, haftaGunu(gun), true)}, ${gunYaz(gun)}`
/** 'HH:MM' + minutes → 'HH:MM' (past midnight it wraps: the day is not this function's business). */
export const bitisSaati = (saat: string, sureDk: number) => saatYazDk(((saatCoz(saat) ?? 0) + sureDk) % 1440)

/** "09:00–09:30" as the country writes a time of day (24- or 12-hour: the pack's `saatBicimi`). Display only. */
export const saatAraligi = (saat: string, sureDk: number) => `${saatGoster(saat)}–${saatGoster(bitisSaati(saat, sureDk))}`

export function DurumRozeti({ r, durum }: { r: RandevuMetni; durum: RandevuDurumu }) {
  return <span className="uza-rozet" data-randevu-durum={durum}>{r.durum[durum]}</span>
}
