import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { detectAndExtract } from "@/lib/ingestion/pipeline"

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function writeTransaction(
  sb: ReturnType<typeof createClient>,
  musavirId: string, musteriId: string | null, belgeId: string,
  analiz: Record<string, unknown>, belgeTuru: string, donem: string
) {
  if (!analiz.toplamTutar) return
  await sb.from("normalized_transactions").insert({
    musavir_id:      musavirId,
    musteri_id:      musteriId,
    belge_id:        belgeId,
    tarih:           analiz.tarih || null,
    donem,
    islem_turu:      String(analiz.islemTuru || "diger"),
    tutar:           analiz.toplamTutar,
    kdv_tutari:      analiz.kdvTutari || 0,
    kdv_orani:       analiz.kdvOrani  || 0,
    kdv_haric:       analiz.kdvHaricTutar || null,
    aciklama:        String(analiz.ozet || ""),
    kaynak:          String(analiz.kaynak || "upload"),
    belge_turu:      belgeTuru,
    firma_adi:       String(analiz.firmaAdi || ""),
    belge_no:        String(analiz.belgeNo  || ""),
    mutabakat_durumu: "bekliyor",
    onaylandi:        false
  })
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sb = getSB()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form        = await req.formData()
    const files       = form.getAll("files") as File[]
    const belgeTuru   = form.get("belgeTuru")   as string || ""
    const isletmeTipi = form.get("isletmeTipi") as string || ""
    const donem       = form.get("donem")       as string || new Date().toISOString().slice(0, 7)
    const notlar      = form.get("notlar")      as string || ""
    const musteriId   = form.get("musteriId")   as string | null
    const kanal       = form.get("kanal")       as string || "web"

    if (!files.length) return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 })

    const results = []

    for (const file of files.slice(0, 5)) {
      const bytes = await file.arrayBuffer()
      const b64   = Buffer.from(bytes).toString("base64")
      const mime  = file.type || "application/octet-stream"
      const fname = user.id + "/" + donem + "/" + Date.now() + "_" + file.name

      // Store file
      const { error: upErr } = await sb.storage.from("mali-belgeler").upload(fname, bytes, { contentType: mime })

      // Two-pass: detect type + extract data
      let detectedTuru = "diger_belge"
      let analiz: Record<string, unknown> = {}
      try {
        const result = await detectAndExtract(b64, mime, file.name, belgeTuru, isletmeTipi, donem, notlar)
        detectedTuru = result.detectedTuru
        analiz       = result.data
      } catch (e) {
        analiz = { ozet: "Analiz yapilamadi: " + String(e), guvenSkor: 0, uyarilar: [String(e)] }
      }

      const finalTuru = belgeTuru || detectedTuru

      // Save document record
      const { data: belge } = await sb.from("mali_belgeler").insert({
        musavir_id:        user.id,
        musteri_id:        musteriId,
        belge_turu:        finalTuru,
        auto_detected_turu: detectedTuru,
        isletme_tipi:      isletmeTipi,
        donem,
        dosya_adi:         file.name,
        storage_path:      upErr ? null : fname,
        notlar,
        kanal,
        analiz_json:       analiz,
        tarih:             analiz.tarih        || null,
        toplam_tutar:      analiz.toplamTutar  || null,
        kdv_tutari:        analiz.kdvTutari    || null,
        kdv_haric_tutar:   analiz.kdvHaricTutar|| null,
        kdv_orani:         analiz.kdvOrani     || null,
        firma_adi:         String(analiz.firmaAdi || ""),
        belge_no:          String(analiz.belgeNo  || ""),
        islem_turu:        String(analiz.islemTuru || "diger"),
        guven_skor:        Number(analiz.guvenSkor) || 0,
        ozet:              String(analiz.ozet || ""),
        inceleme_bekliyor: (Number(analiz.guvenSkor) || 0) < 70,
      }).select().single()

      // Write to normalized transactions
      if (belge?.id) {
        await writeTransaction(sb, user.id, musteriId, belge.id, analiz, finalTuru, donem)
      }

      results.push({ dosya: file.name, detectedTuru, finalTuru, analiz, id: belge?.id })
    }

    const dusuk = results.filter(r => (Number(r.analiz?.guvenSkor) || 0) < 70)
    const msg   = results.length + " belge islendi." + (dusuk.length ? " " + dusuk.length + " belge inceleme bekliyor." : " Tumu onaylandi.")

    return NextResponse.json({ success: true, message: msg, results, count: results.length })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 })
  }
}
