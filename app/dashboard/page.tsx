
"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type Note = {
  id: string
  session_id: string
  content_subjektif: string
  content_objektif: string
  content_degerlendirme: string
  content_plan: string
  content_ilaclar: unknown[]
  kritik_bulgular: string[]
  takip_suresi: string
  approved_at: string
  created_at: string
  ai_confidence: number
  sessions: { specialty: string; session_type: string; duration_seconds: number }
}

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [activeNote, setActiveNote] = useState<Note | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/giris"); return }
      setUser({ email: user.email! })
      loadNotes(user.id)
    })
  }, [])

  async function loadNotes(userId: string) {
    const { data } = await supabase
      .from("notes")
      .select("*, sessions(specialty, session_type, duration_seconds)")
      .eq("doctor_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
    setNotes((data || []) as Note[])
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/giris")
  }

  const SPECIALTY_EMOJI: Record<string, string> = {
    pediatri:"🧒", kardiyoloji:"❤️", noroloji:"🧠", psikiyatri:"💭",
    dahiliye:"🩺", ortopedi:"🦴", kadin_hastaliklari:"👶", genel_cerrahi:"🔪",
    dermatoloji:"🌿", uroloji:"💊", onkoloji:"🎗️", acil:"🚨", genel:"👨‍⚕️"
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("tr-TR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })
  }

  function formatDuration(secs?: number) {
    if (!secs) return ""
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${String(s).padStart(2,"0")}`
  }

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"#0A1628",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0"}}>
          <div style={{fontSize:"20px",fontWeight:"600",color:"#fff"}}>
            <span style={{color:"#2563EB"}}>Notya</span> AI
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <button
              onClick={()=>router.push("/session/new")}
              style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 20px",fontSize:"14px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
              🎙️ Yeni Seans
            </button>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.6)",cursor:"pointer"}} onClick={signOut}>
              {user?.email} · Çıkış
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px 20px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px"}}>
          {[
            {label:"Toplam Not",value:notes.length,icon:"📋"},
            {label:"Onaylı",value:notes.filter(n=>n.approved_at).length,icon:"✅"},
            {label:"Kritik Bulgular",value:notes.filter(n=>n.kritik_bulgular?.length>0).length,icon:"⚠️"},
          ].map(stat => (
            <div key={stat.label} style={{background:"#fff",borderRadius:"16px",padding:"20px",border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:"24px",marginBottom:"4px"}}>{stat.icon}</div>
              <div style={{fontSize:"28px",fontWeight:"600",color:"#0A1628"}}>{stat.value}</div>
              <div style={{fontSize:"13px",color:"#64748B"}}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:activeNote?"1fr 1fr":"1fr",gap:"20px"}}>
          {/* Notes list */}
          <div>
            <div style={{fontSize:"16px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"}}>Son Notlar</div>
            {loading && <div style={{color:"#64748B",padding:"40px",textAlign:"center"}}>Yükleniyor...</div>}
            {!loading && notes.length === 0 && (
              <div style={{background:"#fff",borderRadius:"16px",border:"1px solid #E2E8F0",padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🎙️</div>
                <div style={{fontSize:"16px",fontWeight:"500",color:"#0A1628",marginBottom:"8px"}}>Henüz seans yok</div>
                <div style={{fontSize:"14px",color:"#64748B",marginBottom:"20px"}}>İlk seansınızı başlatın ve Notya AI notunuzu oluştursun</div>
                <button
                  onClick={()=>router.push("/session/new")}
                  style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",padding:"12px 24px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
                  Yeni Seans Başlat
                </button>
              </div>
            )}
            {notes.map(note => (
              <div
                key={note.id}
                onClick={()=>setActiveNote(activeNote?.id===note.id ? null : note)}
                style={{background:"#fff",borderRadius:"14px",border:`1.5px solid ${activeNote?.id===note.id?"#2563EB":"#E2E8F0"}`,padding:"16px",marginBottom:"10px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>
                    {SPECIALTY_EMOJI[note.sessions?.specialty||"genel"]||"🩺"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                      <div style={{fontSize:"14px",fontWeight:"500",color:"#0A1628",textTransform:"capitalize"}}>
                        {note.sessions?.specialty?.replace("_"," ")||"Muayene"}
                      </div>
                      <div style={{fontSize:"11px",color:"#94A3B8"}}>{formatTime(note.created_at)}</div>
                    </div>
                    {note.content_degerlendirme && (
                      <div style={{fontSize:"12px",color:"#64748B",lineHeight:"1.5",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                        {note.content_degerlendirme}
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"8px"}}>
                      {note.approved_at
                        ? <span style={{fontSize:"11px",background:"#EAF3DE",color:"#3B6D11",padding:"3px 8px",borderRadius:"20px",fontWeight:"500"}}>✅ Onaylı</span>
                        : <span style={{fontSize:"11px",background:"#FEF3CD",color:"#92400E",padding:"3px 8px",borderRadius:"20px",fontWeight:"500"}}>⏳ Bekliyor</span>
                      }
                      {note.kritik_bulgular?.length > 0 && (
                        <span style={{fontSize:"11px",background:"#FCEBEB",color:"#A32D2D",padding:"3px 8px",borderRadius:"20px",fontWeight:"500"}}>⚠️ Kritik</span>
                      )}
                      {note.sessions?.duration_seconds && (
                        <span style={{fontSize:"11px",color:"#94A3B8"}}>🎙️ {formatDuration(note.sessions.duration_seconds)}</span>
                      )}
                      {note.ai_confidence && (
                        <span style={{fontSize:"11px",color:"#94A3B8"}}>AI {Math.round(note.ai_confidence*100)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note detail panel */}
          {activeNote && (
            <div style={{background:"#fff",borderRadius:"16px",border:"1px solid #E2E8F0",padding:"24px",position:"sticky",top:"80px",maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
                <div style={{fontSize:"16px",fontWeight:"600",color:"#0A1628"}}>Not Detayı</div>
                <div style={{cursor:"pointer",fontSize:"20px",color:"#94A3B8"}} onClick={()=>setActiveNote(null)}>✕</div>
              </div>
              {[
                {label:"S — Subjektif",value:activeNote.content_subjektif,color:"#3B82F6"},
                {label:"O — Objektif",value:activeNote.content_objektif,color:"#059669"},
                {label:"A — Değerlendirme",value:activeNote.content_degerlendirme,color:"#D97706"},
                {label:"P — Plan",value:activeNote.content_plan,color:"#7C3AED"},
              ].filter(s=>s.value).map(section => (
                <div key={section.label} style={{marginBottom:"16px"}}>
                  <div style={{fontSize:"11px",fontWeight:"600",color:section.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"6px"}}>{section.label}</div>
                  <div style={{fontSize:"13px",color:"#374151",lineHeight:"1.6",background:"#F8FAFC",borderRadius:"8px",padding:"10px 12px"}}>{section.value}</div>
                </div>
              ))}
              {activeNote.kritik_bulgular?.length > 0 && (
                <div style={{background:"#FCEBEB",border:"1px solid #F09595",borderRadius:"10px",padding:"12px",marginBottom:"16px"}}>
                  <div style={{fontSize:"12px",fontWeight:"600",color:"#A32D2D",marginBottom:"6px"}}>⚠️ KRİTİK BULGULAR</div>
                  {activeNote.kritik_bulgular.map((b,i) => (
                    <div key={i} style={{fontSize:"12px",color:"#991B1B",marginBottom:"3px"}}>• {b}</div>
                  ))}
                </div>
              )}
              {activeNote.takip_suresi && (
                <div style={{fontSize:"13px",color:"#374151",background:"#EFF6FF",borderRadius:"8px",padding:"10px 12px"}}>
                  📅 <strong>Takip:</strong> {activeNote.takip_suresi}
                </div>
              )}
              {!activeNote.approved_at && (
                <button
                  onClick={async()=>{
                    const supabase2 = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
                    await supabase2.from("notes").update({approved_at:new Date().toISOString()}).eq("id",activeNote.id)
                    setActiveNote({...activeNote,approved_at:new Date().toISOString()})
                  }}
                  style={{width:"100%",marginTop:"16px",padding:"12px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
                  ✅ Notu Onayla
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
