
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
    if (!email || !password) { setError("E-posta ve şifre gerekli"); return }
    setLoading(true)
    setError("")

    try {
      const endpoint = mode === "register"
        ? `${SUPA_URL}/auth/v1/signup`
        : `${SUPA_URL}/auth/v1/token?grant_type=password`

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "apikey": SUPA_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json()

      if (mode === "register") {
        if (data.error) throw new Error(data.error_description || data.error)
        if (data.access_token) {
          localStorage.setItem("sb-anjayzospuurymjmmtim-auth-token", JSON.stringify({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            token_type: "bearer",
            user: data.user
          }))
          await fetch("/api/users/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.access_token}`,
            },
            body: JSON.stringify({ onboarding_completed: false }),
          })
          router.push("/onboarding")
          return
        }
        setError("Doğrulama e-postası gönderildi. E-postanızı kontrol edin.")
        setLoading(false)
        return
      }

      if (!data.access_token) throw new Error(data.error_description || data.error || "Giriş başarısız")

      // Store session in localStorage for the app to use
      localStorage.setItem("sb-anjayzospuurymjmmtim-auth-token", JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        token_type: "bearer",
        user: data.user
      }))

      const profileResp = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      const profileData = await profileResp.json()
      const profType = profileData.data?.profession_type
      if (profType === 'mali_musavirlik') { router.replace('/dashboard/mali'); return }
      if (profType === 'avukat') { router.replace('/dashboard/avukat'); return }
      if (!profileData.data?.onboarding_completed && !profType) {

      router.push("/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",alignItems:"center",
                 justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"24px",padding:"40px",width:"100%",
                   maxWidth:"400px",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"28px",fontWeight:"600",color:"#0A1628",marginBottom:"6px"}}>
            <span style={{color:"#006699"}}>Notya</span> AI
          </div>
          <div style={{fontSize:"14px",color:"#64748B"}}>
            {mode === "login" ? "Hesabınıza giriş yapın" : "Ücretsiz hesap oluşturun"}
          </div>
        </div>

        {error && (
          <div style={{background:error.includes("gönderildi")?"#EAF3DE":"#FCEBEB",
                       border:`1px solid ${error.includes("gönderildi")?"#a3d977":"#F09595"}`,
                       borderRadius:"10px",padding:"12px",fontSize:"13px",
                       color:error.includes("gönderildi")?"#3B6D11":"#A32D2D",marginBottom:"16px"}}>
            {error}
          </div>
        )}

        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"500",color:"#374151",display:"block",marginBottom:"6px"}}>
            E-posta
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="doktor@hastane.com"
            style={{width:"100%",padding:"12px 14px",border:"1.5px solid #E5E7EB",borderRadius:"10px",
                    fontSize:"14px",outline:"none",boxSizing:"border-box"}}
            onFocus={e => e.target.style.borderColor="#006699"}
            onBlur={e => e.target.style.borderColor="#E5E7EB"}
          />
        </div>

        <div style={{marginBottom:"24px"}}>
          <label style={{fontSize:"13px",fontWeight:"500",color:"#374151",display:"block",marginBottom:"6px"}}>
            Şifre
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{width:"100%",padding:"12px 14px",border:"1.5px solid #E5E7EB",borderRadius:"10px",
                    fontSize:"14px",outline:"none",boxSizing:"border-box"}}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            onFocus={e => e.target.style.borderColor="#006699"}
            onBlur={e => e.target.style.borderColor="#E5E7EB"}
          />
        </div>

        <button onClick={handleAuth} disabled={loading || !email || !password}
          style={{width:"100%",padding:"14px",
                  background:loading || !email || !password ? "#93C5FD" : "#006699",
                  color:"#fff",border:"none",borderRadius:"12px",fontSize:"15px",
                  fontWeight:"600",cursor:loading || !email || !password ? "not-allowed" : "pointer"}}>
          {loading ? "Yükleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </button>

        <div style={{textAlign:"center",marginTop:"20px",fontSize:"13px",color:"#64748B"}}>
          {mode === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
          <span onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}
            style={{color:"#006699",cursor:"pointer",fontWeight:"500"}}>
            {mode === "login" ? "Ücretsiz kaydolun" : "Giriş yapın"}
          </span>
        </div>

        <div style={{marginTop:"24px",padding:"14px",background:"#F8FAFC",borderRadius:"12px",
                     fontSize:"12px",color:"#64748B",lineHeight:"1.5"}}>
          🔐 KVKK uyumlu · AES-256 şifreleme · AB veri merkezi
        </div>
      </div>
    </div>
  )
}
