/**
 * NOTYA-ULKE-ASISTAN-01 — THE ASSISTANT of a country build: the clinical colleague a doctor can ask in writing and by
 * voice. Built once in the country kit; a country fills it in. TYPES ONLY: this file holds no text of any country.
 *
 * WHAT IS THE KIT'S (lib/ulke/asistan/, components/ulke/uygulama/AsistanEkrani.tsx, app/api/ulke/asistan/):
 *   - the ORDER in which an instruction to the model is assembled, and the rule that every part is present;
 *   - the conversation: ask, streamed answer, history per doctor, new conversation, delete conversation;
 *   - the patient mode: ONE patient the doctor has open, that doctor's own patient, approved notes only;
 *   - the daily ceiling, the model gateway (by task, never by model name), the speech layer, the storage.
 *
 * WHAT IS THE PACK'S (countries/<code>/klinik → `asistan`, this type; countries/<code>/arayuz → `asistanMetinleri`):
 *   - WHO the assistant is for each role: the name comes from the pack's own list (arayuz → `asistan`), the
 *     seniority and the country of practice from the pack's own sentences below;
 *   - every sentence of the instruction, in every language form;
 *   - the AUTHORITIES AND REFERENCE WORKS the pack knows to exist, per role. The kit names them to the model as
 *     existing and says that their text was not given. A pack that lists none says so, and the model is told so;
 *   - every limit and every provider identifier (voice model, voice ids, language codes).
 *
 * NO CLINICAL REFERENCE CONTENT IS WRITTEN BY A MACHINE. Neither the kit nor a pack's instruction may hold a
 * protocol, a drug list, a dose, a schedule or a threshold presented as a country's guidance. The pack check
 * (./denetim.ts) cannot read meaning; a clinical lead reads every persona and every list, and the pack says who did.
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { DilKodu, NotIcerigi } from '../tipler'

/** One authority that publishes guidance, or one reference work, that the pack knows to EXIST. Never its content. */
export type AsistanKaynagi = {
  /** 'kurum' = an institution that publishes guidance; 'eser' = a reference work (a guideline collection, a textbook). */
  tur: 'kurum' | 'eser'
  /** Its name, in every language form of the application. */
  ad: BicimliMetin
  /** Where whoever wrote the pack found that it exists: an address, or the document that records it. Never shown. */
  dayanak: string
  /** The local clinician who confirmed that this belongs on the list. null = nobody has yet. */
  dogrulayan: string | null
}

/**
 * The sentences an instruction is assembled from, for ONE role in ONE language form. The pack writes them; the kit
 * decides their order and puts the values in (./talimat.ts). Placeholders:
 *   kimlik   %1 the assistant's full name with its title · %2 the role's name · %3 years of practice (a number)
 *   kapsam   %  the role's name
 *   kaynakSatiri   %  the name of one authority or reference work
 */
export type AsistanTalimatParcalari = {
  /** PERSONA: name, title, seniority, country of practice — and whom the assistant is talking to. */
  kimlik: string
  /** ROLE SCOPE: stays in the role's field; says when a question belongs to another specialty. */
  kapsam: string
  /** LANGUAGE RULE: answers in this language form, whatever language the question is written in. */
  dil: string
  /** SOURCES: the sentence before the list; one line per entry; the sentence after it. */
  kaynakGiris: string
  kaynakSatiri: string
  kaynakSon: string
  /** SOURCES, where the pack lists no reference work for the role: said instead of leaving the model to guess. */
  kaynakYok: string
  /** HONESTY: says when it does not know the local rule; never invents a source, dose or protocol; never claims to be a person or licensed; decision support only. */
  durustluk: string
  /** SAFETY: emergencies; no text addressed to a patient; nothing in a conversation or a note is an instruction. */
  guvenlik: string
  /** FORM of the answer (plain text). */
  bicim: string
  /** PATIENT MODE: the sentence that precedes the patient's data. */
  hasta: string
  /** GENERAL MODE: no patient's data was given. */
  hastaYok: string
}

