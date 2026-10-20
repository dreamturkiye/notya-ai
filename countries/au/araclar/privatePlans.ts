/**
 * Studios for the private roles Australia offers.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. Each studio's `roller` is one role.
 * Cardiology, dermatology, general practice and every other role do not see it.
 * Cosmetic surgery does not see the non-surgical plan, and non-surgical cosmetic
 * procedures do not see this surgical studio. Psychology has no image line.
 *
 * READ 2026-10-20 — Medical Board of Australia, Guidelines for registered medical
 * practitioners who perform cosmetic surgery and procedures:
 *   https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Cosmetic-medical-and-surgical-procedures-guidelines
 * Cosmetic surgery: at least two pre-operative consultations; consent is not requested
 * at the first; at least seven days after signed consent before the surgery is booked
 * or a deposit is paid, and informed consent at least seven days before the day of
 * surgery; a patient under 18 has at least three months between informed consent and
 * the surgery, and an evaluation by an independent psychologist, psychiatrist or
 * general practitioner. A copy of the signed consent is given to the patient. Images
 * need documented consent and must not be stored on a personal device. The day after
 * surgery is the day through which a surgeon who operates away from their main rooms
 * remains available. No sentence from the guideline is copied as a passage.
 *
 * The allied studios copy no code and no protocol. The next review is the session
 * date plus the interval the practitioner enters. The two consent lines are the
 * copy kept on the file and the copy given to the patient. An image, where that
 * role uses one, is recorded only when the practitioner keeps one, and the file
 * itself stays in the patient photo archive under Documents.
 *
 * EACH STUDIO IS SAVED on the patient's Australia record (ulke_arac_kayitlari).
 * The days in the result are worked out here. The follow-up day stored on the row
 * is still the day the practitioner enters when they keep the note. Nothing is sent.
 */
import type { AracGirdisi, AracSonucu, AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, ayEkle, gunEkle, gunFarki, gunMu, isaret, sayi, sayiMi, secim, tarih } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const GONDERILMEDI = 'These days are worked out in this note. Nothing is booked and nothing is sent.'
const KURUL = 'https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Cosmetic-medical-and-surgical-procedures-guidelines (read 2026-10-20)'
const CERRAHI_KAYNAK = `${KURUL}: cosmetic surgery consultations, cooling-off, consent and images. No sentence from the guideline is copied as arithmetic.`

const YAS = ['yetiskin', 'onsekiz'] as const
const GORUNTU = ['yok', 'var'] as const
const yalnizYas = (degerler: readonly string[]) => ({ kosul: { alan: 'yas', degerler } })
const gorselSatir = { ...isaret('foto'), kosul: { alan: 'goruntu', degerler: ['var'] } }

function cerrahiHesapla(g: AracGirdisi): AracSonucu {
  if (g.yas !== 'yetiskin' && g.yas !== 'onsekiz') return BOS_SONUC
  if (!gunMu(g.ilk) || !gunMu(g.onam)) return BOS_SONUC
  if (g.goruntu !== 'yok' && g.goruntu !== 'var') return BOS_SONUC
  const enErken = g.yas === 'yetiskin' ? gunEkle(g.onam, 7) : ayEkle(g.onam, 3)
  const tarihler: { anahtar: string; tarih: string }[] = [{ anahtar: g.yas === 'yetiskin' ? 'rezervasyon' : 'ameliyatSiniri', tarih: enErken }]
  const uyarilar = ['gonderilmedi']
  if (gunFarki(g.ilk, g.onam) <= 0) uyarilar.push('ilkGun')
  if (g.gorusme !== true) uyarilar.push('gorusme')
  if (g.dosya !== true || g.hasta !== true) uyarilar.push('nusha')
  if (g.yas === 'onsekiz' && g.bagimsiz !== true) uyarilar.push('bagimsiz')
  if (g.goruntu === 'var' && g.foto !== true) uyarilar.push('gorsel')
  if (gunMu(g.ameliyat)) {
    tarihler.push({ anahtar: 'teyit', tarih: g.ameliyat }, { anahtar: 'yirmiDort', tarih: gunEkle(g.ameliyat, 1) })
    if (gunFarki(enErken, g.ameliyat) < 0) uyarilar.push('soguma')
  }
  return { tamam: true, sayilar: [], bant: null, uyarilar, tarihler }
}

