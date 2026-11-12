/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro": the language pack contract. Pure, client-safe.
 *
 * Everything language- or country-dependent in the front-desk flow lives behind this interface: the booking-intent
 * rules, the re-proposal words ("another day / later / morning"), the medical and emergency guard lists, the emergency
 * number, every fixed sentence a patient can receive and the date/time labels. The engine (niyet.ts, kalkan.ts, bilgi.ts,
 * isle.ts) holds no patient-facing text of its own, so a country build swaps the pack and nothing else.
 *
 * SAFETY CONTRACT of a pack: `acil` and `tibbi` are rule lists, never model output; `metin.acil` and `metin.tibbi` are
 * fixed sentences. A pack must not contain clinical advice.
 */

/** Keys of the "Muayenehane bilgileri" sheet a deterministic rule or the model may cite. */
export type BilgiAlani =
  | 'adres' | 'harita' | 'calismaSaatleri' | 'otopark' | 'ulasim' | 'ucretler' | 'odeme' | 'sigorta' | 'getirilecekler'
  | 'iptalPolitikasi' | 'telefon' | 'hazirlik.ilk_muayene' | 'hazirlik.muayene' | 'hazirlik.kontrol'

export type GunDilimi = 'sabah' | 'ogleden_sonra'

/** What the patient asked for when (re-)proposing times. All optional; an empty object = "the next free times". */
export interface SlotTercihi {
  /** One calendar day, YYYY-MM-DD in the practice's time zone. */
  gun?: string
  dilim?: GunDilimi
  /** "another day": none of the days already proposed. */
  baskaGun?: boolean
  /** "later": after the last time already proposed. */
  dahaGec?: boolean
  /** "earlier / the soonest": restart from now. */
  dahaErken?: boolean
}

export type RandevuNiyeti =
  /** A clear wish to book a NEW appointment — the only value that may start the booking flow. */
  | 'istek'
  /** Appointment wording that must not book: negation, a question about an existing appointment, a past-tense remark. */
  | 'degil'
  | 'yok'

export interface OnBuroMetinleri {
  /** Up to three proposed times; `satirlar` are already formatted labels. `onayli`: the pick waits for the practice. */
  oneri(satirlar: string[], onayli: boolean): string
  slotYok: string
  /** The requested day / part of day had nothing free; these are the nearest free times instead. */
  tercihYok: string
  /** The chosen time was taken in the meantime (followed by a new proposal when there is one). */
  slotDoldu: string
  /** Onayımla: the pick was recorded as a request. */
  talepAlindi(zaman: string): string
  /** Otomatik: booked. */
  randevuOlustu(zaman: string): string
  talepOnaylandi(zaman: string): string
  talepReddedildi: string
  randevuGeriAlindi(zaman: string): string
  /** The patient typed a cancel word in the middle of a booking conversation: nothing was booked. */
  istekBirakildi: string
  /** Re-proposal cap reached: the desk takes over. */
  oneriSiniri: string
  /** Two patients on one number: `adlar` are FIRST NAMES only. */
  kimIcin(adlar: string[]): string
  /** Unknown number: asks for the full name (sent after the privacy notice). */
  adSor: string
  adAnlasilmadi: string
  /** Unknown number: the request (name + chosen time) went to the desk. */
  yeniHastaTalebi(zaman: string | null): string
  /** Holding reply: the question was passed on, nobody answered it automatically. */
  bekleme: string
  /** Fixed sentence for a medical question — never advice. */
  tibbi: string
  /** Fixed emergency sentence carrying the country's emergency number. */
  acil: string
  /** Patient-facing privacy notice sent to an unknown number BEFORE anything is collected. */
  gizlilik(doktorAdi: string): string
  /** Prefix of an automatic answer taken from the practice sheet. */
  yanitOnEki: string
}

export interface OnBuroDili {
  /** BCP-47 tag of the pack ("tr", "en-AU", "uz-Latn" …). */
  kod: string
  /** The country's emergency number as dialled (TR 112, AU 000, NZ 111, GB 999, US/CA 911, UZ 103). */
  acilNumara: string
  /** Does this message ask for a NEW appointment? Rules only (typos, case folding, negation and question guards). */
  randevuNiyeti(metin: string): RandevuNiyeti
  /** Day / part-of-day wishes in a message. `simdi` and `saatDilimi` resolve "tomorrow" and weekdays. null = none. */
  tercih(metin: string, simdi: Date, saatDilimi: string): SlotTercihi | null
  /** A bare pick of a proposed option: "1", "2.", "3 numara". */
  secim(metin: string): number | null
  /** Emergency wording (chest pain, cannot breathe, bleeding, suicidal wording, seizure, unconscious …). */
  acilMi(metin: string): boolean
  /** Medical wording (symptoms, medication, dose, test results, "is this normal", pregnancy / child symptoms …). */
  tibbiMi(metin: string): boolean
  /** Is this a question or a request for information (as opposed to chatter)? */
  soruMu(metin: string): boolean
  /** Deterministic sheet rules: the fields an obvious question ("adres", "otopark", "ücret") asks for. */
  bilgiAlanlari(metin: string): BilgiAlani[]
  /** Does the message name a visit type (first visit / follow-up)? Used to choose the appointment length. */
  ziyaretTuru(metin: string): 'ilk_muayene' | 'muayene' | 'kontrol' | null
  /** A plausible full name typed by a person (two words or more, letters only). Returns the cleaned name or null. */
  adSoyad(metin: string): string | null
  /** "5 Ekim Pazartesi 14:20" in the practice's time zone. */
  zamanEtiketi(iso: string, saatDilimi: string): string
  /** Sheet field → the label shown before its text in an answer and on the card. */
  alanEtiketi: Record<BilgiAlani, string>
  /** Working plan (doktor_calisma_saatleri.gunler, keys "0".."6" = Sunday..Saturday) → one readable line. */
  calismaSaatiMetni(gunler: Record<string, { acik: boolean; baslangic: string; bitis: string }>): string
  metin: OnBuroMetinleri
  /**
   * A pack that serves several languages (Uzbekistan: Uzbek in Latin and Cyrillic script, Russian) recognises all of them
   * with the functions above and answers in the language of the conversation: this returns the variant (sentences and
   * labels) for a message. `oncekiKod` is the `kod` stored on the open step of the conversation — a bare "2" carries no
   * language of its own. Single-language packs leave it out.
   */
  dilSec?(metin: string, oncekiKod?: string | null): OnBuroDili
}
