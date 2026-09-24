'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'

export const dynamic = 'force-dynamic'

type Hasta = { id: string; name: string; last_visit?: string; is_active?: boolean }

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

export default function KlinikHastalarPage() {
  const router = useRouter()
  const [hastalar, setHastalar] = useState<Hasta[]>([])
  const [q, setQ] = useState('')
  const [ad, setAd] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle() {
    const t = token()
    if (!t) { router.push('/giris'); return }
    const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` } })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setHata(j.error || 'Hastalar alınamadı.'); setYukleniyor(false); return }
    setHastalar(j.patients || [])
    setYukleniyor(false)
  }

  useEffect(() => { void yukle() }, [])

  async function ekle() {
    setHata('')
    const t = token()
    if (!ad.trim()) { setHata('Ad soyad zorunlu.'); return }
    const r = await fetch('/api/doktor/hastalar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ adSoyad: ad.trim() }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setHata(j.error || 'Hasta eklenemedi.'); return }
    setAd('')
    await yukle()
    if (j.patient?.id) router.push(`/dashboard/klinik/hastalar/${j.patient.id}`)
  }

  const filtre = q.trim()
    ? hastalar.filter((h) => h.name.toLocaleLowerCase('tr-TR').includes(q.trim().toLocaleLowerCase('tr-TR')))
    : hastalar

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 72px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, color: '#0A1628' }}>Hastalar</h1>
        <p style={{ color: 'rgba(10,22,40,0.55)', fontSize: 14, maxWidth: 640 }}>
          Klinik hasta kaydı Doktor dosyasından ayrı yüzeydir; aynı izolasyon kuralı geçerlidir
          (yalnız sizin kaydınız). TUS sekmeleri burada açılmaz.
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara" style={inp} />
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Yeni hasta adı soyadı" style={inp} />
          <button type="button" onClick={() => void ekle()} style={btn}>Hasta ekle</button>
        </div>
        {hata && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 10 }}>{hata}</p>}
        <div style={{ marginTop: 22, background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          {yukleniyor ? (
            <p style={{ padding: 24, color: 'rgba(10,22,40,0.4)' }}>Yükleniyor…</p>
          ) : filtre.length === 0 ? (
            <p style={{ padding: 24, color: 'rgba(10,22,40,0.4)' }}>Henüz hasta yok. Ad soyad yazıp ekleyin.</p>
          ) : filtre.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => router.push(`/dashboard/klinik/hastalar/${h.id}`)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px', border: 'none', borderBottom: '1px solid rgba(10,22,40,0.06)', background: '#fff', cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 600, color: '#0A1628' }}>{h.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.45)', marginTop: 4 }}>{h.last_visit ? new Date(h.last_visit).toLocaleDateString('tr-TR') : '—'}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(10,22,40,0.12)', fontSize: 14, minWidth: 200 }
const btn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }
