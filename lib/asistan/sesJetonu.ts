/**
 * NOTYA-TEK-BEYIN — sesli Ayşe'nin Custom LLM ucunu (app/api/asistan/ses-llm) koruyan iki kilit ve geçiş bayrağı.
 *
 * 1. Sunucu sırrı: ElevenLabs ajanına Custom LLM API anahtarı olarak girilen NOTYA_SES_LLM_SECRET; istek
 *    `Authorization: Bearer <sır>` ile gelir (OpenAI uyumlu istemci davranışı). Yalnız ElevenLabs bilir.
 * 2. Konuşma jetonu: /api/asistan/signed-url, doktorun kendi oturumuyla kısa ömürlü, imzalı bir jeton üretir
 *    (doktor, branş, asistan oturumu, sayfa hastası, persona). Tarayıcı bunu ElevenLabs'e `customLlmExtraBody`
 *    olarak verir; her istekte `elevenlabs_extra_body.notya_jeton` diye geri gelir. Gövdedeki hiçbir kimliğe
 *    jetonsuz güvenilmez — kimlikler YALNIZ jetonun içinden okunur. İmza anahtarı (NOTYA_SES_JETON_SECRET)
 *    ElevenLabs'e hiç verilmez; ajandaki sır sızsa da jeton üretilemez.
 * 3. Bayrak: NOTYA_TEK_BEYIN_DOKTORLAR (virgüllü doktor kimlikleri). Boş = kimse geçmedi, eski sesli akış sürer.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface SesJetonu {
  /** doktor (users.id) */
  d: string
  /** asistan_sessions.id — yazı ile sesin ortak oturumu */
  o: string
  /** branş / specialty parametresi */
  s: string
  /** sayfanın hastası (sahipliği jeton üretilirken doğrulandı; uçta yeniden doğrulanır) */
  p: string | null
  /** persona */
  pe: string
  /** bitiş (ms) */
  exp: number
}

/** ElevenLabs konuşması en fazla 120 dk; jeton konuşmanın tamamını, fazlasını değil, kapsar. */
export const JETON_OMRU_MS = 150 * 60 * 1000

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url')

function imzaAnahtari(): string | null {
  const k = String(process.env.NOTYA_SES_JETON_SECRET || '').trim()
  return k.length >= 32 ? k : null
}

function imza(govde: string, anahtar: string): string {
  return b64(createHmac('sha256', anahtar).update(`notya-ses-jeton.v1.${govde}`).digest())
}

function esitMi(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** İmza anahtarı yoksa null — çağıran eski sesli akışta kalır. */
export function sesJetonuImzala(v: Omit<SesJetonu, 'exp'>, simdi = Date.now()): string | null {
  const anahtar = imzaAnahtari()
  if (!anahtar) return null
  const govde = b64(JSON.stringify({ ...v, exp: simdi + JETON_OMRU_MS }))
  return `${govde}.${imza(govde, anahtar)}`
}

export function sesJetonuDogrula(jeton: unknown, simdi = Date.now()): SesJetonu | null {
  const anahtar = imzaAnahtari()
  if (!anahtar || typeof jeton !== 'string' || jeton.length > 2000) return null
  const [govde, imz, fazla] = jeton.split('.')
  if (!govde || !imz || fazla !== undefined || !esitMi(imz, imza(govde, anahtar))) return null
  try {
    const v = JSON.parse(Buffer.from(govde, 'base64url').toString('utf8')) as SesJetonu
    if (typeof v.d !== 'string' || !v.d || typeof v.o !== 'string' || !v.o || typeof v.exp !== 'number' || v.exp < simdi) return null
    return { d: v.d, o: v.o, s: String(v.s || 'genel'), p: v.p ? String(v.p) : null, pe: String(v.pe || ''), exp: v.exp }
  } catch {
    return null
  }
}

/** Sunucu sırrı: `Authorization: Bearer <NOTYA_SES_LLM_SECRET>` (ya da `x-notya-ses-sirri`). Sır tanımlı değilse hep red. */
export function sesSirriGecerliMi(basliklar: Headers): boolean {
  const sir = String(process.env.NOTYA_SES_LLM_SECRET || '').trim()
  if (sir.length < 32) return false
  const auth = basliklar.get('authorization') || ''
  const gelen = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : String(basliklar.get('x-notya-ses-sirri') || '').trim()
  return Boolean(gelen) && esitMi(gelen, sir)
}

/** Bu doktor tek beyinli sese geçti mi? (NOTYA_TEK_BEYIN_DOKTORLAR, varsayılan boş = kimse). */
export function tekBeyinAcikMi(doktorId: string, liste = process.env.NOTYA_TEK_BEYIN_DOKTORLAR): boolean {
  const ids = String(liste || '').split(',').map((s) => s.trim()).filter(Boolean)
  return Boolean(doktorId) && ids.includes(doktorId)
}
