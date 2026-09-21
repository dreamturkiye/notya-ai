/**
 * NOTYA-EYLEM-19 — register voice eylem client tools on live ElevenLabs ConvAI agents.
 *
 * Same pattern as hasta_bul: workspace tool (type=client) + attach tool_id on each base agent.
 * Browser implementations live in app/asistan/page.tsx clientTools; the agent must know the
 * names or it never calls them.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... npx tsx scripts/_el-tool-kur.mts
 *   ELEVENLABS_API_KEY=... npx tsx scripts/_el-tool-kur.mts --dry   # print plan only
 *
 * Agents (same defaults as app/api/asistan/signed-url/route.ts):
 *   female/Ayşe  ELEVENLABS_AGENT_PEDIATRI
 *   male/Mehmet  ELEVENLABS_AGENT_KARDIYOLOJI
 *   Elif         ELEVENLABS_AGENT_ELIF / NOROLOJI
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const API = 'https://api.elevenlabs.io/v1/convai'
const DRY = process.argv.includes('--dry')

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}
loadEnvLocal()

const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) {
  console.error('ELEVENLABS_API_KEY gerekli (.env.local veya ortam)')
  process.exit(1)
}

const AGENT_IDS = [
  process.env.ELEVENLABS_AGENT_PEDIATRI || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa',
  process.env.ELEVENLABS_AGENT_KARDIYOLOJI || 'agent_6501ktc87nmyeca88wskfvr8dfxh',
  process.env.ELEVENLABS_AGENT_ELIF || process.env.ELEVENLABS_AGENT_NOROLOJI || 'agent_1301kwjdee1afajrqkdxmghna6sx',
]

type ParamProp = {
  type: string
  description: string
  enum?: null
  is_system_provided?: boolean
  dynamic_variable?: string
  allowed_values?: null
  allowed_values_dynamic_variable?: string
  constant_value?: string
  is_omitted?: boolean
}

function strParam(description: string): ParamProp {
  return {
    type: 'string',
    description,
    enum: null,
    is_system_provided: false,
    dynamic_variable: '',
    allowed_values: null,
    allowed_values_dynamic_variable: '',
    constant_value: '',
    is_omitted: false,
  }
}

function clientTool(name: string, description: string, required: string[], properties: Record<string, ParamProp>) {
  return {
    type: 'client' as const,
    name,
    description,
    response_timeout_secs: 20,
    disable_interruptions: false,
    interruption_mode: 'allow',
    force_pre_tool_speech: false,
    pre_tool_speech: 'auto',
    assignments: [],
    tool_call_sound: null,
    tool_call_sound_behavior: 'auto',
    tool_error_handling_mode: 'auto',
    parameters: {
      description: '',
      dynamic_variable: '',
      is_omitted: false,
      type: 'object',
      required,
      properties,
    },
    expects_response: true,
    dynamic_variables: { dynamic_variable_placeholders: {} },
    execution_mode: 'immediate',
  }
}

/** Tools the browser implements in app/asistan/page.tsx — names must match exactly. */
const EYLEM_TOOLS = [
  clientTool(
    'dosyaya_kayit_hazirla',
    'Doktor dosyaya bir şey girmemi istediğinde çağır (yazıver, kaydet, kayda geç, aşıyı gir, ilaç ekle, rica ediyorum). KAYIT YAPMAZ — onay kartı / taslak hazırlar. Dönen Türkçe metni oku ve sonunda "Onaylıyor musunuz?" diye sor. "Kaydedildi" DEME.',
    ['eylem', 'hasta'],
    {
      eylem: strParam(
        'Eylem anahtarı. Yaygın: asi_kaydi_ekle, ilac_ekle, alerji_ekle, olcum_ekle, kontrol_randevusu_olustur, dosya_notu_ekle, kronik_hastalik_ekle'
      ),
      hasta: strParam('Hasta adı (ör. "Ali Yılmaz", "Hasta 1")'),
      alanlar: strParam(
        'Alanlar JSON metin. Örn: {"asi_adi":"Hepatit B","doz_no":1,"notlar":"doğumda"}. Uygulama tarihi yoksa doğumda yaz — sistem DOB kullanabilir.'
      ),
    }
  ),
  clientTool(
    'eylem_onayla',
    'Doktor read-back sonrası net onay verdiğinde çağır: Evet, Onaylıyorum, Kaydet, Tamam. onayMetni = duyduğun kelime. Yalnızca önceki dosyaya_kayit_hazirla sonrası. Ambiguous (hmm, belki) ise ÇAĞIRMA — tekrar sor.',
    ['onayMetni'],
    { onayMetni: strParam('Doktorun söylediği onay (ör. "Evet", "Onaylıyorum")') }
  ),
  clientTool(
    'eylem_vazgec',
    'Doktor Hayır / vazgeç / iptal dediğinde çağır. Dosyaya hiçbir şey yazılmaz.',
    [],
    {}
  ),
  clientTool(
    'randevu_takvim',
    'Doktor o günün randevularını veya bir saatin boş olup olmadığını sorduğunda çağır. KAYIT YAPMAZ — takvimi okur. "takvimi göremem / iznim yok" DEME: bu araç vardır. Dönen Türkçe metni oku.',
    ['tarih'],
    {
      tarih: strParam('Gün YYYY-MM-DD (Türkiye). Örn 2026-09-25'),
      saat: strParam('Kontrol edilecek saat HH:MM (24s). Örn 09:00. Yoksa yalnız gün listesi.'),
      sure_dk: strParam('Süre dakika, varsayılan 20'),
    }
  ),
]

