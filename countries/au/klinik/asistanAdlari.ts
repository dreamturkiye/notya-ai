/**
 * NOTYA-AU-ASISTAN-ISIM-01 — Australia: the assistant's name for each of the 44 roles this pack offers.
 *
 * STRUCTURE MIRRORS THE TURKISH PRODUCT'S REAL PATTERN, confirmed by reading it directly before writing this file
 * (not assumed): every one of the 30 core specialties has its OWN named persona (lib/asistan/specialistsCatalog.ts,
 * "one Ayşe-level persona per specialty"), and every one of the 10 Özel Branşlar does too
 * (lib/ai/personas/klinik_uzmanlar.ts). Uzbekistan mirrors the same structure (./../../uz/klinik/asistanAdlari.ts).
 * Australia follows the same structure here: one invented name per role, never one shared name across the 30, and
 * never two voices glued into one "identity" (that was the 2026-10-20 Cursor bug this file replaces — see
 * ../arayuz.ts and docs/OPEN-COMMITMENTS.md, NOTYA-AU-ASISTAN-ISIM-01).
 *
 * WHAT DOES NOT MIRROR TR: voice. In Türkiye each persona carries its OWN ElevenLabs voiceId (many distinct
 * voices across lib/asistan/elevenVoices.ts). The owner's instruction for Australia (2026-10-20, verbatim intent)
 * is the opposite: exactly one already-verified male voice and one already-verified female voice for the whole
 * pack — Charlie and Clara, ../ses.ts — never a third. That collapse is enforced structurally, not by convention:
 * the country-pack voice layer (lib/ulke/uygulama/sesSentez.ts) only ever reads `ses.sesler.erkek` or
 * `ses.sesler.kadin` from the pack's own ../ses.ts, which names exactly those two. There is no per-persona voiceId
 * field anywhere in this pack's types, so a 45th voice cannot be wired in by accident. `cinsiyet` below is this
 * persona's own gender, recorded so the mapping from name to voice is explicit and auditable — not because
 * anything here calls `sesSentezle` with it today (the "Your assistant" card lets a doctor preview EITHER voice;
 * see components/ulke/uygulama/AsistanSes.tsx).
 *
 * TITLING: Australian convention, not the Turkish "Prof. Dr." form (UZ keeps the Turkish convention only because
 * the owner asked for it there, 2026-10-09; no such instruction exists for Australia). A registered medical
 * practitioner (`doktor` and `klinik-hekim` roles) is "Dr. <given> <family>". An allied-health professional
 * (`klinik-muttefik`) carries their own regulated title after their name, the way an Australian practice's own
 * staff page writes it: "<given> <family>, <profession>".
 *
 * NO BIOGRAPHY. Nothing here, and nothing on a screen, says how long the assistant has practised, where, or with
 * what degree — the same rule UZ states for its own list. These are invented names for a product persona, exactly
 * as invented as "Dr. Emre Kaya" or "Dr. Selin Çelik" are in the Turkish product; no real clinician is named.
 *
 * NO FALLBACK TO ANOTHER ROLE. A key without an entry has no assistant: the neutral "Notya assistant" (../arayuz.ts).
 */
import type { Sunulan } from '../asistan/kaynaklar'

export type AuAsistanCinsiyeti = 'erkek' | 'kadin'

export type AuAsistanAdi = {
  /** The full form a screen shows as the assistant's name. */
  tamAd: string
  /** Given name only. */
  kisaAd: string
  /** This persona's gender — maps to ../ses.ts (`erkek` → Charlie, `kadin` → Clara). Never a third voice. */
  cinsiyet: AuAsistanCinsiyeti
}

const dr = (given: string, family: string, cinsiyet: AuAsistanCinsiyeti): AuAsistanAdi => ({ tamAd: `Dr. ${given} ${family}`, kisaAd: given, cinsiyet })
const meslek = (given: string, family: string, unvan: string, cinsiyet: AuAsistanCinsiyeti): AuAsistanAdi => ({ tamAd: `${given} ${family}, ${unvan}`, kisaAd: given, cinsiyet })

