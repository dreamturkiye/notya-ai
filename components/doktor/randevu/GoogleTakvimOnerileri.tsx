'use client'
/**
 * NOTYA-RANDEVU-V2 PR2 — a Notya appointment moved or deleted in Google Takvim, shown as a proposal:
 * "Uygula" takes Google's change, "Yoksay" keeps Notya's (Notya wins; the event is put back). Never applied silently.
 * Doctor only; renders nothing when there is nothing to decide (or Google Takvim is dormant).
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK
type Oneri = { id: string; tur: 'tasindi' | 'silindi'; eskiBaslangic: string | null; yeniBaslangic: string | null }

const zaman = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—'

/** One line per proposal. Pure, exported for the test. */
export function oneriMetni(o: Pick<Oneri, 'tur' | 'eskiBaslangic' | 'yeniBaslangic'>): string {
  return o.tur === 'silindi'
    ? `${zaman(o.eskiBaslangic)} randevusu Google Takvim’de silindi.`
    : `${zaman(o.eskiBaslangic)} randevusu Google Takvim’de ${zaman(o.yeniBaslangic)} saatine taşındı.`
}

export default function GoogleTakvimOnerileri({ kartStili }: { kartStili?: React.CSSProperties } = {}) {
  const [oneriler, setOneriler] = useState<Oneri[]>([])
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch('/api/doktor/google-takvim/oneriler', { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json().catch(() => ({}))
      setOneriler(r.ok ? j.oneriler || [] : [])
    } catch { setOneriler([]) }
  }, [])
  useEffect(() => { void yukle() }, [yukle])

  const yanitla = async (id: string, islem: 'uygula' | 'yoksay') => {
    setMesgul(true); setHata('')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch('/api/doktor/google-takvim/oneriler', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, islem }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) setHata(j.error || 'İşlem yapılamadı.')
      await yukle()
    } finally { setMesgul(false) }
  }

  if (!oneriler.length) return null
  const dugme = (vurgu: boolean): React.CSSProperties => ({ minHeight: 34, padding: '5px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: vurgu ? 'none' : `1px solid ${R.border}`, background: vurgu ? R.pine : 'transparent', color: vurgu ? R.paper : R.ink })
  return (
    <div style={{ background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, padding: '14px 18px', fontFamily: CHROME_FONT.sans, color: R.ink, ...kartStili }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Google Takvim’de değişen randevular</div>
      {oneriler.map((o) => (
        <div key={o.id} style={{ borderTop: `1px solid ${R.borderSoft}`, padding: '8px 0' }}>
          <div style={{ fontSize: 14 }}>{oneriMetni(o)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="button" disabled={mesgul} style={dugme(true)} onClick={() => void yanitla(o.id, 'uygula')}>{o.tur === 'silindi' ? 'Randevuyu iptal et' : 'Yeni saati uygula'}</button>
            <button type="button" disabled={mesgul} style={dugme(false)} onClick={() => void yanitla(o.id, 'yoksay')}>Notya’daki kalsın</button>
          </div>
        </div>
      ))}
      {hata && <div style={{ color: R.warn, fontSize: 13, marginTop: 6 }}>{hata}</div>}
    </div>
  )
}
