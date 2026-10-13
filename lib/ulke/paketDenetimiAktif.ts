/**
 * NOTYA-ULKE-SABLON-01 — the pack check (./paketDenetimi.ts) on the ACTIVE pack, for a country build. SERVER ONLY:
 * it reads all three halves of the pack. Called once, when the country's root layout loads (app/layout.ulke.tsx):
 * an incomplete pack makes the build of THAT country fail with the whole list, and can never be served.
 */
import { AKTIF_PAKET } from '@/countries/active'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { paketiDenetle, sorunlariYaz } from './paketDenetimi'

export function aktifPaketiDenetle(): void {
  const sorunlar = paketiDenetle(AKTIF_PAKET, AKTIF_ARAYUZ, AKTIF_KLINIK)
  if (sorunlar.length) throw new Error(sorunlariYaz(AKTIF_PAKET.kod, sorunlar))
}
