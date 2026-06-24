import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type TxnRow = {
  id: string
  tarih: string
  tutar: number
  belge_turu: string
  islem_turu: string
  aciklama: string
  mutabakat_durumu: string
  belge_id: string
}

// Group transactions by date and type for reconciliation
function groupByDate(txns: TxnRow[]): Record<string, TxnRow[]> {
  return txns.reduce((acc, t) => {
    const key = t.tarih || "tarihsiz"
    acc[key] = acc[key] || []
    acc[key].push(t)
    return acc
  }, {} as Record<string, TxnRow[]>)
}

// Compare Z raporu daily total vs banka/POS
function reconcileDay(
  date: string,
  zTxns: TxnRow[],
  bankaTxns: TxnRow[]
): { date:string; zTotal:number; bankaTotal:number; fark:number; durum:string; notlar:string[] } {
  const zTotal    = zTxns.reduce((a,t) => a + Number(t.tutar), 0)
  const bankaTotal= bankaTxns.reduce((a,t) => a + Number(t.tutar), 0)
  const fark      = Math.abs(zTotal - bankaTotal)
  const tolerance = 0.50 // 50 kurus tolerans

  let durum  = "eslesme"
  const notlar: string[] = []

  if (zTxns.length === 0 && bankaTxns.length > 0) {
    durum = "z_eksik"
    notlar.push(`Bu gun icin Z raporu yok, banka hareketi: ${bankaTotal.toFixed(2)} TL`)
  } else if (zTxns.length > 0 && bankaTxns.length === 0) {
    durum = "banka_eksik"
    notlar.push(`Z raporu mevcut (${zTotal.toFixed(2)} TL), banka hareketi yok`)
  } else if (fark > tolerance) {
    durum = "uyumsuzluk"
    notlar.push(`Z: ${zTotal.toFixed(2)} TL | Banka: ${bankaTotal.toFixed(2)} TL | Fark: ${fark.toFixed(2)} TL`)
    if (fark < 100)  notlar.push("Kucuk fark - kasa farki olabilir")
    if (fark > 1000) notlar.push("DIKKAT: Buyuk fark - iade veya iptal kontrolu yapilsin")
  }

  return { date, zTotal, bankaTotal, fark, durum, notlar }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization")?.replace("Bearer ","")
    if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 })
    const sb = getSB()
    const { data:{ user } } = await sb.auth.getUser(auth)
    if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 })

    const { donem, musteriId } = await req.json()
    if (!donem) return NextResponse.json({ error:"donem gerekli" }, { status:400 })

    // Fetch all transactions for the period
    let q = sb.from("normalized_transactions")
      .select("*")
      .eq("musavir_id", user.id)
      .eq("donem", donem)
    if (musteriId) q = (q as any).eq("musteri_id", musteriId)
    const { data: allTxns } = await q
    if (!allTxns?.length) return NextResponse.json({ eslesme:[], ozet:{ total:0, uyumsuz:0 } })

    const zTxns    = allTxns.filter(t => t.belge_turu === "z_raporu")
    const bankaTxns= allTxns.filter(t => t.belge_turu === "banka")
    const digerTxns= allTxns.filter(t => !(["z_raporu","banka"]).includes(t.belge_turu))

    const zByDate    = groupByDate(zTxns)
    const bankaByDate= groupByDate(bankaTxns)
    const allDates   = [...new Set([...Object.keys(zByDate), ...Object.keys(bankaByDate)])].sort()

    const eslesme = allDates.map(date =>
      reconcileDay(date, zByDate[date]||[], bankaByDate[date]||[])
    )

    const uyumsuz   = eslesme.filter(e => e.durum !== "eslesme")
    const toplamSatis = zTxns.reduce((a,t) => a + Number(t.tutar), 0)
    const toplamGider = digerTxns.filter(t => t.islem_turu === "gider").reduce((a,t) => a + Number(t.tutar), 0)
    const toplamKDV   = allTxns.reduce((a,t) => a + Number(t.kdv_tutari||0), 0)

    // Update mutabakat_durumu in DB
    for (const e of eslesme) {
      const ids = [
        ...(zByDate[e.date]||[]).map(t => t.id),
        ...(bankaByDate[e.date]||[]).map(t => t.id)
      ]
      if (ids.length > 0) {
        await sb.from("normalized_transactions")
          .update({ mutabakat_durumu: e.durum })
          .in("id", ids)
      }
    }

    return NextResponse.json({
      success: true,
      donem,
      eslesme,
      ozet: {
        toplamSatis:   toplamSatis,
        toplamGider:   toplamGider,
        toplamKDV:     toplamKDV,
        netKar:        toplamSatis - toplamGider,
        uyumsuzGun:    uyumsuz.length,
        uyumsuzBelge:  uyumsuz,
        tavsiye:       uyumsuz.length === 0
          ? "Tum gunler eslesti. KDV beyanname hazirlayabilirsiniz."
          : `${uyumsuz.length} gunde uyumsuzluk var. Beyan oncesi kontrol edin.`
      }
    })
  } catch(e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status:500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization")?.replace("Bearer ","")
  if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 })
  const { searchParams } = new URL(req.url)
  const donem = searchParams.get("donem")
  if (!donem) return NextResponse.json({ error:"donem gerekli" }, { status:400 })
  return POST(new NextRequest(req.url, { method:"POST", headers:req.headers, body:JSON.stringify({ donem }) }))
}
