/**
 * NOTYA-MODEL-LUNA-01 — sağlayıcı katmanı: istek hangi uçtan gider (OpenRouter ya da doğrudan Anthropic).
 *
 * Yalnız lib/ai/cagir.ts kullanır. Çağrı yerleri Anthropic biçiminde (system blokları, content blokları, tool_use /
 * tool_result, Anthropic.Message yanıtı) çalışmaya devam eder; OpenRouter chat.completions biçimine çeviri burada:
 *  - openai/* ya da anthropic/* model + OPENROUTER_API_KEY → OpenRouter (Authorization, HTTP-Referer, X-Title)
 *  - değilse anthropic/* → eski doğrudan Anthropic yolu (SDK istemcisi ya da /v1/messages); önek atılır
 *  - değilse (openai/* ama OpenRouter yok) → çağıran GÜÇLÜ'ye düşer (cagir.ts, neden = transport)
 *
 * Gizlilik: her OpenRouter isteği `provider: { data_collection: 'deny' }` taşır — yalnız veriyi saklamayan / eğitimde
 * kullanmayan sağlayıcılara yönlenir. Bu KVKK yurt dışı aktarım konusunu ÇÖZMEZ (OpenRouter Türkiye dışındadır).
 * Prompt caching: sabit system blokları cache_control'ü system mesajının content parçalarında korur (Anthropic
 * modelleri); OpenAI modelleri önbelleği otomatik uygular. Hasta bağlamı hiçbir zaman önbellekli blokta değildir.
 */
import type Anthropic from '@anthropic-ai/sdk'

export class AiCagriHatasi extends Error {
  constructor(public durum: number, public govde: string) {
    super(`Anthropic API ${durum}: ${govde.slice(0, 200)}`)
    this.name = 'AiCagriHatasi'
  }
}

const ONEK = /^(openai|anthropic)\//

export function openRouterAcik(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim()
}

/** "anthropic/<ad>-4.5" → "<ad>-4-5" (doğrudan Anthropic API kimliği; önek atılır, sürüm noktası tireye döner). Önek yoksa aynen. */
export function dogrudanModelAdi(model: string): string {
  if (!model.startsWith('anthropic/')) return model
  return model.slice('anthropic/'.length).replace(/(\d)\.(\d)/g, '$1-$2')
}

/** Eski çıplak ad ("<ad>-4-6") OpenRouter slug'ına: "anthropic/<ad>-4.6"; tarih eki atılır. */
export function openRouterModelAdi(model: string): string {
  if (ONEK.test(model)) return model
  if (/^claude-/.test(model)) return `anthropic/${model.replace(/-\d{8}$/, '').replace(/-(\d+)-(\d+)$/, '-$1.$2')}`
  if (/^(gpt-|o\d)/.test(model)) return `openai/${model}`
  return model
}

export type Yol = 'openrouter' | 'anthropic' | null

/** Model bu ortamda hangi yoldan gider; null = gidemez (OpenAI modeli, OpenRouter yok). */
export function yolSec(model: string): Yol {
  const or = openRouterModelAdi(model)
  if (openRouterAcik() && ONEK.test(or)) return 'openrouter'
  if (or.startsWith('anthropic/') || /^claude-/.test(model)) return 'anthropic'
  return null
}

// ─── Anthropic → OpenRouter (chat.completions) ─────────────────────────────────────────────────

type Blok = Record<string, any>
type OrMesaj = Record<string, unknown>

function kaynakUrl(kaynak: Blok | undefined, varsayilanTur: string): string {
  if (!kaynak) return ''
  if (kaynak.type === 'url') return String(kaynak.url || '')
  return `data:${kaynak.media_type || varsayilanTur};base64,${kaynak.data || ''}`
}

/** Tek bir Anthropic içerik bloğu → OpenAI content parçası (metin, görüntü, PDF). */
function parca(b: Blok): Blok | null {
  if (!b || typeof b !== 'object') return null
  if (b.type === 'text') {
    const p: Blok = { type: 'text', text: String(b.text ?? '') }
    if (b.cache_control) p.cache_control = b.cache_control
    return p
  }
  if (b.type === 'image') return { type: 'image_url', image_url: { url: kaynakUrl(b.source, 'image/png') } }
  if (b.type === 'document') {
    if (b.source?.type === 'text') return { type: 'text', text: String(b.source.data ?? '') }
    return { type: 'file', file: { filename: String(b.title || 'belge.pdf'), file_data: kaynakUrl(b.source, 'application/pdf') } }
  }
  return null
}