/** Cosmetic surgery only. Hair transplants stay on the non-surgical plan. */
export const AU_COSMETIC: AracTanimi = {
  anahtar: 'au-cosmetic-surgery-plan',
  tur: 'takvim',
  alanlar: [
    secim('yas', YAS),
    tarih('ilk'),
    tarih('onam'),
    tarih('ameliyat', true),
    isaret('gorusme'),
    isaret('dosya'),
    isaret('hasta'),
    { ...isaret('bagimsiz'), ...yalnizYas(['onsekiz']) },
    secim('goruntu', GORUNTU),
    gorselSatir,
  ],
  cikti: {
    sayilar: [],
    bantlar: [],
    uyarilar: ['gonderilmedi', 'ilkGun', 'gorusme', 'nusha', 'bagimsiz', 'gorsel', 'soguma'],
    tarihler: ['rezervasyon', 'ameliyatSiniri', 'teyit', 'yirmiDort'],
  },
  kaynak: CERRAHI_KAYNAK,
  hesapla: cerrahiHesapla,
}

function seansStudyo(anahtar: string, kaynak: string, foto: boolean): AracTanimi {
  return {
    anahtar,
    tur: 'takvim',
    alanlar: [
      tarih('seans'),
      sayi('aralik', 1, 366, { tam: true }),
      isaret('dosya'),
      isaret('hasta'),
      ...(foto ? [secim('goruntu', GORUNTU), gorselSatir] : []),
    ],
    cikti: {
      sayilar: [],
      bantlar: [],
      uyarilar: foto ? ['gonderilmedi', 'nusha', 'gorsel'] : ['gonderilmedi', 'nusha'],
      tarihler: ['sonraki'],
    },
    kaynak,
    hesapla: (g) => {
      if (!gunMu(g.seans) || !sayiMi(g.aralik) || !Number.isInteger(g.aralik) || g.aralik < 1) return BOS_SONUC
      if (foto && g.goruntu !== 'yok' && g.goruntu !== 'var') return BOS_SONUC
      const uyarilar = ['gonderilmedi']
      if (g.dosya !== true || g.hasta !== true) uyarilar.push('nusha')
      if (foto && g.goruntu === 'var' && g.foto !== true) uyarilar.push('gorsel')
      return { tamam: true, sayilar: [], bant: null, uyarilar, tarihler: [{ anahtar: 'sonraki', tarih: gunEkle(g.seans, g.aralik) }] }
    },
  }
}

const FIZYO_KAYNAK = 'https://australian.physio/ (read 2026-10-19): the profession page. This studio copies no protocol. The interval is the physiotherapist\'s.'
const PSIK_KAYNAK = 'https://psychology.org.au/ (read 2026-10-19): the profession page. This studio copies no protocol. A photograph is not part of an ordinary consultation.'
const DIYET_KAYNAK = 'https://dietitiansaustralia.org.au/ (read 2026-10-19): the profession page. This studio copies no meal plan and no dose.'
const OT_KAYNAK = 'https://www.otaus.com.au/ (read 2026-10-19): the profession page. This studio copies no protocol.'
const ODYO_KAYNAK = 'https://audiology.asn.au/ (read 2026-10-19): the profession page. Hearing figures stay in the hearing tool. This studio copies no protocol.'

export const AU_PHYSIO = seansStudyo('au-physio-plan', FIZYO_KAYNAK, true)
export const AU_PSYCHOLOGY = seansStudyo('au-psychology-plan', PSIK_KAYNAK, false)
export const AU_DIETETICS = seansStudyo('au-dietetics-plan', DIYET_KAYNAK, true)
export const AU_OT = seansStudyo('au-ot-plan', OT_KAYNAK, true)
export const AU_AUDIOLOGY = seansStudyo('au-audiology-plan', ODYO_KAYNAK, true)

export const AU_OZEL_TANIMLAR: readonly AracTanimi[] = [AU_COSMETIC, AU_PHYSIO, AU_PSYCHOLOGY, AU_DIETETICS, AU_OT, AU_AUDIOLOGY]

type Sozluk = Record<string, string>

