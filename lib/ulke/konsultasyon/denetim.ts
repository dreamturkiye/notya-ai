/**
 * NOTYA-ULKE-MESAJ-01 — THE PACK CHECK FOR CONSULTATION BETWEEN DOCTORS. Called by the pack check
 * (lib/ulke/paketDenetimi.ts); answers with a list, like every other rule there, and a country's build fails on any
 * line of it. Pure.
 *
 *   - BOTH PERIODS ARE THE COUNTRY'S: how long a consultation may stay open, and how long a colleague may still read
 *     it after it was closed. The kit has no default for either (how long a colleague may hold a copy of a patient's
 *     data is a question of the country's law);
 *   - THE CONSENT WORDING HAS A STAMP, stated by the pack's clinical half and stored with every consultation, and the
 *     pack says whether a lawyer has read the sentence;
 *   - the catalogue is there in every language form, and a sentence that carries a value holds its placeholder;
 *   - THE FEATURE AND ITS TILE GO TOGETHER, and the tile is a base tool — exactly as for "my templates".
 */
import type { UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import type { DilKodu, UlkeKlinigi, UlkePaketi } from '../tipler'
import { KONSULTASYON_ARACI } from './sabitler'

export type KonsultasyonSorunu = { yer: string; sorun: string }

const TESLIM = 'to be supplied'
const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/** Sentences of the consultation catalogue that carry a value: path → the placeholders they must hold. */
export const KONSULTASYON_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['iste.bulundu', ['%']], ['iste.cokUzun', ['%']],
  ['giden.meslektas', ['%']], ['giden.okundu', ['%']], ['giden.cevap', ['%']], ['giden.durumAcik', ['%']], ['giden.durumKapali', ['%1', '%2']], ['giden.kapatUyari', ['%']],
  ['gelen.isteyen', ['%']], ['gelen.paylasimNot', ['%']], ['gelen.paylasimOzet', ['%']], ['gelen.okunabilir', ['%']], ['gelen.cokUzun', ['%']], ['gelen.cevabiniz', ['%']], ['gelen.bekleyen', ['%']],
]

export function konsultasyonSorunlari(paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null, diller: readonly DilKodu[], metinleriGez: (deger: unknown, yer: string, sorunlar: KonsultasyonSorunu[]) => void): KonsultasyonSorunu[] {
  const s: KonsultasyonSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  const acik = paket.ozellikler.konsultasyon === true
  if (acik && !paket.ozellikler.cekirdekMuayene) ekle('ozellikler.konsultasyon', 'consultation between doctors needs the signed-in application (cekirdekMuayene)')
  if (!arayuz) return s
  const araclar = arayuz.araclar && !eksikAyarMi(arayuz.araclar) && Array.isArray(arayuz.araclar.araclar) ? arayuz.araclar.araclar : null
  const kutu = araclar?.find((p) => p?.anahtar === KONSULTASYON_ARACI) ?? null
  if (kutu && !acik) ekle(`arayuz.araclar.${KONSULTASYON_ARACI}`, 'the tile is listed and the feature konsultasyon is off: the tile would open a screen whose route answers "not found"')
  if (!acik) return s
  if (!paket.ozellikler.araclar) ekle('ozellikler.konsultasyon', 'consultation between doctors needs the tools area (araclar): the account\'s code and what it was asked are on its tile')
  else if (araclar && !kutu) ekle(`arayuz.araclar.${KONSULTASYON_ARACI}`, `consultation is on and the tools area does not list the tile "${KONSULTASYON_ARACI}": a doctor could be asked and never see it`)
  if (kutu && !eksikAyarMi(kutu.roller) && kutu.roller !== null) ekle(`arayuz.araclar.${KONSULTASYON_ARACI}.roller`, 'must be null: consultation is a base tool, the same for every role')

  // the two periods
  const k = paket.uygulama?.konsultasyon
  if (!k) ekle('uygulama.konsultasyon', 'consultation is switched on and the pack does not say how long a consultation stays open and how long a colleague may read it after it was closed')
  else if (eksikAyarMi(k)) ekle('uygulama.konsultasyon', `${TESLIM}: ${k.__eksikAyar}`)
  else {
    if (eksikAyarMi(k.acikGun)) ekle('uygulama.konsultasyon.acikGun', `${TESLIM}: ${k.acikGun.__eksikAyar}`)
    else if (!(Number.isInteger(k.acikGun) && k.acikGun >= 1 && k.acikGun <= 365)) ekle('uygulama.konsultasyon.acikGun', 'must be a whole number of days between 1 and 365')
    if (eksikAyarMi(k.kapanisSonrasiGun)) ekle('uygulama.konsultasyon.kapanisSonrasiGun', `${TESLIM}: ${k.kapanisSonrasiGun.__eksikAyar}`)
    else if (!(Number.isInteger(k.kapanisSonrasiGun) && k.kapanisSonrasiGun >= 0 && k.kapanisSonrasiGun <= 365)) ekle('uygulama.konsultasyon.kapanisSonrasiGun', 'must be a whole number of days between 0 and 365 (0 = not readable after closing)')
  }

  // the consent wording's stamp, and who has read the sentence
  if (klinik) {
    const r = klinik.konsultasyonRizasi
    if (!r) ekle('klinik.konsultasyonRizasi', 'consultation is switched on and the clinical half does not state the stamp of the consent sentence (konsultasyonRizasi: { surum, hukukcuInceledi })')
    else if (eksikAyarMi(r)) ekle('klinik.konsultasyonRizasi', `${TESLIM}: ${r.__eksikAyar}`)
    else {
      if (eksikAyarMi(r.surum)) ekle('klinik.konsultasyonRizasi.surum', `${TESLIM}: ${(r.surum as unknown as { __eksikAyar: string }).__eksikAyar}`)
      else if (!dolu(r.surum) || r.surum.length > 80) ekle('klinik.konsultasyonRizasi.surum', 'the stamp of the consent sentence: 1 to 80 characters, changed whenever the sentence changes')
      else if (eksikMetinMi(r.surum)) ekle('klinik.konsultasyonRizasi.surum', TESLIM)
      if (eksikAyarMi(r.hukukcuInceledi)) ekle('klinik.konsultasyonRizasi.hukukcuInceledi', `${TESLIM}: ${(r.hukukcuInceledi as unknown as { __eksikAyar: string }).__eksikAyar}`)
      else if (typeof r.hukukcuInceledi !== 'boolean') ekle('klinik.konsultasyonRizasi.hukukcuInceledi', 'must be true or false: has a lawyer of the country read the sentence')
    }
  }

  for (const d of diller) {
    const km = arayuz.konsultasyonMetinleri?.[d]
    const yer = `arayuz.konsultasyonMetinleri[${d}]`
    if (!km) { ekle(yer, 'consultation is on and this form has no catalogue for it'); continue }
    metinleriGez(km, yer, s)
    for (const [yol, yerler] of KONSULTASYON_YER_TUTUCULARI) {
      const metin = yol.split('.').reduce<unknown>((o, a) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[a] : undefined), km)
      if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
      for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`${yer}.${yol}`, `must hold "${y}" where the value is written`)
    }
    // THE CONSENT SENTENCE carries no value: it is ticked as it stands, and its stamp names exactly this wording.
    if (typeof km.iste?.riza === 'string' && !eksikMetinMi(km.iste.riza) && /%/.test(km.iste.riza)) ekle(`${yer}.iste.riza`, 'carries a placeholder: the consent sentence is ticked as it stands')
  }
  return s
}
