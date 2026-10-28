/**
 * AU-PEDIATRI-GOLD-01b — overdue immunisation / clinical-review cohort (Option A).
 *
 * Pure engines + two tools:
 *   au-immunisation-cohort — paediatrics + family-medicine: NIP age milestones due before
 *     today that are not yet ticked (series-started rule: only milestones the clinician
 *     already records against, or birth-date due days that have passed with none done).
 *   au-review-cohort — every offered role: next review from last visit + interval; overdue
 *     when that day is before today. Companion to takip-paneli, not a replacement.
 *
 * Nothing is sent. AIR send stays off. No TR asiPlan/GBP port — uses AU NIP offsets only.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, ayEkle, gunEkle, gunMu, isaret, isaretliler, sayi, sayiMi, tarih } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../klinik/asistanAdlari'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/** Age milestones that have a due day from birth (school years / pregnancy stay ticks only). */
export const AU_KOHORT_ASI_MADDELERI = [
  'dogum', 'hafta6', 'ay4', 'ay6', 'ay12', 'ay18', 'yas4',
] as const

type AsiMadde = (typeof AU_KOHORT_ASI_MADDELERI)[number]

const ASI_VADESI: Readonly<Record<AsiMadde, { gun?: number; ay?: number }>> = {
  dogum: { gun: 0 },
  hafta6: { gun: 42 },
  ay4: { ay: 4 },
  ay6: { ay: 6 },
  ay12: { ay: 12 },
  ay18: { ay: 18 },
  yas4: { ay: 48 },
}

function asiVade(dogumGunu: string, ofset: { gun?: number; ay?: number }): string {
  if (ofset.gun !== undefined) return gunEkle(dogumGunu, ofset.gun)
  return ayEkle(dogumGunu, ofset.ay ?? 0)
}

export type AuAsiKohortBayrak = 'asi_gecikti'

export type AuAsiKohortGirdi = {
  patientId: string
  ad: string
  dogumIso: string
  /** Milestones already recorded as done. */
  yapilan: readonly string[]
}

export type AuAsiKohortSatir = {
  patientId: string
  ad: string
  bayraklar: AuAsiKohortBayrak[]
  geciken: readonly string[]
  enErkenVade: string | null
}

/** One patient's overdue NIP age milestones (due day < today and not ticked). */
export function auAsiKohortSatiri(g: AuAsiKohortGirdi, bugun: string): AuAsiKohortSatir {
  if (!gunMu(g.dogumIso) || !gunMu(bugun)) {
    return { patientId: g.patientId, ad: g.ad, bayraklar: [], geciken: [], enErkenVade: null }
  }
  const yapilan = new Set(g.yapilan)
  const geciken: string[] = []
  let enErken: string | null = null
  for (const k of AU_KOHORT_ASI_MADDELERI) {
    if (yapilan.has(k)) continue
    const vade = asiVade(g.dogumIso, ASI_VADESI[k])
    if (bugun > vade) {
      geciken.push(k)
      if (!enErken || vade < enErken) enErken = vade
    }
  }
  return {
    patientId: g.patientId,
    ad: g.ad,
    bayraklar: geciken.length ? ['asi_gecikti'] : [],
    geciken,
    enErkenVade: enErken,
  }
}

export function auAsiKohortSatirlari(liste: readonly AuAsiKohortGirdi[], bugun: string): AuAsiKohortSatir[] {
  return liste.map((g) => auAsiKohortSatiri(g, bugun)).filter((s) => s.bayraklar.length > 0)
}

export type AuIncelemeKohortGirdi = {
  patientId: string
  ad: string
  seansIso: string
  aralikGun: number
}

export type AuIncelemeKohortSatir = {
  patientId: string
  ad: string
  sonraki: string
  gecikti: boolean
}

/** Next review = session + interval days; overdue when that day is before today. */
export function auIncelemeKohortSatiri(g: AuIncelemeKohortGirdi, bugun: string): AuIncelemeKohortSatir | null {
  if (!gunMu(g.seansIso) || !gunMu(bugun) || !Number.isInteger(g.aralikGun) || g.aralikGun < 1) return null
  const sonraki = gunEkle(g.seansIso, g.aralikGun)
  return { patientId: g.patientId, ad: g.ad, sonraki, gecikti: bugun > sonraki }
}

export function auIncelemeKohortSatirlari(liste: readonly AuIncelemeKohortGirdi[], bugun: string): AuIncelemeKohortSatir[] {
  return liste.map((g) => auIncelemeKohortSatiri(g, bugun)).filter((s): s is AuIncelemeKohortSatir => !!s && s.gecikti)
}

export const AU_ASI_KOHORT: AracTanimi = {
  anahtar: 'au-immunisation-cohort',
  tur: 'takvim',
  alanlar: [
    tarih('dogumGunu'),
    ...AU_KOHORT_ASI_MADDELERI.map(isaret),
  ],
  cikti: {
    sayilar: ['geciken'],
    bantlar: [],
    uyarilar: ['asi_gecikti', 'guncel'],
    tarihler: AU_KOHORT_ASI_MADDELERI.map((k) => `vade_${k}`),
  },
  kaynak: 'National Immunisation Program Schedule age milestones (NSW Health rendering of the national schedule, current as at 1 October 2026, read 2026-10-13). Due days only; nothing is sent to the Australian Immunisation Register.',
  hesapla: (g, ortam) => {
    if (!gunMu(g.dogumGunu)) return BOS_SONUC
    const bugun = gunMu(ortam.bugun) ? ortam.bugun : null
    if (!bugun) return BOS_SONUC
    const yapilan = isaretliler(g, AU_KOHORT_ASI_MADDELERI)
    const satir = auAsiKohortSatiri({ patientId: '_', ad: '_', dogumIso: g.dogumGunu, yapilan }, bugun)
    const tarihler = AU_KOHORT_ASI_MADDELERI.map((k) => ({
      anahtar: `vade_${k}`,
      tarih: asiVade(g.dogumGunu as string, ASI_VADESI[k]),
    }))
    return {
      tamam: true,
      sayilar: [{ anahtar: 'geciken', deger: satir.geciken.length, ondalik: 0, enCok: AU_KOHORT_ASI_MADDELERI.length }],
      bant: null,
      uyarilar: satir.geciken.length ? ['asi_gecikti'] : ['guncel'],
      tarihler,
    }
  },
}

