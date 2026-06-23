"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const SUPA_URL = "https://anjayzospuurymjmmtim.supabase.co"
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login"|"register">("login")

  async function handleAuth() {
    if (!email || !password) { setError("E-posta ve sifre gerekli"); return }
    setLoading(true); setError("")
    try {
      const endpoint = mode === "login"
        ? SUPA_URL + "/auth/v1/token?grant_type=password"
        : SUPA_URL + "/auth/v1/signup"
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPA_ANON },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json()
      if (!data.access_token) throw new Error(data.error_description || data.error || "Giriş basarisiz")
      localStorage.setItem("sb-anjayzospuurymjmmtim-auth-token", JSON.stringify({
        access_token: data.access_token, refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        token_type: "bearer", user: data.user
      }))
      const profileResp = await fetch("/api/users/me", {
        headers: { Authorization: "Bearer " + data.access_token }
      })
      const profileData = await profileResp.json()
      const profType = profileData.data?.profession_type
      if (profType === "mali_musavirlik") { router.replace("/dashboard/mali"); return }
      if (profType === "avukat") { router.replace("/dashboard/avukat"); return }
      if (!profileData.data?.onboarding_completed && !profType) { router.push("/onboarding"); return }
      router.push("/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata olustu")
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"24px",padding:"40px",width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"26px",fontWeight:"600",color:"#0A1628",marginBottom:"6px"}}>
            <span style={{color:"#2563EB"}}>Notya</span> AI
          </div>
          <div style={{fontSize:"13px",color:"#64748B"}}>
            {mode === "login" ? "Hesabiniza giris yapin" : "Ücretsiz hesap olusturun"}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div>
            <label style={{fontSize:"13px",color:"#374151",marginBottom:"6px",display:"block",fontWeight:"500"}}>E-posta</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@notya.ai" style={{width:"100%",background:"#F1F5F9",border:"1.5px solid #E2E8F0",borderRadius:"10px",padding:"12px 14px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#374151",marginBottom:"6px",display:"block",fontWeight:"500"}}>Sifre</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="12345678" style={{width:"100%",background:"#F1F5F9",border:"1.5px solid #E2E8F0",borderRadius:"10px",padding:"12px 14px",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
          </div>
          {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"10px 12px",fontSize:"13px",color:"#DC2626"}}>{error}</div>}
          <button onClick={handleAuth} disabled={loading || !email || !password}
            style={{padding:"13px",background:loading||!email||!password?"#94A3B8":"#2563EB",border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"600",cursor:loading||!email||!password?"not-allowed":"pointer",marginTop:"4px"}}>
            {loading ? "Yükleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Olustur"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:"20px",fontSize:"13px",color:"#64748B"}}>
          {mode === "login" ? "Hesabiniz yok mu? " : "Zaten hesabiniz var mi? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}} style={{color:"#2563EB",cursor:"pointer",fontWeight:"500"}}>
            {mode === "login" ? "Ücretsiz kayit" : "Giriş yapin"}
          </span>
        </div>
        <div style={{marginTop:"20px",padding:"12px",background:"#F8FAFC",borderRadius:"10px",fontSize:"12px",color:"#64748B",textAlign:"center"}}>
          Profesyonel giris:
          {" "}<a href="/giris/mali" style={{color:"#10B981"}}>Mali Müşavir</a>
          {" | "}<a href="/giris/avukat" style={{color:"#7C3AED"}}>Avukat</a>
          {" | "}<a href="/giris/doktor" style={{color:"#2563EB"}}>Doktor</a>
        </div>
      </div>
    </div>
  )
}