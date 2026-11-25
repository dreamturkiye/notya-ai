/**
 * HASTA-PORTALI-GUNLUK — per-branş configuration of the daily health home. CORE feature: every one of the 30 medical
 * branches and the 10 Özel Branşlar resolves to a config here (an unknown / empty branch gets the general default).
 * What differs per branş is DATA — which quick-add measurements are shown, the daily measurement goal, whether the home
 * leans on adherence or on measurements, which badges apply and which cards are drawn — never a forked screen.
 *
 * brans-alan-sizmasi: branş-specific pieces are gated here and nowhere else —
 *  - 'ates_ilac' (fever + fever-medicine log, "Verdim" with time since the last dose) is pediatri / çocuk cerrahisi only;
 *  - the 'gebelik' BP profile applies only to a Kadın Hastalıkları ve Doğum token WITH an active pregnancy record;
 *  - LDL target card only for the cardiometabolic branches.
 * Deeper branş modules (photo diary, family account, voice / WhatsApp entry, safe patient guide, micro tasks) are
 * Phase 2 — docs/OPEN-COMMITMENTS.md § HASTA-PORTALI-GUNLUK-FAZ2.
 */
import type { OlcumTipi } from './tipler'
import type { HedefProfili, HekimAyarlari } from './hedefler'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'

export type GunlukKarti = 'ates_ilac' | 'ldl' | 'su_sayaci' | 'kilo_egilim'

export interface BransGunlukAyari {
  /** Quick-add measurement tiles, in display order. */
  olcumler: OlcumTipi[]
  /** Readings per day that fill the daily "Ölçüm" ring, per kind (absent = the catalog default). */
  gunlukHedef: Partial<Record<OlcumTipi, number>>
  /** 'olcum' = measurements first on Bugün; 'uyum' = doses first (derm / KBB / göz …). */
  vurgu: 'olcum' | 'uyum'
  kartlar: GunlukKarti[]
  /** Weight gain (+2 kg / 3 days) notifies the doctor (heart / kidney follow-up). */
  kiloHekimeBildir: boolean
}

