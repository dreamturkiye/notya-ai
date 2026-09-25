/**
 * NOTYA-TEK-BEYIN — Custom LLM'li TEST KOPYA ajanlar (tekrarlanabilir). Mevcut ajanlara DOKUNMAZ.
 *
 * Her temel ElevenLabs ajanı (app/api/asistan/signed-url/route.ts ile aynı üç ajan: Ayşe/pediatri, Mehmet/kardiyoloji,
 * Elif/nöroloji — sekiz persona bunları ses + prompt override ile paylaşır) için:
 *   1. kopya yoksa POST /agents/{id}/duplicate ("<ad> · TEK BEYİN TEST"), varsa aynı kopya güncellenir;
 *   2. kopyada LLM = custom-llm → <NOTYA_SES_LLM_URL>/api/asistan/ses-llm/v1 (ElevenLabs /chat/completions ekler),
 *      API anahtarı = ElevenLabs çalışma alanı sırrı "notya_ses_llm_secret" (NOTYA_SES_LLM_SECRET değeri);
 *   3. platform_settings.overrides.custom_llm_extra_body = true (tarayıcının jetonu extra body ile geçer);
 *   4. tarayıcı client tool'ları kopyadan çıkarılır (tool_ids: []) — hasta arama / kart / onay artık sunucuda;
 *      ElevenLabs sistem araçları (end_call …) olduğu gibi kalır;
 *   5. eşleme lib/asistan/tekBeyinAjanlari.ts'e yazılır (commit edilir; ajan kimliği gizli değildir).
 * Hiçbir doktor bu script ile geçmez — geçiş NOTYA_TEK_BEYIN_DOKTORLAR ortam değişkenidir.
 *
 *   npx tsx scripts/tek-beyin-ajanlari.mts --dry     # yalnız plan
 *   npx tsx scripts/tek-beyin-ajanlari.mts           # kopyala / güncelle
 *   NOTYA_SES_LLM_URL=https://notya.ai (varsayılan) · NOTYA_SES_LLM_SECRET (.env.local ya da ortam, ≥32 karakter)
 *   --sir-yenile : ElevenLabs sırrını NOTYA_SES_LLM_SECRET'in şimdiki değeriyle yeniden yazar (döndürme)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const API = 'https://api.elevenlabs.io/v1/convai'
const DRY = process.argv.includes('--dry')
const SIR_YENILE = process.argv.includes('--sir-yenile')
const SIR_ADI = 'notya_ses_llm_secret'
const EK = ' · TEK BEYİN TEST'

for (const f of ['.env.local', '.env']) {
  const p = resolve(process.cwd(), f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const KEY = process.env.ELEVENLABS_API_KEY
const SIR = String(process.env.NOTYA_SES_LLM_SECRET || '').trim()
const TABAN_URL = String(process.env.NOTYA_SES_LLM_URL || 'https://notya.ai').replace(/\/$/, '')
if (!KEY) { console.error('ELEVENLABS_API_KEY gerekli (.env.local veya ortam)'); process.exit(1) }
if (SIR.length < 32 && !DRY) { console.error('NOTYA_SES_LLM_SECRET gerekli (≥32 karakter) — sunucuda da aynı değer olmalı'); process.exit(1) }

const TABAN_AJANLAR = [
  process.env.ELEVENLABS_AGENT_PEDIATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  process.env.ELEVENLABS_AGENT_KARDIYOLOJI || 'agent_6501ktc87nmyeca88wskfvr8dfxh',
  process.env.ELEVENLABS_AGENT_ELIF || process.env.ELEVENLABS_AGENT_NOROLOJI || 'agent_1301kwjdee1afajrqkdxmghna6sx',
]
const ESLEME_DOSYASI = resolve(process.cwd(), 'lib/asistan/tekBeyinAjanlari.ts')

async function el<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'xi-api-key': KEY!, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text.slice(0, 600)}`)
  return (text ? JSON.parse(text) : {}) as T
}

function mevcutEsleme(): Record<string, string> {
  const m = readFileSync(ESLEME_DOSYASI, 'utf8').match(/TEK_BEYIN_AJANLARI: Record<string, string> = (\{[\s\S]*?\})/)
  try { return m ? (JSON.parse(m[1]) as Record<string, string>) : {} } catch { return {} }
}

function eslemeYaz(e: Record<string, string>) {
  const eski = readFileSync(ESLEME_DOSYASI, 'utf8')
  const yeni = eski.replace(/TEK_BEYIN_AJANLARI: Record<string, string> = \{[\s\S]*?\}/, `TEK_BEYIN_AJANLARI: Record<string, string> = ${JSON.stringify(e, null, 2)}`)
  writeFileSync(ESLEME_DOSYASI, yeni)
}

async function sirKimligi(): Promise<string> {
  const liste = await el<{ secrets?: { secret_id: string; name: string }[] }>('GET', '/secrets')
  const var_ = (liste.secrets || []).find((s) => s.name === SIR_ADI)
  if (var_ && !SIR_YENILE) { console.log(`  sır mevcut: ${SIR_ADI} → ${var_.secret_id}`); return var_.secret_id }
  if (DRY) return 'dry_secret'
  if (var_) {
    await el('PATCH', `/secrets/${var_.secret_id}`, { type: 'update', name: SIR_ADI, value: SIR })
    console.log(`  sır yenilendi: ${SIR_ADI}`)
    return var_.secret_id
  }
  const y = await el<{ secret_id: string }>('POST', '/secrets', { type: 'new', name: SIR_ADI, value: SIR })
  console.log(`  sır oluşturuldu: ${SIR_ADI} → ${y.secret_id}`)
  return y.secret_id
}

type Ajan = { name?: string; conversation_config?: { agent?: { prompt?: Record<string, unknown> } }; platform_settings?: { overrides?: Record<string, unknown> } }

async function kopyaHazirla(taban: string, oncekiKopya: string | undefined, secretId: string): Promise<string> {
  const t = await el<Ajan>('GET', `/agents/${taban}`)
  let kopya = oncekiKopya
  if (kopya) {
    try { await el('GET', `/agents/${kopya}`) } catch { kopya = undefined }
  }
  if (!kopya) {
    if (DRY) { console.log(`  [dry] DUPLICATE ${t.name}`); return `dry_${taban}` }
    kopya = (await el<{ agent_id: string }>('POST', `/agents/${taban}/duplicate`, { name: `${t.name || taban}${EK}` })).agent_id
    console.log(`  kopya oluşturuldu: ${t.name} → ${kopya}`)
  } else {
    console.log(`  kopya mevcut: ${t.name} → ${kopya}`)
  }
  const url = `${TABAN_URL}/api/asistan/ses-llm/v1`
  const overrides = { ...(t.platform_settings?.overrides || {}), custom_llm_extra_body: true }
  const govde = (basliklar: boolean) => ({
    name: `${(t.name || taban).replace(EK, '')}${EK}`,
    conversation_config: {
      agent: {
        prompt: {
          llm: 'custom-llm',
          custom_llm: {
            url,
            model_id: 'notya-ayse',
            api_key: { secret_id: secretId },
            ...(basliklar ? { request_headers: { 'x-notya-ses-sirri': { secret_id: secretId } } } : {}),
          },
          tool_ids: [],
          tools: [],
        },
      },
    },
    platform_settings: { overrides },
  })
  if (DRY) { console.log(`  [dry] PATCH ${kopya} → custom-llm ${url}, extra body açık, client tool yok`); return kopya }
  try {
    await el('PATCH', `/agents/${kopya}`, govde(true))
  } catch (e) {
    // request_headers şeması sırrı kabul etmiyorsa: yalnız API anahtarı (Authorization: Bearer) — uç ikisini de kabul eder.
    console.log(`    request_headers reddedildi, yalnız api_key ile: ${String(e).slice(0, 160)}`)
    await el('PATCH', `/agents/${kopya}`, govde(false))
  }
  const son = await el<Ajan>('GET', `/agents/${kopya}`)
  const p = son.conversation_config?.agent?.prompt || {}
  console.log(`    llm=${p.llm} url=${(p.custom_llm as { url?: string } | null)?.url} tool_ids=${JSON.stringify(p.tool_ids)} extra_body=${JSON.stringify(son.platform_settings?.overrides?.custom_llm_extra_body)}`)
  return kopya
}

async function main() {
  console.log(DRY ? '=== DRY RUN ===' : '=== TEK BEYİN test ajanları ===')
  const secretId = await sirKimligi()
  const esleme = mevcutEsleme()
  for (const taban of [...new Set(TABAN_AJANLAR)]) {
    esleme[taban] = await kopyaHazirla(taban, esleme[taban], secretId)
  }
  if (!DRY) eslemeYaz(esleme)
  console.log('Eşleme:', esleme)
  console.log('Mevcut ajanlar değişmedi. Doktor geçişi: NOTYA_TEK_BEYIN_DOKTORLAR (+ NOTYA_SES_LLM_SECRET, NOTYA_SES_JETON_SECRET sunucuda).')
}

main().catch((e) => { console.error(e); process.exit(1) })
