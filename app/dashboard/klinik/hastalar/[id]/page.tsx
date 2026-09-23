'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import KlinikNav from '@/components/klinik/KlinikNav'
import KlinikBolumHome from '@/components/klinik/KlinikBolumHome'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { klinikDefterOku } from '@/lib/klinik/klinikKayitIstemci'
import type { KlinikSeansKayit } from '@/lib/klinik/klinikKayit'

export const dynamic = 'force-dynamic'

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

export default function KlinikHastaDosyaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ad, setAd] = useState('Hasta')
  const [dal, setDal] = useState('')
  const [hata, setHata] = useState('')
  const [seanslar, setSeanslar] = useState<KlinikSeansKayit[]>([])
  const [vade, setVade] = useState('')

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = token()
      if (!t) { router.push('/giris'); return }
      const [p, me] = await Promise.all([
        fetch(`/api/doktor/hastalar/${id}`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }),
      ])
      if (p.status === 404) { if (!iptal) setHata('Hasta bulunamadı.'); return }
      const pj = p.ok ? await p.json() : null
      const mj = me.ok ? await me.json() : null
      const uid = String(mj?.data?.id || mj?.data?.user_id || '')
      const kayit = uid ? klinikDefterOku(uid)[id] : undefined
      if (!iptal) {
        setAd(pj?.patient?.ad_soyad || pj?.patient?.name || 'Hasta')
        setDal(mj?.data?.specialty || '')
        setSeanslar(kayit?.seanslar || [])
        setVade(kayit?.sonrakiVade ? `${kayit.vadeEtiket || 'İzlem'} · ${kayit.sonrakiVade}` : '')
      }
    })()
    return () => { iptal = true }
  }, [id, router])

  const slug = klinikSlugCoz(dal)
  const araclar = klinikAraclariListesi(dal)

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 72px' }}>
        <Link href="/dashboard/klinik/hastalar" style={{ fontSize: 13, color: '#2563EB' }}>← Hastalar</Link>
        <h1 style={{ margin: '12px 0 8px', fontSize: 26, color: '#0A1628' }}>{ad}</h1>
        {hata && <p style={{ color: '#DC2626' }}>{hata}</p>}
        <p style={{ color: 'rgba(10,22,40,0.55)', fontSize: 14 }}>Klinik dosya — Doktor TUS sekmeleri yok. Seans kaydı yerelde tutulur; SBİYS iddia edilmez.</p>
        {vade && <p style={{ fontSize: 13, color: '#065F46' }}>Sonraki vade: {vade}</p>}
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => router.push(`/dashboard/klinik/seans?patientId=${id}`)} style={btn}>Seansı başlat</button>
          <button type="button" onClick={() => router.push(`/klinik-tools/hasta-portali?patientId=${id}`)} style={{ ...btn, background: '#059669' }}>Portal ver</button>
          <button type="button" onClick={() => router.push('/dashboard/klinik/randevular')} style={{ ...btn, background: '#fff', color: '#2563EB', border: '1px solid #2563EB' }}>Randevular</button>
        </div>
        {seanslar.length > 0 && (
          <>
            <h2 style={{ margin: '28px 0 12px', fontSize: 16, color: '#0A1628' }}>Seans kaydı</h2>
            {seanslar.slice(0, 6).map((s) => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 13 }}>
                <b>{s.iso}</b> · {s.metin}
                <div style={{ color: 'rgba(10,22,40,0.5)', fontSize: 12, marginTop: 4 }}>
                  {s.rizaIkiNusha ? 'iki nüsha rıza' : 'rıza eksik'}{s.kriz112 ? ' · 112' : ''}
                </div>
              </div>
            ))}
          </>
        )}
        {slug && (
          <div style={{ marginTop: 28, background: '#0D1526', borderRadius: 14, padding: 16 }}>
            <KlinikBolumHome slug={slug} patientId={id} />
          </div>
        )}
        <h2 style={{ margin: '28px 0 12px', fontSize: 16, color: '#0A1628' }}>Dal araçları</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {araclar.map((a) => (
            <button key={a.route} type="button" onClick={() => router.push(a.route)} style={kart}>
              <div style={{ fontWeight: 700, color: '#0A1628' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.5)', marginTop: 6 }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }
const kart: React.CSSProperties = { textAlign: 'left', background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12, padding: 14, cursor: 'pointer' }
