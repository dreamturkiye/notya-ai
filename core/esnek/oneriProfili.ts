/**
 * ESNEK-MUAYENE-B5 — the doctor's suggestion profile (pure). Ayşe's advisory (değerlendirme bullets, reçete önerisi) is
 * classified by TYPE; at approval each suggestion is accepted when its content reached the doctor's final note, rejected
 * otherwise. Types he always rejects are quieted (collapsed under one line, one tap to show), types he accepts come first.
 * Clinical SAFETY warnings (allergy–drug, interaction, dose, contraindication, pregnancy, red flags) are NEVER quieted.
 * The doctor's own choice (show / quiet a type) always wins, except that safety can never be quieted.
 */
import { katla, kelimeler, kok, dolguMu } from './metinAraclari'

export type OneriTuru = 'guvenlik' | 'ayirici_tani' | 'tetkik' | 'tedavi' | 'recete' | 'takip' | 'sevk' | 'hasta_egitimi' | 'kilavuz' | 'diger'
export const ONERI_TURLERI: OneriTuru[] = ['guvenlik', 'ayirici_tani', 'tetkik', 'tedavi', 'recete', 'takip', 'sevk', 'hasta_egitimi', 'kilavuz', 'diger']

const KURALLAR: { tur: OneriTuru; re: RegExp }[] = [
  { tur: 'guvenlik', re: /(alerj|allerj|allerg|etkileşim|etkilesim|interaction|kontrendik|contraindic|doz(u|a|un)?\b|maksimum doz|max(imum)? dose|dose|gebelik|gebe\b|emzir|pregnan|lactat|uyarı|uyari|warning|kırmızı bayrak|kirmizi bayrak|red flag|acil|emergency|toksik|toxic|böbrek fonksiyon|renal (dose|function)|qt uzama|qt prolong)/i },
  { tur: 'ayirici_tani', re: /(ayırıcı|ayirici|ayırıcı tanı|differential|ddx|ekarte|dışla|disla|rule out|düşünül|dusunul|olası tanı|olasi tani|consider)/i },
  { tur: 'sevk', re: /(sevk|konsült|konsult|refer|referral|yönlendir|yonlendir|uzmanına|uzmanina)/i },
  { tur: 'tetkik', re: /(tetkik|test|tahlil|laboratuvar|\blab\b|hemogram|crp|usg|ultrason|grafi|bt\b|mr\b|mrg|ekg|eko|kültür|kultur|biyopsi|imaging|x-?ray|ct\b|mri\b|blood test|culture)/i },
  { tur: 'recete', re: /(reçete|recete|prescri|başlan|baslan|\bmg\b|tablet|şurup|surup|antibiyotik|antibiotic)/i },
  { tur: 'tedavi', re: /(tedavi|treatment|therapy|uygulan|cerrahi|ameliyat|surgery|fizyoterapi|egzersiz)/i },
  { tur: 'takip', re: /(takip|kontrol|izlem|follow|monitor|tekrar değerlendir|tekrar degerlendir|hafta sonra|ay sonra)/i },
  { tur: 'hasta_egitimi', re: /(eğitim|egitim|bilgilendir|anlat|öner(il)?ir(ken)?|aileye|veliye|hastaya|counsel|educat|advise the patient|lifestyle|yaşam tarzı|yasam tarzi|diyet)/i },
  { tur: 'kilavuz', re: /(kılavuz|kilavuz|guideline|öneri düzeyi|kanıt düzeyi|nice|aap|who\b|esc\b|aha\b|gina|gold\b)/i },
]

export function oneriSiniflandir(metin: string): OneriTuru {
  for (const k of KURALLAR) if (k.re.test(metin)) return k.tur
  return 'diger'
}

export type OneriMaddesi = { tur: OneriTuru; metin: string; sira: number }

