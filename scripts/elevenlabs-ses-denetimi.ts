/**
 * ElevenLabs ses denetimi — TR_VOICES içindeki her sesin ConvAI (agent) oturumunda
 * kullanılabilir olduğunu doğrular.
 *
 * Neden: Paylaşılan kütüphaneden kopyalanan bazı Professional Voice Clone seslerinde sahibi
 * "live moderation" açmıştır; ElevenLabs bu sesleri agent'larda reddeder:
 *   "Voices with live moderation enabled cannot be used for agents"
 * (2026-09-17: Prof. Dr. Fatma Çelik / Kadın Doğum sesli asistanı bu hatayla açılmadı.)
 *
 * Kullanım:
 *   ELEVENLABS_API_KEY=... npx tsx scripts/elevenlabs-ses-denetimi.ts          # meta veri (sharing.live_moderation_enabled)
 *   ELEVENLABS_API_KEY=... npx tsx scripts/elevenlabs-ses-denetimi.ts --canli  # + gerçek agent bağlantısı (ses başına ~1 sn)
 *   ... --canli --ses <voiceId>[,<voiceId>]                                     # yalnızca belirli sesler
 *   ... --canli --agent <agentId>                                                # base agent'ı zorla (ör. Mali, avukat)
 *
 * Canlı mod uygulamanın yaptığını yapar: agent için signed URL alır, WebSocket açar,
 * conversation_initiation_client_data ile tts.voice_id override gönderir ve ilk ses
 * paketini (audio) görünce kapatır. Ses verisi saklanmaz. Hata varsa çıkış kodu 1.
 * Node 22+ yerleşik WebSocket kullanır (ek bağımlılık yok).
 */
import { TR_VOICES } from '../lib/asistan/elevenVoices'

const API = 'https://api.elevenlabs.io'
const KEY = process.env.ELEVENLABS_API_KEY
// app/api/asistan/signed-url/route.ts varsayılan base agent'ları (kadın → Ayşe, erkek → Mehmet)
const AGENT_FEMALE = process.env.ELEVENLABS_AGENT_PEDIATRI || 'agent_3601ktc884ntf3dbdkjtyx6vdfwa'
const AGENT_MALE = process.env.ELEVENLABS_AGENT_KARDIYOLOJI || 'agent_6501ktc87nmyeca88wskfvr8dfxh'

type Sonuc = { ok: boolean; detay: string }

async function metaKontrol(voiceId: string): Promise<Sonuc> {
  const r = await fetch(`${API}/v1/voices/${voiceId}`, { headers: { 'xi-api-key': KEY! } })
  if (!r.ok) return { ok: false, detay: `GET /v1/voices ${r.status}` }
  const v = (await r.json()) as { category?: string; sharing?: { live_moderation_enabled?: boolean } | null }
  if (v.sharing?.live_moderation_enabled) return { ok: false, detay: `${v.category}, live_moderation_enabled=true` }
  return { ok: true, detay: `${v.category}, live_moderation_enabled=${v.sharing?.live_moderation_enabled ?? '—'}` }
}

async function signedUrl(agentId: string): Promise<string> {
  const r = await fetch(`${API}/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
    headers: { 'xi-api-key': KEY! },
  })
  if (!r.ok) throw new Error(`get_signed_url ${r.status}: ${await r.text()}`)
  return ((await r.json()) as { signed_url: string }).signed_url
}

async function canliKontrol(voiceId: string, agentId: string): Promise<Sonuc> {
  const url = await signedUrl(agentId)
  return new Promise((resolve) => {
    const ws = new WebSocket(url)
    let bitti = false
    let basladi = false
    const bitir = (s: Sonuc) => {
      if (bitti) return
      bitti = true
      clearTimeout(zaman)
      try { ws.close() } catch { /* yoksay */ }
      resolve(s)
    }
    const zaman = setTimeout(
      () => bitir({ ok: false, detay: basladi ? 'oturum açıldı ama 15 sn içinde ses gelmedi' : 'zaman aşımı' }),
      15_000,
    )
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'conversation_initiation_client_data',
        conversation_config_override: { tts: { voice_id: voiceId }, agent: { language: 'tr' } },
      }))
    })
    ws.addEventListener('message', (ev: MessageEvent) => {
      let m: { type?: string; ping_event?: { event_id: number } }
      try { m = JSON.parse(String(ev.data)) } catch { return }
      if (m.type === 'ping' && m.ping_event) ws.send(JSON.stringify({ type: 'pong', event_id: m.ping_event.event_id }))
      if (m.type === 'conversation_initiation_metadata') basladi = true
      if (m.type === 'audio') bitir({ ok: true, detay: 'agent oturumu açıldı, ilk ses paketi geldi' })
    })
    ws.addEventListener('close', (ev: CloseEvent) => bitir({ ok: false, detay: `WS kapandı ${ev.code}: ${ev.reason || '(neden yok)'}` }))
    ws.addEventListener('error', () => bitir({ ok: false, detay: 'WS hata' }))
  })
}

async function main() {
  if (!KEY) {
    console.error('ELEVENLABS_API_KEY gerekli')
    process.exit(2)
  }
  const canli = process.argv.includes('--canli')
  const sesArg = process.argv[process.argv.indexOf('--ses') + 1]
  const filtre = process.argv.includes('--ses') && sesArg ? new Set(sesArg.split(',')) : null
  const agentZorla = process.argv.includes('--agent') ? process.argv[process.argv.indexOf('--agent') + 1] : null

  // Aynı voiceId birden çok anahtarda olabilir (ör. ayseHanim/leyla) — her sesi bir kez dene.
  const sesler = new Map<string, { anahtarlar: string[]; gender: string }>()
  for (const [k, v] of Object.entries(TR_VOICES)) {
    if (filtre && !filtre.has(v.voiceId)) continue
    const e = sesler.get(v.voiceId)
    if (e) e.anahtarlar.push(k)
    else sesler.set(v.voiceId, { anahtarlar: [k], gender: v.gender })
  }
  if (filtre) for (const id of filtre) if (!sesler.has(id)) sesler.set(id, { anahtarlar: ['(TR_VOICES dışı)'], gender: 'female' })

  let hata = 0
  for (const [voiceId, { anahtarlar, gender }] of sesler) {
    const meta = await metaKontrol(voiceId)
    let satir = `${meta.ok ? 'OK  ' : 'HATA'} meta  ${voiceId}  ${anahtarlar.join('/').padEnd(22)} ${meta.detay}`
    if (!meta.ok) hata++
    if (canli) {
      const c = await canliKontrol(voiceId, agentZorla || (gender === 'male' ? AGENT_MALE : AGENT_FEMALE))
      satir += `\n${c.ok ? 'OK  ' : 'HATA'} canlı ${voiceId}  ${anahtarlar.join('/').padEnd(22)} ${c.detay}`
      if (!c.ok) hata++
    }
    console.log(satir)
  }
  console.log(hata ? `\n${hata} sorun bulundu.` : '\nTüm sesler agent için kullanılabilir.')
  process.exit(hata ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
