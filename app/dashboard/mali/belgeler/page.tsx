"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import MaliNav from "@/components/mali/MaliNav"

type Belge = { id:string; dosya_adi:string; belge_turu:string; isletme_tipi:string; donem:string; ozet:string; guven_skor:number; inceleme_bekliyor:boolean; toplam_tutar:number|null; kdv_tutari:number|null; islem_turu:string; tarih:string|null; analiz_json:Record<string,unknown>; created_at:string }

const RENK: Record<string,string> = { z_raporu:"#1B4332", efatura:"#1e3a5f", kagit_fatura:"#7C2D12", banka:"#0F766E", puantaj:"#6D28D9", kira:"#D97706", diger_belge:"#64748B" }
const LABEL: Record<string,string> = { z_raporu:"Z Raporu", efatura:"e-Fatura", kagit_fatura:"Kagit Fatura", banka:"Banka", puantaj:"Puantaj", kira:"Kira", diger_belge:"Diger" }

export default function BelgelerPage() {
  const router = useRouter()
  const [belgeler, set] = useState<Belge[]>([])
  const [loading, setL] = useState(true)
  const [token, setTok] = useState("")
  const [donem, setD]   = useState(new Date().toISOString().slice(0,7))
  const [filtre, setF]  = useState("hepsi")
  const [acik, setAcik] = useState<string|null>(null)

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { router.push("/giris/mali"); return }
      setTok(session.access_token); load(session.access_token, donem, filtre)
    })
  }, [])

  async function load(tok:string, d:string, f:string) {
    setL(true)
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data:{ user } } = await sb.auth.getUser(tok)
    if (!user) return
    let q: any = sb.from("mali_belgeler").select("*").eq("musavir_id", user.id).eq("donem", d).order("created_at", { ascending:false })
    if (f === "inceleme") q = q.eq("inceleme_bekliyor", true)
    else if (f !== "hepsi") q = q.eq("belge_turu", f)
    const { data } = await q
    set(data || []); setL(false)
  }

  const gelir  = belgeler.filter(b=>b.islem_turu==="satis").reduce((a,b)=>a+(b.toplam_tutar||0),0)
  const gider  = belgeler.filter(b=>b.islem_turu==="gider").reduce((a,b)=>a+(b.toplam_tutar||0),0)
  const review = belgeler.filter(b=>b.inceleme_bekliyor).length

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"system-ui,sans-serif",overflowX:"hidden",width:"100%"}}>
      <MaliNav />
      <div style={{maxWidth:960,margin:"0 auto",padding:"16px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#0A1628",margin:0}}>Belge Arsivi</h1>
            <p style={{fontSize:13,color:"#64748B",margin:"4px 0 0"}}>Derya tarafindan islenen belgeler</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input type="month" value={donem} onChange={e=>{setD(e.target.value);load(token,e.target.value,filtre)}} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:13}} />
            <button onClick={()=>router.push("/dashboard/mali/ingestion")} style={{background:"#DC2626",border:"none",color:"white",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>+ Belge Yukle</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[{l:"Toplam Gelir",v:gelir.toLocaleString("tr-TR")+" TL",c:"#16A34A"},{l:"Toplam Gider",v:gider.toLocaleString("tr-TR")+" TL",c:"#DC2626"},{l:"İnceleme Bekliyor",v:String(review)+" belge",c:"#D97706"}].map(s=>(
            <div key={s.l} style={{background:"white",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
              <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {["hepsi","inceleme","z_raporu","efatura","kagit_fatura","banka","puantaj","kira"].map(f=>(
            <button key={f} onClick={()=>{setF(f);load(token,donem,f)}} style={{background:filtre===f?"#0A1628":"white",color:filtre===f?"white":"#374151",border:"1px solid "+(filtre===f?"#0A1628":"#E2E8F0"),padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:filtre===f?700:400}}>
              {f==="hepsi"?"Hepsi":f==="inceleme"?("Inceleme ("+review+")"):(LABEL[f]||f)}
            </button>
          ))}
        </div>
        {loading ? <div style={{textAlign:"center",padding:40,color:"#64748B"}}>Yukleniyor...</div>
         : belgeler.length===0 ? (
          <div style={{background:"white",borderRadius:12,padding:"40px 20px",textAlign:"center"}}>
            <div style={{fontSize:16,color:"#64748B",marginBottom:12}}>Bu donem belge bulunamadi</div>
            <button onClick={()=>router.push("/dashboard/mali/ingestion")} style={{background:"#10B981",border:"none",color:"white",padding:"10px 24px",borderRadius:8,cursor:"pointer",fontWeight:600}}>Belge Yukle</button>
          </div>
         ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {belgeler.map(b=>{
              const open = acik===b.id
              const bc = RENK[b.belge_turu]||"#64748B"
              return (
                <div key={b.id} style={{background:"white",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",borderLeft:"4px solid "+bc}}>
                  <div onClick={()=>setAcik(open?null:b.id)} style={{padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                        <span style={{fontWeight:600,fontSize:13,color:"#1E293B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{b.dosya_adi}</span>
                        <span style={{background:bc+"22",color:bc,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700,flexShrink:0}}>{LABEL[b.belge_turu]||b.belge_turu}</span>
                        {b.inceleme_bekliyor && <span style={{background:"#FEF3C7",color:"#D97706",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700,flexShrink:0}}>INCELEME</span>}
                      </div>
                      <div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.ozet?b.ozet.substring(0,80):"Analiz bekleniyor..."}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {b.toplam_tutar!=null&&<div style={{fontWeight:700,fontSize:14,color:"#1E293B"}}>{b.toplam_tutar.toLocaleString("tr-TR")} TL</div>}
                      <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{open?"Kapat":"Detay"}</div>
                    </div>
                  </div>
                  {open&&(
                    <div style={{padding:"0 16px 16px",borderTop:"1px solid #F1F5F9"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                        {([["Islem Turu",b.islem_turu||"-"],["Tarih",b.tarih||"-"],["KDV",b.kdv_tutari!=null?b.kdv_tutari.toLocaleString("tr-TR")+" TL":"-"],["Guven",b.guven_skor+"%"],["Isletme",b.isletme_tipi||"-"],["Donem",b.donem]] as [string,string][]).map(([k,v])=>(
                          <div key={k} style={{background:"#F8FAFC",borderRadius:7,padding:"7px 10px"}}>
                            <div style={{fontSize:10,color:"#94A3B8"}}>{k}</div>
                            <div style={{fontSize:12,fontWeight:600,color:"#1E293B",marginTop:2}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {b.analiz_json?.ozet&&<div style={{marginTop:10,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,fontSize:12,color:"#065F46",borderLeft:"3px solid #10B981"}}><strong>Derya:</strong> {String(b.analiz_json.ozet)}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
         )}
      </div>
    </div>
  )
}
