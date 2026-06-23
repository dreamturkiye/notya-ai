"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
const SUPA_URL = "https://anjayzospuurymjmmtim.supabase.co"
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE"
export default function MaliGiriş() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    try {
      const resp = await fetch(SUPA_URL + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPA_ANON },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json()
      if (!data.access_token) throw new Error(data.error_description || "Giriş basarisiz")
      localStorage.setItem("sb-anjayzospuurymjmmtim-auth-token", JSON.stringify({
        access_token: data.access_token, refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        token_type: "bearer", user: data.user
      }))
      router.replace("/dashboard/mali")
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Hata"); setLoading(false) }
  }
  const inp = {width:"100%",background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px 14px",color:"#fff",fontSize:"14px",outline:"none",boxSizing:"border-box" as const}
  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#111827",borderRadius:"20px",padding:"40px",maxWidth:"420px",width:"100%",border:"1px solid rgba(16,185,129,0.2)"}}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"36px",marginBottom:"8px"}}>&#128176;</div>
          <div style={{fontSize:"22px",fontWeight:700,color:"#fff"}}><span style={{color:"#10B981"}}>Notya</span> AI</div>
          <div style={{fontSize:"13px",color:"#64748b",marginTop:"4px"}}>Mali Müşavirlik Modulu</div>
        </div>
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={{fontSize:"13px",color:"#94a3b8",marginBottom:"6px",display:"block"}}>E-posta</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="smmm@ornek.com" style={inp}/></div>
          <div><label style={{fontSize:"13px",color:"#94a3b8",marginBottom:"6px",display:"block"}}>Sifre</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="12345678" style={inp}/></div>
          {error && <div style={{background:"rgba(220,38,38,0.1)",border:"1px solid rgba(220,38,38,0.3)",borderRadius:"8px",padding:"10px",color:"#fca5a5",fontSize:"13px"}}>{error}</div>}
          <button type="submit" disabled={loading} style={{padding:"13px",background:"#10B981",border:"none",borderRadius:"10px",color:"#fff",fontSize:"15px",fontWeight:600,cursor:"pointer",marginTop:"4px"}}>
            {loading ? "Giriş yapiliyor..." : "Giriş Yap"}</button>
        </form>
        <div style={{textAlign:"center",marginTop:"20px",fontSize:"12px",color:"#64748b"}}>
          <a href="/giris" style={{color:"#94a3b8"}}>Genel giris</a>{" | "}
          <a href="/giris/doktor" style={{color:"#3B82F6"}}>Doktor</a>{" | "}
          <a href="/giris/avukat" style={{color:"#7C3AED"}}>Avukat</a>
        </div>
      </div>
    </div>
  )
}
