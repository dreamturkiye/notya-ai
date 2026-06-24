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

export async function GET() {
  return NextResponse.json({ status: "Notya WhatsApp Webhook OK" })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.TWILIO_API_SECRET) return new NextResponse("Forbidden", { status: 403 })
    const form     = await req.formData()
    const from_num = (form.get("From") as string || "").replace("whatsapp:", "")
    const body     = (form.get("Body") as string || "").trim()
    const numMedia = parseInt(form.get("NumMedia") as string || "0")
    const musavirId = process.env.DEFAULT_MUSAVIR_ID
    if (!musavirId) {
      await replyWA(from_num, "Bu numara sisteme kayitli degil.")
      return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
    }
    if (numMedia === 0) {
      await replyWA(from_num, "Belge fotografini gonderin. Derya hemen isleyecek.")
      return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
    }
    const sb = getSB()
    const results: Array<Record<string,unknown>> = []
    for (let i = 0; i < Math.min(numMedia, 5); i++) {
      const mediaUrl  = form.get("MediaUrl" + i) as string
      const mediaMime = form.get("MediaContentType" + i) as string || "image/jpeg"
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
  } catch(e) {
    return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } })
  }
}