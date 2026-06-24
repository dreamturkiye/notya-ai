import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const sb = getSB()
    const { data: { user } } = await sb.auth.getUser(auth)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const donem = req.nextUrl.searchParams.get("donem") || new Date().toISOString().slice(0,7)
    const musteriId = req.nextUrl.searchParams.get("musteriId")

    let q = sb.from("normalized_transactions").select("*")
      .eq("musavir_id", user.id)
      .eq("donem", donem)

    if (musteriId) q = (q as any).eq("musteri_id", musteriId)
    const { data: txns } = await q

    if (!txns?.length) return NextResponse.json({
      donem, satisToplami: 0, giderToplami: 0, kdvTahsilat: 0, kdvIndirilen: 0,
      netKdv: 0, toplamIslem: 0, incelemeGereken: 0, tavsiye: "Bu donem icin islem bulunamadi."
    })

    const satisTxns  = txns.filter(t => t.islem_turu === "satis")
    const giderTxns  = txns.filter(t => t.islem_turu === "gider")
    const bordroTxns = txns.filter(t => t.islem_turu === "bordro")
    const kiraTxns   = txns.filter(t => t.islem_turu === "kira")

    const sum = (arr: typeof txns, field: string) => arr.reduce((a, t) => a + Number((t as Record<string,unknown>)[field] || 0), 0)

    const satisToplami  = sum(satisTxns, "tutar")
    const giderToplami  = sum(giderTxns, "tutar") + sum(kiraTxns, "tutar")
    const bordroToplami = sum(bordroTxns, "tutar")
    const kdvTahsilat   = sum(satisTxns, "kdv_tutari")
    const kdvIndirilen  = sum(giderTxns, "kdv_tutari") + sum(kiraTxns, "kdv_tutari")
    const netKdv        = Math.round((kdvTahsilat - kdvIndirilen) * 100) / 100
    const stopajToplami = sum(kiraTxns, "tutar") * 0.20

    const bekleyenOnayi = txns.filter(t => t.mutabakat_durumu === "bekliyor" || !t.onaylandi).length

    const uyarilar: string[] = []
    if (netKdv > 0)        uyarilar.push("KDV1 Beyanname: " + netKdv.toLocaleString("tr-TR") + " TL odeme cikacak")
    if (stopajToplami > 0) uyarilar.push("Stopaj: " + stopajToplami.toLocaleString("tr-TR") + " TL (kira muhtasari)")
    if (bekleyenOnayi > 0) uyarilar.push(bekleyenOnayi + " belge henuz onaylanmadi - beyan oncesi kontrol edin")

    // Breakdown by belge_turu
    const belgeTuruOzet: Record<string, { sayi: number; tutar: number }> = {}
    txns.forEach(t => {
      const tur = t.belge_turu || "diger"
      if (!belgeTuruOzet[tur]) belgeTuruOzet[tur] = { sayi: 0, tutar: 0 }
      belgeTuruOzet[tur].sayi++
      belgeTuruOzet[tur].tutar += Number(t.tutar || 0)
    })

    return NextResponse.json({
      success: true,
      donem,
      satisToplami:   Math.round(satisToplami  * 100) / 100,
      giderToplami:   Math.round(giderToplami  * 100) / 100,
      bordroToplami:  Math.round(bordroToplami * 100) / 100,
      kdvTahsilat:    Math.round(kdvTahsilat   * 100) / 100,
      kdvIndirilen:   Math.round(kdvIndirilen  * 100) / 100,
      netKdv,
      stopajToplami:  Math.round(stopajToplami * 100) / 100,
      toplamIslem:    txns.length,
      incelemeGereken: bekleyenOnayi,
      belgeTuruOzet,
      uyarilar,
      tavsiye: uyarilar.length === 0
        ? "Tum belgeler onaylandi. Beyan hazirlanabilir."
        : "Belirtilen konular giderilince beyan hazirlanabilir."
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 })
  }
}
