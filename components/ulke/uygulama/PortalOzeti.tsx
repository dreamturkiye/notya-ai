'use client'

/**
 * NOTYA-ULKE-PORTAL-01 — under an APPROVED note: THE SUMMARY FOR THE PATIENT, and the doctor's decision to share it.
 *
 * The doctor asks for a draft: the model writes it from the approved note only, in the patient's language (the
 * doctor's script where the language has several). The doctor reads it, changes it, and SHARES it — one summary,
 * one decision. Nothing is shared by itself. Taking it back removes it from the patient's page at once. A shared
 * summary cannot be edited: it is taken back first, so the patient never reads a text that changes under them.
 *
 * The clinical note itself is never shown to a patient, and nothing here changes it.
 *
 * Every sentence is the pack's (portalMetni), in the account's form; the summary's own text is in the patient's.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, tarihYaz, type Uygulama } from './Kabuk'
import { dilAdi, portalMetni, temelDil, type PortalMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { HEKIM_PORTAL_API, OZET_AZAMI } from '@/lib/ulke/portal/sabitler'
import type { HastaOzeti } from '@/lib/ulke/portal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'

export type OzetVerisi = { ozet: HastaOzeti | null; dil: DilKodu; yazilabilir: boolean }
export type OzetIslemi = 'yaziliyor' | 'kaydediliyor' | 'paylasiliyor' | null
export type OzetBildirimi = 'KAYDEDILDI' | 'GERI_ALINDI' | 'OZET_YAZILAMADI' | 'KAYDEDILEMEDI' | 'BOS' | 'PAYLASILDI' | 'YAPILAMADI' | null

export function PortalOzetGorunumu({ p, m, veri, metin, setMetin, islem, bildirim, yaz, kaydet, paylas, geriAl }: {
  p: PortalMetni; m: UygulamaMetni; veri: OzetVerisi
  /** The text on the screen (the doctor may have changed it since it was saved). */
  metin: string; setMetin: (y: string) => void; islem: OzetIslemi; bildirim: OzetBildirimi
  yaz: () => void; kaydet: () => void; paylas: () => void; geriAl: () => void
}) {
  const o = p.ozet
  const ozet = veri.ozet
  const mesgul = islem !== null
  const iyi = bildirim === 'KAYDEDILDI' ? o.kaydedildi : bildirim === 'GERI_ALINDI' ? o.geriAlindi : null
  const kotu = bildirim === 'OZET_YAZILAMADI' ? o.yazilamadi : bildirim === 'KAYDEDILEMEDI' ? o.kaydedilemedi : bildirim === 'BOS' ? o.bos : bildirim === 'PAYLASILDI' ? o.degistirmekIcin : bildirim === 'YAPILAMADI' ? o.yapilamadi : null
  return (
    <section className="uza-kart" data-alan="hasta-ozeti" data-paylasildi={ozet ? (ozet.paylasildi ? 'evet' : 'hayir') : undefined}>
      <h2 className="uza-h2">{o.baslik}</h2>
      <p className="uza-aciklama">{o.aciklama}</p>
      <p className="uza-ust-yazi" style={{ marginTop: 10 }}>{yerine(o.dil, dilAdi(m, temelDil(ozet?.dil ?? veri.dil)))}</p>
      {!ozet ? (
        <>
          <div style={{ marginTop: 12 }}><Hata>{kotu}</Hata></div>
          {veri.yazilabilir ? <div className="uza-eylemler"><button type="button" className="uza-dugme" disabled={mesgul} onClick={yaz} data-eylem="ozet-yaz">{islem === 'yaziliyor' ? o.yaziliyor : o.yaz}</button></div> : null}
        </>
      ) : ozet.paylasildi ? (
        <>
          <p className="uza-not-metin" lang={ozet.dil} data-alan="ozet-metni" style={{ marginTop: 10 }}>{ozet.metin}</p>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bilgi>{yerine(o.paylasildi, tarihYaz(ozet.paylasimAni))}</Bilgi>
            <Hata>{kotu}</Hata>
          </div>
          <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-uyari" disabled={mesgul} onClick={geriAl} data-eylem="ozet-geri-al">{o.geriAl}</button></div>
          <p className="uza-ipucu">{o.degistirmekIcin}</p>
        </>
      ) : (
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); paylas() }}>
          <p className="uza-ipucu" style={{ marginTop: 0 }} data-bildirim="yapay-zeka">{o.makine}</p>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ozet-metni">{o.etiket}</label>
            <textarea id="uza-ozet-metni" name="metin" className="uza-girdi" rows={8} lang={ozet.dil} maxLength={OZET_AZAMI} value={metin} onChange={(e) => setMetin(e.target.value)} disabled={mesgul} />
          </div>
          <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="ozet-durumu">{o.paylasilmadi}</p>
          <Hata>{kotu}</Hata>
          <Bilgi>{iyi}</Bilgi>
          <div className="uza-eylemler" style={{ marginTop: 0 }}>
            <button type="submit" className="uza-dugme" disabled={mesgul} data-eylem="ozet-paylas">{o.paylas}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={mesgul} onClick={kaydet} data-eylem="ozet-kaydet">{o.kaydet}</button>
            {veri.yazilabilir ? <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={mesgul} onClick={yaz} data-eylem="ozet-yeniden-yaz">{islem === 'yaziliyor' ? o.yaziliyor : o.yenidenYaz}</button> : null}
          </div>
        </form>
      )}
      <p className="uza-ipucu">{o.erisimIpucu}</p>
    </section>
  )
}

