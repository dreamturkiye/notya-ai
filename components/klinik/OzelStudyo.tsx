'use client'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { OZEL_TUVAL } from '@/lib/klinik/ozelTuvalKaydi'
import { STUDYO_KOPYA } from '@/lib/klinik/ozelStudyoKopya'

export default function OzelStudyo({ tanim }: { tanim: AracTanim }) {
  const hasta = useSearchParams().get('patientId') || ''
  const [girdi, setGirdi] = useState<Record<string, string>>({})
  const [kayit, setKayit] = useState('')
  const bugun = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const sonuc = useMemo(() => tanim.calistir(girdi, bugun), [tanim, girdi, bugun])
  const hazir = !('hata' in sonuc)
  const Tuval = OZEL_TUVAL[tanim.slug]

  function yaz(id: string, deger: string) {
    setGirdi((o) => ({ ...o, [id]: deger }))
    setKayit('')
  }

  async function kaydet() {
    if (!hazir) return
    if (!hasta) { setKayit('Hasta seçilmedi. Dosyadan aracı açın.'); return }
    const t = await ensureDoctorAccessToken()
    if (!t) { setKayit('Oturum yok.'); return }
    const r = await fetch('/api/ozel-brans/plan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: hasta, route: tanim.route, girdi }),
    })
    const j = await r.json().catch(() => ({}))
    setKayit(r.ok ? 'Hasta dosyasına yazıldı.' : (j.error || 'Kayıt yazılamadı.'))
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {tanim.alanlar.map((a) => (
        <label key={a.id} style={{ display: 'grid', gap: 4, fontSize: 13, color: '#3b2e24' }}>
          <span>{a.etiket}</span>
          {a.tur === 'onay' ? (
            <input type="checkbox" checked={girdi[a.id] === '1'} onChange={(e) => yaz(a.id, e.target.checked ? '1' : '')} />
          ) : a.tur === 'secim' ? (
            <select value={girdi[a.id] || ''} onChange={(e) => yaz(a.id, e.target.value)} style={inp}>
              <option value="">Seçin</option>
              {(a.secenekler || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : a.tur === 'coklu' ? (
            <div style={{ display: 'grid', gap: 4 }}>
              {(a.secenekler || []).map((s) => {
                const sec = (girdi[a.id] || '').split('|').filter(Boolean)
                const varMi = sec.includes(s)
                return (
                  <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={varMi} onChange={() => {
                      const sonra = varMi ? sec.filter((x) => x !== s) : [...sec, s]
                      yaz(a.id, sonra.join('|'))
                    }} />
                    <span>{s}</span>
                  </label>
                )
              })}
            </div>
          ) : (
            <input
              type={a.tur === 'sayi' ? 'number' : a.tur === 'tarih' ? 'date' : 'text'}
              value={girdi[a.id] || ''}
              onChange={(e) => yaz(a.id, e.target.value)}
              style={inp}
            />
          )}
        </label>
      ))}
      <p style={{ margin: 0, fontSize: 12, color: '#8b7d70' }}>{STUDYO_KOPYA[tanim.slug]}</p>
      {'hata' in sonuc ? (
        <p style={{ color: '#a45b3e', margin: 0 }}>{sonuc.hata}</p>
      ) : (
        <Tuval tanim={tanim} sonuc={sonuc} bugun={bugun} />
      )}
      <button type="button" onClick={kaydet} disabled={!hazir} style={{ justifySelf: 'start', padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 700, cursor: hazir ? 'pointer' : 'default' }}>
        Hasta dosyasına yaz
      </button>
      {kayit && <p style={{ margin: 0, fontSize: 13, color: '#3b2e24' }}>{kayit}</p>}
    </div>
  )
}

const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(58,44,34,0.16)', fontSize: 14 }
