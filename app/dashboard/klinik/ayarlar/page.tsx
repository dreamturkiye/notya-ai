'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

const SPECIALTIES = ['Estetik & Plastik Cerrahi','Dermatoloji','Sac Ekimi','Medikal Estetik','Longevity & Wellness','Fizyoterapi','Klinik Psikoloji','Diyetisyen','Ergoterapi','Odyoloji','Kardiyoloji','Pediatri','Noroloji','Dahiliye']

export default function AyarlarPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [adminName, setAdminName] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let t = ''
    try { const raw = localStorage.getItem('auth-token'); if (raw) t = JSON.parse(raw).access_token || '' } catch {}
    if (!t) { router.push('/giris'); return }
    setToken(t)
    Promise.all([
      fetch('/api/klinik/settings', { headers: { Authorization: `Bearer ${t}` } }),
      fetch('/api/klinik/me', { headers: { Authorization: `Bearer ${t}` } })
    ]).then(async ([sr, mr]) => {
      const sd = await sr.json(); const md = await mr.json()
      if (sd.success && sd.data) {
        setName(sd.data.name || ''); setCity(sd.data.city || ''); setPhone(sd.data.phone || '')
        setWebsite(sd.data.website || ''); setLogoUrl(sd.data.logo_url || '')
        setSelectedSpecialties(sd.data.specialty_focus || [])
      }
      if (md.success) setAdminName(md.data.adminName || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/klinik/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, phone, website, logo_url: logoUrl, specialty_focus: selectedSpecialties })
      })
      const data = await res.json()
      setMsg(data.success ? 'Ayarlar kaydedildi.' : (data.error || 'Kayit basarisiz.'))
    } catch { setMsg('Hata olustu.') } finally { setSaving(false) }
  }

  function toggleSpecialty(s: string) {
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(10,22,40,0.12)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontFamily: 'system-ui', color: '#0A1628', background: '#fff', boxSizing: 'border-box', outline: 'none' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#FFFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(10,22,40,0.4)' }}>Yukleniyor...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName={name || 'Klinik'} adminName={adminName} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, color: '#0A1628', marginBottom: '32px', letterSpacing: '-0.02em' }}>Klinik Ayarlari</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '6px' }}>Klinik Adi</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder='Klinik adiniz' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '6px' }}>Sehir</label>
                <input value={city} onChange={e => setCity(e.target.value)} style={inp} placeholder='Istanbul' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '6px' }}>Telefon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder='+90 212 000 00 00' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '6px' }}>Web Sitesi</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} style={inp} placeholder='https://kliniginiz.com' />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '6px' }}>Logo URL</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ ...inp, flex: 1 }} placeholder='https://...' />
                {logoUrl && <img src={logoUrl} alt='logo' style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(10,22,40,0.08)' }} onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', display: 'block', marginBottom: '10px' }}>Uzmanlik Alanlari</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SPECIALTIES.map(s => (
                  <button key={s} type='button' onClick={() => toggleSpecialty(s)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${selectedSpecialties.includes(s) ? '#2563EB' : 'rgba(10,22,40,0.15)'}`,
                    background: selectedSpecialties.includes(s) ? '#EEF4FF' : '#fff',
                    color: selectedSpecialties.includes(s) ? '#2563EB' : 'rgba(10,22,40,0.5)',
                    fontFamily: 'system-ui'
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {msg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', background: msg.includes('kaydedildi') ? 'rgba(0,168,157,0.08)' : 'rgba(220,38,38,0.08)', color: msg.includes('kaydedildi') ? '#00A89D' : '#DC2626' }}>
              {msg}
            </div>
          )}
          <button type='submit' disabled={saving} style={{ padding: '13px 32px', background: '#0A1628', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, alignSelf: 'flex-start' }}>
            {saving ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}