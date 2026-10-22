/**
 * AU-BETA-01 — pure helpers for the consent ledger and the access/correction request timer. Client-safe.
 *
 * THE TIMER. A request is due `YANIT_GUNU` calendar days after the day it was received, counted in the account's own
 * time zone. 30 is a STARTING VALUE taken from the OAIC's APP 12 guidance (an organisation should respond within a
 * reasonable period, "should not exceed 30 calendar days"; https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information ,
 * read 2026-10-22). It is a product timer, not legal advice.
 */
import { gunEkle, yerelAn } from '../uygulama/zaman'

export const YANIT_GUNU = 30
export const TALEP_TURLERI = ['erisim', 'duzeltme'] as const
export type TalepTuru = (typeof TALEP_TURLERI)[number]
export const TALEP_DURUMLARI = ['yeni', 'islemde', 'tamamlandi', 'reddedildi'] as const
export type TalepDurumu = (typeof TALEP_DURUMLARI)[number]
export const RIZA_KAYNAKLARI = ['portal', 'hasta_formu', 'hekim'] as const
export type RizaKaynagi = (typeof RIZA_KAYNAKLARI)[number]
export const AYRINTI_AZAMI = 1000
export const YANIT_AZAMI = 4000

export function talepSonTarihi(alindiMs: number, dilim: string, gun = YANIT_GUNU): string {
  return gunEkle(yerelAn(alindiMs, dilim).gun, gun)
}

/** Whole days from `bugun` to `sonTarih` (both YYYY-MM-DD). Negative = overdue. */
export function kalanGun(sonTarih: string, bugun: string): number {
  const f = (g: string) => Date.UTC(Number(g.slice(0, 4)), Number(g.slice(5, 7)) - 1, Number(g.slice(8, 10)))
  return Math.round((f(sonTarih) - f(bugun)) / 86_400_000)
}

export const acikDurumMu = (d: string): boolean => d === 'yeni' || d === 'islemde'