const KARDIYOMETABOLIK: BransGunlukAyari = { olcumler: ['kb', 'glukoz', 'kilo', 'nabiz'], gunlukHedef: { kb: 2, glukoz: 2, kilo: 0, nabiz: 0 }, vurgu: 'olcum', kartlar: ['ldl', 'kilo_egilim'], kiloHekimeBildir: false }
const UYUM: BransGunlukAyari = { olcumler: [], gunlukHedef: {}, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false }
const GENEL: BransGunlukAyari = { olcumler: ['kb', 'nabiz', 'kilo'], gunlukHedef: { kb: 1, nabiz: 0, kilo: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false }

/** The 30 medical branches (lib/doktor/specialties.ts keys). Every key is listed on purpose — the test enforces it. */
export const TIBBI_BRANS_AYARLARI: Record<string, BransGunlukAyari> = {
  dahiliye: KARDIYOMETABOLIK,
  endokrinoloji: KARDIYOMETABOLIK,
  kardiyoloji: { ...KARDIYOMETABOLIK, kiloHekimeBildir: true },
  'aile-hekimligi': KARDIYOMETABOLIK,
  nefroloji: { olcumler: ['kb', 'kilo', 'glukoz', 'nabiz'], gunlukHedef: { kb: 2, kilo: 1, glukoz: 0, nabiz: 0 }, vurgu: 'olcum', kartlar: ['ldl', 'kilo_egilim'], kiloHekimeBildir: true },
  'kalp-damar-cerrahisi': { olcumler: ['kb', 'nabiz', 'kilo'], gunlukHedef: { kb: 1, nabiz: 1, kilo: 0 }, vurgu: 'olcum', kartlar: ['kilo_egilim'], kiloHekimeBildir: true },
  pediatri: { olcumler: ['ates', 'kilo'], gunlukHedef: { ates: 0, kilo: 0 }, vurgu: 'uyum', kartlar: ['ates_ilac'], kiloHekimeBildir: false },
  'cocuk-cerrahisi': { olcumler: ['ates', 'kilo'], gunlukHedef: { ates: 0, kilo: 0 }, vurgu: 'uyum', kartlar: ['ates_ilac'], kiloHekimeBildir: false },
  'kadin-hastaliklari-dogum': { olcumler: ['kb', 'kilo'], gunlukHedef: { kb: 1, kilo: 0 }, vurgu: 'olcum', kartlar: ['kilo_egilim'], kiloHekimeBildir: false },
  'gogus-hastaliklari': { olcumler: ['spo2', 'nabiz', 'ates'], gunlukHedef: { spo2: 1, nabiz: 0, ates: 0 }, vurgu: 'olcum', kartlar: [], kiloHekimeBildir: false },
  'enfeksiyon-hastaliklari': { olcumler: ['ates', 'nabiz'], gunlukHedef: { ates: 1, nabiz: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  onkoloji: { olcumler: ['ates', 'kilo', 'nabiz'], gunlukHedef: { ates: 1, kilo: 0, nabiz: 0 }, vurgu: 'uyum', kartlar: ['kilo_egilim'], kiloHekimeBildir: false },
  noroloji: { olcumler: ['kb', 'nabiz'], gunlukHedef: { kb: 1, nabiz: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'beyin-cerrahisi': { olcumler: ['ates', 'kb'], gunlukHedef: { ates: 0, kb: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'genel-cerrahi': { olcumler: ['ates', 'kilo'], gunlukHedef: { ates: 0, kilo: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'gogus-cerrahisi': { olcumler: ['spo2', 'ates', 'nabiz'], gunlukHedef: { spo2: 1, ates: 0, nabiz: 0 }, vurgu: 'olcum', kartlar: [], kiloHekimeBildir: false },
  'plastik-cerrahi': { olcumler: ['ates'], gunlukHedef: { ates: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  anestezi: { olcumler: ['kb', 'nabiz', 'spo2'], gunlukHedef: { kb: 0, nabiz: 0, spo2: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'acil-tip': { olcumler: ['ates', 'kb', 'nabiz'], gunlukHedef: { ates: 0, kb: 0, nabiz: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  gastroenteroloji: { olcumler: ['kilo', 'ates'], gunlukHedef: { kilo: 0, ates: 0 }, vurgu: 'uyum', kartlar: ['kilo_egilim'], kiloHekimeBildir: false },
  romatoloji: { olcumler: ['kb', 'kilo'], gunlukHedef: { kb: 0, kilo: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'spor-hekimligi': { olcumler: ['nabiz', 'kilo'], gunlukHedef: { nabiz: 0, kilo: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  ortopedi: { olcumler: [], gunlukHedef: {}, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'fizik-tedavi': { olcumler: [], gunlukHedef: {}, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  uroloji: { olcumler: ['ates'], gunlukHedef: { ates: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  psikiyatri: UYUM,
  dermatoloji: UYUM,
  'kulak-burun-bogaz': UYUM,
  'goz-hastaliklari': UYUM,
  radyoloji: UYUM,
}

/** The 10 Özel Branşlar (KLINIK_YENI_SLUGS). */
export const OZEL_BRANS_AYARLARI: Record<string, BransGunlukAyari> = {
  diyetisyen: { olcumler: ['kilo', 'bel', 'su'], gunlukHedef: { kilo: 0, bel: 0, su: 8 }, vurgu: 'olcum', kartlar: ['su_sayaci', 'kilo_egilim'], kiloHekimeBildir: false },
  longevity: { olcumler: ['kb', 'glukoz', 'kilo', 'nabiz', 'spo2'], gunlukHedef: { kb: 1, glukoz: 0, kilo: 0, nabiz: 0, spo2: 0 }, vurgu: 'olcum', kartlar: ['ldl', 'kilo_egilim'], kiloHekimeBildir: false },
  fizyoterapi: UYUM,
  ergoterapi: UYUM,
  'klinik-psikolog': UYUM,
  odyoloji: UYUM,
  'sac-ekimi': UYUM,
  'estetik-cerrahi': { olcumler: ['ates'], gunlukHedef: { ates: 0 }, vurgu: 'uyum', kartlar: [], kiloHekimeBildir: false },
  'medikal-estetik': UYUM,
  'klinik-dermatoloji': UYUM,
}

export const VARSAYILAN_GUNLUK_AYARI = GENEL

/** Resolve a doctor's free-text specialty to a config. Özel Branş slugs first (bransAnahtari returns null for them). */
export function bransGunlukAyari(doktorBransi: string | null | undefined): { anahtar: string; ayar: BransGunlukAyari } {
  const klinik = klinikSlugCoz(doktorBransi)
  if (klinik && OZEL_BRANS_AYARLARI[klinik]) return { anahtar: klinik, ayar: OZEL_BRANS_AYARLARI[klinik] }
  const b = bransAnahtari(doktorBransi)
  if (b && TIBBI_BRANS_AYARLARI[b]) return { anahtar: b, ayar: TIBBI_BRANS_AYARLARI[b] }
  return { anahtar: 'genel', ayar: GENEL }
}

/**
 * The patient's effective quick-add list: branş defaults + kinds the doctor turned on − kinds the doctor turned off +
 * kinds the patient already recorded in the last 90 days (a patient who logs weight keeps the tile).
 */
export function etkinOlcumler(ayar: BransGunlukAyari, hekim: HekimAyarlari | null | undefined, kayitliTipler: Iterable<OlcumTipi> = []): OlcumTipi[] {
  const kapali = new Set(hekim?.kapali || [])
  const out: OlcumTipi[] = []
  for (const t of [...ayar.olcumler, ...(hekim?.olcumler || []), ...kayitliTipler]) if (!kapali.has(t) && !out.includes(t)) out.push(t)
  return out
}

/** Target profile: pregnancy thresholds only for a KD doctor with an active pregnancy on the chart. */
export function hedefProfili(bransAnahtar: string, gebelikAktif: boolean): HedefProfili {
  return bransAnahtar === 'kadin-hastaliklari-dogum' && gebelikAktif ? 'gebelik' : 'genel'
}
