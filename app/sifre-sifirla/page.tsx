'use client'
// NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20): completes the Supabase password-recovery email link.
// Supabase's browser client auto-detects the recovery token from the URL on load (detectSessionInUrl,
// default true) and turns it into a real session — that session is what lets updateUser() work here.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

const supabase = createClient(
  'https://anjayzospuurymjmmtim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE'
)

export default function SifreSifirla() {
  const router = useRouter()
  const [durum, setDurum] = useState<'kontrol'|'hazir'|'gecersiz'>('kontrol')
  const [sifre, setSifre] = useState('')
  const [sifre2, setSifre2] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [tamam, setTamam] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setDurum(data.session ? 'hazir' : 'gecersiz')
    })
  }, [])

  async function gonder(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (sifre.length < 8) { setHata('Şifre en az 8 karakter olmalı'); return }
    if (sifre !== sifre2) { setHata('Şifreler eşleşmiyor'); return }
    setYukleniyor(true)
    const { error } = await supabase.auth.updateUser({ password: sifre })
    setYukleniyor(false)
    if (error) { setHata('Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir — yeniden isteyin.'); return }
    setTamam(true)
    setTimeout(() => router.replace('/giris'), 2200)
  }

  const R = CHROME_RENK
  const inp: React.CSSProperties = { width: '100%', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 12, padding: '12px 14px', color: R.ink, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans }
  const etiket: React.CSSProperties = { fontSize: 13, color: R.muted, marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: 0.2 }

  return (
    <div style={{ minHeight: '100dvh', background: R.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CHROME_FONT.sans, color: R.ink, padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px calc(20px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ background: R.paper, borderRadius: 24, padding: 'clamp(28px, 6vw, 44px)', width: '100%', maxWidth: 420, boxSizing: 'border-box', border: `1px solid ${R.border}`, boxShadow: '0 18px 50px rgba(58,44,34,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, color: R.muted, marginTop: 6 }}>Yeni şifre belirle</div>
        </div>
        {durum === 'kontrol' && <div style={{ textAlign: 'center', color: R.muted, fontSize: 14 }}>Kontrol ediliyor…</div>}
        {durum === 'gecersiz' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: R.warn, marginBottom: 16 }}>Bu bağlantının süresi dolmuş veya geçersiz. Giriş sayfasından yeni bir sıfırlama bağlantısı isteyin.</div>
            <a href="/giris" style={{ color: R.pine, fontWeight: 600, textDecoration: 'none' }}>Girişe dön</a>
          </div>
        )}
        {durum === 'hazir' && !tamam && (
          <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={etiket}>Yeni şifre</label>
              <input type="password" value={sifre} onChange={e => setSifre(e.target.value)} autoComplete="new-password" style={inp} />
            </div>
            <div>
              <label style={etiket}>Yeni şifre (tekrar)</label>
              <input type="password" value={sifre2} onChange={e => setSifre2(e.target.value)} autoComplete="new-password" style={inp} />
            </div>
            {hata && <div style={{ background: 'rgba(164,91,62,0.08)', border: `1px solid rgba(164,91,62,0.25)`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: R.warn }}>{hata}</div>}
            <button type="submit" disabled={yukleniyor} style={{ padding: 14, background: R.pine, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: yukleniyor ? 0.7 : 1, fontFamily: CHROME_FONT.sans, letterSpacing: 0.2 }}>
              {yukleniyor ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
            </button>
          </form>
        )}
        {tamam && <div style={{ textAlign: 'center', color: R.pine, fontSize: 14, fontWeight: 600 }}>Şifreniz güncellendi. Girişe yönlendiriliyorsunuz…</div>}
      </div>
    </div>
  )
}
