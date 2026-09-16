/**
 * Taburcu + Ulusal Yenidoğan Tarama + Bebek İzlem — shared types.
 * Clinic checklist + colleague tooling. Not a device, not a national registry, not e-Nabız.
 */

export const NTP_DISCLAIMER =
  'Tarama pozitif tanı değildir. Konfirmasyon ve klinik değerlendirme gerekir.'

export type DogumYolu = 'NSD' | 'C/S'

export type NtpCanonicalKey =
  | 'ntp_pku'
  | 'ntp_tsh'
  | 'ntp_biotinidaz'
  | 'ntp_irt'
  | 'ntp_17ohp'
  | 'ntp_sma'

export type NtpFlag = 'normal' | 'sinir' | 'pozitif_suphe' | 'yetersiz_ornek' | 'tekrar'

export type NtpSampleNo = '1' | '2' | 'tekrar'

export type BebekGorevKind =
  | 'ntp2'
  | 'izlem'
  | 'asi'
  | 'dvit'
  | 'demir'
  | 'isitme_izlem'
  | 'kalca_us'
  | 'hgb'
  | 'lohusa_anne'
  | 'yeni_bebek'

export type GorevStatus = 'bekliyor' | 'yapildi' | 'red' | 'gecikti'

export type GorevSource = 'sistem' | 'hekim'

export type AsiKod =
  | 'HEPB1'
  | 'HEPB2'
  | 'HEPB3'
  | 'BCG'
  | 'DABTIPA_HIB1'
  | 'DABTIPA_HIB2'
  | 'DABTIPA_HIB3'
  | 'DABTIPA_HIB4'
  | 'KPA1'
  | 'KPA2'
  | 'KPA3'
  | 'KPA4'
  | 'OPA1'
  | 'OPA2'
  | 'KKK1'
  | 'VARICELLA'
  | 'HEPA1'
  | 'HEPA2'

export type TaburcuKalem = 'ntp1' | 'hepb1' | 'vitk' | 'isitme'

export type TaburcuIstisnaNeden = 'erken_taburcu' | 'redd' | 'sevk'

export type IsitmeSonuc = 'gec' | 'kaldi' | 'yapilmadi'
export type PulseoxSonuc = 'gec' | 'kaldi'

export type RedKayit = {
  kalem: string
  neden: string
  imza?: string
  at: string
  kaydeden: string
  status: 'red'
}

export type TaburcuChecks = {
  ntp1: boolean
  hepb1: boolean
  vitk: boolean
  isitme: boolean
}

export type TaburcuIstisna = {
  neden: TaburcuIstisnaNeden
  aciklama: string
  kaydeden: string
  at: string
}

export type PlannedTask = {
  kind: BebekGorevKind
  due_at: string
  due_end_at?: string
  title: string
  notes?: string
  source: GorevSource
  asi_kod?: AsiKod
  hedef: 'bebek' | 'anne'
}

export type Urgency = 'ok' | 'amber' | 'red'

export type NtpSatir = {
  canonical_key: NtpCanonicalKey
  flag: NtpFlag | string
  raw?: string
}

export type NtpYorum = {
  panel_type: 'yenidogan_tarama'
  sample_no: NtpSampleNo | string
  satirlar: NtpSatir[]
  yorum: string
  tanilar: string[]
  sevk: 'metabolizma' | 'endokrin' | 'göğüs' | 'nöroloji' | 'yok'
  hekim_tanisi: string[]
  plan: string[]
  disclaimer: string
}

export type DualCite = { sb: string; overlay: string; hint: string }