async function el<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'xi-api-key': KEY!, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text.slice(0, 500)}`)
  return (text ? JSON.parse(text) : {}) as T
}

async function listWorkspaceTools(): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = []
  let cursor: string | null = null
  for (let i = 0; i < 20; i++) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    const page = await el<{ tools?: { id: string; tool_config?: { name?: string } }[]; next_cursor?: string | null; has_more?: boolean }>(
      'GET',
      `/tools${q}`
    )
    for (const t of page.tools || []) {
      const name = t.tool_config?.name
      if (name) out.push({ id: t.id, name })
    }
    if (!page.has_more || !page.next_cursor) break
    cursor = page.next_cursor
  }
  return out
}

async function ensureTool(tool: (typeof EYLEM_TOOLS)[0], existing: { id: string; name: string }[]): Promise<string> {
  const hit = existing.find((e) => e.name === tool.name)
  if (hit) {
    console.log(`  tool mevcut: ${tool.name} → ${hit.id}`)
    // Refresh description/params so agent stays in sync with code.
    if (!DRY) await el('PATCH', `/tools/${hit.id}`, { tool_config: tool })
    return hit.id
  }
  if (DRY) {
    console.log(`  [dry] CREATE ${tool.name}`)
    return `dry_${tool.name}`
  }
  const created = await el<{ id: string }>('POST', '/tools', { tool_config: tool })
  console.log(`  tool oluşturuldu: ${tool.name} → ${created.id}`)
  return created.id
}

async function attachToAgent(agentId: string, toolIds: string[]) {
  const agent = await el<{
    name?: string
    conversation_config?: {
      agent?: { prompt?: { tools?: { name?: string }[]; tool_ids?: string[] } }
    }
  }>('GET', `/agents/${agentId}`)
  const prompt = agent.conversation_config?.agent?.prompt || {}
  const mevcutIds = [...(prompt.tool_ids || [])]

  const ids = [...mevcutIds]
  for (const id of toolIds) if (!ids.includes(id)) ids.push(id)

  console.log(`  agent ${agent.name || agentId}`)
  console.log(`    tool_ids: ${mevcutIds.length} → ${ids.length}`)
  console.log(`    ids: ${ids.join(', ')}`)

  if (DRY) return
  // API rejects tools + tool_ids together when both non-empty — clear inline tools, attach by id.
  await el('PATCH', `/agents/${agentId}`, {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: ids,
          tools: [],
        },
      },
    },
  })
  console.log('    PATCH ok')
}

async function main() {
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE: ElevenLabs eylem tools ===')
  const existing = await listWorkspaceTools()
  const ids: string[] = []
  for (const t of EYLEM_TOOLS) ids.push(await ensureTool(t, existing))

  const hasta = existing.find((e) => e.name === 'hasta_bul')
  if (hasta && !DRY) {
    await el('PATCH', `/tools/${hasta.id}`, {
      tool_config: clientTool(
        'hasta_bul',
        'Doktor hasta listesi/sayısı sorduğunda çağır: ad, yaş, cinsiyet, bu hafta/son N gün, gelme nedeni, tanı, aşı, ilaç, randevu, belge, ateş, kan grubu. Tam cümleyi isim olarak gönder. Filtreler AND + BETWEEN + VEYA + HARİÇ. Tüm dosya taranır. Sayıyı ve listeyi sırayla oku. "erişimim yok" DEME.',
        ['isim'],
        { isim: strParam('Tam cümle. Örn: "bu hafta 1-5 yaş otit veya farenjit", "aşı olmayan", "kaç tane", "Ayşe Metin"') }
      ),
    })
    console.log(`  tool güncellendi: hasta_bul → ${hasta.id}`)
  }
  const attachIds = hasta ? [hasta.id, ...ids] : ids

  for (const agentId of [...new Set(AGENT_IDS)]) {
    await attachToAgent(agentId, attachIds)
  }
  console.log('Bitti. /asistan ses oturumunda yazıver → Onaylıyor musunuz? → Evet denenmeli.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
