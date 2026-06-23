'use client' // 1782254890
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://anjayzospuurymjmmtim.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE')

export default function Giris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('E-posta ve sifre gereklidir'); return }
    setLoading(true); setError('')
    const { data, error: ae } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (ae || !data.session) { setError(ae?.message || 'Giris basarisiz'); setLoading(false); return }
    router.replace('/dashboard/doktor')
  }

  const inp: React.CSSProperties = { width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{minHeight:'100vh',background:'#0A1628',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#111827',borderRadius:'20px',padding:'40px',maxWidth:'420px',width:'100%',border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>&#127973;</div>
          <div style={{fontSize:'22px',fontWeight:700,color:'#fff'}}><span style={{color:'#2563EB'}}>Notya</span> AI</div>
          <div style={{fontSize:'13px',color:'#64748b',marginTop:'4px'}}>Klinik Asistan Modulu</div>
        </div>
        <form onSubmit={handleLogin} noValidate style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div>
            <label style={{fontSize:'13px',color:'#94a3b8',marginBottom:'6px',display:'block'}}>E-posta</label>
            <input type='text' value={email} onChange={e=>setEmail(e.target.value)} placeholder='dr.ornek@hastane.com' style={inp} />
          </div>
          <div>
            <label style={{fontSize:'13px',color:'#94a3b8',marginBottom:'6px',display:'block'}}>Sifre</label>
            <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Sifrenizi girin' style={inp} />
          </div>
          {error && <div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'8px',padding:'10px',color:'#fca5a5',fontSize:'13px'}}>{error}</div>}
          <button type='submit' disabled={loading} style={{padding:'13px',background:'#2563EB',border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}>
            {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:'20px',fontSize:'12px',color:'#64748b'}}>
          <a href='/giris' style={{color:'#94a3b8'}}>Genel giris</a>{' | '}<a href='/giris/mali' style={{color:'#10B981'}}>Mali Musavir</a>{' | '}<a href='/giris/avukat' style={{color:'#7C3AED'}}>Avukat</a>
        </div>
      </div>
    </div>
  )
}
