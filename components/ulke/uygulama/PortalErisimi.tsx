'use client'

/**
 * NOTYA-ULKE-PORTAL-01 — the patient's file: THE DOCTOR GIVES, RENEWS AND WITHDRAWS A PATIENT'S ACCESS.
 *
 * Giving access answers with a link and a PIN, ONCE: the application keeps only hashes of both, so neither can be
 * shown again. The doctor copies them and hands them to the patient — the application sends nothing to anybody.
 * A new link stops the old one at once; withdrawing stops the link and ends every open session.
 *
 * The record under the card says what happened, for the doctor: access given or withdrawn, each sign-in of the
 * patient, a link that locked after wrong PINs, each summary shared or taken back.
 *
 * Every sentence is the pack's (portalMetni), in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, saatYaz, tarihYaz, type Uygulama } from './Kabuk'
import { panoyaKopyala } from './pano'
import { portalMetni, type PortalMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { HEKIM_PORTAL_API } from '@/lib/ulke/portal/sabitler'
import type { PortalErisimi, PortalKaydi, PortalOlayi } from '@/lib/ulke/portal/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'

export type ErisimVerisi = { erisim: PortalErisimi; kayitlar: PortalKaydi[] }
/** What "give access" answered, kept on the screen until the doctor leaves it: the whole address, and the PIN. */
export type YeniErisim = { adres: string; pin: string }
export type ErisimBildirimi = 'iptal' | 'yapilamadi' | 'baglanti-kopyalandi' | 'pin-kopyalandi' | 'kopyalanamadi' | null

const olayAdi = (p: PortalMetni, o: PortalOlayi): string => (o === 'geri-alma' ? p.erisim.olay.geriAlma : p.erisim.olay[o])

export function PortalErisimGorunumu({ p, veri, yeni, bekliyor, bildirim, baglantiHatasi, ver, iptal, kopyala }: {
  p: PortalMetni
  /** null = not loaded yet (or could not be read): the card says so and offers nothing. */
  veri: ErisimVerisi | null
  yeni: YeniErisim | null; bekliyor: boolean; bildirim: ErisimBildirimi
  /** The sentence for "no connection", from the application's catalogue. */
  baglantiHatasi?: string | null
  ver: () => void; iptal: () => void; kopyala: (ne: 'baglanti' | 'pin') => void
}) {
  const e = p.erisim
  const d = veri?.erisim.durum ?? null
  const durumMetni = d === 'acik' ? yerine(e.durumAcik, tarihYaz(veri?.erisim.sonGecerlilik)) : d === 'kilitli' ? e.durumKilitli : d === 'suresi-doldu' ? e.durumBitti : d === 'yok' ? e.durumYok : null
  return (
    <section className="uza-kart" data-alan="portal-erisim" data-erisim-durumu={d ?? undefined}>
      <h2 className="uza-h2">{e.baslik}</h2>
      <p className="uza-aciklama">{e.aciklama}</p>
      {veri ? (
        <>
          <p className="uza-ipucu" data-alan="erisim-durumu">{durumMetni}{d && d !== 'yok' ? <> · {veri.erisim.sonGiris ? yerine(e.sonGiris, `${tarihYaz(veri.erisim.sonGiris)} ${saatYaz(veri.erisim.sonGiris)}`) : e.sonGirisYok}</> : null}</p>
          {yeni ? (
            <div className="uza-form" data-alan="yeni-erisim" style={{ marginTop: 14 }}>
              <Bilgi>{e.birKez}</Bilgi>
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uza-pe-baglanti">{e.baglanti}</label>
                <div className="uza-arama-satir">
                  <input id="uza-pe-baglanti" className="uza-girdi" readOnly value={yeni.adres} data-alan="portal-baglanti" onFocus={(x) => x.currentTarget.select()} />
                  <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('baglanti')} data-eylem="baglanti-kopyala">{e.kopyala}</button>
                </div>
              </div>
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uza-pe-pin">{e.pin}</label>
                <div className="uza-arama-satir">
                  <input id="uza-pe-pin" className="uza-girdi" readOnly value={yeni.pin} data-alan="portal-pin" inputMode="numeric" onFocus={(x) => x.currentTarget.select()} />
                  <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('pin')} data-eylem="pin-kopyala">{e.kopyala}</button>
                </div>
              </div>
              <p className="uza-ipucu" style={{ marginTop: 0 }}>{e.nasil}</p>
            </div>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bilgi>{bildirim === 'iptal' ? e.iptalEdildi : bildirim === 'baglanti-kopyalandi' || bildirim === 'pin-kopyalandi' ? e.kopyalandi : null}</Bilgi>
            <Hata>{bildirim === 'yapilamadi' ? e.yapilamadi : bildirim === 'kopyalanamadi' ? e.kopyalanamadi : baglantiHatasi ?? null}</Hata>
          </div>
          <div className="uza-eylemler">
            <button type="button" className={d === 'yok' ? 'uza-dugme' : 'uza-dugme uza-dugme-cizgi'} disabled={bekliyor} onClick={ver} data-eylem="erisim-ver">{bekliyor ? e.bekliyor : d === 'yok' ? e.ver : e.yenile}</button>
            {d !== 'yok' ? <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={iptal} data-eylem="erisim-iptal">{e.iptal}</button> : null}
          </div>
          {d === 'acik' ? <p className="uza-ipucu">{e.yenileUyari}</p> : null}
          <details className="uza-transkript" data-alan="portal-kayitlar">
            <summary>{e.kayitlar}</summary>
            {veri.kayitlar.length === 0 ? <p>{e.kayitYok}</p> : (
              <ul className="uza-liste">
                {veri.kayitlar.map((k, i) => (
                  <li key={`${k.an}-${i}`}><div className="uza-satir" data-olay={k.olay}><span className="uza-saat">{tarihYaz(k.an)} {saatYaz(k.an)}</span><span className="uza-liste-ad">{olayAdi(p, k.olay)}</span></div></li>
                ))}
              </ul>
            )}
          </details>
        </>
      ) : <div style={{ marginTop: 12 }}><Hata>{baglantiHatasi ?? null}</Hata></div>}
    </section>
  )
}

