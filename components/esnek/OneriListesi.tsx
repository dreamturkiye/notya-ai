'use client'
/**
 * ESNEK-MUAYENE-B5 — Ayşe's advisory shown through the doctor's suggestion profile: safety warnings first and never quieted,
 * the types he accepts next, the types he always rejects collapsed under one line (one tap shows them; his card can bring a
 * type back). Without profile data the advisory renders exactly as before. Country-neutral (words + API injected).
 */
import { useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import { oneriMaddeleri, profiliUygula, type OneriProfili } from '@/core/esnek/oneriProfili'
import { EL_RENK as R } from '@/components/elNotu/renk'
import type { Getirici } from '@/components/elNotu/ElNotuYakala'

const onbellek: { profil: OneriProfili | null; zaman: number } = { profil: null, zaman: 0 }

export default function OneriListesi(p: { metin: EsnekMetinleri; getir: Getirici; api: string; aiDegerlendirme: string; varsayilan: React.ReactNode }) {
  const M = p.metin.oneri
  const [profil, setProfil] = useState<OneriProfili | null>(onbellek.profil)
  const [sessizAcik, setSessizAcik] = useState(false)
  const { getir, api } = p
  useEffect(() => {
    if (onbellek.profil && Date.now() - onbellek.zaman < 5 * 60000) return
    void getir(`${api}/oneri`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.profil) { onbellek.profil = j.profil; onbellek.zaman = Date.now(); setProfil(j.profil) } }).catch(() => undefined)
  }, [getir, api])

  if (!profil) return <>{p.varsayilan}</>
  // line by line: the advisory keeps its own structure (headings, check-list block); quieted bullets are collapsed,
  // accepted types emphasised, safety always shown in red
  const satirlar = String(p.aiDegerlendirme || '').split('\n')
  const maddeler = oneriMaddeleri(p.aiDegerlendirme)
  if (!maddeler.length) return <>{p.varsayilan}</>
  const { sessiz } = profiliUygula(maddeler, profil)
  const turu = (satir: string) => maddeler.find((m) => satir.includes(m.metin.slice(0, 40)))
  const sessizMetin = new Set(sessiz.map((m) => m.metin))
  if (!sessiz.length && !maddeler.some((m) => profil[m.tur] === 'one_cikar' || m.tur === 'guvenlik')) return <>{p.varsayilan}</>
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      {satirlar.map((satir, i) => {
        const m = turu(satir)
        if (m && sessizMetin.has(m.metin) && !sessizAcik) return null
        const vurgu = m && (m.tur === 'guvenlik' || profil[m.tur] === 'one_cikar')
        return (
          <div key={i} style={{ fontSize: 13, whiteSpace: 'pre-wrap', minHeight: satir.trim() ? undefined : 8, color: m?.tur === 'guvenlik' ? R.uyari : m && sessizMetin.has(m.metin) ? R.soluk : R.murekkep, fontWeight: vurgu ? 600 : 400 }}>
            {m && vurgu ? <span style={{ fontSize: 11, fontWeight: 600, marginRight: 4, color: m.tur === 'guvenlik' ? R.uyari : R.cam }}>{M.tur[m.tur]}</span> : null}{satir.replace(/\*\*/g, '')}
          </div>
        )
      })}
      {sessiz.length > 0 && (
        <button type="button" onClick={() => setSessizAcik((x) => !x)} style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', color: R.soluk, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
          {sessizAcik ? M.gizle : M.sessizler(sessiz.length)}
        </button>
      )}
    </div>
  )
}
