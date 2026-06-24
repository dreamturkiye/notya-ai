"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import MaliNav from "@/components/mali/MaliNav"
import { createClient } from "@supabase/supabase-js"

type EslesmeRow = { date:string; zTotal:number; bankaTotal:number; fark:number; durum:string; notlar:string[] }
type Ozet = { toplamSatis:number; toplamGider:number; toplamKDV:number; netKar:number; uyumsuzGun:number; tavsiye:string; uyumsuzBelge:EslesmeRow[] }

export default function MutabakatPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [donem, setDonem] = useState(new Date().toISOString().slice(0,7))
  const [data,  setData]  = useState<{eslesme:EslesmeRow[];ozet:Ozet}|null>(null)
  const [loading, setLoad]= useState(false)

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data:{ session } }) => {
      if (!session) { router.push("/giris/mali"); return }
      setToken(session.access_token)
    })
  }, [])

  async function calistir() {
    setLoad(true)
    try {
      const res = await fetch("/api/mali/mutabakat", {
        method:"POST",
        headers:{ "Authorization":"Bearer "+token, "Content-Type":"application/json" },
        body: JSON.stringify({ donem })
      })
      const d = await res.json()
      setData(d)
    } catch(e) { alert(String(e)) }
    setLoad(false)
  }

  const dur_renk = (d:string) => d==="eslesme"?"#16A34A" : d==="uyumsuzluk"?"#DC2626" : "#D97706"
  const dur_label = (d:string) => d==="eslesme"?"Eslesti" : d==="uyumsuzluk"?"Uyumsuz" : d==="z_eksik"?"Z Eksik" : "Banka Eksik"

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"system-ui,sans-serif",overflowX:"hidden"}}>
      <MaliNav />
      <div style={{maxWidth:960,margin:"0 auto",padding:"16px 12px"}}>
        <h1 style={{fontSize:20,fontWeight:700,color:"#0A1628",margin:"0 0 4px"}}>Mutabakat</h1>
        <p style={{fontSize:13,color:"#64748B",margin:"0 0 20px"}}>Z Raporu x Banka / POS eslestirmesi</p>

        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
          <input type="month" value={donem} onChange={e=>setDonem(e.target.value)}
            style={{padding:"8px 12px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:13}} />
          <button onClick={calistir} disabled={!token||loading}
            style={{background:"#2563EB",border:"none",color:"white",padding:"9px 20px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14,opacity:loading?0.6:1}}>
            {loading ? "Hesaplaniyor..." : "Mutabakat Calistir"}
          </button>
        </div>

        {data && (
          <>
            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
              {[
                { l:"Toplam Satis",   v:data.ozet.toplamSatis?.toLocaleString("tr-TR")+" TL",   c:"#16A34A" },
                { l:"Toplam Gider",   v:data.ozet.toplamGider?.toLocaleString("tr-TR")+" TL",  c:"#DC2626" },
                { l:"Toplam KDV",     v:data.ozet.toplamKDV?.toLocaleString("tr-TR")+" TL",    c:"#6366F1" },
                { l:"Uyumsuz Gun",    v:String(data.ozet.uyumsuzGun)+" gun",                   c:data.ozet.uyumsuzGun>0?"#DC2626":"#16A34A" },
              ].map(s=>(
                <div key={s.l} style={{background:"white",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
                  <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"#64748B",marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* AI tavsiye */}
            <div style={{background:data.ozet.uyumsuzGun===0?"#F0FDF4":"#FEF3C7",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:data.ozet.uyumsuzGun===0?"#065F46":"#D97706",borderLeft:`3px solid ${data.ozet.uyumsuzGun===0?"#10B981":"#D97706"}`}}>
              <strong>Derya:</strong> {data.ozet.tavsiye}
            </div>

            {/* Day-by-day table */}
            <h2 style={{fontSize:15,fontWeight:600,color:"#1E293B",marginBottom:10}}>Gun Bazli Eslesme</h2>
            <div style={{background:"white",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
              {data.eslesme.map((e,i) => (
                <div key={e.date} style={{padding:"11px 16px",borderBottom:i<data.eslesme.length-1?"1px solid #F1F5F9":"none",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                      <span style={{fontWeight:600,fontSize:13}}>{e.date}</span>
                      <span style={{background:dur_renk(e.durum)+"22",color:dur_renk(e.durum),padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:700}}>
                        {dur_label(e.durum)}
                      </span>
                    </div>
                    {e.notlar.map((n,j)=><div key={j} style={{fontSize:11,color:"#94A3B8"}}>{n}</div>)}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:12,color:"#64748B"}}>Z: {e.zTotal.toLocaleString("tr-TR")} TL</div>
                    <div style={{fontSize:12,color:"#64748B"}}>Banka: {e.bankaTotal.toLocaleString("tr-TR")} TL</div>
                    {e.fark > 0 && <div style={{fontSize:12,fontWeight:700,color:dur_renk(e.durum)}}>Fark: {e.fark.toFixed(2)} TL</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!data && !loading && token && (
          <div style={{background:"white",borderRadius:12,padding:"40px 20px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            <div style={{fontSize:14,color:"#64748B",marginBottom:8}}>Donemi secin ve mutabakat calistirin</div>
            <div style={{fontSize:12,color:"#94A3B8"}}>Z raporlari ile banka hareketleri karsilastirilacak</div>
          </div>
        )}
      </div>
    </div>
  )
}
