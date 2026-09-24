'use client'
/**
 * GOGUS-EXCEPTIONAL-01 — Araçlar › Göğüs kohort paneli.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { gogusStil, Rozet } from './GogusAracKabugu'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { GOGUS_BAYRAK_AD, type GogusKohortBayrak } from '../../engines/kohort'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const S = gogusStil

type Satir = {
  patientId: string
  ad: string
  bayraklar: GogusKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

export default function GogusKohortAraci() {
  const [satirlar, setSatirlar] = useState<Satir[]>([])
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gogus-hastaliklari/kohort', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (r.ok) setSatirlar(j.satirlar || [])
      else setMesaj(j.error || 'Yüklenemedi')
    } catch { setMesaj('Yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const hatirlat = async (patientId: string) => {
    setMesaj('')
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gogus-hastaliklari/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })
      const j = await r.json().catch(() => ({}))
      setMesaj(r.ok ? 'Hatırlatma gönderildi.' : (j.error || 'Gönderilemedi'))
    } catch { setMesaj('Gönderilemedi') }
  }

  return (
    <div style={S.kutu}>
      <div style={S.etiket}>Göğüs kohortu</div>
      <p style={S.kucuk}>Geciken kontrol, spirometri, açık kırmızı bayrak ve inhaler teknik. Hatırlatma metni tanı/skor/doz taşımaz.</p>
      {yukleniyor && <div style={S.kucuk}>Yükleniyor…</div>}
      {!yukleniyor && !satirlar.length && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
      {satirlar.map((s) => (
        <div key={s.patientId} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{s.ad}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {s.bayraklar.map((b) => <Rozet key={b} ton={b === 'risk_acik' ? 'uyari' : 'notr'}>{GOGUS_BAYRAK_AD[b]}</Rozet>)}
            </div>
          </div>
          <button type="button" onClick={() => hatirlat(s.patientId)} style={{ background: '#0284C7', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>
            Hatırlat
          </button>
        </div>
      ))}
      {mesaj && <div style={{ ...S.kucuk, marginTop: 8 }}>{mesaj}</div>}
    </div>
  )
}
