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
  id: string | null
  name: string
  seat_count: number
  seats_used: number
  pabau_connected: boolean
  plan: string
}

const ROL_ETIKET: Record<string, string> = { member: 'Üye', admin: 'Yönetici' }
// DB'de saklanan eski ASCII uzmanlık değerleri — yalnız ekranda Türkçe karakterli etiket.
const UZMANLIK_ETIKET: Record<string, string> = { 'Sac Ekimi': 'Saç Ekimi', 'Noroloji': 'Nöroloji', 'Diger': 'Diğer' }

export default function KlinikDashboard() {
  const router = useRouter()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onizleme, setOnizleme] = useState(false)

  useEffect(() => {
    const init = async () => {
      let token = ''
      try {
        const raw = localStorage.getItem('auth-token')
        if (raw) { const p = JSON.parse(raw); token = p.access_token || '' }
        if (!token) {
          const key = Object.keys(localStorage).find((k) => k.includes('auth-token') || k.startsWith('sb-'))
          if (key) {
            const p = JSON.parse(localStorage.getItem(key) || '')
            token = p?.access_token || p?.session?.access_token || ''
          }
        }
      } catch {}
      if (!token) { router.push('/giris/klinik'); return }

      try {
        const res = await fetch('/api/klinik/me', { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401 || res.status === 403) { router.push('/giris/klinik'); return }
        const data = await res.json()
        if (data.success) {
          setClinic(data.data.clinic)
          setMembers(data.data.members || [])
          setAdminName(data.data.adminName || '')
          setOnizleme(Boolean(data.data.onizleme))
        } else {
          setError('Klinik bilgileri yüklenemedi.')
        }
      } catch {
        setError('Bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const kpiStyle = (highlight: boolean): React.CSSProperties => ({
    background: highlight ? 'rgba(47,67,52,0.08)' : '#faf6ee',
    border: `1px solid ${highlight ? '#2f4334' : 'rgba(58,44,34,0.08)'}`,
    borderRadius: '12px', padding: '24px', fontFamily: "'Source Sans 3', system-ui, sans-serif"
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Sans 3', system-ui, sans-serif", color: '#8b7d70' }}>
      Yükleniyor...
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Sans 3', system-ui, sans-serif", color: '#a45b3e' }}>
      {error}
    </div>
  )

  const activeMembers = members.filter(m => m.is_active).length

  return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <KlinikNav clinicName={clinic?.name || 'Klinik'} adminName={adminName} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 48px' }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '32px', fontWeight: 400, color: '#3b2e24', marginBottom: '8px', letterSpacing: '-0.025em' }}>
          Hoş geldiniz, {clinic?.name}
        </h1>
        <p style={{ fontSize: '14px', color: '#8b7d70', marginBottom: onizleme ? 12 : 40 }}>
          Klinik yöneticisi paneli
        </p>
        {onizleme && (
          <p style={{ fontSize: 13, color: '#8b7d70', marginBottom: 40 }}>
            Doktor hesabınızla Klinik yüzü açık. Araçlar 10 dalı gösterir. Klinik üyeliği yok — koltuk / Pabau boş kalır.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '48px' }}>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b7d70', marginBottom: '12px' }}>Toplam Kullanıcı</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#3b2e24', fontFamily: "'Fraunces', Georgia, serif" }}>{members.length}</div>
          </div>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b7d70', marginBottom: '12px' }}>Aktif Kullanıcı</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#3b2e24', fontFamily: "'Fraunces', Georgia, serif" }}>{activeMembers}</div>
          </div>
          <div style={kpiStyle(false)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b7d70', marginBottom: '12px' }}>Kullanılan Koltuk</div>
            <div style={{ fontSize: '36px', fontWeight: 300, color: '#3b2e24', fontFamily: "'Fraunces', Georgia, serif" }}>
              {clinic?.seats_used || 0}<span style={{ fontSize: '16px', color: '#8b7d70' }}>/{clinic?.seat_count || 5}</span>
            </div>
          </div>
          <div style={kpiStyle(!!clinic?.pabau_connected)}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b7d70', marginBottom: '12px' }}>Pabau</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: clinic?.pabau_connected ? '#2f4334' : '#8b7d70' }}>
              {clinic?.pabau_connected ? 'Bağlı' : 'Bağlı Değil'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '20px', fontWeight: 400, color: '#3b2e24' }}>Kullanıcılar</h2>
          <button onClick={() => router.push('/dashboard/klinik/kullanicilar')} style={{
            padding: '10px 20px', background: '#2f4334', border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
          }}>
            + Kullanıcı Davet Et
          </button>
        </div>

        <div style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(58,44,34,0.08)' }}>
                {['Ad Soyad', 'Uzmanlık', 'Rol', 'Durum'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b7d70', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', fontSize: '14px', color: '#8b7d70' }}>Henüz kullanıcı yok. Davet edin.</td></tr>
              ) : members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(58,44,34,0.045)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#3b2e24' }}>{m.users?.full_name || '-'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#8b7d70' }}>{m.specialty ? (UZMANLIK_ETIKET[m.specialty] || m.specialty) : '-'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#8b7d70' }}>{ROL_ETIKET[m.role] || m.role}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: m.is_active ? 'rgba(47,67,52,0.1)' : 'rgba(245,158,11,0.1)', color: m.is_active ? '#2f4334' : '#D97706' }}>
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