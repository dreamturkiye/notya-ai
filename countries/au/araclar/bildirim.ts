/**
 * National Notifiable Disease List, compilation in force on 22 May 2026.
 * Names only. Nothing is sent. No case definition and no time limit is stored.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'
import ham from '../referans/bildirim.json'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export type AuBildirimSatiri = { anahtar: string; kod: string; ad: string }
export const AU_BILDIRIM_SATIRLARI = ham.rows as AuBildirimSatiri[]
const ANAHTARLAR = AU_BILDIRIM_SATIRLARI.map((r) => r.anahtar)

const KAYNAK = 'https://www.legislation.gov.au/F2018L00450/2026-05-22 (read 2026-10-14): compilation of the National Health Security (National Notifiable Disease List) Instrument 2018 in force on 22 May 2026. Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/.'
const liste = kontrolListesi({
  anahtar: 'au-notifiable-diseases',
  maddeler: ANAHTARLAR,
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})
/** The tick count is shown alone. The list length is not written on the screen. */
export const AU_BILDIRIM: AracTanimi = {
  ...liste,
  hesapla: (g, o) => {
    const s = liste.hesapla(g, o)
    return { ...s, sayilar: s.sayilar.map(({ enCok: _toplam, ...kalan }) => kalan) }
  },
}

/** Doctors only. The list is a statutory disease list, not a notice form. */
export function auBildirimAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-notifiable-diseases',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('National Notifiable Disease List'),
      aciklama: m('Tick a disease named on the National Notifiable Disease List in the compilation in force on 22 May 2026. Who must be told, and by when, is not in this list.'),
      alanlar: Object.fromEntries(AU_BILDIRIM_SATIRLARI.map((r) => [r.anahtar, m(r.ad)])),
      sayilar: { isaretli: m('Diseases ticked') },
      uyarilar: {
        gonderilmedi: m('Nothing was sent. A notice to a health department is the doctor\'s own.'),
      },
      not: m('Item 1A, Andes virus infection, is on this compilation. The compilation\'s amendment history says that item expires at the end of 22 November 2026.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: AU_BILDIRIM.kaynak!,
      bildirim: m('Based on content from the Federal Register of Legislation at 14 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'),
    },
  }
}
