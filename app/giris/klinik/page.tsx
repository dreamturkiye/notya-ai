'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { authHataMesaji } from '../authHataMesaji'

export default function KlinikGiris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sifremiUnuttum, setSifremiUnuttum] = useState(false)

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
    // Aynı hesap Doktor / Klinik / Avukat yüzlerini açar — meslek tipi buradan geri çevirmez.
    router.replace('/dashboard/klinik')
  }

  const inp: React.CSSProperties = { width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100dvh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))', fontFamily: 'system-ui,sans-serif', boxSizing: 'border-box' }}>
      <div style={{ background: '#111827', borderRadius: '20px', padding: 'clamp(24px, 6vw, 40px)', maxWidth: '420px', width: '100%', border: '1px solid rgba(233,30,140,0.25)', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}><span style={{ color: '#E91E8C' }}>Notya</span> AI</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Klinik Modülü</div>
        </div>
        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>E-posta</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@klinik.com" autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" spellCheck={false} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifrenizi girin" autoComplete="current-password" style={inp} />
            <button type="button" onClick={() => setSifremiUnuttum((v) => !v)} style={{ background: 'transparent', border: 'none', color: '#F472B6', fontSize: '12.5px', cursor: 'pointer', padding: '6px 0 0', textAlign: 'left' }}>Şifremi unuttum</button>
            {sifremiUnuttum && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: '#94A3B8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                Şifre sıfırlama şu an otomatik değil — Notya ekibinizle iletişime geçin, sizin için sıfırlansın.
              </div>
            )}
          </div>
          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: '13px', background: '#E91E8C', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
          <a href="/giris" style={{ color: '#94a3b8' }}>Genel giriş</a>
          {' | '}
          <a href="/giris/doktor" style={{ color: '#2563EB' }}>Doktor</a>
          {' | '}
          <a href="/giris/mali" style={{ color: '#10B981' }}>Mali Müşavir</a>
          {' | '}
          <a href="/giris/avukat" style={{ color: '#7C3AED' }}>Avukat</a>
        </div>
      </div>
    </div>
  )
}
