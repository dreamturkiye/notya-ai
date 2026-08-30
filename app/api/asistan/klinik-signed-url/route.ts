export const dynamic = "force-dynamic"

/**
 * NOTYA-KLINIK-02 — voice session bootstrap for the klinik experts.
 *
 * Same architecture as the doktor asistan: one base ElevenLabs ConvAI agent per gender, and the
 * client overrides `agent.prompt`, `firstMessage` and `tts.voiceId` per persona. The ten klinik
 * personas therefore need NO new ElevenLabs agents — they ride the existing base agents with
 * their own prompt and voice. This route authenticates, resolves the persona, and returns
 * { signed_url, voice_id, prompt, first_message } for the client to apply as overrides.
 */
import { NextRequest, NextResponse } from "next/server"
import { doktorOturum } from "@/lib/doktor/serverAuth"
import { KlinikUzmanPersonas } from "@/lib/ai/personas/klinik_uzmanlar"

const FEMALE_AGENT =
  process.env.ELEVENLABS_AGENT_PEDIATRI ||
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
  "agent_3601ktc884ntf3dbdkjtyx6vdfwa"
const MALE_AGENT =
  process.env.ELEVENLABS_AGENT_KARDIYOLOJI ||
  "agent_6501ktc87nmyeca88wskfvr8dfxh"

function voicePrompt(slug: string): string {
  const p = KlinikUzmanPersonas[slug]
  return [
    `Sen ${p.name}, ${p.title}. ${p.systemPrompt}`,
    "Bir klinikte çalışan uzman meslektaşla konuşuyorsun; hasta ile değil. Türkçe konuş.",
    "Sesli görüşmedesin: kısa, net cümleler kur; madde işareti ve uzun liste kullanma.",
    "Emin olmadığın klinik bilgiyi uydurma; kaynağından emin değilsen bunu açıkça söyle.",
    "Tehlikeli doz, kontrendikasyon veya atlanmış risk görürsen sormadan söyle ve doğrusunu öner.",
  ].join(" ")
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ("hata" in oturum) return oturum.hata

  const slug = req.nextUrl.searchParams.get("persona") || "sac-ekimi"
  const persona = KlinikUzmanPersonas[slug]
  if (!persona) return NextResponse.json({ error: "Bilinmeyen uzman." }, { status: 400 })

  const elKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
  if (!elKey) return NextResponse.json({ error: "Ses servisi yapılandırılmamış." }, { status: 500 })

  const agentId = persona.gender === "male" ? MALE_AGENT : FEMALE_AGENT
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": elKey }, cache: "no-store" }
  )
  if (!resp.ok) {
    const err = await resp.text()
    return NextResponse.json({ error: `Ses servisi ${resp.status}: ${err.slice(0, 200)}` }, { status: 502 })
  }
  const body = await resp.json()
  if (!body.signed_url) return NextResponse.json({ error: "Bağlantı adresi alınamadı." }, { status: 502 })

  return NextResponse.json({
    signed_url: body.signed_url,
    voice_id: persona.voiceId,
    prompt: voicePrompt(slug),
    first_message: persona.greeting,
  })
}
