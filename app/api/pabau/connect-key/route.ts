export const dynamic = "force-dynamic"

/**
 * NOTYA-PABAU-01 — connect a clinic's Pabau account with its API key.
 *
 * Replaces the old /api/pabau/connect + /callback pair, which implemented an OAuth
 * authorization-code dance against endpoints Pabau does not document. The documented model is an
 * API key (Pabau → Setup → Developer Hub; marketplace installs get it passed to the app's
 * configuration page). POST validates the key with a live call before storing anything, so a
 * clinic can never end up "connected" with a dead key. The key is AES-256-GCM encrypted at rest;
 * only its last 4 characters are stored in the clear, for display.
 *
 * GET  -> connection status  { connected, keyHint, lastSyncedAt }
 * POST { apiKey } -> validate + store
 * DELETE -> disconnect (is_active = false, key overwritten)
 */
import { NextRequest, NextResponse } from "next/server"
import { doktorOturum } from "@/lib/doktor/serverAuth"
import { encrypt } from "@/lib/pabau/crypto"
import { validatePabauKey, maskKey } from "@/lib/pabau/client"

const secret = () => process.env.PABAU_TOKEN_SECRET || "dev-token-secret"

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ("hata" in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: conn } = await supabase
    .from("pabau_connections")
    .select("key_hint, last_synced_at, is_active")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    data: {
      connected: !!conn?.is_active,
      keyHint: conn?.is_active ? conn.key_hint : null,
      lastSyncedAt: conn?.is_active ? conn.last_synced_at : null,
    },
  })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ("hata" in oturum) return oturum.hata
  const { user, supabase } = oturum

  const body = await req.json().catch(() => ({}))
  const apiKey = String(body.apiKey || "").trim()
  if (apiKey.length < 8) {
    return NextResponse.json({ success: false, error: "Geçerli bir Pabau API anahtarı girin." }, { status: 400 })
  }

  const check = await validatePabauKey(apiKey)
  if (!check.valid) {
    return NextResponse.json({ success: false, error: check.error }, { status: 422 })
  }

  const { error } = await supabase.from("pabau_connections").upsert(
    {
      user_id: user.id,
      api_key_encrypted: encrypt(apiKey, secret()),
      key_hint: maskKey(apiKey),
      last_synced_at: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) {
    return NextResponse.json({ success: false, error: "Bağlantı kaydedilemedi." }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { connected: true, keyHint: maskKey(apiKey) } })
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ("hata" in oturum) return oturum.hata
  const { user, supabase } = oturum

  // Overwrite the stored key rather than merely flagging it inactive — a disconnect should
  // leave nothing decryptable behind.
  await supabase
    .from("pabau_connections")
    .update({
      is_active: false,
      api_key_encrypted: encrypt("revoked", secret()),
      key_hint: "",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  return NextResponse.json({ success: true, data: { connected: false } })
}
