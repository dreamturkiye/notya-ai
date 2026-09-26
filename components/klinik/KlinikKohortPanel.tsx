'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { klinikKohortDerle, type KlinikKohortSatir } from '@/lib/klinik/klinikKayit'
import { klinikDefterOku } from '@/lib/klinik/klinikKayitIstemci'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

const RENK: Record<KlinikKohortSatir['durum'], string> = {
  '112': '#DC2626',
  'riza-eksik': '#D97706',
  gecikti: '#B45309',
  bugun: '#2563EB',
  yaklasiyor: '#059669',
}

const DURUM_ETIKET: Record<KlinikKohortSatir['durum'], string> = {
  '112': '112',
  'riza-eksik': 'RIZA EKSİK',
  gecikti: 'GECİKTİ',
  bugun: 'BUGÜN',
  yaklasiyor: 'YAKLAŞIYOR',
}

export default function KlinikKohortPanel() {
  const router = useRouter()
  const [satir, setSatir] = useState<KlinikKohortSatir[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = token()
      if (!t) { router.push('/giris'); return }
      const bugun = new Date().toISOString().slice(0, 10)
      const bas = new Date(); bas.setDate(bas.getDate() - 21)
      const bit = new Date(); bit.setDate(bit.getDate() + 14)
      const [me, p, rv] = await Promise.all([
        fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }),
        fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(bas.toISOString())}&bitis=${encodeURIComponent(bit.toISOString())}`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
      ])
      const mj = me.ok ? await me.json() : null
      const pj = p.ok ? await p.json() : null
      const rj = rv.ok ? await rv.json() : null
      const userId = String(mj?.data?.id || mj?.data?.user_id || '')
      const dal = klinikSlugCoz(mj?.data?.specialty) || 'sac-ekimi'
      const hastalar = (pj?.patients || []).map((h: { id: string; name?: string; ad_soyad?: string; last_visit?: string }) => ({
        id: h.id,
        name: h.name || h.ad_soyad || 'Hasta',
        last_visit: h.last_visit,
      }))
      const randevular = (rj?.randevular || []).map((x: { patientId?: string; hastaAdi?: string; baslangic?: string }) => ({
        patientId: x.patientId,
        hastaAdi: x.hastaAdi || 'Hasta',
        baslangic: x.baslangic || '',
      }))
      const derlenen = klinikKohortDerle({ dal, bugun, hastalar, randevular, defter: klinikDefterOku(userId) })
      if (!iptal) {
        setSatir(derlenen)
        setYukleniyor(false)
      }
    })()
    return () => { iptal = true }
  }, [router])

  if (yukleniyor) return <p style={{ color: 'rgba(10,22,40,0.45)' }}>Kohort yükleniyor…</p>
  if (!satir.length) {
    return <p style={{ color: 'rgba(10,22,40,0.5)', fontSize: 14 }}>Geciken izlem, eksik rıza veya 112 bayrağı yok. Seans kaydı dosyada tutulur — SBİYS iddia edilmez.</p>
  }
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12 }}>
      {satir.map((s) => (
        <button
          key={`${s.patientId}-${s.durum}-${s.vade || ''}`}
          type="button"
          onClick={() => s.patientId.startsWith('rv-') ? undefined : router.push(`/dashboard/klinik/hastalar/${s.patientId}`)}
          style={{ width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none', borderBottom: '1px solid rgba(10,22,40,0.06)', background: '#fff', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <b style={{ color: '#0A1628' }}>{s.ad}</b>
            <span style={{ fontSize: 11, fontWeight: 700, color: RENK[s.durum], textTransform: 'uppercase' }}>{DURUM_ETIKET[s.durum]}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.55)', marginTop: 4 }}>{s.ozet}</div>
        </button>
      ))}
    </div>
  )
}