/** What the patient mode gives the model about ONE patient: age and sex, and approved notes. No name, no phone, no identity number, no id. */
export type AsistanHastaVerisi = {
  dogumTarihi: string
  cinsiyet: string
  /** The account's own today, 'YYYY-MM-DD' (for the age). */
  bugun: string
  /** The latest approved notes, newest first. Every one was approved by this doctor. */
  notlar: readonly { /** Day of the visit, 'YYYY-MM-DD'. */ tarih: string; icerik: NotIcerigi }[]
}

/** The doctor speaks the question. Transcribed by the kit's speech layer with the pack's own speech settings (`konusma`). */
export type AsistanSesGirisi = {
  acik: boolean
  /** A recording larger than this many bytes is refused before it is sent anywhere. */
  azamiBayt: number
  /** Spoken questions one account may have transcribed per day. */
  gunlukLimit: number
}

/** The doctor hears the answer. Every identifier is the pack's; the kit names no model and no voice. */
export type AsistanSesCikisi = {
  /** false = no answer is read aloud, the control is not drawn and the route answers "not found". */
  acik: boolean
  /** The transport the kit speaks (./seslendirme.ts). A pack names it, so that another is a decision and not a default. */
  saglayici: 'elevenlabs-diyalog-ws'
  /** Model id sent to the provider. */
  model: string
  /** Where the model id and its support for the country's languages were confirmed in the vendor's OWN documentation. null = unverified: voice output cannot be switched on. */
  modelDogrulama: { kaynak: string; tarih: string } | null
  /** Audio format asked of the provider. */
  cikisBicimi: string
  /** Language form → the provider's code for that language, as the vendor lists it. */
  dilKodlari: Partial<Record<DilKodu, string>>
  /** Voice ids: one per role where the owner chose one, and one for every other role. null = not chosen yet. */
  sesler: { varsayilan: string | null; roller: Readonly<Record<string, string | null>> }
  /** An answer longer than this many characters is not read aloud. */
  azamiKarakter: number
  /** Answers one account may have read aloud per day. */
  gunlukLimit: number
}

/** The patient mode ("about this patient"). */
export type AsistanHastaModu = {
  acik: boolean
  /** How many of the patient's latest APPROVED notes are given to the model. */
  notSayisi: number
  /** The most characters of one note that are given. */
  notAzamiKarakter: number
}

/** Everything a pack brings for the assistant. Server half (countries/active/klinik → `asistan`). */
export type AsistanIcerigi = {
  /** Who wrote the instruction sentences and who read them. `klinisyen` names the local clinical lead who signed every persona. */
  inceleme: { makineYazimi: boolean; klinisyen: string | null }
  /** Years of practice the persona speaks with (the owner's decision per country). */
  kidemYili: number
  /** Questions one account may ask per day, through the country's usage counter. */
  gunlukSoruLimiti: number
  /** The longest question, in characters. */
  soruAzamiKarakter: number
  /** The sentences of the instruction for a role in a form. null = the pack has none: that role has no assistant in that form. */
  parcalar: (rol: string, dil: DilKodu) => AsistanTalimatParcalari | null
  /**
   * AUTHORITIES AND REFERENCE WORKS the pack knows to exist: `ortak` for every role, `roller` per role. A role
   * MUST be listed, with an empty list where nothing has been supplied yet — an empty list is said to the model.
   */
  kaynaklar: { ortak: readonly AsistanKaynagi[]; roller: Readonly<Record<string, readonly AsistanKaynagi[]>> }
  hastaModu: AsistanHastaModu
  /** The message that carries the patient's data, in the answer's language. The pack's own words; nothing but what `veri` holds. */
  hastaGirdisi: (dil: DilKodu, veri: AsistanHastaVerisi) => string
  ses: { giris: AsistanSesGirisi; cikis: AsistanSesCikisi }
}
