'use client'

/**
 * NOTYA-ULKE-MESAJ-01 — the patient's page: WHAT THEIR DOCTOR WROTE, and the patient's answer.
 *
 *   NOT FOR EMERGENCIES. The notice is the first thing in the section and is ALWAYS there: while the messages
 *   load, when they cannot be read, when there is none, when the conversation is closed. Where the pack states an
 *   ambulance number the notice names it; the number is the pack's setting, never a sentence's.
 *
 *   A PATIENT CANNOT START A CONVERSATION. Where none is open the section says so in plain words and shows no
 *   text box at all — never a box that would then refuse.
 *
 *   A message of the doctor's is marked as read only when it was drawn here.
 *
 * NOT THE DOCTOR'S APPLICATION: this file imports nothing of the signed-in application. Every sentence is the
 * pack's (mesajMetni), in the patient's own form. The server answers with codes; it is asked through the page's own
 * request function (the portal cookie, the link's mark, the portal's header).
 */
import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { okunmamisSayisi, sonMesajAni, YazismaListesi } from '../mesajOrtak'
import { mesajMetni, type MesajMetni } from '@/lib/ulke/arayuz'
import { saatYaz, tarihYaz, varsayilanSaatDilimi } from '@/lib/ulke/arayuz/bicim'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { MESAJ_AZAMI, mesajMetniAl, type HastaMesajGorunumu } from '@/lib/ulke/mesaj/sabitler'
import type { DilKodu } from '@/lib/ulke/tipler'
import type { PortalIstegi } from './HastaFormu'

export type PortalMesajHatasi = 'bos' | 'uzun' | 'limit' | 'kapali' | 'gonderilemedi' | null

/** The notice that messages are not for emergencies. Drawn by itself so that nothing above it can hide it. */
export function MesajAcilUyarisi({ x, acilNumara }: { x: MesajMetni['hasta']; acilNumara: string | null }) {
  return <p className="uza-uyari-kutu" role="note" data-alan="mesaj-acil" data-acil-numara={acilNumara ?? undefined}>{x.acil}{acilNumara ? ` ${yerine(x.acilNumara, acilNumara)}` : ''}</p>
}