export const AU_INCELEME_KOHORT: AracTanimi = {
  anahtar: 'au-review-cohort',
  tur: 'takvim',
  alanlar: [tarih('seans'), sayi('aralik', 1, 366, { tam: true })],
  cikti: {
    sayilar: [],
    bantlar: [],
    uyarilar: ['inceleme_gecikti', 'guncel'],
    tarihler: ['sonraki'],
  },
  kaynak: 'Next review = visit date + interval the practitioner enters. Same arithmetic as the clinical-review studios. Nothing is booked or sent.',
  hesapla: (g, ortam) => {
    if (!gunMu(g.seans) || !sayiMi(g.aralik) || !Number.isInteger(g.aralik) || g.aralik < 1) return BOS_SONUC
    const bugun = gunMu(ortam.bugun) ? ortam.bugun : null
    if (!bugun) return BOS_SONUC
    const satir = auIncelemeKohortSatiri(
      { patientId: '_', ad: '_', seansIso: g.seans as string, aralikGun: g.aralik as number },
      bugun,
    )
    if (!satir) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [],
      bant: null,
      uyarilar: satir.gecikti ? ['inceleme_gecikti'] : ['guncel'],
      tarihler: [{ anahtar: 'sonraki', tarih: satir.sonraki }],
    }
  },
}

export const AU_KOHORT_TANIMLAR: readonly AracTanimi[] = [AU_ASI_KOHORT, AU_INCELEME_KOHORT]

const ASI_ROLLER: readonly string[] = ['paediatrics', 'family-medicine']

export function auKohortAraclari(): readonly PaketAraci[] {
  const tumRoller = Object.keys(AU_ASISTAN_ADLARI) as Sunulan[]
  return [
    {
      anahtar: 'au-immunisation-cohort',
      roller: [...ASI_ROLLER],
      metin: {
        ad: m('Overdue immunisation check (NIP age milestones)'),
        aciklama: m('From the birth date, works out which National Immunisation Program age milestones are already due and not yet ticked. School-year and pregnancy rows stay on the full schedule tool. Nothing is sent to the Australian Immunisation Register.'),
        alanlar: {
          dogumGunu: m('Date of birth'),
          dogum: m('Birth dose recorded'),
          hafta6: m('6-week milestone recorded'),
          ay4: m('4-month milestone recorded'),
          ay6: m('6-month milestone recorded'),
          ay12: m('12-month milestone recorded'),
          ay18: m('18-month milestone recorded'),
          yas4: m('4-year milestone recorded'),
        },
        sayilar: { geciken: m('Overdue milestones') },
        uyarilar: {
          asi_gecikti: m('One or more age milestones are overdue on the National Immunisation Program schedule. Catch-up stays on the immunisation schedule tool. Nothing was sent.'),
          guncel: m('No overdue age milestone on the milestones checked here.'),
        },
        tarihler: Object.fromEntries(AU_KOHORT_ASI_MADDELERI.map((k) => [`vade_${k}`, m(`Due day for ${k}`)])),
        not: m('A check against age milestones only. Brand, risk group and AIR reporting stay elsewhere. Companion to the follow-up list.'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Australian Government Department of Health, Disability and Ageing — National Immunisation Program Schedule',
        kaynak: 'https://www.health.nsw.gov.au/schedule (read 2026-10-28): national NIP age milestones (content current as at 1 October 2026). Nothing is sent to the Australian Immunisation Register.',
        bildirim: m('Based on the National Immunisation Program Schedule age milestones. Nothing is sent to the Register.'),
      },
    },
    {
      anahtar: 'au-review-cohort',
      roller: tumRoller,
      metin: {
        ad: m('Overdue clinical review check'),
        aciklama: m('Works out the next review from the last visit date and the interval you enter. Marks overdue when that day is before today. Companion to the follow-up list — does not replace it. Nothing is booked or sent.'),
        alanlar: {
          seans: m('Date of the last review visit'),
          aralik: m('Days until the next review you arranged'),
        },
        uyarilar: {
          inceleme_gecikti: m('This review is overdue. Open the patient file or the follow-up list. Nothing was sent.'),
          guncel: m('The next review day is today or still ahead.'),
        },
        tarihler: { sonraki: m('Next review this check works out') },
        not: m('Same day arithmetic as the clinical-review studios. The follow-up day you keep on a saved note is still the day you enter there.'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Notya',
        kaynak: 'https://www.medicalboard.gov.au/Registration/Types/Specialist-Registration/Medical-Specialties-and-Specialty-Fields.aspx (read 2026-10-28): visit date + interval only; no college pathway copied.',
        bildirim: m('These days are worked out in this note. Nothing is booked and nothing is sent.'),
      },
    },
  ]
}

export const AU_KOHORT_ANAHTARLARI: readonly string[] = ['au-immunisation-cohort', 'au-review-cohort']
