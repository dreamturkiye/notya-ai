/**
 * Tax invoice particulars in subsection 29-70(1) of A New Tax System (Goods and Services Tax) Act 1999.
 *
 * READ 2026-10-20 — compilation in force on 1 January 2026,
 *   https://www.legislation.gov.au/C2004A00446/2026-01-01/2026-01-01/text/original/epub/OEBPS/document_1/document_1.html
 *   section 29-70. Subsection (2) is the 28-day duty. Subsection (1)(b) is the approved form, which this screen
 *   does not produce. The Commissioner's page "Tax invoices", last updated 18 September 2026, was read the same
 *   day and states the same particulars in plainer words. Its examples and its low-value figure are not copied.
 * LICENCE, read 2026-10-15 for the Medicare particulars tool and relied on again here —
 *   https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0 International, including
 *   commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: an amount, a payment, a card, or a document the practice can hand over. Nothing is sent.
 * WHO SEES IT: every role. A tax invoice is the practice's, not one specialty's.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { gunEkle, gunMu, isaret, secim, tarih } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const SINIF = ['alti', 'bin', 'alici'] as const
const sinif = (degerler: readonly string[]) => ({ kosul: { alan: 'sinif', degerler } })
const kutu = (anahtar: string, degerler: readonly string[] = SINIF) => ({ ...isaret(anahtar), ...sinif(degerler) })

const KAYNAK = 'https://www.legislation.gov.au/C2004A00446/2026-01-01/2026-01-01/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20): compilation of A New Tax System (Goods and Services Tax) Act 1999 in force on 1 January 2026, section 29-70. Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use (read 2026-10-15).'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 20 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

const AU_GST_LISTE = kosulluListe({
  anahtar: 'au-tax-invoice',
  alanlar: [
    secim('sinif', SINIF),
    kutu('niyet'),
    kutu('satici'),
    kutu('abn'),
    kutu('tarih'),
    kutu('ne'),
    kutu('gst'),
    kutu('kapsam'),
    kutu('alici_kim', ['bin', 'alici']),
    kutu('alici_gst', ['alici']),
    { ...tarih('istendi', true), ...sinif(['alti', 'bin']) },
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** Subsection 29-70(2): 28 days after the recipient asks, for a document the supplier issues. */
export const AU_GST: AracTanimi = {
  ...AU_GST_LISTE,
  tur: 'takvim',
  cikti: { ...AU_GST_LISTE.cikti, tarihler: ['sonGun'] },
  hesapla: (g, ortam) => {
    const sonuc = AU_GST_LISTE.hesapla(g, ortam)
    if (!sonuc.tamam || !gunMu(g.istendi)) return sonuc
    return { ...sonuc, tarihler: [{ anahtar: 'sonGun', tarih: gunEkle(g.istendi, 28) }] }
  },
}

/** Every role. Particulars for a tax invoice. Not an invoice and not a payment. */
export function auGstFatura(): PaketAraci {
  return {
    anahtar: 'au-tax-invoice',
    roller: null,
    metin: {
      ad: m('GST tax invoice particulars'),
      aciklama: m('Tick a particular subsection 29-70(1) of A New Tax System (Goods and Services Tax) Act 1999 requires before a document is a tax invoice. The compilation read was in force on 1 January 2026. Choose who issues the document, and whether the total price is under 1,000 or at least 1,000, before the lines for that case appear. A tick is your note.'),
      alanlar: {
        sinif: m('Who issues it, and the price'),
        niyet: m('It can be clearly ascertained that the document was intended to be a tax invoice, or a recipient created tax invoice if the recipient issued it'),
        satici: m('The supplier\'s identity'),
        abn: m('The supplier\'s ABN'),
        tarih: m('The date the document is issued'),
        ne: m('What is supplied, including the quantity if applicable and the price of what is supplied'),
        gst: m('The amount of GST, if any, payable in relation to each supply'),
        kapsam: m('The extent to which each supply is a taxable supply'),
        alici_kim: m('The recipient\'s identity or the recipient\'s ABN'),
        alici_gst: m('If GST is payable, that the GST is payable by the supplier'),
        istendi: m('The day the recipient asked for the tax invoice, if they have asked'),
      },
      secenekler: {
        sinif: {
          alti: m('Issued by the supplier, total price under 1,000'),
          bin: m('Issued by the supplier, total price at least 1,000'),
          alici: m('Issued by the recipient'),
        },
      },
      tarihler: { sonGun: m('Last day to give the tax invoice') },
      sayilar: { isaretli: m('Particulars noted') },
      uyarilar: {
        gonderilmedi: m('A tick is a note in this product. Nothing is sent. This is not a payment, and it is not a finding that the document is a tax invoice.'),
      },
      not: m('Subsection 29-70(1)(b) requires the approved form. This screen does not produce that form. Subsection 29-70(2) requires the supplier to give a tax invoice within 28 days after the recipient asks, unless it is a recipient created tax invoice. Subsection 29-80 names a low value below which that duty does not apply. Stripe and Tyro are not connected.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
