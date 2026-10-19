/**
 * A shape check for a Medicare card number or a Medicare provider number.
 * The arithmetic is ./kimlik.ts, from the two pages named on the tool.
 * Not a register lookup. No number is stored by the tool.
 */
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, metin, secim } from '@/lib/ulke/araclar/yardimci'
import { medicareKartGecerli, providerNoGecerli } from '../kimlik'

const D = 'en-AU'
const m = (metinDegeri: string) => ({ [D]: metinDegeri })

export const AU_KIMLIK_KONTROL: AracTanimi = {
  anahtar: 'au-identifier-check',
  tur: 'hesap',
  alanlar: [
    secim('tur', ['medicare', 'provider']),
    metin('numara', { istege: false }),
  ],
  cikti: { sayilar: [], bantlar: ['gecer', 'gecmez'], uyarilar: ['kayit_degil'], tarihler: [] },
  kaynak: 'Medicare card: https://clearwater.com.au/code/medicare. Medicare provider number: https://clearwater.com.au/code/provider. Both read 2026-10-19. A passing checksum is not a register lookup.',
  hesapla: (g) => {
    const tur = g.tur
    const numara = typeof g.numara === 'string' ? g.numara.trim() : ''
    if ((tur !== 'medicare' && tur !== 'provider') || !numara) return BOS_SONUC
    const gecer = tur === 'medicare' ? medicareKartGecerli(numara) : providerNoGecerli(numara)
    return { tamam: true, sayilar: [], bant: gecer ? 'gecer' : 'gecmez', uyarilar: ['kayit_degil'], tarihler: [] }
  },
}

export const AU_KIMLIK_KONTROL_ARACI: PaketAraci = {
  anahtar: 'au-identifier-check',
  roller: null,
  metin: {
    ad: m('Medicare card and provider number check'),
    aciklama: m('Checks the shape of a Medicare card number or a Medicare provider number. A card is eight digits, a checksum, an issue digit, and an optional reference digit. A provider number is a six-digit stem, a location character and a check character. A five-digit stem is treated as having a leading zero.'),
    alanlar: { tur: m('Which number'), numara: m('Number') },
    secenekler: { tur: { medicare: m('Medicare card number'), provider: m('Medicare provider number') } },
    bantlar: {
      gecer: m('The checksum matches'),
      gecmez: m('The checksum does not match'),
    },
    uyarilar: {
      kayit_degil: m('This is a shape check only. Nothing was looked up on a register, and a match is not proof the number is current.'),
    },
    not: m('Nothing is sent. The practitioner registration number is not checked here: no character pattern for it was on a page opened for this tool.'),
  },
  lisans: {
    durum: 'serbest',
    kaynak: 'https://clearwater.com.au/code/medicare (read 2026-10-19): the card checksum, the digit weights, and the 10-digit and 11-digit lengths. The provider-number checksum is the same author\'s page https://clearwater.com.au/code/provider, read the same day. The pages say the author claims no rights in the sample code.',
    bildirim: m('Checksums as published by Clearwater (clearwater.com.au/code/medicare and clearwater.com.au/code/provider), read 19 October 2026. Not a Services Australia lookup.'),
  },
}
