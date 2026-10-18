'use client'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { ozelSonucDuzeni } from '@/lib/klinik/ozelSonucDuzeni'
import { STUDYO_KOPYA } from '@/lib/klinik/ozelStudyoKopya'

export default function OzelStudyo({ tanim }: { tanim: AracTanim }) {
  const hasta = useSearchParams().get('patientId') || ''
  const [girdi, setGirdi] = useState<Record<string, string>>({})
  const [kayit, setKayit] = useState('')
  const bugun = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const sonuc = useMemo(() => tanim.calistir(girdi, bugun), [tanim, girdi, bugun])
  const hazir = !('hata' in sonuc)

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
        <SonucKart tanim={tanim} sonuc={sonuc} bugun={bugun} />
      )}
      <button type="button" onClick={kaydet} disabled={!hazir} style={{ justifySelf: 'start', padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 700, cursor: hazir ? 'pointer' : 'default' }}>
        Hasta dosyasına yaz
      </button>
      {kayit && <p style={{ margin: 0, fontSize: 13, color: '#3b2e24' }}>{kayit}</p>}
    </div>
  )
}

function SonucKart({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const duzen = ozelSonucDuzeni(tanim.route)
  const satirlar = portalSatirlari(sonuc.vadeler, bugun)
  if (duzen === 'acil') {
    return (
      <div style={{ borderRadius: 12, padding: 14, background: sonuc.acil ? '#a45b3e' : '#faf6ee', color: sonuc.acil ? '#fff' : '#3b2e24' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>{sonuc.acil ? '112' : 'BAND'}</div>
        <p style={{ margin: '6px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </div>
    )
  }
  if (duzen === 'seri') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>{sonuc.ozet}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {satirlar.map((s) => (
            <span key={s.ad} style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>
          ))}
        </div>
      </div>
    )
  }
  if (duzen === 'olcu') {
    return (
      <div style={{ background: '#faf6ee', borderLeft: `4px solid ${tanim.renk}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tanim.renk }}>KARAR DESTEĞİ</div>
        <p style={{ margin: '6px 0 0' }}>{sonuc.ozet}</p>
      </div>
    )
  }
  return (
    <div style={{ background: '#faf6ee', borderRadius: 12, padding: 12 }}>
      {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => (
        <p key={satir} style={{ margin: '0 0 6px' }}>{satir}</p>
      ))}
    </div>
  )
}

const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(58,44,34,0.16)', fontSize: 14 }
