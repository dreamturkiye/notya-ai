'use client'

/**
 * NOTYA-ULKE-PORTAL-01 — the calendar: PATIENTS' APPOINTMENT REQUESTS, and the doctor's answer.
 *
 *   on the calendar            the requests that wait for an answer: who, which days suit them, their short reason
 *   /calendar?istek=<id>       the answer: the doctor chooses the day and the time and books, or declines
 *
 * A request books nothing. Only the doctor's answer makes an appointment, through the same rules as any booking:
 * a taken time is refused and cannot be overridden; a time outside the working hours asks for an explicit "book
 * anyway". The patient reads the outcome on their own page; nothing is sent to anybody.
 *
 * Every sentence is the pack's (portalMetni and the appointment catalogue), in the account's form.
 */
import React, { useEffect, useState, type FormEvent } from 'react'
import { gunCoz, gunYazDesenle } from '@/lib/ulke/uygulama/zaman'
import { Bilgi, Hata, tarihYaz, type Uygulama } from './Kabuk'
import { gunBasligi, takvimYolu } from './randevuOrtak'
import { portalMetni, type PortalMetni, type RandevuMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { tarihDeseni } from '@/lib/ulke/arayuz/bicim'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { HEKIM_PORTAL_API } from '@/lib/ulke/portal/sabitler'
import type { BekleyenIstek } from '@/lib/ulke/portal/tipler'

const API = `${HEKIM_PORTAL_API}/istekler`
const gunYaz = (gun: string) => gunYazDesenle(gun, tarihDeseni())

export type IstekBildirimi = 'reddedildi' | 'cevaplandi' | 'yapilamadi' | null

/** The waiting requests, on the calendar. Draws nothing when there is none. */
export function IsteklerGorunumu({ p, r, istekler, bekliyor, bildirim, reddet }: {
  p: PortalMetni; r: RandevuMetni; istekler: BekleyenIstek[]; bekliyor: boolean; bildirim: IstekBildirimi; reddet: (id: string) => void
}) {
  const i = p.istek
  if (istekler.length === 0 && !bildirim) return null
  return (
    <section className="uza-kart" data-alan="randevu-istekleri">
      <h2 className="uza-h2">{i.baslik}</h2>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bilgi>{bildirim === 'reddedildi' ? i.reddedildi : null}</Bilgi>
        <Hata>{bildirim === 'cevaplandi' ? i.cevaplandi : bildirim === 'yapilamadi' ? i.yapilamadi : null}</Hata>
      </div>
      <ul className="uza-liste">
        {istekler.map((x) => (
          <li key={x.id} data-istek={x.id}>
            <div className="uza-satir" style={{ flexWrap: 'wrap' }}>
              <span className="uza-liste-ad">
                {x.hastaAdi || '—'}
                <span className="uza-liste-alt">{i.gunler}: {x.gunler.map((g) => gunBasligi(r, g)).join('; ')}</span>
                {x.neden ? <span className="uza-liste-alt">{i.neden}: {x.neden}</span> : null}
                <span className="uza-liste-alt">{yerine(i.istekTarihi, tarihYaz(x.olusturuldu))}</span>
              </span>
              <span className="uza-eylemler" style={{ marginTop: 0 }}>
                <a className="uza-dugme uza-dugme-kucuk" href={takvimYolu({ istek: x.id })} data-eylem="istek-sec">{i.sec}</a>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => reddet(x.id)} data-eylem="istek-reddet">{i.reddet}</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Istekler({ u, r }: { u: Uygulama; r: RandevuMetni }) {
  const [istekler, setIstekler] = useState<BekleyenIstek[]>([])
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<IstekBildirimi>(null)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    // The calendar is the calendar without them: if the requests cannot be read, the list is simply not drawn.
    api(API).then((c) => { if (!iptal && c.ok && Array.isArray(c.j.istekler)) setIstekler(c.j.istekler) }).catch(() => { /* no list */ })
    return () => { iptal = true }
  }, [hesap, api])

  async function reddet(id: string) {
    setBekliyor(true); setBildirim(null)
    try {
      const c = await api(API, { method: 'PATCH', govde: { id, red: true } })
      if (c.ok || c.j.code === 'CEVAPLANDI' || c.status === 404) { setIstekler((eski) => eski.filter((x) => x.id !== id)); setBildirim(c.ok ? 'reddedildi' : 'cevaplandi') }
      else setBildirim('yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  return <IsteklerGorunumu p={portalMetni(u.dil)} r={r} istekler={istekler} bekliyor={bekliyor} bildirim={bildirim} reddet={(id) => { void reddet(id) }} />
}

// ───────────────────────── the answer ─────────────────────────

export type IstekCevapFormu = { gun: string; saat: string; sureDk: number }
export type IstekCevapHatasi = { kod: string; alan?: string | null } | null

/**
 * `zaman` is the calendar's own day / time / length fields and `hataMetni` its own sentences for a booking that was
 * refused: both are handed in by the calendar (./Takvim.tsx), so a request is booked with exactly the form any
 * appointment is booked with.
 */
export function IstekCevabiGorunumu({ p, r, istek, a, set, zaman, hataMetni, gonder, reddet, bekliyor, hata }: {
  p: PortalMetni; r: RandevuMetni; istek: BekleyenIstek; a: IstekCevapFormu; set: (y: Partial<IstekCevapFormu>) => void
  zaman: React.ReactNode; hataMetni: string | null
  gonder: (yineDe: boolean) => void; reddet: () => void; bekliyor: boolean; hata: IstekCevapHatasi
}) {
  const i = p.istek
  const mesaiDisi = hata?.kod === 'MESAI_DISI'
  const secili = gunCoz(a.gun, tarihDeseni())
  return (
    <section className="uza-kart uza-dar" data-alan="istek-cevabi" data-istek={istek.id}>
      <p className="uza-ust-yazi">{i.formBaslik}</p>
      <h1 className="uza-h1">{istek.hastaAdi || '—'}</h1>
      <dl className="uza-bilgiler">
        {istek.neden ? <><dt>{i.neden}</dt><dd>{istek.neden}</dd></> : null}
        <dt>{i.gunler}</dt>
        <dd>
          {/* One touch puts a day the patient asked for into the form; the day's own calendar opens beside it. */}
          <span className="uza-secim-satir">
            {istek.gunler.map((g) => (
              <button key={g} type="button" className="uza-secenek" data-secili={secili === g ? 'evet' : undefined} onClick={() => set({ gun: gunYaz(g) })} data-istek-gunu={g}>{gunBasligi(r, g)}</button>
            ))}
          </span>
        </dd>
      </dl>
      {secili ? <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu({ gun: secili })} target="_blank" rel="noreferrer">{r.takvim.gunuAc}: {gunBasligi(r, secili)}</a></p> : null}
      <form className="uza-form" onSubmit={(e: FormEvent) => { e.preventDefault(); gonder(false) }} noValidate>
        {zaman}
        <Hata>{hata?.kod === 'CEVAPLANDI' || hata?.kod === 'NOT_FOUND' ? i.cevaplandi : hata && !hataMetni ? i.yapilamadi : hataMetni}</Hata>
        <div className="uza-eylemler" style={{ marginTop: 0 }}>
          {mesaiDisi ? <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={() => gonder(true)} data-eylem="istek-yine-de">{r.form.yineDe}</button> : null}
          <button type="submit" className={mesaiDisi ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} disabled={bekliyor} data-eylem="istek-kabul">{bekliyor ? r.form.kaydediliyor : i.kabul}</button>
          <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={reddet} data-eylem="istek-reddet">{i.reddet}</button>
          <a className="uza-dugme uza-dugme-cizgi" href={takvimYolu()}>{r.form.vazgec}</a>
        </div>
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{r.duzen.saatDilimi}</p>
      </form>
    </section>
  )
}

/** What the screen shows when the request is not waiting any more (answered in another window, or never this doctor's). */
export function IstekYokGorunumu({ p, r, m, durum }: { p: PortalMetni; r: RandevuMetni; m: UygulamaMetni; durum: 'yukleniyor' | 'yok' | 'hata' }) {
  return (
    <section className="uza-kart" data-alan="istek-cevabi">
      {durum === 'yukleniyor' ? <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p> : <Hata>{durum === 'yok' ? p.istek.cevaplandi : m.kabuk.hata}</Hata>}
      {durum === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu()}>{r.randevu.takvimeDon}</a></p>}
    </section>
  )
}

export const ISTEK_API = API
