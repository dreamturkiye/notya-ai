/**
 * SES-OMURGA-V2 (B) — what KIND of question is this, before any model-free router answers it (voice AND text: same
 * brain, ayseCevapla). Dr. Gökhan's 10-25 / 10-26 sessions, mechanically:
 *
 *   - a general antibiotic-dose question with "…klavulanik ASİT…" was answered "<open patient>: no vaccine on record",
 *     four times (`/\basi/` matched "asit"; the ASR's "Aşı hocam" is "Ayşe Hocam");
 *   - "did you put the appointment in the calendar?" was answered from the card's appointment field;
 *   - with a chart open every question was treated as being about that chart;
 *   - "…dozunu rica ediyorum" forced the vaccine-ADD tool (a command detector reading a question as an order);
 *   - "I'm not talking about that patient or his vaccines" got the same vaccine card again.
 *
 * Pure, Turkish-folded (lib/utils/turkceArama), word-boundary patterns only.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

/** Folded, punctuation-free, padded with spaces. */
export function duzMetin(mesaj: string | null | undefined): string {
  return ` ${trAramaNormalize(String(mesaj || '')).replace(/[^a-z0-9/\s]+/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/**
 * "Aşı hocam / Ayşe Hocam / Ayşe Hanım" at the start or anywhere: the doctor ADDRESSING the assistant (ASR writes "Ayşe"
 * as "Aşı"). Removed before any content matcher runs.
 */
export function hitabiAyikla(duz: string): string {
  return duz.replace(/ (?:asi|ayse|aise|ayshe|aysa|eyse) (?:hocam|hoca|hanim|abla)\b/g, ' ').replace(/\s+/g, ' ')
}

/**
 * The vaccine word, Turkish-folded, as a whole word with its case/possessive endings: aşı, aşılar, aşısı, aşıları,
 * aşılarını, aşısını, aşıyı, aşıya, aşıda, aşının … — never "asit", "asistan", "asitli".
 */
export const ASI_SOZU = / asi(?:lar(?:i(?:n(?:i|in|a|da|dan)?)?|a|da|dan|in|im|imiz)?|s(?:i(?:n(?:i|in|a|da|dan)?)?)?|y[ia]|d[ae]n?|n[ia]n|m(?:iz)?|ler)? /

export function asiSozuVarMi(mesaj: string | null | undefined): boolean {
  return ASI_SOZU.test(hitabiAyikla(duzMetin(mesaj)))
}

/** A dose / guideline / drug-information cue. */
const TIBBI_BILGI = / (doz\w*|dozaj\w*|mg|mcg|mg\/kg|mgkg|ml\/kg|kilo basina|kg basina|kilogram basina|gunluk doz\w*|maksimum|maks|azami|kilavuz\w*|rehber\w*|guideline|protokol\w*|endikasyon\w*|kontrendikasyon\w*|yan etki\w*|etkilesim\w*|ne kadar ver\w*|kac mg|kac ml|nasil kullan\w*|nasil ver\w*|nasil tedavi\w*|tedavisi ne\w*|tedavi protokol\w*|ilk secenek|ilk tercih|antibiyotik\w*|amoksisilin\w*|klavulan\w*|parasetamol\w*|ibuprofen\w*|azitromisin\w*|sefuroksim\w*|seftriakson\w*|klaritromisin\w*|salbutamol\w*|budesonid\w*|prednizolon\w*|deksametazon\w*|setirizin\w*|desloratadin\w*|demir sulfat\w*|vitamin d\w*|d vitamini\w*|ferroz\w*|asit) /

/** A question / information-request form. */
const SORU_BICIMI = / (mi|mu|miydi|muydu|misin|musun|misiniz|musunuz|ne|nedir|neydi|neler|nelerdir|kac|kaca|nasil|hangi|hangisi|ne kadar|ne zaman|neden|niye|soyle\w*|soyler|anlat\w*|ogren\w*|bilgi|rica ediyorum|rica edecegim|lutfen soyle\w*) /
/** A record / order target — the sentence asks to DO something to the chart, not to know something. */
const KAYIT_HEDEFI = / (dosyaya|dosyasina|kaydet\w*|kayded\w*|kayda|ekle|ekleyelim|ekler misin|isle\w*|baslat\w*|basla|baslayalim|kes|kesin|kesiver|sonlandir\w*|recete et\w*|receteye|recetesine|not al|not dus) /

/** "bu hasta / hastamız / onun / kendisi / dosyadaki / bu çocuğun kilosuna göre" — the sentence is about the open patient. */
const HASTA_ATFI = / (kullandig\w*|aldig\w*|ilaclari\w*|dozlari\w*|kilosu\w*|alerjisi\w*|recetesi\w*|receteleri\w*|bu hasta\w*|su hasta\w*|hastamiz\w*|hastam|hastamin|hastama|hastanin|hastaya|bu cocu\w*|cocugumuz\w*|bebegimiz\w*|kendisi\w*|onun|ona|dosyadaki\w*|bu dosya\w*|acik dosya\w*|kilosuna gore|kilosu ile|kilosuyla|bu bebe\w*) /

export function hastaAtfiVarMi(mesaj: string | null | undefined): boolean {
  return HASTA_ATFI.test(duzMetin(mesaj))
}

/**
 * A GENERAL medical question (dose, guideline, drug information) that does not point at the open patient. With a chart
 * open it is still not a chart question: no quick card, no chart scope forced, no write tool.
 */
/** The doctor's own practice ("en çok yazdığım antibiyotik", "bu ay verdiğim") — a practice search, not a general question. */
const PRATIK = / (yazdig\w*|yazdim|yazdik|yazmisim|verdig\w*|verdim|verdik|kullandim|kullandik|gordug\w*|recete ettig\w*|en (?:cok|sik|fazla)) /

export function genelTibbiSoruMu(mesaj: string | null | undefined): boolean {
  const d = hitabiAyikla(duzMetin(mesaj))
  if (!TIBBI_BILGI.test(d)) return false
  if (PRATIK.test(d)) return false
  if (HASTA_ATFI.test(d)) return false
  if (KAYIT_HEDEFI.test(d) && !/ (mi|mu|misin|musun|misiniz|musunuz) /.test(d)) return false
  return SORU_BICIMI.test(d) || /\?/.test(String(mesaj || ''))
}

/**
 * "randevu verdin mi / takvime koydun mu / ekledin mi / kaydettin mi / oluşturdun mu" — a question about the status of an
 * ACTION the assistant was asked to do. Never answered from a stored data field; the model (with its tools) answers.
 */
const EYLEM_DURUMU = / \w+(?:din|dun|tin|tun)(?:iz|uz)? m(?:i|u)(?:sin|sun)? /
export function eylemDurumuSorusuMu(mesaj: string | null | undefined): boolean {
  return EYLEM_DURUMU.test(hitabiAyikla(duzMetin(mesaj)))
}

/**
 * The doctor REJECTS the previous answer: "hayır", "bunu sormadım", "o hastadan bahsetmiyorum", "yanlış anladın". The
 * next turn bypasses every model-free router and goes to the model with that context (escape hatch).
 */
const RED = / (bunu sormadim|onu sormadim|sormadim|ben bunu sormadim|yanlis anladin|anlamadin|beni anlamadin|o hasta\w* (?:bahset|sormu|demi)\w*|hasta\w* bahsetmiyorum|bahsetmiyorum|kastetmiyorum|oyle degil|bu degil|yanlis cevap|yanlis bilgi|alakasiz|alakasi yok|ilgisi yok|hastayla ilgili degil|hasta ile ilgili degil|genel sordum|genel olarak sordum|genel bir soru) /
export function cevapReddiMi(mesaj: string | null | undefined): boolean {
  const d = hitabiAyikla(duzMetin(mesaj))
  return RED.test(d) || (/^ (hayir|yok hayir|hayir hayir|yanlis) /.test(d) && d.trim().split(' ').length > 1)
}
