'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

const SPECIALTIES = ['Estetik & Plastik Cerrahi','Dermatoloji','Sac Ekimi','Medikal Estetik','Longevity & Wellness','Fizyoterapi','Klinik Psikoloji','Diyetisyen','Ergoterapi','Odyoloji','Kardiyoloji','Pediatri','Noroloji','Dahiliye','Diger']
// Değerler DB'de saklanıyor (klinikUzmanlikNorm eşler) — yalnız ekranda Türkçe karakterli etiket.
const UZMANLIK_ETIKET: Record<string, string> = { 'Sac Ekimi': 'Saç Ekimi', 'Noroloji': 'Nöroloji', 'Diger': 'Diğer' }
const uzmanlikEtiket = (s: string) => UZMANLIK_ETIKET[s] || s
const ROL_ETIKET: Record<string, string> = { member: 'Üye', admin: 'Yönetici' }

export default function KullanicilarPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [clinicName, setClinicName] = useState('Klinik')
  const [adminName, setAdminName] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [role, setRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteToken, setInviteToken] = useState('')

  useEffect(() => {
    let t = ''
    try { const raw = localStorage.getItem('auth-token'); if (raw) t = JSON.parse(raw).access_token || '' } catch {}
    if (!t) { router.push('/giris'); return }
    setToken(t)
    fetchData(t)
  }, [router])

  async function fetchData(t: string) {
    setLoading(true)
    try {
      const [meRes, membersRes] = await Promise.all([
        fetch('/api/klinik/me', { headers: { Authorization: `Bearer ${t}` } }),
        fetch('/api/klinik/members', { headers: { Authorization: `Bearer ${t}` } })
      ])
      const me = await meRes.json()
      const mem = await membersRes.json()
      if (me.success) { setClinicName(me.data.clinic?.name || 'Klinik'); setAdminName(me.data.adminName || '') }
      if (mem.success) { setMembers(mem.data.members || []); setInvitations(mem.data.pendingInvitations || []) }
    } catch {} finally { setLoading(false) }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setInviting(true); setInviteMsg(''); setInviteToken('')
    try {
      const res = await fetch('/api/klinik/members', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, specialty, role })
      })
      const data = await res.json()
      if (data.success) {
        setInviteMsg('Davet oluşturuldu!')
        setInviteToken(data.data.token)
        setEmail(''); setSpecialty(''); setRole('member')
        fetchData(token)
      } else { setInviteMsg(data.error || 'Davet gönderilemedi.') }
    } catch { setInviteMsg('Bir hata oluştu.') } finally { setInviting(false) }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Bu kullanıcıyı kaldıracaksınız. Emin misiniz?')) return
    await fetch('/api/klinik/members', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    fetchData(token)
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(58,44,34,0.14)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontFamily: "'Source Sans 3', system-ui, sans-serif", color: '#3b2e24', background: '#faf6ee', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <KlinikNav clinicName={clinicName} adminName={adminName} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px' }}>
        <a href="/dashboard/klinik" style={{ color: '#8b7d70', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Klinik</a>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '28px', fontWeight: 400, color: '#3b2e24', margin: '12px 0 32px', letterSpacing: '-0.02em' }}>Kullanıcı Yönetimi</h1>

        <div style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(58,44,34,0.08)' }}>
                {['Ad Soyad','E-posta','Uzmanlık','Rol','Durum','İşlemler'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b7d70', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#8b7d70' }}>Yükleniyor...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#8b7d70' }}>Henüz kullanıcı yok.</td></tr>
              ) : members.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(58,44,34,0.045)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3b2e24' }}>{m.users?.full_name || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8b7d70' }}>{m.users?.email || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8b7d70' }}>{m.specialty ? uzmanlikEtiket(m.specialty) : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8b7d70' }}>{ROL_ETIKET[m.role] || m.role}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: m.is_active ? 'rgba(47,67,52,0.1)' : 'rgba(245,158,11,0.1)', color: m.is_active ? '#2f4334' : '#D97706' }}>
                      {m.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleRemove(m.users?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#a45b3e' }}>Kaldır</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#3b2e24', marginBottom: '24px' }}>Kullanıcı Davet Et</h2>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>E-posta</label>
              <input type='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='doktor@klinik.com' style={inp} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Uzmanlık</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={inp}>
                  <option value=''>Seçin</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{uzmanlikEtiket(s)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#8b7d70', display: 'block', marginBottom: '6px' }}>Rol</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
                  <option value='member'>Üye</option>
                  <option value='admin'>Yönetici</option>
                </select>
              </div>
            </div>
            {inviteMsg && (
              <div style={{ fontSize: '13px', color: inviteMsg.includes('!') ? '#2f4334' : '#a45b3e', padding: '10px', background: inviteMsg.includes('!') ? 'rgba(47,67,52,0.08)' : 'rgba(164,91,62,0.08)', borderRadius: '8px' }}>
                {inviteMsg}
                {inviteToken && <div style={{ marginTop: '6px', fontSize: '12px', wordBreak: 'break-all', color: '#8b7d70' }}>Davet kodu:{inviteToken}</div>}
              </div>
            )}
            <button type='submit' disabled={inviting} style={{ padding: '12px 24px', background: '#2f4334', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.7 : 1, alignSelf: 'flex-start' }}>
              {inviting ? 'Gönderiliyor...' : 'Davet Gönder'}
            </button>
          </form>
        </div>

        {invitations.length > 0 && (
          <div style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '12px', padding: '32px' }}>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#3b2e24', marginBottom: '20px' }}>Bekleyen Davetler</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invitations.map((inv: any) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f4eee3', borderRadius: '8px', border: '1px solid rgba(58,44,34,0.08)' }}>
                  <span style={{ fontSize: '14px', color: '#3b2e24' }}>{inv.email}</span>
                  <span style={{ fontSize: '12px', color: '#8b7d70' }}>Son kullanım:{new Date(inv.expires_at).toLocaleDateString('tr-TR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}