/** The whole address of a link: this site, the country's path prefix, the page, the token in the fragment. */
export const portalAdresi = (koken: string, yol: string): string => `${koken}${ulkeYolu(yol)}`

export function PortalErisimKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [veri, setVeri] = useState<ErisimVerisi | null>(null)
  const [yeni, setYeni] = useState<YeniErisim | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<ErisimBildirimi>(null)
  const [kopuk, setKopuk] = useState(false)
  const { hesap, api } = u

  const yukle = useCallback(async () => {
    const r = await api(`${HEKIM_PORTAL_API}?hasta=${encodeURIComponent(hastaId)}`)
    if (r.ok && r.j.erisim) { setVeri({ erisim: r.j.erisim, kayitlar: Array.isArray(r.j.kayitlar) ? r.j.kayitlar : [] }); setKopuk(false) } else setKopuk(true)
  }, [api, hastaId])
  useEffect(() => { if (hesap) yukle().catch(() => setKopuk(true)) }, [hesap, yukle])

  async function ver() {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(HEKIM_PORTAL_API, { method: 'POST', govde: { hastaId } })
      if (r.ok && typeof r.j.yol === 'string' && typeof r.j.pin === 'string') { setYeni({ adres: portalAdresi(window.location.origin, r.j.yol), pin: r.j.pin }); await yukle() }
      else setBildirim('yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  async function iptal() {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(HEKIM_PORTAL_API, { method: 'DELETE', govde: { hastaId } })
      if (r.ok) { setYeni(null); await yukle(); setBildirim('iptal') } else setBildirim('yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }

  return (
    <PortalErisimGorunumu p={portalMetni(u.dil)} veri={veri} yeni={yeni} bekliyor={bekliyor} bildirim={bildirim} baglantiHatasi={kopuk ? u.m.kabuk.hata : null} ver={() => { void ver() }} iptal={() => { void iptal() }}
      kopyala={(ne) => { if (yeni) void panoyaKopyala(ne === 'pin' ? yeni.pin : yeni.adres).then((tamam) => setBildirim(tamam ? (ne === 'pin' ? 'pin-kopyalandi' : 'baglanti-kopyalandi') : 'kopyalanamadi')) }} />
  )
}