export const AU_ASISTAN_ADLARI: Record<Sunulan, AuAsistanAdi> = {
  // ── doctor specialties
  'emergency-medicine': dr('Olivia', 'Chen', 'kadin'),
  'family-medicine': dr('James', 'Whitfield', 'erkek'),
  anaesthesia: dr('Priya', 'Nair', 'kadin'),
  neurosurgery: dr('Marcus', 'Webb', 'erkek'),
  'paediatric-surgery': dr('Sarah', 'Thornton', 'kadin'),
  'internal-medicine': dr('David', 'Okafor', 'erkek'),
  dermatology: dr('Grace', 'Liu', 'kadin'),
  endocrinology: dr('Andrew', 'Fitzgerald', 'erkek'),
  'infectious-diseases': dr('Mei', 'Tanaka', 'kadin'),
  gastroenterology: dr('Nathan', 'Brooks', 'erkek'),
  'general-surgery': dr('Hannah', 'Reilly', 'kadin'),
  'respiratory-medicine': dr('Callum', 'Ferguson', 'erkek'),
  ophthalmology: dr('Isabella', 'Moretti', 'kadin'),
  'obstetrics-gynaecology': dr('Chloe', 'Bennett', 'kadin'),
  cardiology: dr('Rajesh', 'Kumar', 'erkek'),
  otolaryngology: dr('Amelia', 'Novak', 'kadin'),
  nephrology: dr('Simon', 'Tran', 'erkek'),
  neurology: dr('Fiona', 'Macalister', 'kadin'),
  oncology: dr('Benjamin', 'Hughes', 'erkek'),
  orthopaedics: dr('Lachlan', 'Shaw', 'erkek'),
  paediatrics: dr('Emily', 'Harcourt', 'kadin'),
  'plastic-surgery': dr('Oliver', 'Bianchi', 'erkek'),
  psychiatry: dr('Zara', 'Abdallah', 'kadin'),
  radiology: dr('Ethan', 'Palmer', 'erkek'),
  rheumatology: dr('Natalie', 'Osei', 'kadin'),
  urology: dr('Jack', 'Donnelly', 'erkek'),
  'sports-medicine': dr('Ryan', 'Castellano', 'erkek'),
  'rehabilitation-medicine': dr('Sophie', 'Dawson', 'kadin'),
  'cardio-thoracic-surgery': dr('Henry', 'Caldwell', 'erkek'),
  'vascular-surgery': dr('Laura', 'Pietrzak', 'kadin'),
  'radiation-oncology': dr('Daniel', 'Kowalski', 'erkek'),
  'geriatric-medicine': dr('Margaret', 'Doyle', 'kadin'),
  'immunology-and-allergy': dr('Felix', 'Nguyen', 'erkek'),
  haematology: dr('Anika', 'Sharma', 'kadin'),
  'pain-medicine': dr('Thomas', 'Lindqvist', 'erkek'),
  // ── Özel Branşlar — doctor-level
  'aesthetic-surgery': dr('Victoria', 'Ashworth', 'kadin'),
  'aesthetic-medicine': dr('Adrian', 'Costa', 'erkek'),
  // ── Özel Branşlar — allied health, own regulated title
  physiotherapy: meslek('Emma', 'Larsson', 'Physiotherapist', 'kadin'),
  'clinical-psychology': meslek('Joshua', 'Bellamy', 'Clinical Psychologist', 'erkek'),
  dietetics: meslek('Ruby', 'Patterson', 'Dietitian', 'kadin'),
  'occupational-therapy': meslek('Connor', 'Fitzpatrick', 'Occupational Therapist', 'erkek'),
  audiology: meslek('Jasmine', 'Wallis', 'Audiologist', 'kadin'),
  podiatry: meslek('Liam', "O'Sullivan", 'Podiatrist', 'erkek'),
  'speech-pathology': meslek('Rebecca', 'Lau', 'Speech Pathologist', 'kadin'),
}

export function auAsistanAdi(rol: string): AuAsistanAdi | null {
  return Object.prototype.hasOwnProperty.call(AU_ASISTAN_ADLARI, rol) ? AU_ASISTAN_ADLARI[rol as Sunulan] : null
}
