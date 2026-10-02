/**
 * NOTYA-KALITE-STANDART-01 — what the DOCTOR'S SENTENCE tells the rubric: which structure of Q-21 applies, which
 * single measurement is asked (Q-02), whether the doctor asked to have the answer read aloud (no Q-30 cap).
 *
 * The file-question type comes from the product's own classifier (soruTuruBul), so the rubric expects a structure
 * exactly where Ayşe is told to produce one. A corpus entry may state the structure itself (`kalite.yapi`) — the
 * golden cases do. PURE.
 */
import { soruTuruBul } from '@/lib/asistan/dosyaSorgu/soruTuru'
import { devamIstegiMi, sesliOkumaSozuMu } from '@/lib/asistan/konusma'
import type { OlcumTuru, YapiTuru } from './denetimler'

const kucuk = (s: string) => String(s || '').toLocaleLowerCase('tr-TR')

const TEK_VIZIT_OZETI = /(?:muayene|vizit|kontrol)\p{L}*\s+(?:\p{L}+\s+){0,2}özet|özet\p{L}*\s+(?:\p{L}+\s+){0,3}(?:muayene|vizit)/u
const COK_VIZIT = /muayenelerini|vizitlerini|(?<!\p{L})(?:bütün|tüm|hepsi|her|iki|üç|dört|beş|\d+)\s+(?:\p{L}+\s+)?(?:muayene|vizit)|tek tek/u

/** One named visit summarised (the eight-part structure) — not a list of several visits. */
export function vizitOzetiSorusuMu(soru: string): boolean {
  const k = kucuk(soru)
  return TEK_VIZIT_OZETI.test(k) && !COK_VIZIT.test(k)
}

/** The structure of Q-21 the question calls for, or null. */
export function yapiBul(soru: string): YapiTuru | null {
  if (vizitOzetiSorusuMu(soru)) return 'vizit-ozeti'
  return soruTuruBul(soru)
}

const OLCUM_SOZU: Record<OlcumTuru, RegExp> = {
  kilo: /(?<!\p{L})(?:kilo(?!metre)\p{L}*|ağırlı\p{L}*|tartı\p{L}*)|kaç kg/u,
  boy: /(?<!\p{L})boy(?:u|un|unu|unun)?(?!\p{L})/u,
  bas: /baş çevre\p{L}*/u,
  ates: /(?<!\p{L})ateş\p{L}*/u,
  tansiyon: /(?<!\p{L})tansiyon\p{L}*/u,
  nabiz: /(?<!\p{L})nab[ıi]z\p{L}*|nabz\p{L}*/u,
}
/** Someone else's value, a growth assessment, or a command to record — not a question for one measurement. */
const OLCUM_DEGIL = /(?<!\p{L})(?:anne|baba|hedef boy|doğum (?:kilo|boy|ağırlı)|nasıl|gidiyor|gelişim|büyüme|persentil|eğri|alıyor mu|alamıyor|uzuyor|planla|takib)\p{L}*|(?<!\p{L})(?:ekle|kaydet|düzelt|sil|gir|yaz|not al|işle|olarak)(?!\p{L})|ölçümler/u
const OLCUM_SORUSU = /(?<!\p{L})(?:kaç\p{L}*|ne(?:dir|ydi)?|neydi|söyle\p{L}*|göster\p{L}*|ver\p{L}*)(?!\p{L})|\?\s*$/u

/** The one measurement a question asks for; null for a series of several, a growth question, or a command. */
export function istenenOlcumBul(soru: string): OlcumTuru | null {
  const k = kucuk(soru)
  if (OLCUM_DEGIL.test(k) || !OLCUM_SORUSU.test(k)) return null
  const anilan = (Object.keys(OLCUM_SOZU) as OlcumTuru[]).filter((t) => OLCUM_SOZU[t].test(k))
  return anilan.length === 1 ? anilan[0] : null
}

/**
 * "oku", "bana anlat", "devam et": the doctor asked to hear it — the spoken length cap of Q-30 does not apply.
 * Wider than the product's read-aloud route (okumaIstegiMi): since NOTYA-KORPUS-KALAN-01 a sentence that names what to
 * read from the chart ("Hastanın özetini oku") goes to the model, and it is still a request to have the answer read.
 */
export function okuIstegiMi(soru: string): boolean {
  return sesliOkumaSozuMu(soru) || devamIstegiMi(soru)
}