function aracSonucuMetni(icerik: unknown): { metin: string; gorseller: Blok[] } {
  if (typeof icerik === 'string') return { metin: icerik, gorseller: [] }
  const bloklar = Array.isArray(icerik) ? (icerik as Blok[]) : []
  const metin = bloklar.filter((b) => b?.type === 'text').map((b) => String(b.text ?? '')).join('\n')
  const gorseller = bloklar.filter((b) => b?.type === 'image' || b?.type === 'document').map(parca).filter(Boolean) as Blok[]
  return { metin, gorseller }
}

/** Anthropic mesaj dizisi → OpenAI mesaj dizisi. tool_use ↔ tool_calls, tool_result ↔ role:'tool'. */
export function mesajlariCevir(mesajlar: { role: string; content: unknown }[]): OrMesaj[] {
  const cikti: OrMesaj[] = []
  for (const m of mesajlar || []) {
    if (typeof m.content === 'string') { cikti.push({ role: m.role, content: m.content }); continue }
    const bloklar = Array.isArray(m.content) ? (m.content as Blok[]) : []
    if (m.role === 'assistant') {
      const metin = bloklar.filter((b) => b?.type === 'text').map((b) => String(b.text ?? '')).join('')
      const cagrilar = bloklar.filter((b) => b?.type === 'tool_use').map((b) => ({
        id: String(b.id), type: 'function', function: { name: String(b.name), arguments: JSON.stringify(b.input ?? {}) },
      }))
      const om: OrMesaj = { role: 'assistant', content: metin || null }
      if (cagrilar.length) om.tool_calls = cagrilar
      cikti.push(om)
      continue
    }
    // user: önce tool_result'lar (asistanın tool_calls'ından hemen sonra gelmeli), sonra kalan içerik
    const ekGorseller: Blok[] = []
    for (const b of bloklar.filter((x) => x?.type === 'tool_result')) {
      const { metin, gorseller } = aracSonucuMetni(b.content)
      cikti.push({ role: 'tool', tool_call_id: String(b.tool_use_id), content: b.is_error ? `HATA: ${metin}` : metin })
      ekGorseller.push(...gorseller)
    }
    const parcalar = [...ekGorseller, ...(bloklar.filter((x) => x?.type !== 'tool_result').map(parca).filter(Boolean) as Blok[])]
    if (parcalar.length) cikti.push({ role: 'user', content: parcalar })
  }
  return cikti
}

function aracCevir(a: Blok): Blok {
  return { type: 'function', function: { name: a.name, description: a.description, parameters: a.input_schema ?? { type: 'object', properties: {} } } }
}

function aracSecimiCevir(t: Blok | undefined): unknown {
  if (!t) return undefined
  if (t.type === 'any') return 'required'
  if (t.type === 'auto') return 'auto'
  if (t.type === 'tool') return { type: 'function', function: { name: t.name } }
  return undefined
}

/** cagir.ts'nin Anthropic biçimli istek gövdesi → OpenRouter chat.completions gövdesi. */
export function openRouterGovdesi(govde: Record<string, unknown>): Record<string, unknown> {
  const mesajlar: OrMesaj[] = []
  const sistem = govde.system
  if (typeof sistem === 'string' && sistem) mesajlar.push({ role: 'system', content: sistem })
  else if (Array.isArray(sistem) && sistem.length) {
    // Sabit (cache_control'lü) blok önce, hasta bağlamı sonra — ayrım korunur.
    mesajlar.push({ role: 'system', content: (sistem as Blok[]).map(parca).filter(Boolean) })
  }
  mesajlar.push(...mesajlariCevir((govde.messages as { role: string; content: unknown }[]) || []))
  const or: Record<string, unknown> = {
    model: openRouterModelAdi(String(govde.model)),
    messages: mesajlar,
    max_tokens: govde.max_tokens,
    provider: { data_collection: 'deny' },
  }
  if (govde.temperature !== undefined) or.temperature = govde.temperature
  if (Array.isArray(govde.tools) && govde.tools.length) {
    or.tools = (govde.tools as Blok[]).map(aracCevir)
    const secim = aracSecimiCevir(govde.tool_choice as Blok | undefined)
    if (secim !== undefined) or.tool_choice = secim
  }
  if (govde.stream) or.stream = true
  return or
}

