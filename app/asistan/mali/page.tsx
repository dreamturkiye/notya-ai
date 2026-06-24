"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
type CS = "idle"|"connecting"|"listening"|"speaking"|"error"
type AC = Awaited<ReturnType<typeof Conversation.startSession>>

export default function MaliAsistanPage() {
  const router = useRouter()
  const [status, setStatus] = useState<CS>("idle")
  const [err, setErr] = useState("")
  const ref = useRef<AC|null>(null)

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/giriş/mali")
    })
  }, [router])

  async function start() {
    try {
      setStatus("connecting"); setErr("")
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.push("/giriş/mali"); return }
      const r = await fetch("/api/asistan/mali-signed-url", { headers: { Authorization: "Bearer " + session.access_token } })
      if (!r.ok) throw new Error("Bağlantı hatası")
      const { signed_url } = await r.json()
      const conv = await Conversation.startSession({
        signedUrl: signed_url,
        connectionType: "websocket",
        onStatusChange: ({ status: s }: { status: string }) => {
          if (s === "connected") setStatus("listening")
          else if (s === "disconnected") { setStatus("idle"); ref.current = null }
        },
        onError: (e: unknown) => { setErr(String(e)); setStatus("error") },
      })
      ref.current = conv
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Hata"); setStatus("error") }
  }

  async function stop() {
    await ref.current?.endSession()
    ref.current = null; setStatus("idle")
  }

  const active = status === "listening" || status === "speaking" || status === "connecting"
  const label = status==="connecting"?"Bağlanılıyor...":status==="listening"?"Dinliyorum...":status==="speaking"?"Konuşuyor...":status==="error"?err:"Başlamak için dokun"

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"24px"}}>
      <div style={{background:"#111827",borderRadius:"20px",padding:"40px",maxWidth:"480px",width:"100%",border:"1px solid rgba(16,185,129,0.2)",textAlign:"center"}}>
        <img src="/derya-avatar.jpg" style={{width:120,height:120,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(16,185,129,0.5)",marginBottom:"12px"}} />
        <h1 style={{fontSize:"22px",fontWeight:700,color:"#fff",marginBottom:"4px"}}>Uzm. Derya Yılmaz</h1>
        <p style={{fontSize:"13px",color:"#64748b",marginBottom:"32px"}}>Mali Müşavirlik AI Asistani</p>
        <div style={{width:"120px",height:"120px",borderRadius:"50%",background:active?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.05)",border:active?"2px solid #10B981":"2px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 32px"}}>
          <div style={{fontSize:"40px"}}>{active?"🎙️":"🎙️"}</div>
        </div>
        <p style={{fontSize:"14px",color:active?"#10B981":"#64748b",marginBottom:"24px",minHeight:"20px"}}>{label}</p>
        {!active ? (
          <button onClick={start} style={{padding:"14px 32px",background:"#10B981",border:"none",borderRadius:"12px",color:"#fff",fontSize:"15px",fontWeight:600,cursor:"pointer",width:"100%"}}>Derya Yılmaz ile Konuş</button>
        ) : (
          <button onClick={stop} style={{padding:"14px 32px",background:"rgba(220,38,38,0.15)",border:"1px solid rgba(220,38,38,0.4)",borderRadius:"12px",color:"#fca5a5",fontSize:"15px",fontWeight:600,cursor:"pointer",width:"100%"}}>Görüşmeyi Bitir</button>
        )}
        <button onClick={()=>router.push("/dashboard/mali")} style={{marginTop:"12px",padding:"10px",background:"transparent",border:"none",color:"#64748b",fontSize:"13px",cursor:"pointer",width:"100%"}}>Dashboard</button>
      </div>
    </div>
  )
}