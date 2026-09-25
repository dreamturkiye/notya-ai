
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ayseCevapla } from "@/lib/asistan/ayseCevapla"

// NOTYA-TEK-BEYIN: yazılı Ayşe — bütün boru hattı (hasta çözümü, dosya paketi, kimlik cevabı, branş kilitleri, doz /
// kaynak kilidi, eylem kartları, hafıza) lib/asistan/ayseCevapla.ts'te; sesli Ayşe (/api/asistan/ses-llm) aynı
// fonksiyonu çağırır. Bu rota yalnız kimliği doğrular ve yanıt sözleşmesini korur.

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz" }, { status: 401 })
    }
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ success: false, error: "Geçersiz token" }, { status: 401 })

    const body = await req.json()
    const {
      message,
      asistanSessionId,
      patientId,
      sessionId,
      specialty = "genel",
      personaId: requestedPersona,
    } = body

    const sonuc = await ayseCevapla({
      supabase,
      doktorId: user.id,
      oturumId: asistanSessionId,
      mesaj: message,
      kanal: "yazi",
      specialty,
      patientId,
      sessionId,
      personaId: requestedPersona,
    })
    if (!sonuc.ok) return NextResponse.json(sonuc.govde, { status: sonuc.durum })
    return NextResponse.json({ success: true, data: sonuc.cevap.veri })

  } catch (error) {
    console.error("[asistan/chat]", error)
    return NextResponse.json({ success: false, error: "Asistan yanıt veremedi" }, { status: 500 })
  }
}