// ─── OpenRouter → Anthropic.Message ────────────────────────────────────────────────────────────

const DURMA: Record<string, string> = { stop: 'end_turn', length: 'max_tokens', tool_calls: 'tool_use', content_filter: 'refusal' }

type OrKullanim = { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number } }

/** OpenAI usage → Anthropic usage. prompt_tokens önbellek okuma/yazmayı içerir; Anthropic input_tokens içermez. */
export function kullanimCevir(u: OrKullanim | undefined | null): Record<string, number> {
  const okuma = Number(u?.prompt_tokens_details?.cached_tokens) || 0
  const yazma = Number(u?.prompt_tokens_details?.cache_write_tokens) || 0
  return {
    input_tokens: Math.max(0, (Number(u?.prompt_tokens) || 0) - okuma - yazma),
    output_tokens: Number(u?.completion_tokens) || 0,
    cache_read_input_tokens: okuma,
    cache_creation_input_tokens: yazma,
  }
}

function argumanCoz(j: unknown): unknown {
  if (j && typeof j === 'object') return j
  try { return j ? JSON.parse(String(j)) : {} } catch { return {} }
}

/** OpenRouter yanıtı → Anthropic.Message. Boş gövde / choices yok → null (taşıma hatası sayılır). */
export function openRouterYanitiniCevir(y: any, istenenModel: string): Anthropic.Message | null {
  const secenek = y?.choices?.[0]
  if (!secenek || !secenek.message) return null
  const m = secenek.message
  const icerik: Blok[] = []
  if (typeof m.content === 'string' && m.content) icerik.push({ type: 'text', text: m.content })
  for (const c of m.tool_calls || []) {
    icerik.push({ type: 'tool_use', id: String(c.id || ''), name: String(c.function?.name || ''), input: argumanCoz(c.function?.arguments) })
  }
  return {
    id: String(y.id || ''),
    type: 'message',
    role: 'assistant',
    model: String(y.model || istenenModel),
    content: icerik,
    stop_reason: m.refusal ? 'refusal' : (DURMA[secenek.finish_reason] ?? secenek.finish_reason ?? null),
    stop_sequence: null,
    usage: kullanimCevir(y.usage),
  } as unknown as Anthropic.Message
}

// ─── HTTP ──────────────────────────────────────────────────────────────────────────────────────

