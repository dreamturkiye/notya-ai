/**
 * NOTYA-ULKE-PORTAL-01 — what the patient's page is given, and what the doctor's controls are answered with.
 * TYPES ONLY, client-safe: the screens (components/ulke/portal/, components/ulke/uygulama/Portal*.tsx) read these;
 * the server builds them (./icerik.ts, ./erisim.ts, ./ozet.ts, ./istek.ts).
 */
import type { DilKodu } from '../tipler'

export type IstekDurumu = 'bekliyor' | 'kabul' | 'red'

export type PortalIcerigi = {
  /** The language form the page is shown in. */
  dil: DilKodu
  hasta: { ad: string }
  hekim: { ad: string; /** The doctor's role as the pack names it in `dil`; '' where the account has none. */ rol: string }
  /** null = the country has no appointments. Upcoming ones only, in time order; day and time of the doctor's zone. */
  randevular: { gun: string; saat: string; sureDk: number }[] | null
  /** The doctor's time zone, named only where the country has more than one (elsewhere there is nothing to say). */
  saatDilimi: string | null
  /** Shared summaries, newest visit first. */
  ozetler: { id: string; /** The day of the visit, 'YYYY-MM-DD' in the doctor's zone. */ gun: string; metin: string }[]
  /** null = the country has no appointment requests. */
  istek: {
    /** The days the patient may choose from. */
    gunler: string[]
    son: { durum: IstekDurumu; gunler: string[]; olusturuldu: string; randevu: { gun: string; saat: string } | null } | null
  } | null
  /**
   * NOTYA-ULKE-INTAKE-01 — the intake form: is one waiting to be filled in, or was one sent? null = neither.
   * Absent = the country has no intake form. No question and no answer is here: the form is read by itself.
   */
  form?: { durum: 'bekliyor' | 'taslak' | 'gonderildi'; veli: boolean; gonderildi: string | null; yenidenAcildi: boolean } | null
  /** When this session ends. */
  bitis: string
}

/** The doctor's view of one patient's access (GET /api/ulke/hasta-portali). */
export type PortalErisimi = {
  /** none · open · locked by wrong PINs · ended */
  durum: 'yok' | 'acik' | 'kilitli' | 'suresi-doldu'
  olusturuldu: string | null
  sonGecerlilik: string | null
  sonGiris: string | null
}
export type PortalOlayi = 'erisim' | 'iptal' | 'giris' | 'kilit' | 'paylasim' | 'geri-alma'
export type PortalKaydi = { olay: PortalOlayi; an: string; ozetId: string | null }

/** A summary for the patient, as the doctor's note screen reads it (/api/ulke/hasta-portali/ozet). */
export type HastaOzeti = {
  id: string
  notId: string
  /** The language form the summary is written in. */
  dil: DilKodu
  metin: string
  paylasildi: boolean
  paylasimAni: string | null
  guncellendi: string
}

/** A patient's appointment request, as the calendar lists it (GET /api/ulke/hasta-portali/istekler). */
export type BekleyenIstek = { id: string; hastaId: string; hastaAdi: string; /** 'YYYY-MM-DD', ascending */ gunler: string[]; neden: string; olusturuldu: string }
