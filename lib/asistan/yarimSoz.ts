/**
 * NOTYA-SES-YARIM-01 (Kaan, 2026-10-01) — is the doctor's transcript an unfinished request?
 *
 * Live: "Ayşe lütfen bana Umutcan [pause] Türkoğlu..." — the turn closed after "Umutcan" and Ayşe answered the
 * fragment; "Ayşe lütfen bana." was answered as a complete message too. The silence tail cannot tell a pause from
 * an ending; the words can. An unfinished request gets NO reply: fish-tur sends `bekle`, the clip stays pending in
 * the turn sequencer (fishTurSirasi `yarim`) and the doctor's next clip is merged into it.
 *
 * Fish ASR closes fragments with a period ("Ayşe lütfen bana."), so punctuation is ignored here.
 * Two shapes only — everything else is a complete turn (a wrong hold costs the doctor a repeat):
 *  1. `askida`: after the address ("Ayşe", "Hocam") nothing is left but request words (bana / bize / lütfen)
 *     and fillers — no verb, no object.
 *  2. `ad-adayi`: exactly one content word is left, it is bare (no suffix after an apostrophe), it comes AFTER a
 *     request word or request verb and no verb follows it ("Ayşe lütfen bana Umutcan", "Aç Umutcan"). Whether that
 *     word is a patient's name is the caller's question (the doctor's name index) — "Lütfen devam" is complete.
 * A request verb after the name ("Bana Umutcan'ı aç", "Umutcan aç") or a second content word
 * ("bana Umutcan Türkoğlu") is a complete turn. Pure.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type YarimSoz =
  | { tur: 'tam' }
  | { tur: 'yarim'; neden: 'askida' }
  /** `buyukHarf`: the ASR wrote it capitalised — the fallback signal when the name index cannot be read. */
  | { tur: 'ad-adayi'; ad: string; buyukHarf: boolean }

const RICA = new Set(['bana', 'bize', 'lutfen'])
const DOLGU = new Set(['e', 'ee', 'eee', 'i', 'ii', 'iii', 'hm', 'hmm', 'sey', 'bir', 'bi', 'su', 'hemen', 'simdi', 'ya', 'yani', 'hani', 'rica', 'ederim', 'ediyorum', 'etsem', 'mi', 'mu', 'misin', 'misiniz', 'musun', 'musunuz'])
const HITAP_EK = new Set(['hocam', 'hoca', 'hanim'])
/** Request verbs as the doctor says them to Ayşe: aç, açar, göster, gösterir, getir, bul, ver, söyle, anlat, oku, bak, listele, özetle. */
const FIIL = /^(ac|goster|getir|bul|ver|soyle|anlat|oku|bak|listele|ozetle)(ar|er|ir|ur|r|sana|sene|in|iniz|abilir|ebilir)?$/

export function yarimSozCoz(metin: string | null | undefined, hitapAdlari: string[] = ['Ayşe']): YarimSoz {
  const hitap = new Set(hitapAdlari.map((a) => trAramaNormalize(a)).filter(Boolean))
  let kelimeler = String(metin || '').split(/\s+/).map((k) => {
    const ham = k.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    return { ham, n: trAramaNormalize(ham).replace(/[^a-z0-9]/g, ''), ekli: /['’]/.test(ham) }
  }).filter((k) => k.n)
  while (kelimeler.length && (hitap.has(kelimeler[0].n) || HITAP_EK.has(kelimeler[0].n))) kelimeler = kelimeler.slice(1)
  if (!kelimeler.length) return { tur: 'tam' }

  const fiilMi = (n: string) => FIIL.test(n)
  const icerik = kelimeler.map((k, i) => ({ ...k, i })).filter((k) => !RICA.has(k.n) && !DOLGU.has(k.n) && !fiilMi(k.n))
  const ricaVar = kelimeler.some((k) => RICA.has(k.n))
  const fiilVar = kelimeler.some((k) => fiilMi(k.n))
  if (!icerik.length) return ricaVar && !fiilVar ? { tur: 'yarim', neden: 'askida' } : { tur: 'tam' }
  if (icerik.length !== 1) return { tur: 'tam' }

  const ad = icerik[0]
  if (ad.ekli || ad.n.length < 3 || /^\d+$/.test(ad.n)) return { tur: 'tam' }
  const istekOnce = kelimeler.some((k, i) => i < ad.i && (RICA.has(k.n) || fiilMi(k.n)))
  const fiilSonra = kelimeler.some((k, i) => i > ad.i && fiilMi(k.n))
  if (!istekOnce || fiilSonra) return { tur: 'tam' }
  return { tur: 'ad-adayi', ad: ad.ham, buyukHarf: /^\p{Lu}/u.test(ad.ham) }
}
