'use client'

/** NOTYA-SUT-01 + kapı 2. Yazmadan önce / Deftere yapıştır. İlaç kartını kesmez. */
import React, { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

const R = CHROME_RENK

interface Uyari { kod: string; seviye: 'kirmizi' | 'sari' | 'bilgi'; cumle: string }

export default function SeansKapilari({ noteId, onKilit }: { noteId: string; onKilit?: (kilit: boolean) => void }) {
  const [sut, setSut] = useState<Uyari[]>([])
  const [kilit, setKilit] = useState(false)
  const [mbys, setMbys] = useState<string | null>(null)
  const [kapi, setKapi] = useState<'kapali' | 'sari' | 'tam' | ''>('')
  const [gerekce, setGerekce] = useState('')
  const [hata, setHata] = useState('')
  const [kopya, setKopya] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const r = await fetch(`/api/doktor/seans-paketi?noteId=${encodeURIComponent(noteId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (j.kapali || j.kapi === 'kapali') { onKilit?.(false); return }
        setKapi(j.kapi)
        setSut(Array.isArray(j.sut) ? j.sut : [])
        setKilit(Boolean(j.kopyaKilit))
        setMbys(j.mbys || null)
        onKilit?.(Boolean(j.kopyaKilit))
      } catch { onKilit?.(false) }
    })()
  }, [noteId, onKilit])

  if (!kapi || kapi === 'kapali') return null

  const yineDe = async () => {
    setHata('')
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/seans-paketi', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ islem: 'yine_de_yaz', noteId, gerekce }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setHata(j.error || 'Kaydedilemedi.'); return }
    setKilit(false)
    onKilit?.(false)
  }

  const yapistir = async () => {
    if (!mbys) return
    try {
      await navigator.clipboard.writeText(mbys)
      setKopya('Kopyalandı')
      const t = await ensureDoctorAccessToken()
      await fetch('/api/doktor/seans-paketi', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ islem: 'mbys_kopyalandi', noteId }) })
    } catch { setHata('Kopyalanamadı.') }
  }

  const enabizIndir = async () => {
    setHata('')
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/seans-paketi', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ islem: 'enabiz', noteId }) })
    const j = await r.json().catch(() => ({}))
    if (!j.dosya) { setHata('e-Nabız çıktısı üretilmedi.'); return }
    const blob = new Blob([JSON.stringify(j.dosya, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'notya-enabiz-taslak.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const renk = (s: Uyari['seviye']) => s === 'kirmizi' ? '#8C2F2F' : s === 'sari' ? '#8A5A12' : R.muted

  return (
    <div className="yazdirma-gizle" style={{ maxWidth: 760, margin: '12px auto 0', display: 'grid', gap: 10 }}>
      <div style={{ padding: '12px 14px', background: '#fff', border: `1px solid ${R.border}`, borderRadius: 12, fontFamily: 'system-ui' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Yazmadan önce</div>
        {sut.length === 0 && <div style={{ fontSize: 13, color: R.muted }}>Bu paket için uyarı yok.</div>}
        {sut.map((u) => (
          <div key={`${u.kod}-${u.seviye}`} style={{ fontSize: 14, color: renk(u.seviye), marginBottom: 4 }}>{u.seviye === 'kirmizi' ? 'Kırmızı' : u.seviye === 'sari' ? 'Sarı' : 'Bilgi'} · {u.cumle}</div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <a href={`/dashboard/doktor/notlar/${noteId}/recete`} style={{ fontSize: 13, fontWeight: 700, color: R.pine }}>Düzelt</a>
          {kapi === 'tam' && kilit && (
            <>
              <input value={gerekce} onChange={(e) => setGerekce(e.target.value)} placeholder="Gerekçe" aria-label="Gerekçe" style={{ flex: '1 1 180px', minHeight: 36, borderRadius: 8, border: `1px solid ${R.border}`, padding: '0 8px' }} />
              <button type="button" onClick={() => void yineDe()} style={{ minHeight: 36, borderRadius: 8, border: 'none', background: R.pine, color: '#FAF8F4', fontWeight: 700, padding: '0 10px' }}>Yine de yaz — gerekçe</button>
            </>
          )}
          <button type="button" onClick={() => { setGerekce(''); setHata('') }} style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${R.border}`, background: '#fff' }}>Vazgeç</button>
        </div>
        {hata && <div style={{ color: '#8C2F2F', fontSize: 13, marginTop: 6 }}>{hata}</div>}
      </div>
      {mbys && (
        <div style={{ padding: '12px 14px', background: '#fff', border: `1px solid ${R.border}`, borderRadius: 12, fontFamily: 'system-ui' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Deftere yapıştır</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, margin: 0 }}>{mbys}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => void yapistir()} style={{ minHeight: 36, borderRadius: 8, border: 'none', background: R.pine, color: '#FAF8F4', fontWeight: 700, padding: '0 10px' }}>{kopya || 'Kopyala'}</button>
            <button type="button" onClick={() => void enabizIndir()} style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${R.border}`, background: '#fff', fontWeight: 600, padding: '0 10px' }}>e-Nabız şekli indir</button>
          </div>
        </div>
      )}
    </div>
  )
}
