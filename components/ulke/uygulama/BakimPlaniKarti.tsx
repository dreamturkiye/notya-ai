'use client'

/**
 * AU-GAP-CLOSE-03 — care-plan document studio under an APPROVED note.
 * GPMP / TCA / CCMP / MHCP drafts → doctor edits → hekimOnayi before export/queue.
 * Never lodges Medicare. Reuses /api/ulke/not/mektup with bakim plan turler.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { BakimPlanTuru } from '@/lib/ulke/mektup/sabitler'
import type { OnayliMektup } from './MektupKarti'

type Islem = 'yaziliyor' | null

export function BakimPlaniKarti({ u, notId, onOnayliDegisti }: {
  u: Uygulama
  notId: string
  onOnayliDegisti?: (planlar: Partial<Record<BakimPlanTuru, OnayliMektup>>) => void
}) {
  const metin = ulkePaketi().uzanti?.bakimPlani
  const [yazilabilir, setYazilabilir] = useState(false)
  const [tur, setTur] = useState<BakimPlanTuru>('gpmp')
  const [govde, setGovde] = useState('')
  const [onayli, setOnayli] = useState(false)
  const [kayit, setKayit] = useState<Partial<Record<BakimPlanTuru, OnayliMektup>>>({})
  const [islem, setIslem] = useState<Islem>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const { hesap, api } = u

  const bildir = useCallback((k: Partial<Record<BakimPlanTuru, OnayliMektup>>) => {
    onOnayliDegisti?.(k)
  }, [onOnayliDegisti])

  const yukle = useCallback(async () => {
    const r = await api(`/api/ulke/not/mektup?not=${encodeURIComponent(notId)}`)
    if (!r.ok || r.j.yazilabilir !== true) { setYazilabilir(false); return }
    const bakim = Array.isArray(r.j.bakimTurler) ? (r.j.bakimTurler as BakimPlanTuru[]) : []
    if (!bakim.length) { setYazilabilir(false); return }
    setYazilabilir(true)
    if (!bakim.includes(tur)) setTur(bakim[0])
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
    a.download = `notya-care-plan-${tur}-${notId.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function yazdir() {
    if (!govde.trim()) { setHata(metin!.bos); return }
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>Care plan</title></head><body><pre style="font:14px/1.45 system-ui,sans-serif;white-space:pre-wrap">${govde.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</pre><script>onload=()=>print()<\/script></body></html>`)
    w.document.close()
  }

  return (
    <section className="uza-kart" data-alan="bakim-plani-studio">
      <h2 className="uza-h2">{metin.baslik}</h2>
      <p className="uza-aciklama">{metin.aciklama}</p>
      <div className="uza-alan" style={{ marginTop: 12 }}>
        <label className="uza-etiket" htmlFor="uza-bakim-tur">Care-plan type</label>
        <select id="uza-bakim-tur" className="uza-girdi" value={tur} disabled={islem !== null} onChange={(e) => {
          const t = e.target.value as BakimPlanTuru
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
        <button type="button" className="uza-dugme" disabled={islem !== null} onClick={() => { void yaz() }} data-eylem="bakim-yaz">
          {islem === 'yaziliyor' ? metin.yaziliyor : (govde ? metin.yenidenYaz : metin.yaz)}
        </button>
      </div>
      {govde ? (
        <>
          <div className="uza-alan" style={{ marginTop: 12 }}>
            <label className="uza-etiket" htmlFor="uza-bakim-metin">{metin.etiket}</label>
            <textarea id="uza-bakim-metin" className="uza-girdi" rows={14} value={govde} onChange={(e) => {
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
            <button type="button" className="uza-dugme" data-eylem="bakim-onayla" disabled={onayli} onClick={imzala}>{onayli ? metin.onaylandi : metin.onayla}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => { void kopyala() }} data-eylem="bakim-kopyala">{metin.kopyala}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={indir} data-eylem="bakim-indir">{metin.indir}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={yazdir} data-eylem="bakim-yazdir">{metin.yazdir}</button>
          </div>
          {!onayli ? <p className="uza-ipucu" data-alan="bakim-onay-bekliyor">{metin.onayBekliyor}</p> : null}
        </>
      ) : null}
      <Hata>{hata}</Hata>
      <Bilgi>{bilgi}</Bilgi>
      <p className="uza-ipucu">{metin.uyari}</p>
      <p className="uza-ipucu" data-alan="bakim-kaynak">{metin.kaynak}</p>
    </section>
  )
}
