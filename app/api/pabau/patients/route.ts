export const dynamic = "force-dynamic"

/**
 * NOTYA-PABAU-01 — the clinic's Pabau patients (clients), proxied.
 * Documented endpoint: GET https://api.oauth.pabau.com/{api_key}/clients[?search=]
 */
import { NextRequest, NextResponse } from "next/server"
import { doktorOturum } from "@/lib/doktor/serverAuth"
import { decrypt } from "@/lib/pabau/crypto"
import { pabauGet } from "@/lib/pabau/client"

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ("hata" in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: conn } = await supabase
    .from("pabau_connections")
    .select("api_key_encrypted, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()
  if (!conn) return NextResponse.json({ success: false, error: "Pabau bağlantısı bulunamadı." }, { status: 404 })

  const apiKey = decrypt(conn.api_key_encrypted, process.env.PABAU_TOKEN_SECRET || "dev-token-secret")
  const search = new URL(req.url).searchParams.get("search") || ""
  const r = await pabauGet(apiKey, `clients${search ? `?search=${encodeURIComponent(search)}` : ""}`)
  if (!r.ok) return NextResponse.json({ success: false, error: "Pabau hasta verisi alınamadı." }, { status: 502 })

  await supabase.from("pabau_connections").update({ last_synced_at: new Date().toISOString() }).eq("user_id", user.id)
  return NextResponse.json({ success: true, data: r.data })
}