const API = `${HEKIM_PORTAL_API}/ozet`

/** Mounted under an approved note. Draws nothing until the server has said that this note may have a summary. */
export function PortalOzetKarti({ u, notId }: { u: Uygulama; notId: string }) {
  const [veri, setVeri] = useState<OzetVerisi | null>(null)
  const [metin, setMetin] = useState('')
  const [islem, setIslem] = useState<OzetIslemi>(null)
  const [bildirim, setBildirim] = useState<OzetBildirimi>(null)
  const { hesap, api } = u

  const yerlestir = useCallback((ozet: HastaOzeti | null) => { setVeri((eski) => (eski ? { ...eski, ozet } : eski)); setMetin(ozet?.metin ?? '') }, [])
  const yukle = useCallback(async () => {
    const r = await api(`${API}?not=${encodeURIComponent(notId)}`)
    if (!r.ok || r.j.onayli !== true) { setVeri(null); return }
    const ozet = (r.j.ozet as HastaOzeti | null) ?? null
    setVeri({ ozet, dil: r.j.dil as DilKodu, yazilabilir: r.j.yazilabilir === true }); setMetin(ozet?.metin ?? '')
  }, [api, notId])
  useEffect(() => { if (hesap) yukle().catch(() => setVeri(null)) }, [hesap, yukle])

  /** One change. The server's code, when it has a sentence, is shown; anything else is `yedek`. */
  async function degistir(is: OzetIslemi, method: 'POST' | 'PATCH' | 'PUT', govde: Record<string, unknown>, yedek: OzetBildirimi, iyi: OzetBildirimi = null): Promise<boolean> {
    setIslem(is); setBildirim(null)
    try {
      const r = await api(API, { method, govde: { notId, ...govde } })
      if (r.ok && r.j.ozet) { yerlestir(r.j.ozet as HastaOzeti); setBildirim(iyi); setIslem(null); return true }
      const kod = r.j.code
      setBildirim(kod === 'BOS' ? 'BOS' : kod === 'PAYLASILDI' ? 'PAYLASILDI' : kod === 'OZET_YAZILAMADI' ? 'OZET_YAZILAMADI' : yedek)
      // Shared or taken back in another window: show what is true now.
      if (kod === 'PAYLASILDI' || kod === 'NOT_FOUND' || kod === 'ONAYSIZ') await yukle()
    } catch { setBildirim(yedek) }
    setIslem(null)
    return false
  }

  if (!hesap || !veri) return null
  const degisti = veri.ozet !== null && metin.trim() !== veri.ozet.metin
  return (
    <PortalOzetGorunumu p={portalMetni(u.dil)} m={u.m} veri={veri} metin={metin} setMetin={(y) => { setMetin(y); setBildirim(null) }} islem={islem} bildirim={bildirim}
      yaz={() => { void degistir('yaziliyor', 'POST', {}, 'OZET_YAZILAMADI') }}
      kaydet={() => { void degistir('kaydediliyor', 'PATCH', { metin }, 'KAYDEDILEMEDI', 'KAYDEDILDI') }}
      // What the patient will read is what is on the screen: a changed text is saved first, and shared only if that worked.
      paylas={() => { void (async () => { if (degisti && !(await degistir('kaydediliyor', 'PATCH', { metin }, 'KAYDEDILEMEDI'))) return; await degistir('paylasiliyor', 'PUT', { paylas: true }, 'YAPILAMADI') })() }}
      geriAl={() => { void degistir('paylasiliyor', 'PUT', { paylas: false }, 'YAPILAMADI', 'GERI_ALINDI') }} />
  )
}
