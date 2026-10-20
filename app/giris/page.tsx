"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authHataMesaji } from "./authHataMesaji"
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from "@/lib/doktor/chromeTheme"

const SUPA_URL = "https://anjayzospuurymjmmtim.supabase.co"
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login"|"register">("login")
  const [fpAcik, setFpAcik] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [fpDurum, setFpDurum] = useState<"bos"|"gonderiliyor"|"gonderildi"|"hata">("bos")

  // NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20): real Supabase recovery email.
  async function sifreSifirlaGonder() {
    setFpDurum("gonderiliyor")
    try {
      const resp = await fetch(SUPA_URL + "/auth/v1/recover?redirect_to=" + encodeURIComponent(`${window.location.origin}${window.location.pathname.replace(/\/giris.*$/, "")}/sifre-sifirla`), {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPA_ANON },
        body: JSON.stringify({ email: fpEmail.toLowerCase().trim() })
      })
      setFpDurum(resp.ok ? "gonderildi" : "hata")
    } catch { setFpDurum("hata") }
  }

  async function handleAuth() {
    if (!email || !password) { setError("E-posta ve şifre gerekli"); return }
    setLoading(true); setError("")
    try {
      const endpoint = mode === "login"
        ? SUPA_URL + "/auth/v1/token?grant_type=password"
        : SUPA_URL + "/auth/v1/signup"
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPA_ANON },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      })
      const data = await resp.json()
      if (!data.access_token) throw new Error(authHataMesaji(data.error_description || data.msg || data.error, mode === "login" ? "Giriş başarısız. Lütfen tekrar deneyin." : "Kayıt tamamlanamadı. Lütfen tekrar deneyin."))
      localStorage.setItem("sb-anjayzospuurymjmmtim-auth-token", JSON.stringify({
        access_token: data.access_token, refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        token_type: "bearer", user: data.user
      }))
      const profileResp = await fetch("/api/users/me", {
        headers: { Authorization: "Bearer " + data.access_token }
      })
      let profileData: {data?: {profession_type?: string; onboarding_completed?: boolean}} = {}
      try { profileData = await profileResp.json() } catch { profileData = {} }
      const profType = profileData.data?.profession_type
      if (profType === "mali_musavirlik") { router.replace("/dashboard/mali"); return }
      if (profType === "avukat") { router.replace("/dashboard/avukat"); return }
      if (!profileData.data?.onboarding_completed && !profType) { router.push("/onboarding"); return }
      router.push("/dashboard")
    } catch (e: unknown) {
      setError(authHataMesaji(e instanceof Error ? e.message : "", "Bir hata oluştu. Lütfen tekrar deneyin."))
      setLoading(false)
    }
  }

  // NOTYA-GIRIS-GORUNUM-01 (Kaan, 2026-09-27): giriş sayfası doktor arayüzüyle aynı görünüm — krem/çam, Fraunces başlık.
  const R = CHROME_RENK
  const inp: React.CSSProperties = { width: "100%", background: R.paper, border: `1px solid ${R.border}`, borderRadius: 12, padding: "12px 14px", color: R.ink, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: CHROME_FONT.sans }
  const etiket: React.CSSProperties = { fontSize: 13, color: R.muted, marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: 0.2 }
  const hazir = Boolean(email && password) && !loading
  return (
    <div style={{ minHeight: "100dvh", background: R.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CHROME_FONT.sans, color: R.ink, padding: "calc(20px + env(safe-area-inset-top, 0px)) 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ background: R.paper, borderRadius: 24, padding: "clamp(28px, 6vw, 44px)", width: "100%", maxWidth: 420, boxSizing: "border-box", border: `1px solid ${R.border}`, boxShadow: "0 18px 50px rgba(58,44,34,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: "italic", fontSize: 16, color: R.muted, marginTop: 6 }}>
            {mode === "login" ? "Hesabınıza giriş yapın" : "Ücretsiz hesap oluşturun"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={etiket}>E-posta</label>
            <input type="text" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ad@ornek.com" autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" spellCheck={false} style={inp} />
          </div>
          <div>
            <label style={etiket}>Şifre</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Şifreniz" autoComplete="current-password" style={inp} onKeyDown={e => { if (e.key === "Enter" && hazir) void handleAuth() }} />
            {mode === "login" && (
              <>
                <button type="button" onClick={() => { setFpAcik(v => !v); setFpEmail(email) }} style={{ background: "transparent", border: "none", color: R.pine, fontSize: 12.5, cursor: "pointer", padding: "8px 0 0", textAlign: "left", fontFamily: CHROME_FONT.sans, fontWeight: 600 }}>Şifremi unuttum</button>
                {fpAcik && (
                  <div style={{ marginTop: 6, fontSize: 12.5, color: R.muted, background: R.cream, border: `1px solid ${R.border}`, borderRadius: 10, padding: "10px 12px" }}>
                    {fpDurum === "gonderildi" ? (
                      <span style={{ color: R.pine, fontWeight: 600 }}>Sıfırlama bağlantısı e-postanıza gönderildi.</span>
                    ) : (
                      <>
                        <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} placeholder="E-posta adresiniz" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ ...inp, marginBottom: 8, padding: "9px 10px", fontSize: 13.5 }} />
                        <button type="button" disabled={fpDurum === "gonderiliyor" || !fpEmail.trim()} onClick={sifreSifirlaGonder} style={{ padding: "8px 12px", background: R.pine, border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: fpDurum === "gonderiliyor" ? "not-allowed" : "pointer", opacity: fpDurum === "gonderiliyor" ? 0.7 : 1, fontFamily: CHROME_FONT.sans }}>
                          {fpDurum === "gonderiliyor" ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
                        </button>
                        {fpDurum === "hata" && <div style={{ marginTop: 6, color: R.warn }}>Gönderilemedi. E-postayı kontrol edip tekrar deneyin.</div>}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {error && <div style={{ background: "rgba(164,91,62,0.08)", border: `1px solid rgba(164,91,62,0.25)`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: R.warn }}>{error}</div>}
          <button type="submit" onClick={handleAuth} disabled={!hazir}
            style={{ padding: 14, background: hazir ? R.pine : "rgba(47,67,52,0.35)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, cursor: hazir ? "pointer" : "not-allowed", fontFamily: CHROME_FONT.sans, letterSpacing: 0.2 }}>
            {loading ? "Yükleniyor…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: R.muted }}>
          {mode === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}} style={{ color: R.pine, cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Ücretsiz kayıt" : "Giriş yapın"}
          </span>
        </div>
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}`, fontSize: 12.5, color: R.muted, textAlign: "center", display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <span>Profesyonel giriş:</span>
          <a href="/giris/doktor" style={{ color: R.pine, fontWeight: 600, textDecoration: "none" }}>Doktor</a>
          <a href="/giris/notya-klinik" style={{ color: R.pine, fontWeight: 600, textDecoration: "none" }}>Notya Klinik</a>
          <a href="/giris/mali" style={{ color: R.pine, fontWeight: 600, textDecoration: "none" }}>Mali Müşavir</a>
          <a href="/giris/avukat" style={{ color: R.pine, fontWeight: 600, textDecoration: "none" }}>Avukat</a>
        </div>
      </div>
    </div>
  )
}
