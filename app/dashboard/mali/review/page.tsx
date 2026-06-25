"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import MaliNav from "@/components/mali/MaliNav"

type Belge = {
  id:string; dosya_adi:string; belge_turu:string; ozet:string
  guven_skor:number; toplam_tutar:number|null; tarih:string|null
  analiz_json:Record<string,unknown>; islem_turu:string; donem:string
  firma_adi:string; belge_no:string; inceleme_bekliyor:boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const [items, setItems]   = useState<Belge[]>([])
  const [loading, setLoad]  = useState(true)
  const [token, setToken]   = useState("")
  const [userId, setUserId] = useState("")
  const [saving, setSaving] = useState<string|null>(null)
  const [edits, setEdits]   = useState<Record<string, Partial<Belge>>>({})

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { router.push("/giris/mali"); return }
      setToken(session.access_token)
      setUserId(session.user.id)
      const { data } = await sb.from("mali_belgeler")
        .select("*")
        .eq("musavir_id", session.user.id)
        .eq("inceleme_bekliyor", true)
        .order("created_at", { ascending:false })
        .limit(50)
      setItems(data || [])
      setLoad(false)
    })
  }, [])

  async function onayla(id: string) {
    setSaving(id)
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const patch = {
      inceleme_bekliyor: false,
      guven_skor: 100,
      derya_notu: "SMMM tarafindan onaylandi",
      ...(edits[id] || {})
    }
    await sb.from("mali_belgeler").update(patch).eq("id", id)
    if (edits[id]?.toplam_tutar != null) {
      await sb.from("normalized_transactions").update({
        tutar: edits[id].toplam_tutar,
        mutabakat_durumu: "onaylandi",
        onaylandi: true
      }).eq("belge_id", id)
    }
    setItems(prev => prev.filter(b => b.id !== id))
    setSaving(null)
  }

  async function reddet(id: string, sebep: string) {
    setSaving(id)
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from("mali_belgeler").update({
      derya_notu: "REDDEDILDI: " + sebep,
      islem_turu: "reddedildi"
    }).eq("id", id)
    setItems(prev => prev.filter(b => b.id !== id))
    setSaving(null)
  }

  function editField(id: string, field: string, val: unknown) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }))
  }

  const skor_renk = (s:number) => s >= 70 ? "#16A34A" : s >= 40 ? "#D97706" : "#DC2626"

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"system-ui,sans-serif",overflowX:"hidden"}}>
      <MaliNav />
      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 12px"}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:20,fontWeight:700,color:"#0A1628",margin:0}}>İnceleme Kuyruğu</h1>
          <p style={{fontSize:13,color:"#64748B",margin:"4px 0 0"}}>
            {loading ? "Yukleniyor..." : `${items.length} belge SMMM onayı bekliyor`}
          </p>
        </div>

        {!loading && items.length === 0 && (
          <div style={{background:"white",borderRadius:12,padding:"40px 20px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            <div style={{fontSize:32,marginBottom:12}}>?</div>
            <div style={{fontSize:16,fontWeight:600,color:"#16A34A",marginBottom:8}}>İnceleme bekleyen belge yok</div>
            <p style={{fontSize:13,color:"#94A3B8"}}>Tum belgeler onaylandi veya henuz belge yuklenmedi.</p>
            <button onClick={()=>router.push("/dashboard/mali/belgeler")}
              style={{background:"#2563EB",border:"none",color:"white",padding:"10px 24px",borderRadius:8,cursor:"pointer",fontWeight:600,marginTop:16}}>
              Belge Arsivine Git
            </button>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {items.map(b => {
            const edit = edits[b.id] || {}
            const isSaving = saving === b.id
            return (
              <div key={b.id} style={{background:"white",borderRadius:12,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,.08)",borderLeft:`4px solid ${skor_renk(b.guven_skor)}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  <div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#1E293B"}}>{b.dosya_adi}</span>
                      <span style={{background:skor_renk(b.guven_skor)+"22",color:skor_renk(b.guven_skor),padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:700}}>
                        Guven: {b.guven_skor}%
                      </span>
                      <span style={{background:"#F1F5F9",color:"#64748B",padding:"2px 8px",borderRadius:10,fontSize:11}}>
                        {b.belge_turu.replace("_"," ")}
                      </span>
                    </div>
                    <div style={{fontSize:12,color:"#64748B"}}>{b.ozet || "Ozet yok"}</div>
                  </div>
                </div>

                {/* Editable fields */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[
                    { label:"Toplam Tutar (TL)", field:"toplam_tutar", type:"number", val: edit.toplam_tutar ?? b.toplam_tutar },
                    { label:"Tarih",             field:"tarih",        type:"date",   val: edit.tarih ?? b.tarih },
                    { label:"Firma Adi",          field:"firma_adi",    type:"text",   val: (edit as any).firma_adi ?? b.firma_adi },
                    { label:"Islem Turu",         field:"islem_turu",   type:"text",   val: edit.islem_turu ?? b.islem_turu },
                  ].map(({ label, field, type, val }) => (
                    <div key={field}>
                      <div style={{fontSize:10,color:"#94A3B8",marginBottom:3}}>{label}</div>
                      <input
                        type={type}
                        value={String(val || "")}
                        onChange={e => editField(b.id, field, type==="number" ? parseFloat(e.target.value)||null : e.target.value)}
                        style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid #E2E8F0",fontSize:12,boxSizing:"border-box"}}
                      />
                    </div>
                  ))}
                </div>

                {/* Uyarilar */}
                {b.analiz_json?.uyarilar && Array.isArray(b.analiz_json.uyarilar) && (b.analiz_json.uyarilar as string[]).length > 0 && (
                  <div style={{marginBottom:12,padding:"8px 12px",background:"#FEF3C7",borderRadius:8,fontSize:12,color:"#D97706"}}>
                    {(b.analiz_json.uyarilar as string[]).map((u,i) => <div key={i}>• {u}</div>)}
                  </div>
                )}

                {/* Actions */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button
                    onClick={() => onayla(b.id)}
                    disabled={isSaving}
                    style={{background:"#16A34A",border:"none",color:"white",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,opacity:isSaving?0.6:1}}>
                    {isSaving ? "Kaydediliyor..." : "Onayla"}
                  </button>
                  <button
                    onClick={() => {
                      const s = prompt("Reddetme sebebi:")
                      if (s) reddet(b.id, s)
                    }}
                    disabled={isSaving}
                    style={{background:"white",border:"1px solid #DC2626",color:"#DC2626",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>
                    Reddet
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/mali/belgeler`)}
                    style={{background:"white",border:"1px solid #E2E8F0",color:"#64748B",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13}}>
                    Arşive Git
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
