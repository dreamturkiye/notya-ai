'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

interface Member {
  id: string
  role: string
  specialty: string
  is_active: boolean
  joined_at: string
  users: { id: string; full_name: string; email: string }
}

interface Clinic {
  id: string
  name: string
  seat_count: number
  seats_used: number
  pabau_connected: boolean
  plan: string
}

export default function KlinikDashboard() {
  const router = useRouter()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      let token = ''
      try {
        const raw = localStorage.getItem('auth-token')
        if (raw) { const p = JSON.parse(raw); token = p.access_token || '' }
      } catch {}
      if (!token) { router.push('/giris'); return }

      try {
        const res = await fetch('/api/klinik/me', { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401 || res.status === 403) { router.push('/giris'); return }
        const data = await res.json()
        if (data.success) {
          setClinic(data.data.clinic)
          setMembers(data.data.members || [])
          setAdminName(data.data.adminName || '')
        } else {
          setError('Klinik bilgileri yuklenemedi.')
        }
      } catch {
        setError('Bir hata olustu.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const kpiStyle = (highlight: boolean): React.CSSProperties => ({
    background: highlight ? '#EEF4FF' : '#fff',
    border: `1px solid ${highlight ? '#2563EB' : 'rgba(10,22,40,0.08)'}`,
    borderRadius: '12px', padding: '24px', fontFamily: 'system-ui'
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: 'rgba(10,22,40,0.4)' }}>
      Yukleniyor...
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#DC2626' }}>
      {error}
    </div>
  )

  const activeMembers = members.filter(m => m.is_active).length

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName={clinic?.name || 'Klinik'} adminName={adminName} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 48px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 400, color: '#0A1628', marginBottom: '8px', letterSpacing: '-0.025em' }}>
          Hosgeldiniz, {clinic?.name}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(10,22,40,0.45)', marginBottom: '40px' }}>
          Klinik yoneticisi paneli
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '48px' }}>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,22,40,0.35)', marginBottom: '12px' }}>Toplam Kullanici</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#0A1628', fontFamily: 'Georgia, serif' }}>{members.length}</div>
          </div>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,22,40,0.35)', marginBottom: '12px' }}>Aktif Kullanici</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#0A1628', fontFamily: 'Georgia, serif' }}>{activeMembers}</div>
          </div>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,22,40,0.35)', marginBottom: '12px' }}>Kullanilan Koltuk</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#0A1628', fontFamily: 'Georgia, serif' }}>
              {clinic?.seats_used || 0}<span style={{ fontSize: '16px', color: 'rgba(10,22,40,0.3)' }}>/{clinic?.seat_count || 5}</span>
            </div>
          </div>
          <div style={kpiStyle(!!clinic?.pabau_connected)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,22,40,0.35)', marginBottom: '12px' }}>Pabau</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: clinic?.pabau_connected ? '#00A89D' : 'rgba(10,22,40,0.4)' }}>
              {clinic?.pabau_connected ? 'Baglõ' : 'Bagli Degil'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 400, color: '#0A1628' }}>Kullanicilar</h2>
          <button onClick={() => router.push('/dashboard/klinik/kullanicilar')} style={{
            padding: '10px 20px', background: '#2563EB', border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
          }}>
            + Kullanici Davet Et
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(10,22,40,0.06)' }}>
                {['Ad Soyad', 'Uzmanlik', 'Rol', 'Durum'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(10,22,40,0.35)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', fontSize: '14px', color: 'rgba(10,22,40,0.3)' }}>Henuz kullanici yok. Davet edin.</td></tr>
              ) : members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(10,22,40,0.04)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#0A1628' }}>{m.users?.full_name || '-'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: 'rgba(10,22,40,0.6)' }}>{m.specialty || '-'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: 'rgba(10,22,40,0.6)', textTransform: 'capitalize' }}>{m.role}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: m.is_active ? 'rgba(0,168,157,0.1)' : 'rgba(245,158,11,0.1)', color: m.is_active ? '#00A89D' : '#D97706' }}>
                      {m.is_active ? 'Aktif' : 'Davet Bekliyor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}