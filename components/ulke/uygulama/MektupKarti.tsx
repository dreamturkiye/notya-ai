'use client'

/**
 * AU-GAP-CLOSE-01/02 — letter studio under an APPROVED note.
 * Draft → doctor edits → explicit sign-off before export/queue inclusion.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'

type Islem = 'yaziliyor' | null

export type OnayliMektup = { tur: MektupTuru; metin: string; hekimOnayi: true }

export function MektupKarti({ u, notId, onOnayliDegisti }: {
  u: Uygulama
  notId: string
  /** Lift approved letters to the MBS/export card. */
  onOnayliDegisti?: (mektuplar: Partial<Record<MektupTuru, OnayliMektup>>) => void
}) {
  const metin = ulkePaketi().uzanti?.mektup
  const [yazilabilir, setYazilabilir] = useState(false)
  const [tur, setTur] = useState<MektupTuru>('gp')
  const [govde, setGovde] = useState('')
  const [onayli, setOnayli] = useState(false)
  const [kayit, setKayit] = useState<Partial<Record<MektupTuru, OnayliMektup>>>({})
  const [islem, setIslem] = useState<Islem>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const { hesap, api } = u

  const bildir = useCallback((k: Partial<Record<MektupTuru, OnayliMektup>>) => {
    onOnayliDegisti?.(k)
  }, [onOnayliDegisti])

  const yukle = useCallback(async () => {
    const r = await api(`/api/ulke/not/mektup?not=${encodeURIComponent(notId)}`)
    if (!r.ok || r.j.yazilabilir !== true) { setYazilabilir(false); return }
    setYazilabilir(true)
    const turler = Array.isArray(r.j.turler) ? (r.j.turler as MektupTuru[]) : []
    if (turler.length && !turler.includes(tur)) setTur(turler[0])
  }, [api, notId, tur])

  useEffect(() => { if (hesap && metin) yukle().catch(() => setYazilabilir(false)) }, [hesap, metin, yukle])

  if (!metin || !hesap || !yazilabilir) return null

  async function yaz() {
    setIslem('yaziliyor'); setHata(null); setBilgi(null); setOnayli(false)
    try {
      const r = await api('/api/ulke/not/mektup', { method: 'POST', govde: { notId, tur } })
      if (r.ok && r.j.mektup && typeof (r.j.mektup as { metin?: string }).metin === 'string') {
        setGovde((r.j.mektup as { metin: string }).metin)
      } else setHata(metin!.yazilamadi)
    } catch { setHata(metin!.yazilamadi) }
    setIslem(null)
  }

  function imzala() {
    if (!govde.trim()) { setHata(metin!.bos); return }
    const sonraki = { ...kayit, [tur]: { tur, metin: govde.trim(), hekimOnayi: true as const } }
    setKayit(sonraki)
    setOnayli(true)
    setBilgi(metin!.onaylandi)
    setHata(null)
    bildir(sonraki)
  }

  async function kopyala() {
    if (!govde.trim()) { setHata(metin!.bos); return }
    try { await navigator.clipboard.writeText(govde); setBilgi(metin!.kopyalandi); setHata(null) } catch { setHata(metin!.yazilamadi) }
  }

  function indir() {
    if (!govde.trim()) { setHata(metin!.bos); return }
    const blob = new Blob([govde], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `notya-letter-${tur}-${notId.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function yazdir() {
    if (!govde.trim()) { setHata(metin!.bos); return }
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>Letter</title></head><body><pre style="font:14px/1.45 system-ui,sans-serif;white-space:pre-wrap">${govde.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</pre><script>onload=()=>print()<\/script></body></html>`)
    w.document.close()
  }

  return (
    <section className="uza-kart" data-alan="mektup-studio">
      <h2 className="uza-h2">{metin.baslik}</h2>
      <p className="uza-aciklama">{metin.aciklama}</p>
      <div className="uza-alan" style={{ marginTop: 12 }}>
        <label className="uza-etiket" htmlFor="uza-mektup-tur">Letter type</label>
        <select id="uza-mektup-tur" className="uza-girdi" value={tur} disabled={islem !== null} onChange={(e) => {
          const t = e.target.value as MektupTuru
          setTur(t)
          setBilgi(null)
          const onceki = kayit[t]
          setGovde(onceki?.metin ?? '')
          setOnayli(!!onceki?.hekimOnayi)
        }}>
          {metin.turler.map((t) => <option key={t.tur} value={t.tur}>{t.ad}</option>)}
        </select>
        <p className="uza-ipucu">{metin.turler.find((t) => t.tur === tur)?.aciklama}</p>
      </div>
      <p className="uza-ipucu" data-bildirim="yapay-zeka">{metin.makine}</p>
      <div className="uza-eylemler">
        <button type="button" className="uza-dugme" disabled={islem !== null} onClick={() => { void yaz() }} data-eylem="mektup-yaz">
          {islem === 'yaziliyor' ? metin.yaziliyor : (govde ? metin.yenidenYaz : metin.yaz)}
        </button>
      </div>
      {govde ? (
        <>
          <div className="uza-alan" style={{ marginTop: 12 }}>
            <label className="uza-etiket" htmlFor="uza-mektup-metin">{metin.etiket}</label>
            <textarea id="uza-mektup-metin" className="uza-girdi" rows={12} value={govde} onChange={(e) => {
              setGovde(e.target.value)
              setOnayli(false)
              setBilgi(null)
              if (kayit[tur]) {
                const sonraki = { ...kayit }
                delete sonraki[tur]
                setKayit(sonraki)
                bildir(sonraki)
              }
            }} />
          </div>
          <div className="uza-eylemler">
            <button type="button" className="uza-dugme" data-eylem="mektup-onayla" disabled={onayli} onClick={imzala}>{onayli ? metin.onaylandi : metin.onayla}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => { void kopyala() }} data-eylem="mektup-kopyala">{metin.kopyala}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={indir} data-eylem="mektup-indir">{metin.indir}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={yazdir} data-eylem="mektup-yazdir">{metin.yazdir}</button>
          </div>
          {!onayli ? <p className="uza-ipucu" data-alan="mektup-onay-bekliyor">{metin.onayBekliyor}</p> : null}
        </>
      ) : null}
      <Hata>{hata}</Hata>
      <Bilgi>{bilgi}</Bilgi>
      <p className="uza-ipucu">{metin.uyari}</p>
    </section>
  )
}
