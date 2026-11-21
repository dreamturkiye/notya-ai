'use client'

/**
 * DIKTE-TIBBI-01 (c) — "Dikte sözlüğüm" in Ayşe'nin hafızası: the doctor's personal "heard → correct" terms.
 * Learned from his corrections (note approval, the dictated text before "Seansı Bitir") or typed here; used from the
 * next dictation on (repair + Scribe keyterms). Visible, deletable, never shared with another doctor.
 */
import { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

interface Satir { id: string; duyulan: string; dogru: string; kaynak: 'elle' | 'not_duzeltme' | 'transkript_duzeltme'; sayac: number; updated_at: string }

const KAYNAK: Record<Satir['kaynak'], string> = {
  elle: 'siz eklediniz',
  not_duzeltme: 'notta düzelttiniz',
  transkript_duzeltme: 'dikte metninde düzelttiniz',
}

const GIRDI = { border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: CHROME_FONT.sans, minWidth: 0, flex: '1 1 160px' } as const
const DUGME = { border: `1px solid ${CHROME_RENK.border}`, background: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const

export default function DikteSozluguBolumu() {
  const [satirlar, setSatirlar] = useState<Satir[] | null>(null)
  const [duyulan, setDuyulan] = useState('')
  const [dogru, setDogru] = useState('')
  const [hata, setHata] = useState('')
  const [bekliyor, setBekliyor] = useState(false)

  const yukle = async () => {
    try {
      const r = await doktorFetch('/api/doktor/dikte-sozlugu', { cache: 'no-store' })
      const j = await r.json()
      setSatirlar(Array.isArray(j?.ciftler) ? j.ciftler : [])
    } catch { setSatirlar([]) }
  }
  useEffect(() => { void yukle() }, [])

  const ekle = async () => {
    if (!duyulan.trim() || !dogru.trim() || bekliyor) return
    setBekliyor(true)
    setHata('')
    try {
      const r = await doktorFetch('/api/doktor/dikte-sozlugu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duyulan, dogru }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(String(j?.error || 'Kaydedilemedi.')); return }
      setDuyulan('')
      setDogru('')
      await yukle()
    } finally { setBekliyor(false) }
  }

  const sil = async (id: string) => {
    await doktorFetch('/api/doktor/dikte-sozlugu', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null)
    await yukle()
  }

  return (
    <section style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 22 }}>
      <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 6px', color: '#2e251d' }}>Dikte sözlüğüm</h2>
      <p style={{ fontSize: 13, color: CHROME_RENK.muted, margin: '0 0 10px' }}>
        Sesle dikte ederken yanlış duyulan bir terimi notta ya da dikte metninde düzelttiğinizde Ayşe bunu buraya ekler ve bir sonraki
        dikteden itibaren kendisi düzeltir. Yalnız terimler tutulur (rakam, doz, hasta bilgisi tutulmaz); bu liste yalnız sizindir.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <input aria-label="Yanlış duyulan" placeholder="Yanlış duyulan (ör. orta conta)" value={duyulan} maxLength={50} onChange={(e) => setDuyulan(e.target.value)} style={GIRDI} />
        <span aria-hidden style={{ color: CHROME_RENK.muted }}>→</span>
        <input aria-label="Doğru terim" placeholder="Doğru terim (ör. orta konka)" value={dogru} maxLength={50} onChange={(e) => setDogru(e.target.value)} style={GIRDI} />
        <button type="button" onClick={() => void ekle()} disabled={bekliyor} style={DUGME}>Ekle</button>
      </div>
      {hata && <div role="alert" style={{ fontSize: 12, color: '#8C2F2F', marginBottom: 8 }}>{hata}</div>}
      {satirlar === null && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Yükleniyor…</div>}
      {satirlar !== null && !satirlar.length && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Henüz terim yok.</div>}
      {satirlar?.map((s) => (
        <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${CHROME_RENK.border}`, padding: '8px 0', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, color: CHROME_RENK.ink, overflowWrap: 'anywhere' }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{s.duyulan}</span> → <strong>{s.dogru}</strong>
            </div>
            <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>{KAYNAK[s.kaynak] || s.kaynak} · {s.sayac} kez · {String(s.updated_at).slice(0, 10)}</div>
          </div>
          <button type="button" onClick={() => void sil(s.id)} style={{ border: 'none', background: 'transparent', color: '#8C2F2F', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sil</button>
        </div>
      ))}
    </section>
  )
}
