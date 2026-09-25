/**
 * NOTYA-BETA-0925 — "Not oluşturulamadı" (canlı, 2026-09-25 19:45 TRT, 34.843 karakterlik / 594 sn'lik muayene).
 *
 * POST /api/sessions/[id]/end 500 döndü; iki dakika sonra aynı transkriptle yeni seans başarılı oldu — hata geçiciydi.
 * Başarısız seans `processing` durumunda, error_message'sız kaldı; Vercel loglarında hata görünmedi. Bu modül:
 *
 *   (a) geçici hatada (bozuk / ayrıştırılamayan model JSON'u, overloaded / 5xx / 529, ağ, zaman aşımı) SOAP üretimini
 *       kısa bir beklemeyle BİR kez daha dener — yalnız fonksiyonun süre sınırında yeterli pay kaldıysa,
 *   (b) son hatayı kısa, temizlenmiş bir koda çevirir (hata sınıfı + sağlayıcı durumu, en çok 200 karakter; model
 *       çıktısı ya da transkript ASLA),
 *   (e) doktorun `processing`'de takılı kalmış eski seanslarını (not yok, süre sınırını çoktan geçmiş) `failed` yapar.
 *
 * Hiçbiri klinik metne dokunmaz; yalnız sayaç / durum.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Retry öncesi kısa bekleme (overloaded / 529 çoğu zaman saniyeler içinde geçer). */
export const SOAP_TEKRAR_BEKLEME_MS = 2_000
/** Retry için ayrılan en az süre: hızlı düşen ilk denemede bile ikinci deneme bu kadar sürebilir. */
export const SOAP_ASGARI_DENEME_MS = 60_000
/** Süre sınırına çarpmamak için emniyet payı (not kaydı + yanıt). */
export const SOAP_EMNIYET_PAYI_MS = 15_000
/** Bu süreden eski ve hâlâ `processing` olan, notu olmayan seans takılı kalmıştır (maxDuration 300 sn'nin çok üstü). */
export const TAKILI_SEANS_ESIGI_MS = 15 * 60_000

type HataBenzeri = {
  name?: unknown
  message?: unknown
  status?: unknown
  durum?: unknown
  code?: unknown
  cause?: { code?: unknown; name?: unknown } | unknown
  error?: { error?: { type?: unknown }; type?: unknown } | unknown
  govde?: unknown
}

function nesne(e: unknown): HataBenzeri {
  return e && typeof e === 'object' ? (e as HataBenzeri) : {}
}

function durumKodu(e: unknown): number | null {
  const h = nesne(e)
  const d = typeof h.status === 'number' ? h.status : typeof h.durum === 'number' ? h.durum : null
  if (d != null) return d
  // SDK / AiCagriHatasi mesajı durumla başlar ("529 {…}", "Anthropic API 503: …"); mesajın içindeki rastgele sayı sayılmaz.
  const m = String(h.message ?? '').match(/^(?:Anthropic API )?([45]\d\d)\b/)
  return m ? Number(m[1]) : null
}

function saglayiciTuru(e: unknown): string | null {
  const h = nesne(e)
  const govde = h.error && typeof h.error === 'object' ? (h.error as { error?: { type?: unknown }; type?: unknown }) : null
  const t = govde?.error?.type ?? (govde?.type !== 'error' ? govde?.type : undefined)
  if (typeof t === 'string' && t) return t
  const m = String(h.govde ?? h.message ?? '').match(/"type"\s*:\s*"([a-z_]+_error)"/)
  return m ? m[1] : null
}

function agKodu(e: unknown): string | null {
  const h = nesne(e)
  const c = h.code ?? (h.cause && typeof h.cause === 'object' ? (h.cause as { code?: unknown }).code : undefined)
  return typeof c === 'string' && /^[A-Z_]{3,40}$/.test(c) ? c : null
}

/** Ayrıştırılamayan / boş model çıktısı (soapUret.jsonKurtar ya da JSON.parse). */
function ciktiHatasiMi(e: unknown): boolean {
  const h = nesne(e)
  return h.name === 'SoapCiktiHatasi' || h.name === 'SyntaxError' || /SOAP çıktısı ayrıştırılamadı/.test(String(h.message ?? ''))
}

/** Tekrar denemeye değer mi: bozuk model JSON'u, overloaded / 5xx / 529, ağ ya da zaman aşımı. Bakiye / yetki / 4xx değil. */
export function geciciSoapHatasiMi(e: unknown): boolean {
  if (ciktiHatasiMi(e)) return true
  const h = nesne(e)
  const ad = String(h.name ?? '')
  const mesaj = String(h.message ?? '')
  if (/credit balance|billing/i.test(mesaj)) return false
  if (/APIConnectionError|APIConnectionTimeoutError|TimeoutError|AbortError|InternalServerError/.test(ad)) return true
  const durum = durumKodu(e)
  if (durum != null) return durum === 529 || (durum >= 500 && durum <= 599)
  if (saglayiciTuru(e) === 'overloaded_error' || /overloaded/i.test(mesaj)) return true
  if (agKodu(e) && /^(ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|EPIPE|ENOTFOUND|UND_ERR_[A-Z_]+)$/.test(String(agKodu(e)))) return true
  return /fetch failed|network|socket hang up|timed? ?out|timeout/i.test(mesaj)
}

