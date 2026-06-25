'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    const tokenKey = Object.keys(localStorage).find(k => k.includes('auth-token') || k.startsWith('sb-'))
    if (!tokenKey) { router.push('/giris/doktor'); return }
    const raw = localStorage.getItem(tokenKey)
    if (!raw) { router.push('/giris/doktor'); return }
    let token: string | null = null
    try { const parsed = JSON.parse(raw); token = parsed?.access_token || parsed?.session?.access_token || null } catch { token = raw }
    if (!token) { router.push('/giris/doktor'); return }
    const go = async () => {
      try {
        const res = await fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
        if (!res.ok) { router.push('/giris/doktor'); return }
        const json = await res.json()
        const profile = json.data || json
        const type = profile.profession_type
        if (type === 'doktor') router.push('/dashboard/doktor')
        else if (type === 'mali_musavirlik' || type === 'mali') router.push('/dashboard/mali')
        else if (type === 'avukat') router.push('/dashboard/avukat')
        else router.push('/dashboard/doktor')
      } catch { router.push('/giris/doktor') }
    }
    go()
  }, [router])
  return (
    <div style={{minHeight:'100vh',background:'#0A1628',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:24}}>
      <div style={{width:56,height:56,borderRadius:'50%',background:'#0F9B8E',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{color:'#fff',fontSize:28,fontWeight:700}}>N</span>
      </div>
      <div style={{width:40,height:40,borderRadius:'50%',border:'4px solid #0F9B8E',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />
      <p style={{color:'#fff',fontSize:16}}>Yükleniyor...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}