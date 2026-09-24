'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

export const dynamic = 'force-dynamic'

type Rv = { id: string; baslangic: string; bitis: string; hastaAdi: string; patientId?: string | null; durum: string }

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

function gunAraligi(d: Date) {
  const bas = new Date(d); bas.setHours(0, 0, 0, 0)
  const bit = new Date(d); bit.setHours(23, 59, 59, 999)
  return { baslangic: bas.toISOString(), bitis: bit.toISOString() }
}

export default function KlinikRandevularPage() {
  const router = useRouter()
  const [gun, setGun] = useState(() => new Date().toISOString().slice(0, 10))
  const [liste, setListe] = useState<Rv[]>([])
  const [hata, setHata] = useState('')
  const [ad, setAd] = useState('')
  const [saat, setSaat] = useState('10:00')

  const aralik = useMemo(() => gunAraligi(new Date(gun + 'T12:00:00')), [gun])

  async function yukle() {
    const t = token()
    if (!t) { router.push('/giris'); return }
    const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(aralik.baslangic)}&bitis=${encodeURIComponent(aralik.bitis)}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setHata(j.error || 'Randevular alınamadı.'); return }
    setListe(j.randevular || [])
  }

  useEffect(() => { void yukle() }, [aralik.baslangic, aralik.bitis])

  async function ekle() {
    setHata('')
    const t = token()
    if (!ad.trim()) { setHata('Hasta adı zorunlu.'); return }
    const bas = new Date(`${gun}T${saat}:00`)
    const bit = new Date(bas.getTime() + 30 * 60000)
    const r = await fetch('/api/doktor/randevular', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hastaAdiSerbest: ad.trim(), baslangic: bas.toISOString(), bitis: bit.toISOString(), tur: 'seans' }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setHata(j.error || 'Randevu eklenemedi.'); return }
    setAd('')
    await yukle()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 72px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, color: '#0A1628' }}>Randevular</h1>
        <p style={{ color: 'rgba(10,22,40,0.55)', fontSize: 14 }}>Klinik takvimi Doktor ekranından ayrıdır; aynı çakışma ve izolasyon kuralları geçerlidir.</p>
        <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="date" value={gun} onChange={(e) => setGun(e.target.value)} style={inp} />
          <input type="time" value={saat} onChange={(e) => setSaat(e.target.value)} style={inp} />
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Hasta adı" style={inp} />
          <button type="button" onClick={() => void ekle()} style={btn}>Randevu ekle</button>
        </div>
        {hata && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 10 }}>{hata}</p>}
        <div style={{ marginTop: 20, background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12 }}>
          {liste.length === 0 ? (
            <p style={{ padding: 24, color: 'rgba(10,22,40,0.4)' }}>Bu günde randevu yok.</p>
          ) : liste.map((rv) => (
            <div key={rv.id} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(10,22,40,0.06)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0A1628' }}>{rv.hastaAdi}</div>
                <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.5)' }}>{new Date(rv.baslangic).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {rv.durum}</div>
              </div>
              {rv.patientId && (
                <button type="button" onClick={() => router.push(`/dashboard/klinik/seans?patientId=${rv.patientId}`)} style={btn}>Seansı başlat</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(10,22,40,0.12)', fontSize: 14 }
const btn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }
