/**
 * NOTYA-BELGE-01 — 30-branş router.
 * Which modalities a branş accepts as "yüksek değerli girdi", which engines run (per tier), the age rule,
 * and the confidence cap. Anything not listed for a branş is 'serbest' → describe only (locked rule).
 * Psikiyatri: no engines, diagnostic audio rejected (locked).
 */
import type { Modalite } from './ontoloji'

export type BransKurali = {
  ad: string
  persona: 'ayse' | 'mehmet' | 'elif' | 'genel'
  modaliteler: Modalite[]
  /** Tier B browser engines to try, by modality (registered in motor_kayit; absent = Tier A only) */
  motorlar: Partial<Record<Modalite, string[]>>
  pediatrik?: boolean
  engelli?: boolean
  /** GOZ-EXCEPTIONAL-01: analiz, branşın dual-sign görüntü okumasına taslak olarak aktarılabilir (yalnız göz). */
  goruntuOkumaKoprusu?: boolean
}

const CXR_B = ['txrv-densenet121']
const EKG_B = ['ptbxl-inception1d']
const AKC_SES_B = ['hear-icbhi']
const KALP_SES_B = ['hear-circor']
const KEMIK_PED_B = ['grazpedwri-yolo', 'rsna-boneage']
const KEMIK_B = ['fracatlas-yolo']

export const BRANS_KURALLARI: Record<string, BransKurali> = {
  aile: { ad: 'Aile Hekimliği', persona: 'genel', modaliteler: ['cxr', 'ekg', 'derm', 'fundus', 'ses_akciger', 'ses_kalp', 'otoskopi', 'pdf_rapor'], motorlar: { cxr: CXR_B, ekg: EKG_B, ses_akciger: AKC_SES_B, ses_kalp: KALP_SES_B } },
  acil: { ad: 'Acil Tıp', persona: 'genel', modaliteler: ['cxr', 'xr_kemik', 'xr_batin', 'ekg', 'ct', 'us', 'pdf_rapor'], motorlar: { cxr: CXR_B, ekg: EKG_B, xr_kemik: KEMIK_B } },
  anestezi: { ad: 'Anestezi ve Reanimasyon', persona: 'genel', modaliteler: ['ekg', 'cxr', 'serbest', 'pdf_rapor'], motorlar: { cxr: CXR_B, ekg: EKG_B } },
  beyin_cerrahisi: { ad: 'Beyin ve Sinir Cerrahisi', persona: 'elif', modaliteler: ['ct', 'mr', 'pdf_rapor'], motorlar: {} },
  cocuk_cerrahisi: { ad: 'Çocuk Cerrahisi', persona: 'ayse', modaliteler: ['xr_kemik', 'xr_batin', 'us', 'pdf_rapor'], motorlar: { xr_kemik: KEMIK_PED_B }, pediatrik: true },
  pediatri: { ad: 'Çocuk Sağlığı ve Hastalıkları', persona: 'ayse', modaliteler: ['cxr', 'ekg', 'otoskopi', 'ses_akciger', 'ses_kalp', 'ses_oksuruk', 'xr_kemik', 'derm', 'pdf_rapor'], motorlar: { cxr: CXR_B, ekg: EKG_B, ses_akciger: AKC_SES_B, ses_kalp: KALP_SES_B, xr_kemik: KEMIK_PED_B }, pediatrik: true },
  dermatoloji: { ad: 'Dermatoloji', persona: 'genel', modaliteler: ['dermatoskopi', 'derm', 'yara', 'pdf_rapor'], motorlar: {} },
  enfeksiyon: { ad: 'Enfeksiyon Hastalıkları', persona: 'elif', modaliteler: ['cxr', 'yara', 'yayma', 'pdf_rapor'], motorlar: { cxr: CXR_B } },
  ftr: { ad: 'Fiziksel Tıp ve Rehabilitasyon', persona: 'genel', modaliteler: ['xr_kemik', 'video_yurume', 'pdf_rapor'], motorlar: { xr_kemik: KEMIK_B } },
  genel_cerrahi: { ad: 'Genel Cerrahi', persona: 'genel', modaliteler: ['xr_batin', 'ct', 'yara', 'cxr', 'pdf_rapor'], motorlar: { cxr: CXR_B } },
  gogus: { ad: 'Göğüs Hastalıkları', persona: 'elif', modaliteler: ['cxr', 'ct', 'ses_akciger', 'ses_oksuruk', 'pdf_rapor'], motorlar: { cxr: CXR_B, ses_akciger: AKC_SES_B } },
  gogus_cerrahisi: { ad: 'Göğüs Cerrahisi', persona: 'genel', modaliteler: ['cxr', 'ct', 'pdf_rapor'], motorlar: { cxr: CXR_B } },
  goz: { ad: 'Göz Hastalıkları', persona: 'genel', modaliteler: ['fundus', 'oct', 'dis_goz', 'pdf_rapor'], motorlar: {}, goruntuOkumaKoprusu: true },
  dahiliye: { ad: 'İç Hastalıkları', persona: 'elif', modaliteler: ['cxr', 'ekg', 'fundus', 'us', 'pdf_rapor'], motorlar: { cxr: CXR_B, ekg: EKG_B } },
  kadin_dogum: { ad: 'Kadın Hastalıkları ve Doğum', persona: 'genel', modaliteler: ['us', 'nst', 'mamografi', 'pdf_rapor'], motorlar: {} },
  kardiyoloji: { ad: 'Kardiyoloji', persona: 'mehmet', modaliteler: ['ekg', 'eko', 'ses_kalp', 'cxr', 'pdf_rapor'], motorlar: { ekg: EKG_B, ses_kalp: KALP_SES_B, cxr: CXR_B } },
  kbb: { ad: 'Kulak Burun Boğaz', persona: 'genel', modaliteler: ['otoskopi', 'endoskopi', 'ses_konusma', 'pdf_rapor'], motorlar: {} },
  nefroloji: { ad: 'Nefroloji', persona: 'elif', modaliteler: ['us', 'xr_batin', 'pdf_rapor'], motorlar: {} },
  noroloji: { ad: 'Nöroloji', persona: 'elif', modaliteler: ['ct', 'mr', 'fundus', 'eeg', 'pdf_rapor'], motorlar: {} },
  ortopedi: { ad: 'Ortopedi ve Travmatoloji', persona: 'genel', modaliteler: ['xr_kemik', 'mr', 'pdf_rapor'], motorlar: { xr_kemik: KEMIK_B } },
  plastik: { ad: 'Plastik Cerrahi', persona: 'genel', modaliteler: ['yara', 'derm', 'pdf_rapor'], motorlar: {} },
  psikiyatri: { ad: 'Psikiyatri', persona: 'genel', modaliteler: ['pdf_rapor'], motorlar: {}, engelli: true },
  radyoloji: { ad: 'Radyoloji', persona: 'genel', modaliteler: ['cxr', 'xr_kemik', 'xr_batin', 'ct', 'mr', 'us', 'mamografi', 'pet', 'pdf_rapor'], motorlar: { cxr: CXR_B, xr_kemik: KEMIK_B } },
  uroloji: { ad: 'Üroloji', persona: 'genel', modaliteler: ['us', 'xr_batin', 'ct', 'pdf_rapor'], motorlar: {} },
  patoloji: { ad: 'Patoloji', persona: 'genel', modaliteler: ['patoloji', 'pdf_rapor'], motorlar: {} },
  gastroenteroloji: { ad: 'Gastroenteroloji', persona: 'elif', modaliteler: ['endoskopi', 'us', 'pdf_rapor'], motorlar: {} },
  endokrinoloji: { ad: 'Endokrinoloji', persona: 'elif', modaliteler: ['fundus', 'us', 'pdf_rapor'], motorlar: {} },
  hematoloji: { ad: 'Hematoloji', persona: 'elif', modaliteler: ['yayma', 'pdf_rapor'], motorlar: {} },
  onkoloji: { ad: 'Tıbbi Onkoloji', persona: 'elif', modaliteler: ['ct', 'pet', 'patoloji', 'derm', 'pdf_rapor'], motorlar: {} },
  romatoloji: { ad: 'Romatoloji', persona: 'elif', modaliteler: ['xr_kemik', 'us', 'pdf_rapor'], motorlar: { xr_kemik: KEMIK_B } },
  dis: { ad: 'Diş Hekimliği', persona: 'genel', modaliteler: ['dental', 'pdf_rapor'], motorlar: {} },
  genel: { ad: 'Genel', persona: 'genel', modaliteler: ['pdf_rapor'], motorlar: {} },
}

/** Map the free-text specialty stored on users.specialty / notes.specialty to a router key. */
export function bransAnahtari(specialty: string | null | undefined): string {
  const s = (specialty || '').toLocaleLowerCase('tr-TR')
  const eslesme: [RegExp, string][] = [
    [/pediatri|çocuk sağ|cocuk sag/, 'pediatri'], [/çocuk cer|cocuk cer/, 'cocuk_cerrahisi'], [/kardiyo/, 'kardiyoloji'],
    [/nöro|noro/, 'noroloji'], [/beyin/, 'beyin_cerrahisi'], [/dahiliye|iç hast|ic hast/, 'dahiliye'], [/aile/, 'aile'],
    [/acil/, 'acil'], [/anestez/, 'anestezi'], [/derma/, 'dermatoloji'], [/enfeksiyon/, 'enfeksiyon'], [/fizik|ftr/, 'ftr'],
    [/genel cer/, 'genel_cerrahi'], [/göğüs cer|gogus cer/, 'gogus_cerrahisi'], [/göğüs|gogus/, 'gogus'], [/göz|goz/, 'goz'],
    [/kadın|kadin|jinek|obstet/, 'kadin_dogum'], [/kbb|kulak/, 'kbb'], [/nefro/, 'nefroloji'], [/ortoped/, 'ortopedi'],
    [/plastik/, 'plastik'], [/psikiyatr/, 'psikiyatri'], [/radyo/, 'radyoloji'], [/üro|uro/, 'uroloji'], [/patolo/, 'patoloji'],
    [/gastro/, 'gastroenteroloji'], [/endokrin/, 'endokrinoloji'], [/hemato/, 'hematoloji'], [/onkolo/, 'onkoloji'],
    [/romato/, 'romatoloji'], [/diş|dis hek/, 'dis'],
  ]
  for (const [re, k] of eslesme) if (re.test(s)) return k
  return 'genel'
}

export function bransKurali(anahtar: string): BransKurali {
  return BRANS_KURALLARI[anahtar] || BRANS_KURALLARI.genel
}

/** Effective modality for this branş: listed → as chosen; not listed → 'serbest' (describe only). */
export function etkinModalite(anahtar: string, secilen: Modalite): { modalite: Modalite; serbest: boolean } {
  const k = bransKurali(anahtar)
  if (k.modaliteler.includes(secilen)) return { modalite: secilen, serbest: false }
  return { modalite: 'serbest', serbest: true }
}

/** Tier B engines to attempt for (branş, modality). Empty → Tier A only. */
export function tierBMotorlari(anahtar: string, modalite: Modalite): string[] {
  return bransKurali(anahtar).motorlar[modalite] || []
}

export const SES_MODALITELERI: Modalite[] = ['ses_akciger', 'ses_kalp', 'ses_oksuruk', 'ses_konusma']
