
"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleAuth() {
    setLoading(true)
    setError("")
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError("Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.")
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"24px",padding:"40px",width:"100%",maxWidth:"400px",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"28px",fontWeight:"600",color:"#0A1628",marginBottom:"6px"}}>
            <span style={{color:"#2563EB"}}>Notya</span> AI
          </div>
          <div style={{fontSize:"14px",color:"#64748B"}}>
            {mode === "login" ? "Hesabınıza giriş yapın" : "Ücretsiz hesap oluşturun"}
          </div>
        </div>

        {error && (
          <div style={{background:"#FCEBEB",border:"1px solid #F09595",borderRadius:"10px",padding:"12px",fontSize:"13px",color:"#A32D2D",marginBottom:"16px"}}>
            {error}
          </div>
        )}

        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"500",color:"#374151",display:"block",marginBottom:"6px"}}>E-posta</label>
          <input
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="doktor@hastane.com"
            style={{width:"100%",padding:"12px 14px",border:"1.5px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",transition:"border .2s"}}
            onFocus={e=>e.target.style.borderColor="#2563EB"}
            onBlur={e=>e.target.style.borderColor="#E5E7EB"}
          />
        </div>

        <div style={{marginBottom:"24px"}}>
          <label style={{fontSize:"13px",fontWeight:"500",color:"#374151",display:"block",marginBottom:"6px"}}>Şifre</label>
          <input
            type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
            style={{width:"100%",padding:"12px 14px",border:"1.5px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none"}}
            onKeyDown={e=>e.key==="Enter"&&handleAuth()}
            onFocus={e=>e.target.style.borderColor="#2563EB"}
            onBlur={e=>e.target.style.borderColor="#E5E7EB"}
          />
        </div>

        <button
          onClick={handleAuth} disabled={loading || !email || !password}
          style={{width:"100%",padding:"14px",background:loading?"#93C5FD":"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"15px",fontWeight:"600",cursor:loading?"not-allowed":"pointer",transition:"background .2s"}}>
          {loading ? "Yükleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </button>

        <div style={{textAlign:"center",marginTop:"20px",fontSize:"13px",color:"#64748B"}}>
          {mode === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
          <span
            onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}
            style={{color:"#2563EB",cursor:"pointer",fontWeight:"500"}}>
            {mode === "login" ? "Ücretsiz kaydolun" : "Giriş yapın"}
          </span>
        </div>

        <div style={{marginTop:"24px",padding:"16px",background:"#F8FAFC",borderRadius:"12px",fontSize:"12px",color:"#64748B",lineHeight:"1.5"}}>
          🔐 <strong>KVKK uyumlu</strong> — Tüm hasta verileri AES-256 ile şifrelenir. AB veri merkezi (Frankfurt).
        </div>
      </div>
    </div>
  )
}