export function PortalMesajGorunumu({ x, g, yuklenemedi, acilNumara, saatDilimi, metin, setMetin, gonder, bekliyor, hata }: {
  x: MesajMetni['hasta']
  /** null = not loaded yet (or could not be read). */
  g: HastaMesajGorunumu | null
  yuklenemedi?: boolean
  /** The pack's ambulance number, or null where the pack states none. */
  acilNumara: string | null
  /** The zone the moments are written in: the doctor's. */
  saatDilimi: string
  metin: string; setMetin: (y: string) => void; gonder: (e: FormEvent) => void; bekliyor: boolean; hata: PortalMesajHatasi
}) {
  const yeni = g ? okunmamisSayisi(g.yazismalar, 'hasta') : 0
  const hataMetni = hata === 'bos' ? x.bosMesaj : hata === 'uzun' ? yerine(x.cokUzun, MESAJ_AZAMI) : hata === 'limit' ? x.limit : hata === 'kapali' ? x.kapali : hata === 'gonderilemedi' ? x.gonderilemedi : null
  // The newest conversation decides what is said where no answer is possible: "closed", or "not written yet".
  const sonKapali = Boolean(g?.yazismalar[0]?.kapandi)
  return (
    <section className="uza-kart" data-alan="portal-mesajlar" data-okunmamis={g ? yeni : undefined} data-yazabilir={g ? (g.yazabilir ? 'evet' : 'hayir') : undefined}>
      <div className="uza-baslik-satiri" style={{ marginBottom: 0 }}>
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{x.baslik}</h2>
        {yeni ? <span className="uza-rozet" data-mesaj-durum="yeni" data-alan="mesaj-okunmamis">{yerine(x.okunmamis, yeni)}</span> : null}
      </div>
      <p className="uza-aciklama">{x.aciklama}</p>
      <div style={{ marginTop: 12 }}><MesajAcilUyarisi x={x} acilNumara={acilNumara} /></div>
      <p className="uza-ipucu" data-alan="mesaj-yanit-suresi">{x.yanitSuresi}</p>
      {!g ? (yuklenemedi ? <p className="uza-uyari-kutu" role="alert" style={{ marginTop: 12 }}>{x.yuklenemedi}</p> : null) : (
        <>
          {g.yazismalar.length === 0 ? <p className="uza-bos" data-alan="mesaj-yok">{x.yok}</p> : (
            <YazismaListesi yazismalar={g.yazismalar} ben="hasta" zaman={(iso) => `${tarihYaz(iso, saatDilimi)} ${saatYaz(iso, saatDilimi)}`}
              s={{ yazan: { hekim: x.hekim, hasta: x.siz }, acik: '', kapali: (k) => yerine(x.kapandi, tarihYaz(k, saatDilimi)), yeni: x.yeni }} />
          )}
          {g.yazabilir ? (
            <form className="uza-form" onSubmit={gonder} noValidate data-alan="mesaj-yaz">
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uzp-mesaj">{x.yaz}</label>
                <textarea id="uzp-mesaj" name="metin" className="uza-girdi" rows={4} maxLength={MESAJ_AZAMI} value={metin} onChange={(e) => setMetin(e.target.value)} />
              </div>
              {hataMetni ? <p className="uza-uyari-kutu" role="alert">{hataMetni}</p> : null}
              <div className="uza-eylemler" style={{ marginTop: 0 }}>
                <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="portal-mesaj-gonder">{bekliyor ? x.gonderiliyor : x.gonder}</button>
              </div>
            </form>
          ) : (
            <div data-alan="mesaj-baslatamaz" style={{ marginTop: 12 }}>
              {sonKapali ? <p className="uza-bilgi-kutu" role="status" data-alan="mesaj-kapali">{x.kapali}</p> : null}
              <p className="uza-ipucu">{x.baslatamaz}</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function PortalMesajlar({ dil, iste, acilNumara, saatDilimi, oturumBitti }: {
  dil: DilKodu; iste: PortalIstegi; acilNumara: string | null
  /** The doctor's zone where the country has several; elsewhere the country's own. */
  saatDilimi?: string | null
  oturumBitti: () => void
}) {
  const [g, setG] = useState<HastaMesajGorunumu | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [metin, setMetin] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<PortalMesajHatasi>(null)
  const okunan = useRef('')

  const yukle = useCallback(async () => {
    const r = await iste('/mesaj')
    if (r.status === 401) { oturumBitti(); return }
    if (r.status !== 200 || !Array.isArray(r.j.yazismalar)) { setYuklenemedi(true); return }
    const yeni = r.j as unknown as HastaMesajGorunumu
    setG(yeni); setYuklenemedi(false)
    const son = sonMesajAni(yeni.yazismalar)
    if (son && son !== okunan.current && okunmamisSayisi(yeni.yazismalar, 'hasta') > 0) {
      okunan.current = son
      void iste('/mesaj', { kadar: son }, 'PUT').catch(() => { okunan.current = '' })
    }
  }, [iste, oturumBitti])
  useEffect(() => { yukle().catch(() => setYuklenemedi(true)) }, [yukle])

  async function gonder(e: FormEvent) {
    e.preventDefault()
    const temiz = mesajMetniAl(metin)
    if (!temiz) { setHata('bos'); return }
    if (temiz.length > MESAJ_AZAMI) { setHata('uzun'); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await iste('/mesaj', { metin: temiz })
      if (r.status === 200) { setMetin(''); await yukle() }
      else if (r.status === 401) oturumBitti()
      // The doctor closed it a moment ago: the page reads again and says so.
      else if (r.j.code === 'KAPALI') { await yukle(); setHata('kapali') }
      else setHata(r.j.code === 'BOS' ? 'bos' : r.j.code === 'UZUN' ? 'uzun' : r.j.code === 'LIMIT' ? 'limit' : 'gonderilemedi')
    } catch { setHata('gonderilemedi') }
    setBekliyor(false)
  }

  return <PortalMesajGorunumu x={mesajMetni(dil).hasta} g={g} yuklenemedi={yuklenemedi} acilNumara={acilNumara} saatDilimi={saatDilimi || varsayilanSaatDilimi()} metin={metin} setMetin={(y) => { setMetin(y); setHata(null) }} gonder={gonder} bekliyor={bekliyor} hata={hata} />
}