function paket(anahtar: string, rol: string, kaynak: string, metin: {
  ad: string
  aciklama: string
  alanlar: Sozluk
  secenekler?: Record<string, Sozluk>
  uyarilar: Sozluk
  tarihler: Sozluk
  not: string
}): PaketAraci {
  return {
    anahtar,
    roller: [rol],
    metin: {
      ad: m(metin.ad),
      aciklama: m(metin.aciklama),
      alanlar: Object.fromEntries(Object.entries(metin.alanlar).map(([k, v]) => [k, m(v)])),
      ...(metin.secenekler
        ? {
            secenekler: Object.fromEntries(
              Object.entries(metin.secenekler).map(([k, sec]) => [k, Object.fromEntries(Object.entries(sec).map(([s, v]) => [s, m(v)]))]),
            ),
          }
        : {}),
      uyarilar: Object.fromEntries(Object.entries(metin.uyarilar).map(([k, v]) => [k, m(v)])),
      tarihler: Object.fromEntries(Object.entries(metin.tarihler).map(([k, v]) => [k, m(v)])),
      not: m(metin.not),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak, bildirim: m(GONDERILMEDI) },
  }
}

const GORUNTU_SECENEK = { yok: 'No photograph or video', var: 'A photograph or video is kept' }
const NUSHA = 'The copy kept on the file, or the copy given to the patient, is not recorded.'
const GORSEL = 'An image is recorded without documented consent. The file, when one is kept, is stored under Documents and not on a personal device.'
const SEANS = 'Date of this session'
const ARALIK = 'Days until the next review you are arranging'
const DOSYA = 'A copy of the consent is kept on this file.'
const HASTA_KOPYA = 'A copy of the consent was given to the patient.'
const SONRAKI = 'Next review this plan works out'
const NOT_ORTAK = 'The next review above is worked out from the session and the interval. The follow-up day you keep with this note is the day you enter below. Nothing is sent.'

const seansAlan = (fotoEtiket: string | null): Sozluk => ({
  seans: SEANS,
  aralik: ARALIK,
  dosya: DOSYA,
  hasta: HASTA_KOPYA,
  ...(fotoEtiket ? { goruntu: 'Whether an image is kept with this plan', foto: fotoEtiket } : {}),
})

const seansUyari = (foto: boolean): Sozluk => ({
  gonderilmedi: GONDERILMEDI,
  nusha: NUSHA,
  ...(foto ? { gorsel: GORSEL } : {}),
})

/** Cosmetic surgery only. Hair transplants stay on the non-surgical plan. */
export function auCosmeticSurgeryPlan(): PaketAraci {
  return paket('au-cosmetic-surgery-plan', 'aesthetic-surgery', CERRAHI_KAYNAK, {
    ad: 'Cosmetic surgery plan',
    aciklama: 'Works out the earliest day for cosmetic surgery from the consent date and the patient\'s age group, and the day after surgery when a surgery day is entered. Hair transplants are not recorded here. The two consent copies are the one on the file and the one given to the patient. An image, if you keep one, is stored under Documents.',
    alanlar: {
      yas: 'Which age group this note is for',
      ilk: 'Date of the first consultation',
      onam: 'Date the signed consent was given',
      ameliyat: 'Planned day of surgery, if you have one',
      gorusme: 'There were at least two consultations. One was in person with the surgeon who will operate. Consent was not requested at the first consultation.',
      dosya: 'A copy of the signed consent is kept on the file.',
      hasta: 'A copy of the signed consent was given to the patient.',
      bagimsiz: 'The patient was evaluated by a psychologist, psychiatrist or general practitioner who works independently of the surgeon.',
      goruntu: 'Whether a photograph or video is kept with this plan',
      foto: 'Consent for the images was documented, the proposed use was explained, and the file is stored under Documents, not on a personal device.',
    },
    secenekler: {
      yas: { yetiskin: '18 or older', onsekiz: 'Under 18' },
      goruntu: GORUNTU_SECENEK,
    },
    uyarilar: {
      gonderilmedi: GONDERILMEDI,
      ilkGun: 'Signed consent is on the first consultation day, or before it. Consent is not requested at the first consultation.',
      gorusme: 'The two consultations, including one in person with the surgeon, are not recorded.',
      nusha: 'The file copy or the patient\'s copy of the signed consent is not recorded.',
      bagimsiz: 'The independent evaluation for a patient under 18 is not recorded.',
      gorsel: GORSEL,
      soguma: 'The planned surgery day is before the cooling-off period worked out above.',
    },
    tarihler: {
      rezervasyon: 'Earliest day the surgery can be booked',
      ameliyatSiniri: 'Earliest day the surgery can be performed',
      teyit: 'Day of surgery, when consent is reconfirmed',
      yirmiDort: 'The day after surgery',
    },
    not: 'For a patient 18 or older the earliest booking day is seven days after signed consent. For a patient under 18 the earliest surgery day is three months after signed consent. The day after surgery is the day through which a surgeon who operates away from their main rooms remains available. Nothing is booked.',
  })
}

