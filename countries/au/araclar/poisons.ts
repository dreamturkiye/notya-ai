/**
 * Poisons Standard, October 2026 (SUSMP No. 51). Classes, Schedule 8 entries, and
 * Appendix L clause 1 label details. Nothing is sent. State and Territory prescription
 * forms are not in this instrument and are not invented here.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, kontrolListesi } from '@/lib/ulke/araclar/yardimci'
import ham from '../referans/poisons.json'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

const KAYNAK = 'https://www.legislation.gov.au/F2026L01327/asmade/2026-09-30 (read 2026-10-14): Therapeutic Goods (Poisons Standard—October 2026) Instrument 2026, also cited as the Standard for the Uniform Scheduling of Medicines and Poisons No. 51, commenced 1 October 2026. Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/.'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 14 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export type AuSinif = { anahtar: string; kod: string; baslik: string; ad: string; aciklama: string }
export type AuMadde = { anahtar: string; ad: string }
export const AU_SINIFLAR = ham.classes as AuSinif[]
export const AU_SCHEDULE_8 = ham.schedule8 as AuMadde[]
const SINIF_ANAHTARLARI = AU_SINIFLAR.map((r) => r.anahtar)

export const AU_ZEHIR_SINIFI: AracTanimi = {
  anahtar: 'au-poisons-schedules',
  tur: 'liste',
  alanlar: [{ anahtar: 'sinif', tur: 'secim', secenekler: SINIF_ANAHTARLARI, tam: true }],
  cikti: { sayilar: [], bantlar: SINIF_ANAHTARLARI, uyarilar: ['eyalet', 'gonderilmedi'], tarihler: [] },
  kaynak: KAYNAK,
  hesapla: (g) => {
    const sinif = g.sinif
    if (typeof sinif !== 'string' || !SINIF_ANAHTARLARI.includes(sinif)) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: sinif, uyarilar: ['eyalet', 'gonderilmedi'], tarihler: [] }
  },
}

const s8 = kontrolListesi({
  anahtar: 'au-schedule-8',
  maddeler: AU_SCHEDULE_8.map((r) => r.anahtar),
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})
/** The tick count is shown alone. The list length is not written on the screen. */
export const AU_SCHEDULE_8_TANIMI: AracTanimi = {
  ...s8,
  hesapla: (g, o) => {
    const s = s8.hesapla(g, o)
    return { ...s, sayilar: s.sayilar.map(({ enCok: _toplam, ...kalan }) => kalan) }
  },
}

/** Appendix L clause 1 details that a human-medicine label always carries. */
const ETIKET_CEKIRDEK = ['english', 'height', 'durable', 'dispenser', 'substance', 'directions', 'strength', 'quantity', 'keep-out', 'person'] as const
const ETIKET_MADDELERI = [...ETIKET_CEKIRDEK, 'external', 'reference', 'supply-date', 'script-directions'] as const

const etiket = kontrolListesi({
  anahtar: 'au-dispensing-label',
  maddeler: ETIKET_MADDELERI,
  uyarilar: ['eksik', 'gonderilmedi'],
  uyari: (secili) => [ETIKET_CEKIRDEK.every((k) => secili.includes(k)) ? '' : 'eksik', 'gonderilmedi'].filter((k) => k),
  kaynak: KAYNAK,
})
export const AU_ETIKET: AracTanimi = {
  ...etiket,
  hesapla: (g, o) => {
    const s = etiket.hesapla(g, o)
    return { ...s, sayilar: s.sayilar.map(({ enCok: _toplam, ...kalan }) => kalan) }
  },
}

const lisans = {
  durum: 'serbest' as const,
  hakSahibi: 'Federal Register of Legislation',
  kaynak: KAYNAK,
  bildirim: m(BILDIRIM),
}

/** Doctors only. The instrument's general description of each schedule. */
export function auZehirSinifiAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-poisons-schedules',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Poisons Standard schedules'),
      aciklama: m('Choose a schedule from the Poisons Standard that commenced on 1 October 2026. The line under the result is that instrument\'s general description of the schedule. Schedule 1 is intentionally blank and is not a choice.'),
      alanlar: { sinif: m('Schedule') },
      secenekler: {
        sinif: Object.fromEntries(AU_SINIFLAR.map((r) => [r.anahtar, m(`${r.baslik} — ${r.ad}`)])),
      },
      bantlar: Object.fromEntries(AU_SINIFLAR.map((r) => [r.anahtar, m(r.aciklama)])),
      uyarilar: {
        eyalet: m('The instrument says the legal definition is a matter for each State or Territory authority. This screen repeats the instrument\'s general description only.'),
        gonderilmedi: m('Nothing was sent.'),
      },
      not: m('A description of a schedule, not a decision that a substance is in it, and not a prescription. Who may prescribe, and what a prescription must contain, is State or Territory law, which is not copied here.'),
    },
    lisans,
  }
}

/** Doctors only. Schedule 8 entries, including each exception the instrument prints. */
export function auSchedule8Araci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-schedule-8',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Schedule 8 controlled drugs'),
      aciklama: m('Tick an entry from Schedule 8 of the Poisons Standard that commenced on 1 October 2026. The words of the entry, including any exception, are the instrument\'s.'),
      alanlar: Object.fromEntries(AU_SCHEDULE_8.map((r) => [r.anahtar, m(r.ad)])),
      sayilar: { isaretli: m('Entries ticked') },
      uyarilar: {
        gonderilmedi: m('Nothing was sent. A prescription is the doctor\'s own, under the law of the State or Territory.'),
      },
      not: m('A hash mark is the instrument\'s own mark that the entry is also listed in Appendix D. An exception written in the entry is part of the entry. This list is the schedule, not a ranking of what is prescribed.'),
    },
    lisans,
  }
}

/** Doctors only. Appendix L clause 1, human medicines. Not a live label printer. */
export function auEtiketAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-dispensing-label',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Dispensing label details'),
      aciklama: m('Tick the details Appendix L, clause 1, of the Poisons Standard requires on a label for a medicine for human use. The three prescription lines apply when the medicine is supplied on a prescription. The external-use line applies when that is the intent.'),
      alanlar: {
        english: m('All details, words and other required information are in the English language'),
        height: m('Letters are at least 1.5 mm in height'),
        durable: m('Symbols, numbers and words are in durable characters'),
        dispenser: m('The name, address and telephone number of the dispenser supplying the substance'),
        substance: m('The approved name of the substance and/or its proprietary name'),
        directions: m('Adequate directions for use'),
        strength: m('The strength and form of the substance'),
        quantity: m('The total quantity of the goods in the container'),
        'keep-out': m('The words “KEEP OUT OF REACH OF CHILDREN” in red on a white background'),
        person: m('The name of the person for whom it was dispensed'),
        external: m('If for external use only: the word “POISON”, or the words “FOR EXTERNAL USE ONLY”, in red on a white background'),
        reference: m('Where supplied on a prescription: the prescription reference number'),
        'supply-date': m('Where supplied on a prescription: the date the prescription was supplied, unless that date is clear from the reference number'),
        'script-directions': m('Where supplied on a prescription: the directions for use set out in the prescription'),
      },
      sayilar: { isaretli: m('Details ticked') },
      uyarilar: {
        eksik: m('A detail clause 1 requires for a human medicine is not ticked.'),
        gonderilmedi: m('Nothing was printed and nothing was sent.'),
      },
      not: m('Appendix L, clause 1. The veterinary line in clause 1(4)(i) is not a tick here. Clause 2 names extra warning statements for some medicines; those statements are not stored. This is a checklist, not a label and not a prescription.'),
    },
    lisans,
  }
}
