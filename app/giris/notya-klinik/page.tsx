'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { authHataMesaji } from '../authHataMesaji'
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

export default function KlinikGiris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sifremiUnuttum, setSifremiUnuttum] = useState(false)
  const [fpEmail, setFpEmail] = useState('')
  const [fpDurum, setFpDurum] = useState<'bos'|'gonderiliyor'|'gonderildi'|'hata'>('bos')

  // NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20): real Supabase recovery email, not the old static message.
  async function sifreSifirlaGonder() {
    setFpDurum('gonderiliyor')
    const istemci = createClient('https://anjayzospuurymjmmtim.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE')
    const { error } = await istemci.auth.resetPasswordForEmail(fpEmail.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname.replace(/\/giris.*$/, '')}/sifre-sifirla`,
    })
    setFpDurum(error ? 'hata' : 'gonderildi')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('E-posta ve şifre gereklidir'); return }
    setLoading(true); setError('')
    const supabase = createClient('https://anjayzospuurymjmmtim.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE')
    const { data, error: ae } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password })
    if (ae || !data.session) {
      setError(authHataMesaji(ae?.message, 'Giriş başarısız. Lütfen tekrar deneyin.'))
      setLoading(false)
      return
    }
    localStorage.setItem('auth-token', JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    }))
    // Aynı hesap Doktor / Notya Klinik / Avukat yüzlerini açar — meslek tipi buradan geri çevirmez.
    router.replace('/dashboard/notya-klinik')
  }

  // NOTYA-GIRIS-GORUNUM-01 (Kaan, 2026-09-27): klinik girişi de doktor arayüzünün krem/çam görünümünde (pembe vurgu bırakıldı).
  const R = CHROME_RENK
  const inp: React.CSSProperties = { width: '100%', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 12, padding: '12px 14px', color: R.ink, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans }
  const etiket: React.CSSProperties = { fontSize: 13, color: R.muted, marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: 0.2 }
  const baglanti: React.CSSProperties = { color: R.pine, fontWeight: 600, textDecoration: 'none' }
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))', fontFamily: CHROME_FONT.sans, color: R.ink, boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ background: R.paper, borderRadius: 24, padding: 'clamp(28px, 6vw, 44px)', maxWidth: 420, width: '100%', border: `1px solid ${R.border}`, boxSizing: 'border-box', boxShadow: '0 18px 50px rgba(58,44,34,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, color: R.muted, marginTop: 6 }}>Notya Klinik girişi</div>
        </div>
        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={etiket}>E-posta</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@klinik.com" autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" spellCheck={false} style={inp} />
          </div>
          <div>
            <label style={etiket}>Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifrenizi girin" autoComplete="current-password" style={inp} />
            <button type="button" onClick={() => { setSifremiUnuttum((v) => !v); setFpEmail(email) }} style={{ background: 'transparent', border: 'none', color: R.pine, fontSize: 12.5, cursor: 'pointer', padding: '8px 0 0', textAlign: 'left', fontFamily: CHROME_FONT.sans, fontWeight: 600 }}>Şifremi unuttum</button>
            {sifremiUnuttum && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: R.muted, background: R.cream, border: `1px solid ${R.border}`, borderRadius: 10, padding: '10px 12px' }}>
                {fpDurum === 'gonderildi' ? (
                  <span style={{ color: R.pine, fontWeight: 600 }}>Sıfırlama bağlantısı e-postanıza gönderildi.</span>
                ) : (
                  <>
                    <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} placeholder="E-posta adresiniz" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ ...inp, marginBottom: 8, padding: '9px 10px', fontSize: 13.5 }} />
                    <button type="button" disabled={fpDurum === 'gonderiliyor' || !fpEmail.trim()} onClick={sifreSifirlaGonder} style={{ padding: '8px 12px', background: R.pine, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: fpDurum === 'gonderiliyor' ? 'not-allowed' : 'pointer', opacity: fpDurum === 'gonderiliyor' ? 0.7 : 1, fontFamily: CHROME_FONT.sans }}>
                      {fpDurum === 'gonderiliyor' ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}
                    </button>
                    {fpDurum === 'hata' && <div style={{ marginTop: 6, color: R.warn }}>Gönderilemedi. E-postayı kontrol edip tekrar deneyin.</div>}
                  </>
                )}
              </div>
            )}
          </div>
          {error && <div style={{ background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', borderRadius: 10, padding: '10px 12px', color: R.warn, fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: 14, background: R.pine, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: CHROME_FONT.sans, letterSpacing: 0.2 }}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}`, fontSize: 12.5, color: R.muted, textAlign: 'center', display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/giris" style={baglanti}>Genel giriş</a>
          <a href="/giris/doktor" style={baglanti}>Doktor</a>
          <a href="/giris/mali" style={baglanti}>Mali Müşavir</a>
          <a href="/giris/avukat" style={baglanti}>Avukat</a>
        </div>
      </div>
    </div>
  )
}
