'use client'

/**
 * AU-GAP-CLOSE-01 — MBS suggestions under an APPROVED note. Suggest only; never lodge.
 * Pack extension `uzanti.mbsOneri`. Also offers the PMS export pack download for this note.
 */
import React, { useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { MbsOneri } from '@/lib/ulke/mektup/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'

export function MbsOneriKarti({ u, notId, mektuplar }: { u: Uygulama; notId: string; /** Optional letter drafts already on screen, included in the export pack. */ mektuplar?: Partial<Record<MektupTuru, string>> }) {
  const m = ulkePaketi().uzanti?.mbsOneri
  const pms = ulkePaketi().uzanti?.pmsEntegrasyon
  const [oneriler, setOneriler] = useState<MbsOneri[] | null>(null)
  const [islem, setIslem] = useState<'oneriliyor' | 'export' | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const { hesap, api } = u

  if (!m || !hesap) return null

  async function oner() {
    setIslem('oneriliyor'); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/not/mbs-oneri', { method: 'POST', govde: { notId } })
      if (r.ok && Array.isArray(r.j.oneriler)) {
        setOneriler(r.j.oneriler as MbsOneri[])
        if (!(r.j.oneriler as MbsOneri[]).length) setBilgi(m!.bos)
      } else setHata(m!.yazilamadi)
    } catch { setHata(m!.yazilamadi) }
    setIslem(null)
  }

  async function kopyala() {
    if (!oneriler?.length) { setHata(m!.bos); return }
    const t = oneriler.map((o) => `${o.item}\t${o.aciklama}\t${o.gerekce}`).join('\n')
    try { await navigator.clipboard.writeText(t); setBilgi(m!.kopyalandi); setHata(null) } catch { setHata(m!.yazilamadi) }
  }

  async function exportPaket() {
    if (!pms) return
    setIslem('export'); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/not/pms-export', {
        method: 'POST',
        govde: { notId, ...(mektuplar ? { mektuplar } : {}), ...(oneriler?.length ? { mbsOnerileri: oneriler } : {}) },
      })
      if (r.ok && r.j.paket) {
        const blob = new Blob([JSON.stringify(r.j.paket, null, 2)], { type: 'application/json;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `notya-visit-export-${notId.slice(0, 8)}.json`
        a.click()
        URL.revokeObjectURL(a.href)
        setBilgi('Export pack downloaded. No practice-management system was contacted.')
      } else setHata(m!.yazilamadi)
    } catch { setHata(m!.yazilamadi) }
    setIslem(null)
  }

  return (
    <section className="uza-kart" data-alan="mbs-oneri">
      <h2 className="uza-h2">{m.baslik}</h2>
      <p className="uza-aciklama">{m.aciklama}</p>
      <div className="uza-eylemler">
        <button type="button" className="uza-dugme" disabled={islem !== null} onClick={() => { void oner() }} data-eylem="mbs-oner">
          {islem === 'oneriliyor' ? m.oneriliyor : m.oner}
        </button>
        {oneriler?.length ? (
          <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => { void kopyala() }} data-eylem="mbs-kopyala">{m.kopyala}</button>
        ) : null}
        {pms ? (
          <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={islem !== null} onClick={() => { void exportPaket() }} data-eylem="pms-export">
            {islem === 'export' ? pms.exportIndiriliyor : 'Download visit export'}
          </button>
        ) : null}
      </div>
      {oneriler?.length ? (
        <ul className="uza-liste" style={{ marginTop: 12 }} data-alan="mbs-liste">
          {oneriler.map((o) => (
            <li key={o.item}>
              <div className="uza-satir">
                <span className="uza-liste-ad">
                  <strong>{o.item}</strong>
                  <span className="uza-liste-alt">{o.aciklama}</span>
                  {o.gerekce ? <span className="uza-liste-alt">{o.gerekce}</span> : null}
                  <span className="uza-liste-alt" data-alan="lodge-edilmez">Never lodge from Notya</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <Hata>{hata}</Hata>
      <Bilgi>{bilgi}</Bilgi>
      <p className="uza-ipucu">{m.uyari}</p>
      <p className="uza-ipucu" data-alan="kaynak-satiri">{m.kaynak}</p>
    </section>
  )
}
