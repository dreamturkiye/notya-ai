/**
 * NOTYA-ULKE-EN-01 — clinic accounts for an English-speaking pack.
 *
 * MACHINE-WRITTEN STARTING VALUES. No lawyer of any of the five countries has read them (`hukukcu: null`). The narrow
 * side is taken wherever there is one: a clinic's owner cannot grant access to a doctor's patients; no record of
 * access is deleted. Every allied profession of the pack may be offered a share of one patient's approved notes.
 * Whether that profession may lawfully read a record is for a lawyer of the country.
 */
import type { KlinikHesabiAyarlari } from '@/lib/ulke/tipler'
import { enRolSatirlari, type EnRolDegisimi } from './klinik/roller'

/** Allied professions of this country's role list, in the order they are offered. */
export function enMuttefikRolleri(degisim?: EnRolDegisimi): readonly string[] {
  return enRolSatirlari(degisim).filter((r) => r.taraf === 'klinik-muttefik').map((r) => r.anahtar)
}

export function enKlinikHesaplari(degisim?: EnRolDegisimi): KlinikHesabiAyarlari {
  return {
    yetkiTurleri: ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet'],
    sahipHekimAdinaVerebilir: false,
    paylasimRolleri: enMuttefikRolleri(degisim),
    davetGecerlilikGun: 7,
    vekaletAzamiGun: 14,
    kayitSaklama: null,
    inceleme: { makineYazimi: true, hukukcu: null },
  }
}
