/**
 * A note that the practice is working under the Australian Privacy Principles.
 * The four ticks are the four subjects the OAIC index page names. They are not the text of the 13 principles.
 * Read 2026-10-19: https://www.oaic.gov.au/privacy/australian-privacy-principles
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export const AU_GIZLILIK_MADDELERI = ['toplama', 'yonetim', 'butunluk', 'erisim'] as const

export const AU_GIZLILIK = kontrolListesi({
  anahtar: 'au-privacy-principles',
  maddeler: AU_GIZLILIK_MADDELERI,
  uyarilar: ['hukuki_degil'],
  uyari: () => ['hukuki_degil'],
  kaynak: 'Office of the Australian Information Commissioner, "Australian Privacy Principles", read 2026-10-19. The page says the 13 principles govern collection, use and disclosure; governance and accountability; integrity and correction; and access.',
})

export const AU_GIZLILIK_ARACI: PaketAraci = {
  anahtar: 'au-privacy-principles',
  roller: null,
  metin: {
    ad: m('Privacy Act record'),
    aciklama: m('A note that this practice is handling personal information under the Australian Privacy Principles in the Privacy Act 1988. The four lines are the four subjects the Office of the Australian Information Commissioner names on its principles page. They are not the text of the 13 principles.'),
    alanlar: {
      toplama: m('Collection, use and disclosure of personal information'),
      yonetim: m('Governance and accountability'),
      butunluk: m('Integrity and correction of personal information'),
      erisim: m('The right of a person to access their personal information'),
    },
    sayilar: { isaretli: m('Lines noted') },
    uyarilar: {
      hukuki_degil: m('A tick is a note in this product. It is not a finding that the Privacy Act 1988 or the Australian Privacy Principles are satisfied.'),
    },
    not: m('Health information is sensitive information under that Act. State and territory health-records laws are not set out here. Nothing is sent to the Office of the Australian Information Commissioner.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Office of the Australian Information Commissioner',
    kaynak: 'https://www.oaic.gov.au/privacy/australian-privacy-principles (read 2026-10-19): the 13 Australian Privacy Principles are the cornerstone of the privacy protection framework in the Privacy Act 1988, and they govern the four subjects named on this screen. The principle text itself is not copied.',
    bildirim: m('Subjects named by the Office of the Australian Information Commissioner on its Australian Privacy Principles page, read 19 October 2026. The principles themselves are not reproduced.'),
  },
}
