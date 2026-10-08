'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /today: the doctor's home. Today's visits, a patient search, "new patient", "start a visit".
 * Replaces the holding page for accounts of a country where the application is switched on.
 */
import React, { useEffect, useState } from 'react'
import { Cerceve, Hata, HAZIR, saatYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import type { UygulamaMetni } from './metinler'

export type BugunMuayenesi = { seansId: string; notId: string | null; hastaId: string | null; hastaAdi: string; baslangic: string; durum: 'taslak' | 'onayli' | 'notsuz' }

export function AramaFormu({ m, q }: { m: UygulamaMetni; q?: string }) {
  // A plain GET form: the search works before any script has loaded, and the address can be shared with nobody but the doctor.
  return (
    <form className="uza-arama" action={YOL.hastalar} method="get" role="search">
      <label className="uza-etiket" htmlFor="uza-arama">{m.arama.etiket}</label>
      <div className="uza-arama-satir">
        <input id="uza-arama" name="q" type="search" defaultValue={q} placeholder={m.arama.ornek} autoComplete="off" className="uza-girdi" />
        <button type="submit" className="uza-dugme uza-dugme-cizgi">{m.arama.dugme}</button>
      </div>
    </form>
  )
}

export function BugunGorunumu({ m, ad, muayeneler, hata }: { m: UygulamaMetni; ad: string; muayeneler: BugunMuayenesi[] | null; hata: boolean }) {
  return (
    <>
      <section className="uza-karsilama">
        <p className="uza-ust-yazi">{m.bugun.selam}</p>
        <h1 className="uza-h1">{ad}</h1>
        <div className="uza-eylemler">
          {HAZIR.muayene ? <a className="uza-dugme" href={YOL.muayene}>{m.bugun.muayeneBaslat}</a> : null}
          <a className={HAZIR.muayene ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} href={YOL.yeniHasta}>{m.bugun.yeniHasta}</a>
        </div>
      </section>
      <section className="uza-kart">
        <AramaFormu m={m} />
        <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{m.bugun.tumHastalar}</a></p>
      </section>
      <section className="uza-kart">
        <h2 className="uza-h2">{m.bugun.baslik}</h2>
        <Hata>{hata ? m.kabuk.hata : null}</Hata>
        {muayeneler === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : muayeneler.length === 0 ? (
          <p className="uza-bos">{m.bugun.bos}</p>
        ) : (
          <ul className="uza-liste">
            {muayeneler.map((v) => {
              const hedef = v.notId && HAZIR.muayene ? `${YOL.muayene}?not=${v.notId}` : v.hastaId ? `${YOL.hasta}?id=${v.hastaId}` : null
              const icerik = (
                <>
                  <span className="uza-saat">{saatYaz(v.baslangic)}</span>
                  <span className="uza-liste-ad">{v.hastaAdi || m.bugun.hastasiz}</span>
                  {v.durum === 'notsuz' ? null : <span className="uza-rozet" data-durum={v.durum}>{v.durum === 'onayli' ? m.durum.onayli : m.durum.taslak}</span>}
                </>
              )
              return <li key={v.seansId}>{hedef ? <a className="uza-satir" href={hedef}>{icerik}</a> : <div className="uza-satir">{icerik}</div>}</li>
            })}
          </ul>
        )}
      </section>
    </>
  )
}

export default function Bugun() {
  const u = useUygulama('bugun')
  const [muayeneler, setMuayeneler] = useState<BugunMuayenesi[] | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api('/api/ulke/bugun')
      .then((r) => { if (iptal) return; if (r.ok && Array.isArray(r.j.muayeneler)) setMuayeneler(r.j.muayeneler); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="bugun" cikis={u.cikis}>
      <BugunGorunumu m={u.m} ad={hesap.ad} muayeneler={muayeneler} hata={hata} />
    </Cerceve>
  )
}
