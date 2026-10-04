'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

const SPECIALTIES = ['Estetik & Plastik Cerrahi','Dermatoloji','Sac Ekimi','Medikal Estetik','Longevity & Wellness','Fizyoterapi','Klinik Psikoloji','Diyetisyen','Ergoterapi','Odyoloji','Kardiyoloji','Pediatri','Noroloji','Dahiliye']

// Değerler DB'de saklanıyor (klinikUzmanlikNorm eşler) — yalnız ekranda Türkçe karakterli etiket.
const UZMANLIK_ETIKET: Record<string, string> = { 'Sac Ekimi': 'Saç Ekimi', 'Noroloji': 'Nöroloji' }

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
      setMsg(data.success ? 'Ayarlar kaydedildi.' : (data.error || 'Kayıt başarısız.'))
    } catch { setMsg('Bir hata oluştu.') } finally { setSaving(false) }
  }

  function toggleSpecialty(s: string) {
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(58,44,34,0.14)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontFamily: "'Source Sans 3', system-ui, sans-serif", color: '#3b2e24', background: '#faf6ee', boxSizing: 'border-box', outline: 'none' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#f4eee3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7d70' }}>Yükleniyor...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <KlinikNav clinicName={name || 'Klinik'} adminName={adminName} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px' }}>
        <a href="/dashboard/klinik" style={{ color: '#8b7d70', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Klinik</a>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#3b2e24', margin: '12px 0 32px', letterSpacing: '-0.02em' }}>Klinik Ayarları</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Klinik Adı</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder='Klinik adınız' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Şehir</label>
                <input value={city} onChange={e => setCity(e.target.value)} style={inp} placeholder='İstanbul' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Telefon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder='+90 212 000 00 00' />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Web Sitesi</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} style={inp} placeholder='https://kliniginiz.com' />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Logo URL</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ ...inp, flex: 1 }} placeholder='https://...' />
                {logoUrl && <img src={logoUrl} alt='logo' style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(58,44,34,0.08)' }} onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '10px' }}>Uzmanlık Alanları</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SPECIALTIES.map(s => (
                  <button key={s} type='button' onClick={() => toggleSpecialty(s)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${selectedSpecialties.includes(s) ? '#2f4334' : 'rgba(58,44,34,0.14)'}`,
                    background: selectedSpecialties.includes(s) ? 'rgba(47,67,52,0.08)' : '#faf6ee',
                    color: selectedSpecialties.includes(s) ? '#2f4334' : '#8b7d70',
                    fontFamily: "'Source Sans 3', system-ui, sans-serif"
                  }}>
                    {UZMANLIK_ETIKET[s] || s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {msg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', background: msg.includes('kaydedildi') ? 'rgba(47,67,52,0.08)' : 'rgba(164,91,62,0.08)', color: msg.includes('kaydedildi') ? '#2f4334' : '#a45b3e' }}>
              {msg}
            </div>
          )}
          <button type='submit' disabled={saving} style={{ padding: '13px 32px', background: '#2f4334', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, alignSelf: 'flex-start' }}>
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}