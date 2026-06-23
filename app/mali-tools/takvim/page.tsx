
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TakvimPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [müşteriler, setMüşteriler] = useState(0)
  const [kritikCount, setKritikCount] = useState(0)

  useEffect(() => { loadTakvim() }, [])

  async function loadTakvim(sendAlert = false) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/giris/mali'); return }
    setLoading(true)
    const res = await fetch('/api/mali/takvim' + (sendAlert ? '?sendAlert=true' : ''), {
      headers: { 'Authorization': 'Bearer ' + session.access_token }
    })
    const data = await res.json()
    if (data.success) { setItems(data.data.items); setMüşteriler(data.data.müşteriler); setKritikCount(data.data.kritikCount) }
    setLoading(false)
  }

  async function gonderAlert() { setSending(true); await loadTakvim(true); setSending(false) }

  const riskColor = (r: string) => r === 'kritik' ? '#DC2626' : r === 'uyari' ? '#D97706' : '#16A34A'
  const riskBg = (r: string) => r === 'kritik' ? '#FEF2F2' : r === 'uyari' ? '#FFFBEB' : '#F0FDF4'

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>Beyan Takvimi</span>
      </nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[['Toplam Beyan', items.length, '#1e3a5f'], ['Kritik', kritikCount, '#DC2626'], ['Müşteri', müşteriler, '#1B4332']].map(([l, v, c]) => (
            <div key={l as string} style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c as string }}>{v as number}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{l as string}</div>
            </div>
          ))}
        </div>
        {kritikCount > 0 && (
          <button onClick={gonderAlert} disabled={sending}
            style={{ width: '100%', padding: 14, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
            {sending ? 'Gonderiliyor...' : `${kritikCount} Kritik Uyariyi Telegram'a Gonder`}
          </button>
        )}
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Yükleniyor...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ background: riskBg(item.risk), border: `1px solid ${riskColor(item.risk)}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628' }}>{item.beyanTuru}</div>
                    {item.müşteriAdi && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.müşteriAdi}</div>}
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.kanun}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: riskColor(item.risk), fontSize: 14 }}>{item.sonGun}</div>
                    <div style={{ fontSize: 12, color: riskColor(item.risk) }}>{item.daysLeft <= 0 ? 'Gecti!' : item.daysLeft + ' gun'}</div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Onumuzdeki 60 gunde beyan yok</div>}
          </div>
        )}
      </div>
    </div>
  )
}
