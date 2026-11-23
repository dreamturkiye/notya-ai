'use client'
/** ESNEK-MUAYENE-A — pick a patient (search by name) for an el notu outside a visit. Words + endpoint injected. */
import { useEffect, useState } from 'react'
import { EL_RENK as R } from './renk'
import { dugme, type Getirici } from './ElNotuYakala'

const katla = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i')

export default function HastaAra(p: { getir: Getirici; uc: (q: string) => string; etiket: string; yer: string; cevir: (j: unknown) => { id: string; ad: string }[]; onSec: (h: { id: string; ad: string }) => void }) {
  const [acik, setAcik] = useState(false)
  const [q, setQ] = useState('')
  const [liste, setListe] = useState<{ id: string; ad: string }[]>([])
  useEffect(() => {
    if (!acik || q.trim().length < 2) { setListe([]); return }
    const t = setTimeout(() => { void p.getir(p.uc(q.trim())).then((r) => (r.ok ? r.json() : null)).then((j) => { const k = katla(q.trim()); setListe(j ? p.cevir(j).filter((h) => katla(h.ad).includes(k)).slice(0, 8) : []) }).catch(() => setListe([])) }, 250)
    return () => clearTimeout(t)
  }, [q, acik, p])
  if (!acik) return <button type="button" style={dugme('birincil')} onClick={() => setAcik(true)}>{p.etiket}</button>
  return (
    <div style={{ position: 'relative', minWidth: 240 }}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={p.yer} style={{ width: '100%', boxSizing: 'border-box', minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 10, padding: '0 12px', fontSize: 15 }} onKeyDown={(e) => { if (e.key === 'Escape') setAcik(false) }} />
      {liste.length > 0 && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 10, zIndex: 20, boxShadow: '0 10px 24px rgba(0,0,0,0.08)' }}>
          {liste.map((h) => <button key={h.id} type="button" onClick={() => { p.onSec(h); setAcik(false); setQ('') }} style={{ all: 'unset', display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 12px', cursor: 'pointer', fontSize: 14 }}>{h.ad}</button>)}
        </div>
      )}
    </div>
  )
}