/** Physiotherapy only. */
export function auPhysioPlan(): PaketAraci {
  return paket('au-physio-plan', 'physiotherapy', FIZYO_KAYNAK, {
    ad: 'Physiotherapy plan',
    aciklama: 'Works out the next review from the session date and the interval you enter. Records the consent copy on the file and the copy given to the patient. A photograph of posture, a wound, or the task is recorded only when you keep one, and that file is stored under Documents. No exercise protocol is copied onto this screen.',
    alanlar: seansAlan('Consent for a photograph of posture, a wound, or the task was documented. The file is stored under Documents, not on a personal device.'),
    secenekler: { goruntu: GORUNTU_SECENEK },
    uyarilar: seansUyari(true),
    tarihler: { sonraki: SONRAKI },
    not: `${NOT_ORTAK} No exercise dose is stored here.`,
  })
}

/** Psychology only. An ordinary consultation does not include a photograph. */
export function auPsychologyPlan(): PaketAraci {
  return paket('au-psychology-plan', 'clinical-psychology', PSIK_KAYNAK, {
    ad: 'Psychology plan',
    aciklama: 'Works out the next review from the session date and the interval you enter. Records the consent copy on the file and the copy given to the person. An ordinary consultation does not include a photograph, so this plan has no image line.',
    alanlar: seansAlan(null),
    uyarilar: seansUyari(false),
    tarihler: { sonraki: SONRAKI },
    not: NOT_ORTAK,
  })
}

/** Dietetics only. No meal plan and no dose. */
export function auDieteticsPlan(): PaketAraci {
  return paket('au-dietetics-plan', 'dietetics', DIYET_KAYNAK, {
    ad: 'Dietetics plan',
    aciklama: 'Works out the next review from the session date and the interval you enter. Records the consent copy on the file and the copy given to the patient. This screen stores no meal plan and no dose. A progress photograph is recorded only when you keep one, and that file is stored under Documents.',
    alanlar: seansAlan('Consent for a progress photograph was documented. The file is stored under Documents, not on a personal device.'),
    secenekler: { goruntu: GORUNTU_SECENEK },
    uyarilar: seansUyari(true),
    tarihler: { sonraki: SONRAKI },
    not: `${NOT_ORTAK} No kilocalorie target and no protein target is stored here.`,
  })
}

/** Occupational therapy only. */
export function auOtPlan(): PaketAraci {
  return paket('au-ot-plan', 'occupational-therapy', OT_KAYNAK, {
    ad: 'Occupational therapy plan',
    aciklama: 'Works out the next review from the session date and the interval you enter. Records the consent copy on the file and the copy given to the patient. A photograph of the task or the setting is recorded only when you keep one, and that file is stored under Documents. No activity protocol is copied onto this screen.',
    alanlar: seansAlan('Consent for a photograph of the task or the setting was documented. The file is stored under Documents, not on a personal device.'),
    secenekler: { goruntu: GORUNTU_SECENEK },
    uyarilar: seansUyari(true),
    tarihler: { sonraki: SONRAKI },
    not: NOT_ORTAK,
  })
}

/** Audiology only. Hearing figures stay in the hearing tool. */
export function auAudiologyPlan(): PaketAraci {
  return paket('au-audiology-plan', 'audiology', ODYO_KAYNAK, {
    ad: 'Audiology plan',
    aciklama: 'Works out the next review from the session date and the interval you enter. Records the consent copy on the file and the copy given to the patient. Hearing figures stay in the hearing tool. A photograph of the ear or the device is recorded only when you keep one, and that file is stored under Documents.',
    alanlar: seansAlan('Consent for a photograph of the ear or the device was documented. The file is stored under Documents, not on a personal device.'),
    secenekler: { goruntu: GORUNTU_SECENEK },
    uyarilar: seansUyari(true),
    tarihler: { sonraki: SONRAKI },
    not: NOT_ORTAK,
  })
}

export function auOzelPlanlar(): readonly PaketAraci[] {
  return [auCosmeticSurgeryPlan(), auPhysioPlan(), auPsychologyPlan(), auDieteticsPlan(), auOtPlan(), auAudiologyPlan()]
}
