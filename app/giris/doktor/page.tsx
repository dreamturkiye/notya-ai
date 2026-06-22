// app/giris/doktor/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DoktorGiris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Giris basarisiz: ' + error.message); setLoading(false); return }
    if (data.session) {
      const { data: profile } = await supabase.from('users').select('profession_type, onboarding_completed').eq('id', data.session.user.id).single()
      if (profile?.profession_type === 'mali_musavirlik') { router.replace('/dashboard/mali'); return }
      if (profile?.profession_type === 'avukat') { router.replace('/dashboard/avukat'); return }
      if (profile?.onboarding_completed || profile?.profession_type) router.replace('/dashboard')
      else router.replace('/onboarding')
    }
    setLoading(false)
  }

  const inp = { width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: '#111827', borderRadius: '20px', padding: '40px', maxWidth: '420px', width: '100%', border: '1px solid rgba(37,99,235,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>?</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}><span style={{ color: '#2563EB' }}>Notya</span> AI</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Klinik Asistan Modulu</div>
        </div>
        <div style={{ height: '1px', background: 'rgba(37,99,235,0.15)', margin: '24px 0' }} />
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>E-posta</label>
            <input type='email' required value={email} onChange={e => setEmail(e.target.value)} placeholder='dr.ornek@hastane.com' style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Sifre</label>
            <input type='password' required value={password} onChange={e => setPassword(e.target.value)} placeholder='ееееееее' style={inp} />
          </div>
          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px' }}>{error}</div>}
          <button type='submit' disabled={loading} style={{ padding: '13px', background: '#2563EB', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
            {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
          Diger profesyonlar: <a href='/giris/mali' style={{ color: '#10B981' }}>Mali Musavir</a> с <a href='/giris/avukat' style={{ color: '#7C3AED' }}>Avukat</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
          Hesabiniz yok mu? <a href='/onboarding' style={{ color: '#2563EB' }}>Kayit olun</a>
        </div>
      </div>
    </div>
  )
}