function basliklar(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim() || ''}`,
    'HTTP-Referer': process.env.NOTYA_OPENROUTER_APP_URL || 'https://notya.ai',
    'X-Title': process.env.NOTYA_OPENROUTER_APP_TITLE || 'Notya AI',
    'content-type': 'application/json',
  }
}

function uc(): string {
  return `${(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '')}/chat/completions`
}

async function gonder(govde: Record<string, unknown>, zamanAsimiMs?: number): Promise<Response> {
  let r: Response
  try {
    r = await fetch(uc(), {
      method: 'POST',
      headers: basliklar(),
      body: JSON.stringify(govde),
      ...(zamanAsimiMs ? { signal: AbortSignal.timeout(zamanAsimiMs) } : {}),
    })
  } catch (e) {
    const ad = (e as { name?: string })?.name
    if (ad === 'TimeoutError' || ad === 'AbortError') throw new AiCagriHatasi(504, 'OpenRouter zaman aşımı')
    throw new AiCagriHatasi(503, `OpenRouter ağ hatası: ${String((e as Error)?.message || e).slice(0, 120)}`)
  }
  if (!r.ok) throw new AiCagriHatasi(r.status, await r.text().catch(() => ''))
  return r
}

/** Tek OpenRouter çağrısı (akışsız). Boş/bozuk gövde → 502 AiCagriHatasi (taşıma). */
export async function openRouterCagir(govde: Record<string, unknown>, zamanAsimiMs?: number): Promise<Anthropic.Message> {
  const or = openRouterGovdesi({ ...govde, stream: false })
  const r = await gonder(or, zamanAsimiMs)
  const ham = await r.text().catch(() => '')
  let json: unknown = null
  try { json = ham ? JSON.parse(ham) : null } catch { json = null }
  const hata = (json as { error?: { code?: number; message?: string } } | null)?.error
  if (hata) throw new AiCagriHatasi(Number(hata.code) || 502, String(hata.message || ham))
  const yanit = openRouterYanitiniCevir(json, String(or.model))
  if (!yanit) throw new AiCagriHatasi(502, 'OpenRouter boş gövde')
  return yanit
}

/**
 * Akışlı OpenRouter çağrısı (sesli Ayşe). SSE `data:` satırları → metinParcasi; tool_calls parçaları birleşir.
 * Dönen mesaj aiAkis'in Anthropic yolunda kurduğu mesajla aynı şekildedir. Akış tek metin üretmeden koparsa hata.
 */
export async function openRouterAkis(govde: Record<string, unknown>, metinParcasi: (p: string) => void, zamanAsimiMs?: number): Promise<{ yanit: Anthropic.Message; metinVerildi: boolean }> {
  const or = openRouterGovdesi({ ...govde, stream: true })
  const r = await gonder(or, zamanAsimiMs)
  if (!r.body) throw new AiCagriHatasi(502, 'OpenRouter boş akış')
  const okuyucu = r.body.getReader()
  const coz = new TextDecoder()
  let tampon = ''
  let metin = ''
  let model = String(or.model)
  let id = ''
  let bitis: string | null = null
  let reddetti = false
  let usage: OrKullanim | null = null
  const cagrilar: { id: string; name: string; args: string }[] = []
  let herhangiOlay = false

  const satirIsle = (satir: string) => {
    const t = satir.trim()
    if (!t.startsWith('data:')) return // ": OPENROUTER PROCESSING" yorum satırları
    const veri = t.slice(5).trim()
    if (!veri || veri === '[DONE]') return
    let o: any
    try { o = JSON.parse(veri) } catch { return }
    herhangiOlay = true
    if (o.error) throw new AiCagriHatasi(Number(o.error.code) || 502, String(o.error.message || 'OpenRouter akış hatası'))
    if (o.model) model = o.model
    if (o.id) id = o.id
    if (o.usage) usage = o.usage
    const c = o.choices?.[0]
    if (!c) return
    const d = c.delta || {}
    if (typeof d.content === 'string' && d.content) { metin += d.content; metinParcasi(d.content) }
    if (d.refusal) reddetti = true
    for (const tc of d.tool_calls || []) {
      const i = Number(tc.index ?? cagrilar.length)
      const a = cagrilar[i] || (cagrilar[i] = { id: '', name: '', args: '' })
      if (tc.id) a.id = tc.id
      if (tc.function?.name) a.name += tc.function.name
      if (tc.function?.arguments) a.args += tc.function.arguments
    }
    if (c.finish_reason) bitis = c.finish_reason
  }

  try {
    for (;;) {
      const { done, value } = await okuyucu.read()
      if (done) break
      tampon += coz.decode(value, { stream: true })
      let n: number
      while ((n = tampon.indexOf('\n')) >= 0) { satirIsle(tampon.slice(0, n)); tampon = tampon.slice(n + 1) }
    }
    if (tampon) satirIsle(tampon)
  } catch (e) {
    if (e instanceof AiCagriHatasi) throw Object.assign(e, { metinVerildi: metin.length > 0 })
    throw Object.assign(new AiCagriHatasi(503, `OpenRouter akış koptu: ${String((e as Error)?.message || e).slice(0, 120)}`), { metinVerildi: metin.length > 0 })
  }
  if (!herhangiOlay) throw new AiCagriHatasi(502, 'OpenRouter boş akış')

  const icerik: Blok[] = []
  if (metin) icerik.push({ type: 'text', text: metin })
  for (const a of cagrilar.filter(Boolean)) icerik.push({ type: 'tool_use', id: a.id, name: a.name, input: argumanCoz(a.args) })
  const yanit = {
    id, type: 'message', role: 'assistant', model, content: icerik,
    stop_reason: reddetti ? 'refusal' : (bitis ? (DURMA[bitis] ?? bitis) : null), stop_sequence: null,
    usage: kullanimCevir(usage),
  } as unknown as Anthropic.Message
  return { yanit, metinVerildi: metin.length > 0 }
}
