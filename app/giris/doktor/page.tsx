'use client' // 1782254890
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { girisIstemcisi } from '@/lib/doktor/girisIstemcisi'
import { saveDoctorSession } from '@/lib/doktor/clientAuth'
import { girisSorgusu, OTURUM_DOLDU_MESAJI } from '@/lib/doktor/oturumYolu'
import { authHataMesaji } from '../authHataMesaji'
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'
import ZiyaretSayaci from '@/components/ziyaret/ZiyaretSayaci'
import { doktorFetch } from '@/lib/doktor/oturumFetch'



export default function Giris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sifremiUnuttum, setSifremiUnuttum] = useState(false)
  const [fpEmail, setFpEmail] = useState('')
  const [fpDurum, setFpDurum] = useState<'bos'|'gonderiliyor'|'gonderildi'|'hata'>('bos')
  // NOTYA-OTURUM-01: ?oturum=doldu shows the expired-session notice; ?next= (internal paths only) is where the
  // doctor returns after signing in.
  const [oturumDoldu, setOturumDoldu] = useState(false)
  const [donus, setDonus] = useState<string | null>(null)
  useEffect(() => {
    const q = girisSorgusu(window.location.search)
    setOturumDoldu(q.doldu)
    setDonus(q.next)
  }, [])

  // NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20): real Supabase recovery email, not the old static message.
  async function sifreSifirlaGonder() {
    setFpDurum('gonderiliyor')
    const istemci = girisIstemcisi()
    const { error } = await istemci.auth.resetPasswordForEmail(fpEmail.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname.replace(/\/giris.*$/, '')}/sifre-sifirla`,
    })
    setFpDurum(error ? 'hata' : 'gonderildi')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('E-posta ve şifre gereklidir'); return }
    setLoading(true); setError('')
    const supabase = girisIstemcisi()
    const { data, error: ae } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password })
    if (ae || !data.session) { setError(authHataMesaji(ae?.message, 'Giriş başarısız. Lütfen tekrar deneyin.')); setLoading(false); return }
    saveDoctorSession(data.session)
    // NOTYA-SEKRETER-01: sekreter onboarding'e gitmez — doğrudan Ön büro (Ana Sayfa) açılır.
    try {
      const personelRes = await doktorFetch('/api/personel/me', {
        cache: 'no-store',
      })
      if (personelRes.ok) {
        const pm = await personelRes.json().catch(() => ({} as { rol?: string }))
        if (pm.rol && pm.rol !== 'doktor') {
          router.replace(donus || '/dashboard/doktor')
          return
        }
      }
    } catch { /* doktor akışına düş */ }
    // Davet kabulünde user_metadata.personel=true yazılır; bağ kopuk olsa bile onboarding'e itme.
    if (data.user?.user_metadata?.personel === true) {
      router.replace(donus || '/dashboard/doktor')
      return
    }
    // Prefer users table /me over auth metadata alone — metadata onboarding flag often never stuck.
    try {
      const meRes = await doktorFetch('/api/users/me', {})
      const me = await meRes.json().catch(() => ({} as { data?: { onboarding_completed?: boolean; profession_type?: string; specialty?: string } }))
      const profile = me.data
      const done =
        Boolean(profile?.onboarding_completed) ||
        Boolean(profile?.profession_type) ||
        Boolean(profile?.specialty) ||
        Boolean(data.user?.user_metadata?.onboarding_completed)
      if (!done) {
        router.replace('/onboarding?p=doktor')
      } else {
        router.replace(donus || '/dashboard/doktor')
      }
    } catch {
      const meta = data.user?.user_metadata || {}
      router.replace(meta.onboarding_completed ? (donus || '/dashboard/doktor') : '/onboarding?p=doktor')
    }
  }

  // NOTYA-GIRIS-GORUNUM-01 (Kaan, 2026-09-27): doktor girişi, uygulamanın krem/çam görünümüyle aynı.
  const R = CHROME_RENK
  const inp: React.CSSProperties = { width: '100%', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 12, padding: '12px 14px', color: R.ink, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans }
  const etiket: React.CSSProperties = { fontSize: 13, color: R.muted, marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: 0.2 }
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))', fontFamily: CHROME_FONT.sans, color: R.ink, boxSizing: 'border-box' }}>
      <ZiyaretSayaci />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel='stylesheet' href={CHROME_FONT_HREF} />
      <div style={{ background: R.paper, borderRadius: 24, padding: 'clamp(28px, 6vw, 44px)', maxWidth: 420, width: '100%', border: `1px solid ${R.border}`, boxSizing: 'border-box', boxShadow: '0 18px 50px rgba(58,44,34,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, color: R.muted, marginTop: 6 }}>Hekim ve ön büro girişi</div>
        </div>
        {oturumDoldu && (
          <div role="status" style={{ background: R.cream, border: `1px solid ${R.border}`, borderRadius: 10, padding: '10px 12px', color: R.ink, fontSize: 13.5, marginBottom: 14 }}>{OTURUM_DOLDU_MESAJI}</div>
        )}
        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={etiket}>E-posta</label>
            <input type='text' value={email} onChange={e=>setEmail(e.target.value)} placeholder='dr.ad@hastane.com' autoCapitalize='none' autoCorrect='off' autoComplete='email' inputMode='email' spellCheck={false} style={inp} />
          </div>
          <div>
            <label style={etiket}>Şifre</label>
            <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Şifrenizi girin' autoComplete='current-password' style={inp} />
            <button type='button' onClick={() => { setSifremiUnuttum((v) => !v); setFpEmail(email) }} style={{ background: 'transparent', border: 'none', color: R.pine, fontSize: 12.5, cursor: 'pointer', padding: '8px 0 0', textAlign: 'left', fontFamily: CHROME_FONT.sans, fontWeight: 600 }}>Şifremi unuttum</button>
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
          <button type='submit' disabled={loading} style={{ padding: 14, background: R.pine, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: CHROME_FONT.sans, letterSpacing: 0.2 }}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}` }}>
          <a href='/kayit' style={{ display: 'inline-block', color: R.pine, fontWeight: 600, fontSize: 14, background: 'transparent', border: `1px solid ${R.pine}`, padding: '11px 24px', borderRadius: 12, textDecoration: 'none' }}>15 gün ücretsiz başlayın →</a>
        </div>
      </div>
    </div>
  )
}
