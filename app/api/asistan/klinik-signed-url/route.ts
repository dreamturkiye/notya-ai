export const dynamic = "force-dynamic"

/**
 * NOTYA-KLINIK-02 + NOTYA-TEK-BEYIN-CORE-01 — voice session bootstrap for klinik experts.
 *
 * Same thin-mouth architecture as Pediatri Ayşe: Flash-locked base agent → Custom-LLM copy
 * (`TEK_BEYIN_AJANLARI`) → `/api/asistan/ses-llm` with a signed jeton. Klinik brain is
 * `klinikCevapla` (persona prompt + Luna), not the fat ElevenLabs-hosted LLM.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { doktorOturum } from "@/lib/doktor/serverAuth"
import { KlinikUzmanPersonas } from "@/lib/ai/personas/klinik_uzmanlar"
import { sesMotorunuSabitle } from "@/lib/asistan/sesMotoru"
import { asistanOturumuAc } from "@/lib/asistan/ayseCevapla"
import { sesJetonuImzala, tekBeyinAcikMi } from "@/lib/asistan/sesJetonu"
import { TEK_BEYIN_AJANLARI } from "@/lib/asistan/tekBeyinAjanlari"
import { klinikPersonaJeton, klinikTabanAgentSec } from "@/lib/asistan/agentSec"
import { istekSaatDilimi } from "@/lib/doktor/saatDilimi"
import { saatDilimiSec } from "@/lib/randevu/tarihCozumle"

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

  let agentId = klinikTabanAgentSec(persona.gender)
  let tekBeyin: { asistan_session_id: string; notya_jeton: string; baslangic: string } | null = null

  // NOTYA-TEK-BEYIN-CORE-01: klinik rides the same Custom-LLM copies as doktor asistan.
  const kopya = TEK_BEYIN_AJANLARI[agentId]
  if (kopya && tekBeyinAcikMi(oturum.user.id)) {
    try {
      const hazir = await tekBeyinHazirla(oturum.user.id, slug, req)
      if (hazir?.notya_jeton) {
        agentId = kopya
        tekBeyin = hazir
      }
    } catch (e) {
      console.error("[klinik-signed-url] tek beyin", e instanceof Error ? e.name : "hata")
    }
  }

  await sesMotorunuSabitle(agentId, elKey)
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
    agent_id: agentId,
    voice_id: persona.voiceId,
    // Fat prompt only when still on the base (non–tek-beyin) agent — Custom LLM ignores it.
    prompt: tekBeyin ? "" : voicePrompt(slug),
    first_message: persona.greeting,
    ...(tekBeyin ? { tek_beyin: true, ...tekBeyin } : {}),
  })
}

async function tekBeyinHazirla(doktorId: string, slug: string, req: NextRequest) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: "no-store" }) },
  })
  const pe = klinikPersonaJeton(slug)
  const yeni = await asistanOturumuAc(sb, {
    doktorId,
    personaId: pe,
    specialty: `klinik-${slug}`,
    hekimBransi: "klinik",
    patientId: null,
  })
  const oturumId = (yeni?.id as string) || null
  if (!oturumId) return null
  const tz = saatDilimiSec(String(req.nextUrl.searchParams.get("tz") || "").trim() || null, istekSaatDilimi())
  const jeton = sesJetonuImzala({ d: doktorId, o: oturumId, s: `klinik-${slug}`, p: null, pe, tz })
  if (!jeton) return null
  return { asistan_session_id: oturumId, notya_jeton: jeton, baslangic: new Date().toISOString() }
}
