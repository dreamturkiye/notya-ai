
import HelpWidget from '@/components/HelpWidget'
"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { buildAssistantGreeting } from "@/lib/greetings"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"

type Note = {
  id: string
  content_subjektif: string
  content_degerlendirme: string
  content_plan: string
  kritik_bulgular: string[]
  takip_suresi: string
  approved_at: string
  created_at: string
  ai_confidence: number
  sessions: { specialty: string; duration_seconds: number }
}

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [greeting, setGreeting] = useState("")
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/giris"); return }
      setUser({ email: user.email! })

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (token) {
        const resp = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const profileData = await resp.json()
        const profType = profileData.data?.profession_type
        if (profType === 'mali_musavirlik') { router.replace('/dashboard/mali'); return }
        if (profType === 'avukat') { router.replace('/dashboard/avukat'); return }
        if (!profileData.data?.onboarding_completed && !profType) {
          router.push("/onboarding")
          return
        }
        const addressable = toAddressableUser(profileData.data as DoctorProfile)
        setGreeting(buildAssistantGreeting(addressable))
      }

      loadNotes(user.id)
    })
  }, [])

  async function loadNotes(userId: string) {
    const { data } = await supabase.from("notes").select("*, sessions(specialty, duration_seconds)")
      .eq("doctor_id", userId).order("created_at", { ascending: false }).limit(20)
    setNotes((data || []) as Note[])
    setLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); router.push("/giris") }

  const EMOJI: Record<string, string> = { pediatri:"🧒", kardiyoloji:"❤️", noroloji:"🧠", psikiyatri:"💭", dahiliye:"🩺", ortopedi:"🦴", kadin_hastaliklari:"👶", genel:"👨‍⚕️", acil:"🚨" }

  function fmt(iso: string) { return new Date(iso).toLocaleString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) }

  return (
    <>
      <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#0A1628",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",gap:"10px"}}>
          <div style={{fontSize:"20px",fontWeight:"600",color:"#fff"}}><span style={{color:"#2563EB"}}>Notya</span> AI</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>router.push("/asistan")}
              style={{background:"linear-gradient(135deg,#7C3AED,#2563EB)",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"}}>
              🩺 AI Uzman Asistan
            </button>
            <button onClick={()=>router.push("/session/new")}
              style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>
              🎙️ Yeni Seans
            </button>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)",cursor:"pointer",alignSelf:"center"}} onClick={signOut}>Çıkış</div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px 20px"}}>
        {greeting && (
          <div style={{fontSize:"18px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"}}>
            {greeting}
          </div>
        )}
        {/* AI Asistan Banner */}
        <div onClick={()=>router.push("/asistan")}
          style={{background:"linear-gradient(135deg,#0A1628,#1A3050)",border:"1px solid rgba(124,58,237,.4)",borderRadius:"16px",padding:"20px 24px",marginBottom:"20px",cursor:"pointer",display:"flex",alignItems:"center",gap:"16px"}}>
          <div style={{fontSize:"40px"}}>🩺</div>
          <div style={{flex:1}}>
            <div style={{fontSize:"16px",fontWeight:"600",color:"#fff",marginBottom:"4px"}}>AI Uzman Asistan — Prof. Elif, Prof. Ayşe, Prof. Mehmet</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.6)"}}>Sesli veya yazılı komutla hasta oluştur, tanı al, reçete yaz. Her seanstan öğrenerek sana özel hale gelir.</div>
          </div>
          <div style={{fontSize:"13px",color:"#7C3AED",fontWeight:"600",flexShrink:0}}>Başla →</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[{l:"Toplam Not",v:notes.length,i:"📋"},{l:"Onaylı",v:notes.filter(n=>n.approved_at).length,i:"✅"},{l:"Kritik",v:notes.filter(n=>n.kritik_bulgular?.length>0).length,i:"⚠️"}].map(s=>(
            <div key={s.l} style={{background:"#fff",borderRadius:"14px",padding:"18px",border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:"22px",marginBottom:"4px"}}>{s.i}</div>
              <div style={{fontSize:"26px",fontWeight:"600",color:"#0A1628"}}>{s.v}</div>
              <div style={{fontSize:"12px",color:"#64748B"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:activeNote?"1fr 1fr":"1fr",gap:"16px"}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"12px"}}>Son Notlar</div>
            {loading && <div style={{color:"#64748B",padding:"32px",textAlign:"center"}}>Yükleniyor...</div>}
            {!loading && notes.length === 0 && (
              <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E2E8F0",padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:"36px",marginBottom:"10px"}}>🎙️</div>
                <div style={{fontSize:"15px",fontWeight:"500",color:"#0A1628",marginBottom:"6px"}}>Henüz seans yok</div>
                <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"16px"}}>
                  <button onClick={()=>router.push("/asistan")} style={{background:"linear-gradient(135deg,#7C3AED,#2563EB)",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 20px",fontSize:"13px",cursor:"pointer"}}>AI Asistan ile Başla</button>
                  <button onClick={()=>router.push("/session/new")} style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 20px",fontSize:"13px",cursor:"pointer"}}>Yeni Seans</button>
                </div>
              </div>
            )}
            {notes.map(note=>(
              <div key={note.id} onClick={()=>setActiveNote(activeNote?.id===note.id?null:note)}
                style={{background:"#fff",borderRadius:"12px",border:`1.5px solid ${activeNote?.id===note.id?"#2563EB":"#E2E8F0"}`,padding:"14px",marginBottom:"8px",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"10px",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
                    {EMOJI[note.sessions?.specialty||"genel"]||"🩺"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                      <div style={{fontSize:"13px",fontWeight:"500",color:"#0A1628",textTransform:"capitalize"}}>{note.sessions?.specialty?.replace("_"," ")||"Muayene"}</div>
                      <div style={{fontSize:"11px",color:"#94A3B8"}}>{fmt(note.created_at)}</div>
                    </div>
                    {note.content_degerlendirme && <div style={{fontSize:"12px",color:"#64748B",lineHeight:"1.4",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{note.content_degerlendirme}</div>}
                    <div style={{display:"flex",gap:"6px",marginTop:"6px"}}>
                      {note.approved_at ? <span style={{fontSize:"10px",background:"#EAF3DE",color:"#3B6D11",padding:"2px 8px",borderRadius:"20px"}}>✅ Onaylı</span> : <span style={{fontSize:"10px",background:"#FEF3CD",color:"#92400E",padding:"2px 8px",borderRadius:"20px"}}>⏳ Bekliyor</span>}
                      {note.kritik_bulgular?.length>0 && <span style={{fontSize:"10px",background:"#FCEBEB",color:"#A32D2D",padding:"2px 8px",borderRadius:"20px"}}>⚠️ Kritik</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {activeNote && (
            <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E2E8F0",padding:"20px",position:"sticky",top:"72px",maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <div style={{fontSize:"15px",fontWeight:"600",color:"#0A1628"}}>Not Detayı</div>
                <div style={{cursor:"pointer",color:"#94A3B8",fontSize:"18px"}} onClick={()=>setActiveNote(null)}>✕</div>
              </div>
              {[{l:"S — Subjektif",k:"content_subjektif",c:"#2563EB"},{l:"O — Objektif",k:"content_objektif",c:"#059669"},{l:"A — Değerlendirme",k:"content_degerlendirme",c:"#D97706"},{l:"P — Plan",k:"content_plan",c:"#7C3AED"}]
                .filter(s=>(activeNote as Record<string,unknown>)[s.k]).map(s=>(
                <div key={s.k} style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"10px",fontWeight:"600",color:s.c,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"4px"}}>{s.l}</div>
                  <div style={{fontSize:"12px",color:"#374151",background:"#F8FAFC",borderRadius:"8px",padding:"8px 10px",lineHeight:"1.6"}}>{String((activeNote as Record<string,unknown>)[s.k])}</div>
                </div>
              ))}
              {activeNote.kritik_bulgular?.length>0 && (
                <div style={{background:"#FCEBEB",borderRadius:"8px",padding:"10px",marginBottom:"12px"}}>
                  <div style={{fontSize:"11px",fontWeight:"600",color:"#A32D2D",marginBottom:"4px"}}>⚠️ KRİTİK</div>
                  {activeNote.kritik_bulgular.map((b,i)=><div key={i} style={{fontSize:"11px",color:"#991B1B"}}>• {b}</div>)}
                </div>
              )}
              {!activeNote.approved_at && (
                <button onClick={async()=>{
                  await supabase.from("notes").update({approved_at:new Date().toISOString()}).eq("id",activeNote.id)
                  setActiveNote({...activeNote,approved_at:new Date().toISOString()})
                }} style={{width:"100%",padding:"12px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>
                  ✅ Onayla
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
      <HelpWidget professionType="doktor" isFirstLogin={true} />
    </>
  )
}