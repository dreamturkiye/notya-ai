'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /today: the doctor's home. Today's appointments in time order with their status
 * (NOTYA-UZ-RANDEVU-01), today's visits, a patient search, "new patient", "start a visit".
 * Replaces the holding page for accounts of a country where the application is switched on.
 */
import React, { useEffect, useState } from 'react'
import { Cerceve, Hata, HAZIR, saatYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { AsistanKarti } from './Asistan'
import { saatAraligi, DurumRozeti, muayeneBaslatilabilir, muayeneBaslatYolu, takvimYolu, type RandevuKaydi } from './randevuOrtak'
import { araclarMetni, metninDili, randevuMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { ozellikAcik } from '@/lib/ulke/ulke'

export type BugunMuayenesi = { seansId: string; notId: string | null; hastaId: string | null; hastaAdi: string; baslangic: string; durum: 'taslak' | 'onayli' | 'notsuz' }

export function AramaFormu({ m, q, hedef }: { m: UygulamaMetni; q?: string; /** Where the search lands; the patient list unless told otherwise. */ hedef?: string }) {
  // A plain GET form: the search works before any script has loaded, and the address can be shared with nobody but the doctor.
  return (
    <form className="uza-arama" action={hedef ?? YOL.hastalar} method="get" role="search">
      <label className="uza-etiket" htmlFor="uza-arama">{m.arama.etiket}</label>
      <div className="uza-arama-satir">
        <input id="uza-arama" name="q" type="search" defaultValue={q} placeholder={m.arama.ornek} autoComplete="off" className="uza-girdi" />
        <button type="submit" className="uza-dugme uza-dugme-cizgi">{m.arama.dugme}</button>
      </div>
    </form>
  )
}

/**
 * NOTYA-UZ-RANDEVU-01 — today's appointments, in time order, each with its status. A row opens the appointment;
 * one that is planned or has arrived also offers "start the visit" right here.
 */
export function BugunRandevulari({ m, randevular }: { m: UygulamaMetni; randevular: RandevuKaydi[] }) {
  const r = randevuMetni(metninDili(m))
  return (
    <section className="uza-kart" data-alan="bugun-randevular">
      <div className="uza-baslik-satiri" style={{ marginBottom: 6 }}>
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{r.bugun.randevular}</h2>
        <a className="uza-baglanti" href={takvimYolu()}>{r.bugun.takvimiAc}</a>
      </div>
      {randevular.length === 0 ? <p className="uza-bos">{r.bugun.randevuYok}</p> : (
        <ul className="uza-liste">
          {randevular.map((x) => (
            <li key={x.id} className="uza-randevu-satiri" data-randevu={x.id} data-soluk={x.durum === 'iptal' || x.durum === 'gelmedi' ? 'evet' : undefined}>
              <a className="uza-satir" href={takvimYolu({ randevu: x.id })}>
                <span className="uza-saat">{saatAraligi(x.saat, x.sureDk)}</span>
                <span className="uza-liste-ad">{x.hastaAdi || m.bugun.hastasiz}{x.neden ? <span className="uza-liste-alt">{x.neden}</span> : null}</span>
                <DurumRozeti r={r} durum={x.durum} />
              </a>
              {muayeneBaslatilabilir(x) ? <a className="uza-dugme uza-dugme-kucuk" href={muayeneBaslatYolu(x)} data-eylem="muayene-baslat">{m.bugun.muayeneBaslat}</a> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function BugunGorunumu({ m, ad, muayeneler, hata, rol, randevular }: {
  m: UygulamaMetni; ad: string; muayeneler: BugunMuayenesi[] | null; hata: boolean
  /** NOTYA-UZ-RANDEVU-01: today's appointments. Absent or null = not loaded, or the country has none: no list is drawn. */
  randevular?: RandevuKaydi[] | null
  /** NOTYA-UZ-BRANSLAR-01: the account's role — decides which assistant is shown. No role = the neutral assistant. */
  rol?: string | null
}) {
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
      <AsistanKarti m={m} rol={rol} />
      {HAZIR.takvim && randevular ? <BugunRandevulari m={m} randevular={randevular} /> : null}
      <section className="uza-kart">
        <AramaFormu m={m} />
        <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{m.bugun.tumHastalar}</a></p>
      </section>
      {/* NOTYA-ULKE-ARACLAR-01: the way into the tools area from the home screen, where the country has it. */}
      {ozellikAcik('araclar') ? (() => { const a = araclarMetni(metninDili(m)); return (
        <section className="uza-kart" data-alan="bugun-araclar">
          <div className="uza-baslik-satiri" style={{ marginBottom: 0 }}>
            <h2 className="uza-h2" style={{ marginBottom: 0 }}>{a.izgara.baslik}</h2>
            <a className="uza-baglanti" href={YOL.araclar} data-eylem="araclari-ac">{a.izgara.ac}</a>
          </div>
        </section>
      ) })() : null}
      <section className="uza-kart">
        <h2 className="uza-h2">{m.bugun.baslik}</h2>
        <Hata>{hata ? m.kabuk.hata : null}</Hata>
        {muayeneler === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : muayeneler.length === 0 ? (
          <p className="uza-bos">{m.bugun.bos}</p>
        ) : (
          <ul className="uza-liste">
            {muayeneler.map((v) => {
              // A visit with a note opens the note; one without opens the recorded visit (its transcript).
              const hedef = !HAZIR.muayene ? (v.hastaId ? `${YOL.hasta}?id=${v.hastaId}` : null) : v.notId ? `${YOL.muayene}?not=${v.notId}` : `${YOL.muayene}?seans=${v.seansId}`
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
  const [randevular, setRandevular] = useState<RandevuKaydi[] | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api('/api/ulke/bugun')
      .then((r) => { if (iptal) return; if (r.ok && Array.isArray(r.j.muayeneler)) { setMuayeneler(r.j.muayeneler); setRandevular(Array.isArray(r.j.randevular) ? r.j.randevular : null) } else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="bugun" cikis={u.cikis}>
      <BugunGorunumu m={u.m} ad={hesap.ad} muayeneler={muayeneler} hata={hata} rol={hesap.rol} randevular={randevular} />
    </Cerceve>
  )
}