/** Advisory text → its suggestion items (bullets / numbered lines; headings and the check-list block are not suggestions). */
export function oneriMaddeleri(aiDegerlendirme: string | null | undefined): OneriMaddesi[] {
  const out: OneriMaddesi[] = []
  let sira = 0
  for (const ham of String(aiDegerlendirme || '').split('\n')) {
    const s = ham.trim()
    if (!s) continue
    if (/:$/.test(s) && s.length < 60) continue // heading
    if (/^(—|--|##|\*\*[^*]+\*\*:?$)/.test(s)) continue
    if (/kontrol listesi|çek listesi|cek listesi|check-?list/i.test(s)) continue
    const metin = s.replace(/^([-•*]|\d{1,2}[.)])\s*/, '').replace(/\*\*/g, '').trim()
    if (metin.length < 6) continue
    out.push({ tur: oneriSiniflandir(metin), metin, sira: sira++ })
  }
  return out
}

/** Content stems of a text (≥ 4 letters, no function words). */
function icerikKokleri(metin: string): Set<string> {
  return new Set(kelimeler(metin).map(katla).filter((w) => w.length >= 4 && !dolguMu(w) && !/^\d/.test(w)).map(kok))
}

/** A bullet reached the final note: at least half of its (≤ 8) content stems are in the approved text. */
export function maddeKabulMu(madde: string, sonMetin: string): boolean {
  const k = [...icerikKokleri(madde)].slice(0, 8)
  if (!k.length) return false
  const son = icerikKokleri(sonMetin)
  const ortak = k.filter((x) => son.has(x)).length
  return ortak >= Math.max(1, Math.ceil(k.length / 2))
}

/** A prescription suggestion reached the note: its active substance or brand (first word) is in the final drugs / plan. */
export function receteKabulMu(r: { etkenMadde?: string | null; ticariOrnek?: string | null }, sonMetin: string): boolean {
  const son = katla(sonMetin)
  const adlar = [r.etkenMadde, r.ticariOrnek].map((x) => katla(String(x || '')).split(/[\s(,/]+/)[0]).filter((x) => x.length >= 4)
  return adlar.some((a) => son.includes(a))
}

export type GeriBildirim = { tur: OneriTuru; kabul: boolean }

/** One approved note → feedback events (one per suggestion type: accepted if any of its items was accepted). */
export function notGeriBildirimi(g: { aiDegerlendirme: string | null | undefined; receteOnerisi: unknown; sonMetin: string }): GeriBildirim[] {
  const tur = new Map<OneriTuru, boolean>()
  for (const m of oneriMaddeleri(g.aiDegerlendirme)) tur.set(m.tur, (tur.get(m.tur) || false) || maddeKabulMu(m.metin, g.sonMetin))
  const recete = Array.isArray(g.receteOnerisi) ? (g.receteOnerisi as { etkenMadde?: string; ticariOrnek?: string }[]) : []
  if (recete.length) tur.set('recete', (tur.get('recete') || false) || recete.some((r) => receteKabulMu(r, g.sonMetin)))
  return [...tur].map(([t, kabul]) => ({ tur: t, kabul }))
}

export type ProfilDurumu = 'sessiz' | 'one_cikar' | 'normal'
export type TurSayimi = { tur: OneriTuru; kabul: number; red: number }
export type HekimKarari = 'sessiz' | 'goster' | null

export const SESSIZ_ASGARI = 8
export const SESSIZ_ORAN = 0.1
export const ONE_CIKAR_ASGARI = 5
export const ONE_CIKAR_ORAN = 0.6

export function turDurumu(s: TurSayimi, karar: HekimKarari = null): ProfilDurumu {
  const toplam = s.kabul + s.red
  const oran = toplam ? s.kabul / toplam : 0
  if (s.tur === 'guvenlik') return toplam >= ONE_CIKAR_ASGARI && oran >= ONE_CIKAR_ORAN ? 'one_cikar' : 'normal'
  if (karar === 'sessiz') return 'sessiz'
  if (karar !== 'goster' && toplam >= SESSIZ_ASGARI && oran <= SESSIZ_ORAN) return 'sessiz'
  if (toplam >= ONE_CIKAR_ASGARI && oran >= ONE_CIKAR_ORAN) return 'one_cikar'
  return 'normal'
}

export type OneriProfili = Partial<Record<OneriTuru, ProfilDurumu>>

/** Display order: safety first, then accepted types, then the rest; quieted types go under one collapsed line. */
export function profiliUygula(maddeler: OneriMaddesi[], profil: OneriProfili): { gorunen: OneriMaddesi[]; sessiz: OneriMaddesi[] } {
  const agirlik = (m: OneriMaddesi) => (m.tur === 'guvenlik' ? 0 : profil[m.tur] === 'one_cikar' ? 1 : 2)
  const gorunen = maddeler.filter((m) => m.tur === 'guvenlik' || profil[m.tur] !== 'sessiz').sort((a, b) => agirlik(a) - agirlik(b) || a.sira - b.sira)
  const sessiz = maddeler.filter((m) => m.tur !== 'guvenlik' && profil[m.tur] === 'sessiz')
  return { gorunen, sessiz }
}
