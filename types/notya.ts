// ============================================================
// NOTYA AI - TypeScript Tip Tanımları
// ============================================================

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'klinik' | 'hastane'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused'
export type SessionStatus = 'recording' | 'processing' | 'completed' | 'failed'
export type SessionType = 'muayene' | 'kontrol' | 'konsültasyon' | 'telesağlık'
export type NoteType = 'soap' | 'anamnez' | 'epikriz' | 'konsültan' | 'ameliyat'
export type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'approve'
export type ConsentType = 'kayit' | 'isleme' | 'paylasim' | 'whatsapp'
export type DoctorTitle = 'Dr.' | 'Uzm. Dr.' | 'Doç. Dr.' | 'Prof. Dr.'
export type Gender = 'male' | 'female'
export type AddressingPreference = 'hocam' | 'named_hocam' | 'first_name_only'

export type MedicalSpecialty =
  | 'dahiliye'
  | 'kardiyoloji'
  | 'nöroloji'
  | 'pediatri'
  | 'ortopedi'
  | 'psikiyatri'
  | 'genel_cerrahi'
  | 'kadin_hastaliklari'
  | 'göz'
  | 'kulak_burun_bogaz'
  | 'dermatoloji'
  | 'uroloji'
  | 'onkoloji'
  | 'acil'
  | 'genel'

export interface User {
  id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  title?: DoctorTitle
  specialty?: MedicalSpecialty
  hospital?: string
  clinic_name?: string
  gender?: Gender
  addressing_preference?: AddressingPreference
  onboarding_completed?: boolean
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  iyzico_customer_id?: string
  whatsapp_number?: string
  whatsapp_enabled: boolean
  monthly_session_count: number
  data_retention_hours: number
  kvkk_consent_at?: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  doctor_id: string
  name_encrypted: string
  dob_encrypted?: string
  gender_encrypted?: string
  tc_kimlik_hash?: string
  phone_encrypted?: string
  notes_encrypted?: string
  is_active: boolean
  created_at: string
  // Şifresi çözülmüş (sadece runtime'da kullanılır, DB'ye kaydedilmez)
  name?: string
  dob?: string
  gender?: string
  phone?: string
}

export interface Session {
  id: string
  doctor_id: string
  patient_id?: string
  started_at: string
  ended_at?: string
  audio_url?: string
  audio_deleted_at?: string
  transcript_raw?: string
  transcript_cleaned?: string
  status: SessionStatus
  session_type: SessionType
  specialty?: MedicalSpecialty
  duration_seconds?: number
  patient_consent_given: boolean
  patient_consent_at?: string
  error_message?: string
  created_at: string
}

export interface Medication {
  ad: string           // İlaç adı
  doz: string          // Doz (örn: 500mg)
  kullanim: string     // Kullanım şekli (örn: günde 2x1)
  sure: string         // Süre (örn: 7 gün)
  aciklama?: string    // Ek açıklama
}

export interface ICD10Code {
  code: string
  description: string
  description_tr: string
  is_primary: boolean
}

export interface LabRequest {
  test_adi: string
  acil: boolean
  aciklama?: string
}

export interface ImagingRequest {
  tur: string          // BT, MR, Röntgen, Ultrason
  bolge: string        // Hangi bölge
  acil: boolean
  aciklama?: string
}

export interface Note {
  id: string
  session_id: string
  doctor_id: string
  note_type: NoteType
  // SOAP
  content_subjektif?: string
  content_objektif?: string
  content_degerlendirme?: string
  content_plan?: string
  // Detaylı
  content_anamnez?: string
  content_fizik_muayene?: string
  content_tani?: string
  content_tedavi?: string
  content_ilaclar?: Medication[]
  content_lab_istekleri?: LabRequest[]
  content_goruntulemeler?: ImagingRequest[]
  icd10_codes?: ICD10Code[]
  kritik_bulgular?: string[]
  takip_suresi?: string
  // Meta
  approved_at?: string
  approved_by?: string
  whatsapp_sent_at?: string
  ai_model?: string
  ai_confidence?: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: Exclude<SubscriptionTier, 'free'>
  status: SubscriptionStatus
  iyzico_subscription_id?: string
  monthly_price_try: number
  session_limit_monthly?: number
  user_count_limit: number
  started_at: string
  trial_ends_at?: string
  current_period_start?: string
  current_period_end?: string
  cancelled_at?: string
}

// ============================================================
// AI / KLİNİK NOT YAPILARI
// ============================================================
export interface TranscriptSegment {
  speaker: 'doktor' | 'hasta' | 'bilinmiyor'
  text: string
  start_ms: number
  end_ms: number
  confidence: number
}

export interface SessionContext {
  specialty: MedicalSpecialty
  session_type: SessionType
  patient_age?: number
  patient_gender?: string
  previous_diagnoses?: string[]
  current_medications?: string[]
  allergies?: string[]
}

export interface GeneratedNote {
  soap: {
    subjektif: string
    objektif: string
    degerlendirme: string
    plan: string
  }
  anamnez: string
  fizik_muayene: string
  tani: string
  tedavi: string
  ilaclar: Medication[]
  lab_istekleri: LabRequest[]
  goruntulemeler: ImagingRequest[]
  icd10_codes: ICD10Code[]
  kritik_bulgular: string[]
  takip_suresi: string
  ai_confidence: number
}

// ============================================================
// API YANIT YAPILARI
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface StartSessionResponse {
  session_id: string
  deepgram_token: string
  websocket_url: string
  expires_at: string
}

export interface EndSessionResponse {
  session_id: string
  note_id: string
  status: 'processing' | 'completed'
  estimated_seconds: number
}

// ============================================================
// İYZİCO ÖDEME YAPILARI
// ============================================================
export interface IyzicoSubscriptionPlan {
  planCode: string
  name: string
  price: number
  currencyCode: 'TRY'
  paymentInterval: 'MONTHLY' | 'YEARLY'
  paymentIntervalCount: number
}

export interface IyzicoWebhookEvent {
  iyziEventType: string
  iyziReferenceCode: string
  status: string
  subscriptionReferenceCode?: string
  customerEmail?: string
  merchantSubscriptionId?: string
}

// ============================================================
// ABONELİK PLANLARI
// ============================================================
export const SUBSCRIPTION_PLANS: Record<string, {
  name: string
  price_try_monthly: number
  price_try_yearly: number
  session_limit: number | null
  user_limit: number
  features: string[]
}> = {
  starter: {
    name: 'Starter',
    price_try_monthly: 499,
    price_try_yearly: 399,
    session_limit: 50,
    user_limit: 1,
    features: ['50 seans/ay', 'SOAP notları', 'WhatsApp gönderimi', 'Türkçe AI'],
  },
  pro: {
    name: 'Pro',
    price_try_monthly: 1299,
    price_try_yearly: 999,
    session_limit: null,
    user_limit: 1,
    features: ['Sınırsız seans', 'Tüm şablonlar', 'ICD-10 kodlama', 'WhatsApp', 'Çevrimdışı mod'],
  },
  klinik: {
    name: 'Klinik',
    price_try_monthly: 3999,
    price_try_yearly: 3299,
    session_limit: null,
    user_limit: 5,
    features: ['5 kullanıcı', 'Sınırsız seans', 'Tüm özellikler', 'Öncelikli destek'],
  },
  hastane: {
    name: 'Hastane',
    price_try_monthly: 0,
    price_try_yearly: 0,
    session_limit: null,
    user_limit: 999,
    features: ['Sınırsız kullanıcı', 'HIS entegrasyonu', 'SLA garantisi', 'Özel eğitim'],
  },
}
