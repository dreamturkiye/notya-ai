'use client'

/**
 * AU-GAP-CLOSE-01/02 — MBS suggestions under an APPROVED note. Suggest only; never lodge.
 * Doctor confirms selected items before they enter the export pack / write-back queue.
 */
import React, { useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { MbsOneri } from '@/lib/ulke/mektup/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import type { OnayliMektup } from './MektupKarti'
import { PMS_SAGLAYICILAR, type PmsSaglayici } from '@/lib/ulke/pms/tipler'

export function MbsOneriKarti({ u, notId, mektuplar }: {
  u: Uygulama
  notId: string
  mektuplar?: Partial<Record<MektupTuru, OnayliMektup>>
}) {
  const m = ulkePaketi().uzanti?.mbsOneri
  const pms = ulkePaketi().uzanti?.pmsEntegrasyon
  const [oneriler, setOneriler] = useState<MbsOneri[] | null>(null)
  const [secili, setSecili] = useState<Record<string, boolean>>({})
  const [onayli, setOnayli] = useState(false)
  const [islem, setIslem] = useState<'oneriliyor' | 'export' | 'kuyruk' | null>(null)
  const [hedef, setHedef] = useState<PmsSaglayici>('best-practice')
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const { hesap, api } = u

  if (!m || !hesap) return null

  async function oner() {
    setIslem('oneriliyor'); setHata(null); setBilgi(null); setOnayli(false); setSecili({})
    try {
      const r = await api('/api/ulke/not/mbs-oneri', { method: 'POST', govde: { notId } })
      if (r.ok && Array.isArray(r.j.oneriler)) {
        setOneriler(r.j.oneriler as MbsOneri[])
        if (!(r.j.oneriler as MbsOneri[]).length) setBilgi(m!.bos)
      } else setHata(m!.yazilamadi)
    } catch { setHata(m!.yazilamadi) }
    setIslem(null)
  }

  function onaylaSecilen() {
    if (!oneriler?.length) { setHata(m!.bos); return }
    const varMi = oneriler.some((o) => secili[o.item])
    if (!varMi) { setHata(m!.onayBekliyor); return }
    setOnayli(true)
    setBilgi(m!.onaylandi)
    setHata(null)
  }

  function onayliMbs(): MbsOneri[] {
    if (!oneriler || !onayli) return []
    return oneriler.filter((o) => secili[o.item]).map((o) => ({ ...o, lodgeEdilmez: true as const, hekimOnayi: true as const }))
  }

  function mektupGovde() {
    if (!mektuplar) return undefined
    const out: Record<string, { metin: string; hekimOnayi: true }> = {}
    for (const [tur, v] of Object.entries(mektuplar)) {
      if (v?.hekimOnayi && v.metin.trim()) out[tur] = { metin: v.metin, hekimOnayi: true }
    }
    return Object.keys(out).length ? out : undefined
  }

  async function exportPaket() {
    if (!pms) return
    setIslem('export'); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/not/pms-export', {
        method: 'POST',
        govde: {
          notId,
          ...(mektupGovde() ? { mektuplar: mektupGovde() } : {}),
          ...(onayliMbs().length ? { mbsOnerileri: onayliMbs() } : {}),
        },
      })
      if (r.ok && r.j.paket) {
        const blob = new Blob([JSON.stringify(r.j.paket, null, 2)], { type: 'application/json;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `notya-visit-export-${notId.slice(0, 8)}.json`
        a.click()
        URL.revokeObjectURL(a.href)
        setBilgi('Export pack downloaded. Only signed-off letters/MBS were included. No practice-management system was contacted.')
      } else setHata(m!.yazilamadi)
    } catch { setHata(m!.yazilamadi) }
    setIslem(null)
  }

  async function kuyrugaAl() {
    if (!pms) return
    setIslem('kuyruk'); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/pms/kuyruk', {
        method: 'POST',
        govde: {
          notId,
          hedef,
          ...(mektupGovde() ? { mektuplar: mektupGovde() } : {}),
          ...(onayliMbs().length ? { mbsOnerileri: onayliMbs() } : {}),
        },
      })
      if (r.ok && r.j.kuyruk) {
        const d = (r.j.kuyruk as { durum?: string }).durum
        setBilgi(d === 'gonderildi'
          ? 'Queued and acknowledged by the partner adapter.'
          : (pms.kuyrukBekliyor || 'Prepared — partner API not live. Not Synced.'))
      } else {
        const kod = typeof r.j.code === 'string' ? r.j.code : ''
        setHata(kod === 'BAGLANTI_YOK' ? 'Save partner credentials in Settings › Integrations first.' : m!.yazilamadi)
      }
    } catch { setHata(m!.yazilamadi) }
    setIslem(null)
  }

  async function kopyala() {
    const liste = onayli ? onayliMbs() : oneriler
    if (!liste?.length) { setHata(m!.bos); return }
    const t = liste.map((o) => `${o.item}\t${o.aciklama}\t${o.gerekce}`).join('\n')
    try { await navigator.clipboard.writeText(t); setBilgi(m!.kopyalandi); setHata(null) } catch { setHata(m!.yazilamadi) }
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
        <>
          <ul className="uza-liste" style={{ marginTop: 12 }} data-alan="mbs-liste">
            {oneriler.map((o) => (
              <li key={o.item}>
                <label className="uza-satir" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!secili[o.item]}
                    disabled={onayli}
                    onChange={(e) => { setSecili((s) => ({ ...s, [o.item]: e.target.checked })); setOnayli(false) }}
                    data-eylem={`mbs-sec-${o.item}`}
                  />
                  <span className="uza-liste-ad">
                    <strong>{o.item}</strong>
                    <span className="uza-liste-alt">{o.aciklama}</span>
                    {o.gerekce ? <span className="uza-liste-alt">{o.gerekce}</span> : null}
                    <span className="uza-liste-alt" data-alan="lodge-edilmez">Never lodge from Notya</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="uza-eylemler">
            <button type="button" className="uza-dugme" data-eylem="mbs-onayla" disabled={onayli} onClick={onaylaSecilen}>
              {onayli ? m.onaylandi : m.onayla}
            </button>
          </div>
          {!onayli ? <p className="uza-ipucu" data-alan="mbs-onay-bekliyor">{m.onayBekliyor}</p> : null}
        </>
      ) : null}
      {pms ? (
        <div style={{ marginTop: 14 }} data-alan="pms-kuyruk">
          <label className="uza-etiket" htmlFor="uza-pms-hedef">{pms.kuyrukBaslik || 'Write-back queue'}</label>
          <p className="uza-ipucu">{pms.kuyrukAciklama}</p>
          <select id="uza-pms-hedef" className="uza-girdi" value={hedef} onChange={(e) => setHedef(e.target.value as PmsSaglayici)}>
            {PMS_SAGLAYICILAR.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="uza-eylemler" style={{ marginTop: 8 }}>
            <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={islem !== null} onClick={() => { void kuyrugaAl() }} data-eylem="pms-kuyruk">
              {islem === 'kuyruk' ? '…' : (pms.kuyrukEkle || 'Queue this visit')}
            </button>
          </div>
        </div>
      ) : null}
      <Hata>{hata}</Hata>
      <Bilgi>{bilgi}</Bilgi>
      <p className="uza-ipucu">{m.uyari}</p>
      <p className="uza-ipucu" data-alan="kaynak-satiri">{m.kaynak}</p>
    </section>
  )
}
