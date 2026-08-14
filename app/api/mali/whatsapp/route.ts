import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { detectAndExtract } from "@/lib/ingestion/pipeline"

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function replyWA(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const tok = process.env.TWILIO_API_SECRET!
  const frm = process.env.TWILIO_WHATSAPP_FROM!
  const creds = Buffer.from(process.env.TWILIO_API_KEY! + ":" + tok).toString("base64")
  await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: { Authorization: "Basic " + creds, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: frm, To: "whatsapp:" + to, Body: body }).toString()
  })
}

/** Twilio request validation: HMAC-SHA1 over full URL + sorted POST params. */
function validateTwilioSignature(req: NextRequest, params: Record<string, string>): boolean {
  const signature = req.headers.get('x-twilio-signature')
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET
  if (!signature || !authToken) return false

  const url =
    process.env.TWILIO_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'}/api/mali/whatsapp`

  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url)

  const expected = createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
  try {
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function GET() {
  return NextResponse.json({ status: "Notya WhatsApp Webhook OK" })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.TWILIO_API_SECRET && !process.env.TWILIO_AUTH_TOKEN) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const form = await req.formData()
    const params: Record<string, string> = {}
    form.forEach((value, key) => {
      if (typeof value === 'string') params[key] = value
    })

    if (!validateTwilioSignature(req, params)) {
      return new NextResponse("Invalid signature", { status: 403 })
    }

    const from_num = (params.From || "").replace("whatsapp:", "")
    const body = (params.Body || "").trim()
    const numMedia = parseInt(params.NumMedia || "0", 10)

    // Bind sender to a musavir — no anonymous DEFAULT catch-all ingest.
    const sb = getSB()
    const { data: binding } = await sb
      .from('mali_whatsapp_bindings')
      .select('musavir_id')
      .eq('phone', from_num)
      .maybeSingle()

    const musavirId = binding?.musavir_id || process.env.DEFAULT_MUSAVIR_ID
    if (!musavirId) {
      await replyWA(from_num, "Bu numara sisteme kayitli degil.")
      return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
    }
    if (numMedia === 0) {
      await replyWA(from_num, "Belge fotografini gonderin. Derya hemen isleyecek.")
      return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
    }
    const results: Array<Record<string,unknown>> = []
    for (let i = 0; i < Math.min(numMedia, 5); i++) {
      const mediaUrl  = params["MediaUrl" + i]
      const mediaMime = params["MediaContentType" + i] || "image/jpeg"
      if (!mediaUrl) continue
      try {
        const sid   = process.env.TWILIO_ACCOUNT_SID!
        const tok   = process.env.TWILIO_API_SECRET!
        const creds = Buffer.from(process.env.TWILIO_API_KEY! + ":" + tok).toString("base64")
        const mres  = await fetch(mediaUrl, { headers: { Authorization: "Basic " + creds } })
        const bytes = await mres.arrayBuffer()
        const b64   = Buffer.from(bytes).toString("base64")
        const ext   = mediaMime.split("/")[1] || "jpg"
        const fname = musavirId + "/whatsapp/" + Date.now() + "_" + i + "." + ext
        await sb.storage.from("mali-belgeler").upload(fname, bytes, { contentType: mediaMime })
        const res   = await detectAndExtract(b64, mediaMime, fname, "", "", new Date().toISOString().slice(0,7), body)
        const analiz = res.data
        const { data: belge } = await sb.from("mali_belgeler").insert({
          musavir_id: musavirId, donem: new Date().toISOString().slice(0,7),
          belge_turu: res.detectedTuru, dosya_adi: fname, storage_path: fname,
          notlar: body, kanal: "whatsapp", whatsapp_from: from_num,
          analiz_json: analiz, tarih: analiz.tarih || null,
          toplam_tutar: analiz.toplamTutar || null, kdv_tutari: analiz.kdvTutari || null,
          islem_turu: String(analiz.islemTuru || "diger"),
          guven_skor: Number(analiz.guvenSkor) || 0,
          ozet: String(analiz.ozet || ""),
          inceleme_bekliyor: (Number(analiz.guvenSkor) || 0) < 70,
        }).select().single()
        results.push({ detectedTuru: res.detectedTuru, analiz, id: belge?.id })
      } catch(e) { results.push({ analiz: { guvenSkor: 0, ozet: String(e) }, detectedTuru: "diger_belge" }) }
    }
    const ok = results.filter(r => (Number((r.analiz as Record<string,unknown>)?.guvenSkor) || 0) > 0)
    const msg = ok.length === 0
      ? "Belge islenemedi. Daha net fotograf gonderin.": ("Derya " + ok.length + " belgeyi isledi. Detay: notya-ai.vercel.app/dashboard/mali/belgeler")
    await replyWA(from_num, msg)
    return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
  } catch {
    return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
  }
}
