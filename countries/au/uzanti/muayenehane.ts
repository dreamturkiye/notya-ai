/**
 * AU-BETA-01 — the practice's identity as an Australian practice writes it: practice name, ABN, the practitioner's
 * AHPRA registration number and Medicare provider number, and an Australian address (street, suburb, state or
 * territory, four-digit postcode). Used on invoices, and wherever a letter or referral prints the practice.
 *
 * EVERY FIELD IS OPTIONAL. An empty field is valid and never blocks a workflow. A non-empty field must have the
 * shape below; a wrong one answers with a sentence next to that field and is not kept. Nothing is looked up in any
 * register (ABR, AHPRA, Services Australia): these are FORMAT checks and, for the ABN, the public weighting check.
 * Sources and retrieval dates are on the validators in ../kimlik.ts and in docs/au/SOURCES.md.
 *
 * Initial compliance draft – external legal review later. Initial clinical draft – external clinician review later.
 */
import type { MuayenehaneSonucu, MuayenehaneTanimi } from '@/lib/ulke/uzanti/tipler'
import { abnGecerli, AU_EYALETLER, ahpraNoBicimi, eyaletMi, postaKoduBicimi, postaKoduEyalette, providerNoBicimi } from '../kimlik'

export const AU_MUAYENEHANE_ANAHTARLARI = ['adi', 'abn', 'ahpra', 'saglayici', 'sokak', 'banliyo', 'eyalet', 'postakodu'] as const

const metin = (g: Record<string, unknown>, k: string): string => (typeof g[k] === 'string' ? (g[k] as string).trim() : '')

/** Pure. Never throws; a non-object gives an empty, valid result. */
export function auMuayenehaneDogrula(girdi: Record<string, unknown>): MuayenehaneSonucu {
  const g = girdi && typeof girdi === 'object' ? girdi : {}
  const temiz: Record<string, string> = {}
  const hatalar: Record<string, string> = {}
  const uyarilar: Record<string, string> = {}

  const adi = metin(g, 'adi')
  if (adi) { if (adi.length > 120) hatalar.adi = 'Use 120 characters or fewer.'; else temiz.adi = adi }

  const abn = metin(g, 'abn')
  if (abn) {
    if (abnGecerli(abn)) { const r = abn.replace(/[\s-]/g, ''); temiz.abn = `${r.slice(0, 2)} ${r.slice(2, 5)} ${r.slice(5, 8)} ${r.slice(8)}` }
    else hatalar.abn = 'An ABN is 11 digits and passes the Australian Business Register check. Check the number, or leave this empty.'
  }

  const ahpra = metin(g, 'ahpra')
  if (ahpra) {
    const n = ahpraNoBicimi(ahpra)
    if (n) temiz.ahpra = n
    else hatalar.ahpra = 'An AHPRA registration number is three letters followed by ten digits, for example MED0001234567. Check the number, or leave this empty.'
  }

  const sag = metin(g, 'saglayici')
  if (sag) {
    const n = providerNoBicimi(sag)
    if (n) temiz.saglayici = n
    else hatalar.saglayici = 'A Medicare provider number is six digits, a location character and a check letter, for example 2447781L. Check the number, or leave this empty.'
  }

  const sokak = metin(g, 'sokak')
  if (sokak) { if (sokak.length > 120) hatalar.sokak = 'Use 120 characters or fewer.'; else temiz.sokak = sokak }
  const banliyo = metin(g, 'banliyo')
  if (banliyo) { if (banliyo.length > 60) hatalar.banliyo = 'Use 60 characters or fewer.'; else temiz.banliyo = banliyo }

  const eyalet = metin(g, 'eyalet').toUpperCase()
  if (eyalet) { if (eyaletMi(eyalet)) temiz.eyalet = eyalet; else hatalar.eyalet = `Choose one of ${AU_EYALETLER.join(', ')}.` }

  const pk = metin(g, 'postakodu')
  if (pk) {
    const n = postaKoduBicimi(pk)
    if (!n) hatalar.postakodu = 'An Australian postcode is four digits, for example 2000.'
    else {
      temiz.postakodu = n
      if (temiz.eyalet && !postaKoduEyalette(n, temiz.eyalet)) uyarilar.postakodu = `Postcode ${n} is not in the ranges listed for ${temiz.eyalet}. It was kept; check it.`
    }
  }
  return { temiz, hatalar, uyarilar }
}

export const AU_MUAYENEHANE: MuayenehaneTanimi = {
  baslik: 'Practice details',
  aciklama: 'Used on invoices and letters. Every field is optional; leave any empty. Nothing is checked against the ABN, AHPRA or Medicare registers — only the shape of each number is checked. Initial compliance draft – external legal review later.',
  alanlar: [
    { anahtar: 'adi', etiket: 'Practice or business name', azami: 120 },
    { anahtar: 'abn', etiket: 'ABN', ipucu: '11 digits, for example 51 824 753 556', azami: 20 },
    { anahtar: 'ahpra', etiket: 'AHPRA registration number', ipucu: 'Three letters and ten digits, for example MED0001234567', azami: 16 },
    { anahtar: 'saglayici', etiket: 'Medicare provider number', ipucu: 'Six digits, a location character and a check letter', azami: 12 },
    { anahtar: 'sokak', etiket: 'Street address', azami: 120 },
    { anahtar: 'banliyo', etiket: 'Suburb', azami: 60 },
    { anahtar: 'eyalet', etiket: 'State or territory', azami: 3, secenekler: AU_EYALETLER.map((e) => ({ deger: e, etiket: e })) },
    { anahtar: 'postakodu', etiket: 'Postcode', ipucu: 'Four digits', azami: 4 },
  ],
  kaydet: 'Save practice details',
  kaydediliyor: 'Saving…',
  kaydedildi: 'Saved.',
  kaydedilemedi: 'Could not save. Try again.',
  dogrula: auMuayenehaneDogrula,
}