/**
 * sessions.error_message için kısa, temizlenmiş kod: "APIError status=529 type=overloaded_error". Yalnız sınıf adı,
 * HTTP durumu, sağlayıcı hata türü ve ağ kodu — mesaj metni (model çıktısı / transkript parçası taşıyabilir) YOK.
 */
export function soapHataKodu(e: unknown): string {
  const h = nesne(e)
  const ad = String(h.name || (e instanceof Error ? e.constructor.name : '') || typeof e).replace(/[^A-Za-z0-9_]/g, '').slice(0, 60) || 'Hata'
  const parca = [ciktiHatasiMi(e) && ad !== 'SoapCiktiHatasi' ? `SoapCikti:${ad}` : ad]
  const durum = durumKodu(e)
  if (durum != null) parca.push(`status=${durum}`)
  const tur = saglayiciTuru(e)
  if (tur) parca.push(`type=${tur.replace(/[^a-z_]/g, '').slice(0, 40)}`)
  const ag = agKodu(e)
  if (ag) parca.push(`code=${ag}`)
  return parca.join(' ').slice(0, 200)
}

/** Log satırı için hata mesajı: tek satır, kısaltılmış; SyntaxError'da (girdi parçası taşır) yalnız sınıf adı. */
export function soapHataLogMetni(e: unknown): string {
  const h = nesne(e)
  if (h.name === 'SyntaxError') return 'SyntaxError (model JSON)'
  return String(h.message ?? e ?? '').replace(/\s+/g, ' ').slice(0, 300)
}

export interface TekrarSecenek {
  /** İsteğin başladığı an (Date.now()). */
  baslangicMs: number
  /** Rotanın süre sınırı (maxDuration × 1000). */
  sureSiniriMs: number
  beklemeMs?: number
  simdi?: () => number
  bekle?: (ms: number) => Promise<void>
  /** Retry kararı loglansın (tek satır, yalnız kod). */
  uyar?: (satir: string) => void
}

/**
 * `uret`i çalıştırır; geçici hatada süre yetiyorsa bir kez daha dener. İkinci hata (ya da süre yetmiyorsa ilki)
 * olduğu gibi fırlatılır. `deneme` kaç çağrı yapıldığını söyler.
 */
export async function soapUretYeniden<T>(uret: () => Promise<T>, s: TekrarSecenek): Promise<{ sonuc: T; deneme: number }> {
  const simdi = s.simdi ?? Date.now
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const beklemeMs = s.beklemeMs ?? SOAP_TEKRAR_BEKLEME_MS
  const ilkBas = simdi()
  try {
    return { sonuc: await uret(), deneme: 1 }
  } catch (e) {
    if (!geciciSoapHatasiMi(e)) throw e
    const bitis = simdi()
    const gecen = bitis - s.baslangicMs
    const gereken = beklemeMs + Math.max(bitis - ilkBas, SOAP_ASGARI_DENEME_MS) + SOAP_EMNIYET_PAYI_MS
    if (gecen + gereken > s.sureSiniriMs) {
      s.uyar?.(`[sessions/end] SOAP tekrar denenmedi (süre yetmez, ${Math.round(gecen / 1000)} sn geçti): ${soapHataKodu(e)}`)
      throw e
    }
    s.uyar?.(`[sessions/end] SOAP geçici hata, ${beklemeMs} ms sonra bir kez daha deneniyor: ${soapHataKodu(e)}`)
    await bekle(beklemeMs)
    return { sonuc: await uret(), deneme: 2 }
  }
}

/** Başarısız seansı işaretle: status failed + kısa kod. Doktora kapsanmış (id + doctor_id). */
export async function seansiBasarisizIsaretle(supabase: SupabaseClient, doktorId: string, sessionId: string, kod: string): Promise<void> {
  await supabase.from('sessions')
    .update({ status: 'failed', error_message: kod.slice(0, 200) })
    .eq('id', sessionId).eq('doctor_id', doktorId)
}

/**
 * (e) Bu doktorun `processing`'de takılı kalmış seansları (not yok, bitişi / oluşturulması eşikten eski) → failed.
 * Yalnız kod yolu; elle SQL yok. Her seans bitişinde o doktor için çalışır (ucuz: en çok 20 satır).
 */
export async function takiliSeanslariKapat(
  supabase: SupabaseClient, doktorId: string, haricSessionId: string | null, nowMs = Date.now(),
): Promise<string[]> {
  const esik = new Date(nowMs - TAKILI_SEANS_ESIGI_MS).toISOString()
  const { data } = await supabase.from('sessions')
    .select('id, created_at, ended_at')
    .eq('doctor_id', doktorId).eq('status', 'processing').lt('created_at', esik)
    .order('created_at', { ascending: true }).limit(20)
  const adaylar = ((data || []) as { id: string; created_at: string; ended_at: string | null }[])
    .filter((s) => s.id !== haricSessionId && new Date(s.ended_at || s.created_at).getTime() < nowMs - TAKILI_SEANS_ESIGI_MS)
  if (!adaylar.length) return []
  const { data: notlar } = await supabase.from('notes').select('session_id').eq('doctor_id', doktorId).in('session_id', adaylar.map((s) => s.id))
  const notlu = new Set(((notlar || []) as { session_id: string }[]).map((n) => String(n.session_id)))
  const kapat = adaylar.filter((s) => !notlu.has(s.id)).map((s) => s.id)
  for (const id of kapat) await seansiBasarisizIsaretle(supabase, doktorId, id, 'StuckProcessing: no note after 15 min')
  return kapat
}
