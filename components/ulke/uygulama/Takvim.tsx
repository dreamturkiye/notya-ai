'use client'

/**
 * NOTYA-UZ-RANDEVU-01 — /calendar: the doctor's appointments. One address, by its parameters:
 *
 *   (none) | ?gun=<YYYY-MM-DD>[&gorunum=hafta]   the calendar: one day (default: today) or its week, Monday first
 *   ?yeni=1[&hasta=<id>][&gun=][&saat=]          the booking form; without a patient, first choose one
 *   ?randevu=<id>                                one appointment: status, start the visit, move, cancel, reminder text
 *   ?duzen=1                                     the working pattern: days, hours, default length, breaks
 *
 * BOTH VIEWS WORK ON A PHONE. The day is a list of rows; the week is seven day blocks, stacked on a narrow screen
 * and side by side on a wide one. Nothing depends on dragging or hovering.
 *
 * TIME. Every day and hour on these screens is the COUNTRY's (the pack's time zone), as the server answers it
 * (`gun`, `saat`); the browser's own zone is never asked. A day is typed and shown in the pack's pattern (DD.MM.YYYY).
 *
 * RULES ARE THE SERVER'S. A taken time answers 'DOLU' and can never be overridden here; a time outside the working
 * hours answers 'MESAI_DISI', nothing is written, and the same form offers an explicit "book anyway".
 *
 * THE REMINDER is text the doctor copies. Nothing is sent from here to anybody (./hatirlatma.ts).
 *
 * The server answers with codes; every sentence here is the catalogue's (./randevuMetinleri.ts), in the account's form.
 */
import React, { useEffect, useState, type FormEvent } from 'react'
import { gunCoz, gunEkle, gunYazDesenle, haftaGunu, saatCoz, saatYazDk } from '@/lib/ulke/uygulama/zaman'
import { Bilgi, Cerceve, Hata, tarihYaz, useUygulama, YOL, Yukleniyor, type Uygulama } from './Kabuk'
import { tamAd, type HastaKaydi } from './Hastalar'
import { bitisSaati, DurumRozeti, gunBasligi, muayeneBaslatilabilir, muayeneBaslatYolu, takvimYolu, type DuzenKaydi, type Gorunum, type RandevuDurumu, type RandevuKaydi } from './randevuOrtak'
import { temelDil, randevuMetni, gunAdi, type UygulamaMetni, type RandevuMetni } from '@/lib/ulke/arayuz'
import type { DilKodu } from '@/lib/ulke/tipler'
import { hatirlatmaMetni, tarihDeseni } from '@/lib/ulke/arayuz/hatirlatma'

export { bitisSaati, DurumRozeti, gunBasligi, muayeneBaslatilabilir, muayeneBaslatYolu, takvimYolu, type DuzenKaydi, type Gorunum, type RandevuDurumu, type RandevuKaydi } from './randevuOrtak'

const gunYaz = (gun: string) => gunYazDesenle(gun, tarihDeseni())

/** A code of the appointment API → the catalogue's sentence. `tasima` = the request was a move, not a booking. */
export function randevuHataMetni(m: UygulamaMetni, r: RandevuMetni, kod: string | null, alan?: string | null, tasima = false): string | null {
  if (!kod) return null
  if (kod === 'DOLU') return r.form.dolu
  if (kod === 'MESAI_DISI') return tasima ? r.randevu.tasiMesaiDisi : r.form.mesaiDisi
  if (kod === 'GECERSIZ') return alan === 'gun' ? r.form.tarihGecersiz : alan === 'saat' ? r.form.saatGecersiz : alan === 'sure' ? r.form.sureGecersiz : tasima ? r.randevu.degistirilemedi : r.form.kaydedilemedi
  if (kod === 'GECIS_YOK') return r.randevu.gecisYok
  if (kod === 'RANDEVU_YOK') return r.randevu.bulunamadi
  if (kod === 'NOT_FOUND') return tasima ? r.randevu.bulunamadi : m.hasta.bulunamadi
  if (kod === 'BAGLANTI') return m.kabuk.baglanti
  return tasima ? r.randevu.degistirilemedi : r.form.kaydedilemedi
}

// ───────────────────────── the calendar ─────────────────────────

export type GunSatiri =
  | { tur: 'randevu'; dk: number; randevu: RandevuKaydi }
  | { tur: 'bos'; dk: number; saat: string }
  | { tur: 'mola'; dk: number; saat: string; bitis: string }

/**
 * The rows of one day, in time order: its appointments, the breaks, and the free times of the working pattern
 * (steps of the default length, inside the working hours, outside the breaks, not under an appointment that still
 * holds its time). A day that is not a working day has no free rows — it can still be booked with the form.
 */
export function gunSatirlari(duzen: DuzenKaydi | null, gun: string, randevular: RandevuKaydi[]): GunSatiri[] {
  const gununki = randevular.filter((x) => x.gun === gun)
  const satirlar: GunSatiri[] = gununki.map((x) => ({ tur: 'randevu', dk: saatCoz(x.saat) ?? 0, randevu: x }))
  const bas = duzen ? saatCoz(duzen.baslangic) : null
  const bit = duzen ? saatCoz(duzen.bitis) : null
  if (duzen && bas !== null && bit !== null && duzen.sureDk >= 5 && duzen.gunler.includes(haftaGunu(gun))) {
    const molalar = duzen.molalar.map((x) => ({ bas: saatCoz(x.baslangic) ?? 0, bit: saatCoz(x.bitis) ?? 0 })).filter((x) => x.bit > x.bas)
    for (const x of molalar) satirlar.push({ tur: 'mola', dk: x.bas, saat: saatYazDk(x.bas), bitis: saatYazDk(x.bit) })
    const dolu = gununki.filter((x) => x.durum === 'planlandi' || x.durum === 'geldi' || x.durum === 'tamamlandi').map((x) => ({ bas: saatCoz(x.saat) ?? 0, bit: (saatCoz(x.saat) ?? 0) + x.sureDk }))
    for (let dk = bas; dk + duzen.sureDk <= bit; dk += duzen.sureDk) {
      const son = dk + duzen.sureDk
      if ([...molalar, ...dolu].some((x) => dk < x.bit && son > x.bas)) continue
      satirlar.push({ tur: 'bos', dk, saat: saatYazDk(dk) })
    }
  }
  const sira = { mola: 0, randevu: 1, bos: 2 }
  return satirlar.sort((a, b) => a.dk - b.dk || sira[a.tur] - sira[b.tur])
}

function RandevuSatiri({ r, x, gunlu }: { r: RandevuMetni; x: RandevuKaydi; gunlu?: boolean }) {
  return (
    <a className="uza-satir" href={takvimYolu({ randevu: x.id })} data-randevu={x.id} data-soluk={x.durum === 'iptal' || x.durum === 'gelmedi' ? 'evet' : undefined}>
      <span className="uza-saat">{gunlu ? `${gunYaz(x.gun)} ` : ''}{x.saat}–{bitisSaati(x.saat, x.sureDk)}</span>
      <span className="uza-liste-ad">
        {x.hastaAdi || '—'}
        {x.neden || x.mesaiDisi ? <span className="uza-liste-alt">{[x.neden, x.mesaiDisi ? r.takvim.mesaiDisi : ''].filter(Boolean).join(' · ')}</span> : null}
      </span>
      <DurumRozeti r={r} durum={x.durum} />
    </a>
  )
}

export function GunGorunumu({ r, gun, duzen, randevular }: { r: RandevuMetni; gun: string; duzen: DuzenKaydi | null; randevular: RandevuKaydi[] }) {
  const satirlar = gunSatirlari(duzen, gun, randevular)
  const isGunu = !duzen || duzen.gunler.includes(haftaGunu(gun))
  return (
    <div data-gorunum="gun">
      <h2 className="uza-h2" style={{ marginBottom: 6 }}>{gunBasligi(r, gun)}</h2>
      {isGunu ? null : <p className="uza-ipucu" style={{ marginTop: 0, marginBottom: 8 }}>{r.takvim.isGunuDegil}</p>}
      {satirlar.length === 0 ? <p className="uza-bos">{r.takvim.bos}</p> : (
        <ul className="uza-liste">
          {satirlar.map((s) => s.tur === 'randevu' ? (
            <li key={`r-${s.randevu.id}`}><RandevuSatiri r={r} x={s.randevu} /></li>
          ) : s.tur === 'mola' ? (
            <li key={`m-${s.dk}`}><div className="uza-satir uza-takvim-mola"><span className="uza-saat">{s.saat}–{s.bitis}</span><span className="uza-liste-ad">{r.takvim.mola}</span></div></li>
          ) : (
            <li key={`b-${s.dk}`}>
              <a className="uza-satir uza-takvim-bos" href={takvimYolu({ yeni: '1', gun, saat: s.saat })} data-bos={s.saat}>
                <span className="uza-saat">{s.saat}</span>
                <span className="uza-liste-ad">{r.takvim.bosSaat}</span>
                <span className="uza-rozet">{r.takvim.yeni}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function HaftaGorunumu({ r, gunler, bugun, randevular }: { r: RandevuMetni; gunler: string[]; bugun: string; randevular: RandevuKaydi[] }) {
  return (
    <div className="uza-hafta" data-gorunum="hafta">
      {gunler.map((g) => {
        const gununki = randevular.filter((x) => x.gun === g)
        return (
          <section key={g} className="uza-hafta-gun" data-gun={g} data-bugun={g === bugun ? 'evet' : undefined}>
            <div className="uza-hafta-baslik">
              <a className="uza-baglanti" href={takvimYolu({ gun: g })} title={r.takvim.gunuAc}>{gunAdi(r, haftaGunu(g))} · {gunYaz(g).slice(0, 5)}</a>
              <a className="uza-hafta-ekle" href={takvimYolu({ yeni: '1', gun: g })} aria-label={`${r.takvim.yeni}: ${gunBasligi(r, g)}`}>+</a>
            </div>
            {gununki.length === 0 ? <p className="uza-hafta-bos" aria-hidden="true">—</p> : (
              <ul className="uza-hafta-liste">
                {gununki.map((x) => (
                  <li key={x.id}>
                    <a className="uza-hafta-randevu" href={takvimYolu({ randevu: x.id })} data-randevu={x.id} data-randevu-durum={x.durum}>
                      <span className="uza-saat">{x.saat}</span>
                      <span className="uza-hafta-ad">{x.hastaAdi || '—'}</span>
                      <span className="uza-hafta-durum">{r.durum[x.durum]}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export function TakvimGorunumu({ m, r, gorunum, gun, gunler, bugun, duzen, randevular, hata }: {
  m: UygulamaMetni; r: RandevuMetni; gorunum: Gorunum
  /** The day the calendar stands on (the country's day). */
  gun: string
  /** The days shown: one for the day view, seven for the week. */
  gunler: string[]; bugun: string; duzen: DuzenKaydi | null
  /** null = still loading. */
  randevular: RandevuKaydi[] | null; hata: boolean
}) {
  const adim = gorunum === 'hafta' ? 7 : 1
  const g = (x: string, gr: Gorunum = gorunum) => takvimYolu({ gun: x, gorunum: gr === 'hafta' ? 'hafta' : undefined })
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <h1 className="uza-h1">{r.takvim.baslik}</h1>
        <a className="uza-dugme" href={takvimYolu({ yeni: '1', gun })} data-eylem="yeni-randevu">{r.takvim.yeni}</a>
      </div>
      <div className="uza-takvim-ust">
        <nav className="uza-takvim-gorunumler" aria-label={r.takvim.baslik}>
          <a className="uza-sekme" href={g(gun, 'gun')} aria-current={gorunum === 'gun' ? 'page' : undefined}>{r.takvim.gun}</a>
          <a className="uza-sekme" href={g(gun, 'hafta')} aria-current={gorunum === 'hafta' ? 'page' : undefined}>{r.takvim.hafta}</a>
        </nav>
        <div className="uza-takvim-gezinme">
          <a className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" href={g(gunEkle(gun, -adim))} data-eylem="onceki">‹ {r.takvim.onceki}</a>
          <a className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" href={g(bugun)} data-eylem="bugun">{r.takvim.bugun}</a>
          <a className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" href={g(gunEkle(gun, adim))} data-eylem="sonraki">{r.takvim.sonraki} ›</a>
        </div>
      </div>
      <Hata>{hata ? m.kabuk.hata : null}</Hata>
      {randevular === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : gorunum === 'hafta'
        ? <HaftaGorunumu r={r} gunler={gunler} bugun={bugun} randevular={randevular} />
        : <GunGorunumu r={r} gun={gunler[0] ?? gun} duzen={duzen} randevular={randevular} />}
      <p className="uza-ipucu" style={{ marginTop: 14 }}>
        <a className="uza-baglanti" href={takvimYolu({ duzen: '1' })}>{r.takvim.duzen}</a> · {r.duzen.saatDilimi}
      </p>
    </section>
  )
}

function TakvimEkrani({ u, r, gunParam, gorunum }: { u: Uygulama; r: RandevuMetni; gunParam: string; gorunum: Gorunum }) {
  const [veri, setVeri] = useState<{ gunler: string[]; bugun: string; randevular: RandevuKaydi[] } | null>(null)
  const [duzen, setDuzen] = useState<DuzenKaydi | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const s = new URLSearchParams()
    if (gunParam) s.set('gun', gunParam)
    if (gorunum === 'hafta') s.set('gorunum', 'hafta')
    api(`/api/ulke/randevular${s.toString() ? `?${s.toString()}` : ''}`)
      .then((c) => { if (iptal) return; if (c.ok && Array.isArray(c.j.randevular) && Array.isArray(c.j.gunler)) setVeri({ gunler: c.j.gunler, bugun: String(c.j.bugun ?? ''), randevular: c.j.randevular }); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    // The working pattern only draws the free rows; the calendar is still a calendar without it.
    api('/api/ulke/calisma-duzeni').then((c) => { if (!iptal && c.ok && c.j.duzen) setDuzen(c.j.duzen) }).catch(() => { /* no free rows */ })
    return () => { iptal = true }
  }, [hesap, api, gunParam, gorunum])
  // Until the server has said which day "today" is, the address's own day is the only day known.
  const gun = (gunParam && gunCoz(gunParam, tarihDeseni())) || veri?.bugun || ''
  if (!gun) return <section className="uza-kart"><Hata>{hata ? u.m.kabuk.hata : null}</Hata>{hata ? null : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>}</section>
  return <TakvimGorunumu m={u.m} r={r} gorunum={gorunum} gun={gun} gunler={veri?.gunler ?? [gun]} bugun={veri?.bugun ?? gun} duzen={duzen} randevular={veri?.randevular ?? null} hata={hata} />
}

// ───────────────────────── booking ─────────────────────────

export type RandevuFormu = { gun: string; saat: string; sureDk: number; neden: string }
export type FormHatasi = { kod: string; alan?: string | null } | null

function ZamanAlanlari({ r, a, set, sureler, on }: { r: RandevuMetni; a: Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>; set: (y: Partial<RandevuFormu>) => void; sureler: readonly number[]; on: string }) {
  return (
    <>
      <div className="uza-iki">
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor={`${on}-gun`}>{r.form.tarih}</label>
          {/* Typed in the pack's own pattern (DD.MM.YYYY): a browser date field would show the browser's pattern instead. */}
          <input id={`${on}-gun`} name="gun" className="uza-girdi" inputMode="numeric" autoComplete="off" placeholder={r.form.tarihOrnek} value={a.gun} onChange={(e) => set({ gun: e.target.value })} required />
        </div>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor={`${on}-saat`}>{r.form.saat}</label>
          <input id={`${on}-saat`} name="saat" type="time" className="uza-girdi" value={a.saat} onChange={(e) => set({ saat: e.target.value })} required />
        </div>
      </div>
      <div className="uza-alan">
        <label className="uza-etiket" htmlFor={`${on}-sure`}>{r.form.sure}</label>
        <select id={`${on}-sure`} name="sureDk" className="uza-girdi" value={String(a.sureDk)} onChange={(e) => set({ sureDk: Number(e.target.value) })}>
          {(sureler.includes(a.sureDk) ? sureler : [a.sureDk, ...sureler]).map((s) => <option key={s} value={String(s)}>{s} {r.form.dakika}</option>)}
        </select>
      </div>
    </>
  )
}

export function RandevuFormuGorunumu({ m, r, hasta, a, set, sureler, gonder, bekliyor, hata, geri }: {
  m: UygulamaMetni; r: RandevuMetni; hasta: Pick<HastaKaydi, 'id' | 'ad' | 'otaIsmi'>
  a: RandevuFormu; set: (y: Partial<RandevuFormu>) => void; sureler: readonly number[]
  /** `yineDe` true = the explicit "book anyway", offered only after the server said "outside working hours". */
  gonder: (yineDe: boolean) => void; bekliyor: boolean; hata: FormHatasi; geri: string
}) {
  const mesaiDisi = hata?.kod === 'MESAI_DISI'
  return (
    <section className="uza-kart uza-dar">
      <p className="uza-ust-yazi">{r.form.baslik}</p>
      <h1 className="uza-h1">{tamAd(hasta)}</h1>
      <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu({ yeni: '1', gun: gunCoz(a.gun, tarihDeseni()) ?? undefined, saat: a.saat })}>{r.form.hastaDegistir}</a></p>
      <form className="uza-form" onSubmit={(e: FormEvent) => { e.preventDefault(); gonder(false) }} noValidate>
        <ZamanAlanlari r={r} a={a} set={set} sureler={sureler} on="uza-rf" />
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-rf-neden">{r.form.neden}</label>
          <input id="uza-rf-neden" name="neden" className="uza-girdi" maxLength={200} placeholder={r.form.nedenOrnek} value={a.neden} onChange={(e) => set({ neden: e.target.value })} />
        </div>
        <Hata>{randevuHataMetni(m, r, hata?.kod ?? null, hata?.alan)}</Hata>
        <div className="uza-eylemler" style={{ marginTop: 0 }}>
          {/* A taken time has no second button: there is no way to book over another appointment. */}
          {mesaiDisi ? <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={() => gonder(true)} data-eylem="yine-de">{r.form.yineDe}</button> : null}
          <button type="submit" className={mesaiDisi ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} disabled={bekliyor} data-eylem="kaydet">{bekliyor ? r.form.kaydediliyor : r.form.kaydet}</button>
          <a className="uza-dugme uza-dugme-cizgi" href={geri}>{r.form.vazgec}</a>
        </div>
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{r.duzen.saatDilimi}</p>
      </form>
    </section>
  )
}

export function RandevuHastaSecGorunumu({ m, r, q, hastalar, hata, gun, saat }: { m: UygulamaMetni; r: RandevuMetni; q: string; hastalar: HastaKaydi[] | null; hata: boolean; gun?: string; saat?: string }) {
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <h1 className="uza-h1">{r.form.baslik}</h1>
        <a className="uza-dugme uza-dugme-cizgi" href={YOL.yeniHasta}>{m.muayene.yeniHasta}</a>
      </div>
      <p className="uza-aciklama" style={{ marginBottom: 14 }}>{r.form.hastaSec}</p>
      {/* A plain GET form that keeps the day and the time already chosen. */}
      <form className="uza-arama" action={YOL.takvim} method="get" role="search">
        <input type="hidden" name="yeni" value="1" />
        {gun ? <input type="hidden" name="gun" value={gun} /> : null}
        {saat ? <input type="hidden" name="saat" value={saat} /> : null}
        <label className="uza-etiket" htmlFor="uza-rarama">{m.arama.etiket}</label>
        <div className="uza-arama-satir">
          <input id="uza-rarama" name="q" type="search" defaultValue={q} placeholder={m.arama.ornek} autoComplete="off" className="uza-girdi" />
          <button type="submit" className="uza-dugme uza-dugme-cizgi">{m.arama.dugme}</button>
        </div>
      </form>
      <Hata>{hata ? m.kabuk.hata : null}</Hata>
      {hastalar === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : hastalar.length === 0 ? (
        <p className="uza-bos">{q ? m.arama.sonucYok : m.hastalar.bos}</p>
      ) : (
        <ul className="uza-liste" style={{ marginTop: 10 }}>
          {hastalar.map((h) => (
            <li key={h.id}>
              <a className="uza-satir" href={takvimYolu({ yeni: '1', hasta: h.id, gun, saat })}>
                <span className="uza-liste-ad">
                  {tamAd(h)}
                  <span className="uza-liste-alt">{[tarihYaz(h.dogumTarihi), h.telefon].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="uza-rozet">{r.takvim.yeni}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu({ gun })}>{r.randevu.takvimeDon}</a></p>
    </section>
  )
}

type DuzenCevabi = { duzen: DuzenKaydi; kayitli: boolean; sureSecenekleri: number[]; bugun: string }

function YeniRandevu({ u, r, hastaId, gunParam, saatParam, q }: { u: Uygulama; r: RandevuMetni; hastaId: string; gunParam: string; saatParam: string; q: string }) {
  const [hasta, setHasta] = useState<HastaKaydi | null>(null)
  const [hastalar, setHastalar] = useState<HastaKaydi[] | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [sureler, setSureler] = useState<number[]>([])
  const [a, setA] = useState<RandevuFormu | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<FormHatasi>(null)
  const { hesap, api } = u
  const gun = gunCoz(gunParam, tarihDeseni()) ?? ''
  const saat = saatCoz(saatParam) !== null ? saatParam : ''

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    ;(async () => {
      try {
        if (!hastaId) {
          const c = await api(`/api/ulke/hastalar${q ? `?q=${encodeURIComponent(q)}` : ''}`)
          if (iptal) return
          if (c.ok && Array.isArray(c.j.hastalar)) { setHastalar(c.j.hastalar); setYuk('tamam') } else setYuk('hata')
          return
        }
        const [h, d] = await Promise.all([api(`/api/ulke/hasta?id=${encodeURIComponent(hastaId)}`), api('/api/ulke/calisma-duzeni')])
        if (iptal) return
        if (!h.ok || !h.j.hasta) { setYuk(h.status === 404 ? 'yok' : 'hata'); return }
        if (!d.ok || !d.j.duzen) { setYuk('hata'); return }
        const dc = d.j as unknown as DuzenCevabi
        setHasta(h.j.hasta); setSureler(dc.sureSecenekleri ?? [])
        setA({ gun: gunYaz(gun || dc.bugun), saat, sureDk: dc.duzen.sureDk, neden: '' })
        setYuk('tamam')
      } catch { if (!iptal) setYuk('hata') }
    })()
    return () => { iptal = true }
  }, [hesap, api, hastaId, q, gun, saat])

  async function gonder(yineDe: boolean) {
    if (!a || !hasta) return
    setBekliyor(true); setHata(null)
    try {
      const c = await api('/api/ulke/randevu', { method: 'POST', govde: { hastaId: hasta.id, gun: a.gun, saat: a.saat, sureDk: a.sureDk, neden: a.neden, ...(yineDe ? { yineDe: true } : {}) } })
      if (c.ok && c.j.randevu?.id) { window.location.assign(takvimYolu({ randevu: c.j.randevu.id })); return }
      setHata({ kod: typeof c.j.code === 'string' ? c.j.code : 'BASARISIZ', alan: typeof c.j.alan === 'string' ? c.j.alan : null })
    } catch { setHata({ kod: 'BAGLANTI' }) }
    setBekliyor(false)
  }

  if (!hastaId) return <RandevuHastaSecGorunumu m={u.m} r={r} q={q} hastalar={hastalar} hata={yuk === 'hata'} gun={gun || undefined} saat={saat || undefined} />
  if (yuk !== 'tamam' || !hasta || !a) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.hasta.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu()}>{r.randevu.takvimeDon}</a></p>}
      </section>
    )
  }
  return <RandevuFormuGorunumu m={u.m} r={r} hasta={hasta} a={a} set={(y) => { setA({ ...a, ...y }); setHata(null) }} sureler={sureler} gonder={gonder} bekliyor={bekliyor} hata={hata} geri={takvimYolu({ gun: gun || undefined })} />
}

// ───────────────────────── one appointment ─────────────────────────

export type DetayBildirimi = 'tasindi' | 'kopyalandi' | 'kopyalanamadi' | null
export type DetayHatasi = { nerede: 'durum' | 'tasi'; kod: string; alan?: string | null } | null

/** The status buttons an appointment offers by hand, in order. The server decides again; this only hides the impossible. */
export function durumEylemleri(x: Pick<RandevuKaydi, 'durum' | 'seansId'>): RandevuDurumu[] {
  if (x.durum === 'planlandi') return ['geldi', 'gelmedi', 'iptal']
  if (x.durum === 'geldi') return ['tamamlandi', 'planlandi', 'gelmedi', 'iptal']
  if (x.durum === 'gelmedi') return ['geldi', 'planlandi', 'iptal']
  // "Done" by hand, with no visit, can be taken back; with a visit it is the approved note that finished it.
  if (x.durum === 'tamamlandi' && !x.seansId) return ['geldi']
  return []
}

export function RandevuDetayGorunumu({ m, r, randevu, hekim, sureler, tasi, setTasi, hata, bildirim, bekliyor, durumDegistir, tasiGonder, kopyala }: {
  m: UygulamaMetni; r: RandevuMetni; randevu: RandevuKaydi
  /** The account: its two forms and its name, for the reminder text. */
  hekim: { dil: DilKodu; notDili: DilKodu; ad: string }
  sureler: readonly number[]; tasi: Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>; setTasi: (y: Partial<RandevuFormu>) => void
  hata: DetayHatasi; bildirim: DetayBildirimi; bekliyor: boolean
  durumDegistir: (d: RandevuDurumu) => void; tasiGonder: (yineDe: boolean) => void; kopyala: (metin: string) => void
}) {
  const x = randevu
  const tasinabilir = x.durum === 'planlandi' || x.durum === 'geldi'
  const eylemler = durumEylemleri(x)
  const etiket = (d: RandevuDurumu) => d === 'geldi' ? (x.durum === 'tamamlandi' ? r.randevu.geldiyeAl : r.randevu.geldi) : d === 'tamamlandi' ? r.randevu.tamamla : d === 'gelmedi' ? r.randevu.gelmedi : d === 'iptal' ? r.randevu.iptalEt : r.randevu.planaAl
  // The reminder is for an appointment that is still to come: planned.
  const h = x.durum === 'planlandi' ? hatirlatmaMetni({ hastaDili: x.hastaDili ?? '', hekim, gun: x.gun, saat: x.saat }) : null
  const tasiMesaiDisi = hata?.nerede === 'tasi' && hata.kod === 'MESAI_DISI'
  return (
    <>
      <section className="uza-kart">
        <p className="uza-ust-yazi">{r.randevu.baslik}</p>
        <div className="uza-baslik-satiri">
          <h1 className="uza-h1">{x.hastaAdi || '—'}</h1>
          <DurumRozeti r={r} durum={x.durum} />
        </div>
        <dl className="uza-bilgiler">
          <dt>{r.form.tarih}</dt><dd data-alan="gun">{gunBasligi(r, x.gun)}</dd>
          <dt>{r.randevu.vakit}</dt><dd data-alan="saat">{x.saat}–{bitisSaati(x.saat, x.sureDk)} ({x.sureDk} {r.form.dakika})</dd>
          {x.neden ? <><dt>{r.form.neden}</dt><dd>{x.neden}</dd></> : null}
        </dl>
        {x.mesaiDisi ? <p className="uza-ipucu">{r.randevu.mesaiDisiIsareti}</p> : null}
        <Hata>{hata?.nerede === 'durum' ? randevuHataMetni(m, r, hata.kod, hata.alan, true) : null}</Hata>
        <div className="uza-eylemler">
          {muayeneBaslatilabilir(x) ? <a className="uza-dugme" href={muayeneBaslatYolu(x)} data-eylem="muayene-baslat">{m.bugun.muayeneBaslat}</a> : null}
          {x.seansId ? <a className="uza-dugme" href={`${YOL.muayene}?seans=${x.seansId}`} data-eylem="muayene-ac">{r.randevu.muayeneyiAc}</a> : null}
          {eylemler.map((d) => (
            <button key={d} type="button" className={d === 'iptal' ? 'uza-dugme uza-dugme-uyari' : 'uza-dugme uza-dugme-cizgi'} disabled={bekliyor} onClick={() => durumDegistir(d)} data-eylem={`durum-${d}`}>{etiket(d)}</button>
          ))}
          {x.durum === 'iptal' || x.durum === 'gelmedi' ? <a className="uza-dugme uza-dugme-cizgi" href={takvimYolu({ yeni: '1', hasta: x.hastaId })}>{r.randevu.yenidenYaz}</a> : null}
        </div>
        <p className="uza-ipucu" style={{ marginTop: 14 }}>
          <a className="uza-baglanti" href={takvimYolu({ gun: x.gun })}>{r.randevu.takvimeDon}</a> · <a className="uza-baglanti" href={`${YOL.hasta}?id=${x.hastaId}`}>{r.randevu.dosya}</a>
        </p>
      </section>
      {h && h.metin ? (
        <section className="uza-kart" data-alan="hatirlatma-karti">
          <h2 className="uza-h2">{r.hatirlatma.baslik}</h2>
          <p className="uza-ust-yazi">{r.hatirlatma.dil}: {r.hatirlatma.dilAdi[temelDil(h.dil)] ?? ''}</p>
          <textarea className="uza-girdi uza-hatirlatma" readOnly rows={3} value={h.metin} lang={h.dil} data-alan="hatirlatma" data-dil={h.dil} aria-label={r.hatirlatma.baslik} onFocus={(e) => e.currentTarget.select()} />
          {bildirim === 'kopyalandi' ? <div style={{ marginTop: 10 }}><Bilgi>{r.hatirlatma.kopyalandi}</Bilgi></div> : null}
          {bildirim === 'kopyalanamadi' ? <div style={{ marginTop: 10 }}><Hata>{r.hatirlatma.kopyalanamadi}</Hata></div> : null}
          <div className="uza-eylemler" style={{ marginTop: 12 }}>
            <button type="button" className="uza-dugme" onClick={() => kopyala(h.metin)} data-eylem="hatirlatma-kopyala">{r.hatirlatma.kopyala}</button>
          </div>
          <p className="uza-ipucu">{r.hatirlatma.izoh}</p>
        </section>
      ) : null}
      {tasinabilir ? (
        <section className="uza-kart" data-alan="tasi">
          <h2 className="uza-h2">{r.randevu.tasi}</h2>
          <form className="uza-form" style={{ marginTop: 0 }} onSubmit={(e: FormEvent) => { e.preventDefault(); tasiGonder(false) }} noValidate>
            <ZamanAlanlari r={r} a={tasi} set={setTasi} sureler={sureler} on="uza-rt" />
            {bildirim === 'tasindi' ? <Bilgi>{r.randevu.tasindi}</Bilgi> : null}
            <Hata>{hata?.nerede === 'tasi' ? randevuHataMetni(m, r, hata.kod, hata.alan, true) : null}</Hata>
            <div className="uza-eylemler" style={{ marginTop: 0 }}>
              {tasiMesaiDisi ? <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={() => tasiGonder(true)} data-eylem="tasi-yine-de">{r.randevu.tasiYineDe}</button> : null}
              <button type="submit" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} data-eylem="tasi">{r.randevu.tasiKaydet}</button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  )
}

/** Copies text for the doctor to paste elsewhere. true = it is on the clipboard. Nothing is sent anywhere. */
async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(metin); return true }
  } catch { /* fall through to the older way */ }
  try {
    const alan = document.createElement('textarea')
    alan.value = metin; alan.setAttribute('readonly', ''); alan.style.position = 'fixed'; alan.style.opacity = '0'
    document.body.appendChild(alan); alan.select()
    const tamam = document.execCommand('copy')
    document.body.removeChild(alan)
    return tamam
  } catch { return false }
}

function RandevuDetay({ u, r, id }: { u: Uygulama; r: RandevuMetni; id: string }) {
  const [randevu, setRandevu] = useState<RandevuKaydi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [sureler, setSureler] = useState<number[]>([])
  const [tasi, setTasi] = useState<Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>>({ gun: '', saat: '', sureDk: 30 })
  const [hata, setHata] = useState<DetayHatasi>(null)
  const [bildirim, setBildirim] = useState<DetayBildirimi>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const { hesap, api } = u
  const yerlestir = (x: RandevuKaydi) => { setRandevu((eski) => ({ ...x, hastaDili: x.hastaDili ?? eski?.hastaDili })); setTasi({ gun: gunYaz(x.gun), saat: x.saat, sureDk: x.sureDk }) }

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`/api/ulke/randevu?id=${encodeURIComponent(id)}`)
      .then((c) => { if (iptal) return; if (c.ok && c.j.randevu) { yerlestir(c.j.randevu); setYuk('tamam') } else setYuk(c.status === 404 ? 'yok' : 'hata') })
      .catch(() => { if (!iptal) setYuk('hata') })
    api('/api/ulke/calisma-duzeni').then((c) => { if (!iptal && c.ok && Array.isArray(c.j.sureSecenekleri)) setSureler(c.j.sureSecenekleri) }).catch(() => { /* the present length stays the only choice */ })
    return () => { iptal = true }
  }, [hesap, api, id])

  async function degistir(govde: Record<string, unknown>, nerede: 'durum' | 'tasi') {
    setBekliyor(true); setHata(null); setBildirim(null)
    try {
      const c = await api('/api/ulke/randevu', { method: 'PATCH', govde: { id, ...govde } })
      if (c.ok && c.j.randevu) { yerlestir(c.j.randevu); if (nerede === 'tasi') setBildirim('tasindi') }
      else setHata({ nerede, kod: typeof c.j.code === 'string' ? (c.j.code === 'NOT_FOUND' ? 'RANDEVU_YOK' : c.j.code) : 'BASARISIZ', alan: typeof c.j.alan === 'string' ? c.j.alan : null })
    } catch { setHata({ nerede, kod: 'BAGLANTI' }) }
    setBekliyor(false)
  }

  if (!hesap) return null
  if (yuk !== 'tamam' || !randevu) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? r.randevu.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu()}>{r.randevu.takvimeDon}</a></p>}
      </section>
    )
  }
  return (
    <RandevuDetayGorunumu
      m={u.m} r={r} randevu={randevu} hekim={{ dil: hesap.dil, notDili: hesap.notDili, ad: hesap.ad }} sureler={sureler}
      tasi={tasi} setTasi={(y) => { setTasi({ ...tasi, ...y }); setHata(null); setBildirim(null) }} hata={hata} bildirim={bildirim} bekliyor={bekliyor}
      durumDegistir={(d) => { void degistir({ durum: d }, 'durum') }}
      tasiGonder={(yineDe) => { void degistir({ gun: tasi.gun, saat: tasi.saat, sureDk: tasi.sureDk, ...(yineDe ? { yineDe: true } : {}) }, 'tasi') }}
      kopyala={(metin) => { void panoyaKopyala(metin).then((tamam) => setBildirim(tamam ? 'kopyalandi' : 'kopyalanamadi')) }}
    />
  )
}

// ───────────────────────── the working pattern ─────────────────────────

export type DuzenHatasi = 'gunler' | 'saatler' | 'sure' | 'molalar' | 'kayit' | 'baglanti' | null
export const MOLA_AZAMI = 4

export function DuzenGorunumu({ m, r, a, set, sureler, gonder, bekliyor, hata, kaydedildi, kayitli }: {
  m: UygulamaMetni; r: RandevuMetni; a: DuzenKaydi; set: (y: DuzenKaydi) => void; sureler: readonly number[]
  gonder: (e: FormEvent) => void; bekliyor: boolean; hata: DuzenHatasi; kaydedildi: boolean
  /** false = the account has saved no pattern yet: what is shown is the country's standard one. */
  kayitli: boolean
}) {
  const d = r.duzen
  const hataMetni = hata === 'gunler' ? d.gunGerekli : hata === 'saatler' ? d.saatGecersiz : hata === 'sure' ? d.sureGecersiz : hata === 'molalar' ? d.molaGecersiz : hata === 'baglanti' ? m.kabuk.baglanti : hata === 'kayit' ? d.kaydedilemedi : null
  const mola = (i: number, y: Partial<{ baslangic: string; bitis: string }>) => set({ ...a, molalar: a.molalar.map((x, j) => (j === i ? { ...x, ...y } : x)) })
  return (
    <section className="uza-kart uza-dar">
      <h1 className="uza-h1">{d.baslik}</h1>
      <p className="uza-aciklama">{d.aciklama}</p>
      {kayitli ? null : <div style={{ marginTop: 12 }}><Bilgi>{d.varsayilan}</Bilgi></div>}
      <form className="uza-form" onSubmit={gonder} noValidate>
        <fieldset className="uza-secim">
          <legend className="uza-etiket">{d.gunler}</legend>
          {/* Monday first: the week starts on Monday in this country. */}
          <div className="uza-secim-satir">
            {[1, 2, 3, 4, 5, 6, 7].map((g) => {
              const secili = a.gunler.includes(g)
              return (
                <label key={g} className="uza-secenek" data-secili={secili ? 'evet' : undefined} title={gunAdi(r, g, true)}>
                  <input type="checkbox" name="gunler" value={g} checked={secili} onChange={() => set({ ...a, gunler: secili ? a.gunler.filter((x) => x !== g) : [...a.gunler, g].sort((p, q) => p - q) })} />
                  <span>{gunAdi(r, g)}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="uza-iki">
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-d-bas">{d.baslangic}</label>
            <input id="uza-d-bas" name="baslangic" type="time" className="uza-girdi" value={a.baslangic} onChange={(e) => set({ ...a, baslangic: e.target.value })} required />
          </div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-d-bit">{d.bitis}</label>
            <input id="uza-d-bit" name="bitis" type="time" className="uza-girdi" value={a.bitis} onChange={(e) => set({ ...a, bitis: e.target.value })} required />
          </div>
        </div>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-d-sure">{d.sure}</label>
          <select id="uza-d-sure" name="sureDk" className="uza-girdi" value={String(a.sureDk)} onChange={(e) => set({ ...a, sureDk: Number(e.target.value) })}>
            {(sureler.includes(a.sureDk) ? sureler : [a.sureDk, ...sureler]).map((s) => <option key={s} value={String(s)}>{s} {r.form.dakika}</option>)}
          </select>
        </div>
        <fieldset className="uza-secim">
          <legend className="uza-etiket">{d.molalar}</legend>
          {a.molalar.map((x, i) => (
            <div key={i} className="uza-mola" data-mola={i}>
              <label className="uza-alan"><span className="uza-etiket">{d.molaBas}</span><input type="time" name={`mola-bas-${i}`} className="uza-girdi" value={x.baslangic} onChange={(e) => mola(i, { baslangic: e.target.value })} /></label>
              <label className="uza-alan"><span className="uza-etiket">{d.molaBit}</span><input type="time" name={`mola-bit-${i}`} className="uza-girdi" value={x.bitis} onChange={(e) => mola(i, { bitis: e.target.value })} /></label>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => set({ ...a, molalar: a.molalar.filter((_, j) => j !== i) })}>{d.molaSil}</button>
            </div>
          ))}
          {a.molalar.length < MOLA_AZAMI ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" style={{ marginTop: 8 }} onClick={() => set({ ...a, molalar: [...a.molalar, { baslangic: '13:00', bitis: '14:00' }] })} data-eylem="mola-ekle">{d.molaEkle}</button> : null}
        </fieldset>
        <Hata>{hataMetni}</Hata>
        {kaydedildi ? <Bilgi>{d.kaydedildi}</Bilgi> : null}
        <div className="uza-eylemler" style={{ marginTop: 0 }}>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="duzen-kaydet">{bekliyor ? d.kaydediliyor : d.kaydet}</button>
          <a className="uza-dugme uza-dugme-cizgi" href={takvimYolu()}>{r.randevu.takvimeDon}</a>
        </div>
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{d.saatDilimi}</p>
        {/* No public holiday is known to the application: the doctor is told so, plainly. */}
        <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="tatil-notu">{d.tatilNotu}</p>
      </form>
    </section>
  )
}

function Duzen({ u, r }: { u: Uygulama; r: RandevuMetni }) {
  const [a, setA] = useState<DuzenKaydi | null>(null)
  const [sureler, setSureler] = useState<number[]>([])
  const [kayitli, setKayitli] = useState(true)
  const [yukHata, setYukHata] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<DuzenHatasi>(null)
  const [kaydedildi, setKaydedildi] = useState(false)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api('/api/ulke/calisma-duzeni')
      .then((c) => { if (iptal) return; if (c.ok && c.j.duzen) { const dc = c.j as unknown as DuzenCevabi; setA(dc.duzen); setSureler(dc.sureSecenekleri ?? []); setKayitli(Boolean(dc.kayitli)) } else setYukHata(true) })
      .catch(() => { if (!iptal) setYukHata(true) })
    return () => { iptal = true }
  }, [hesap, api])

  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (!a) return
    if (!a.gunler.length) { setHata('gunler'); return }
    setBekliyor(true); setHata(null); setKaydedildi(false)
    try {
      const c = await api('/api/ulke/calisma-duzeni', { method: 'POST', govde: a })
      if (c.ok && c.j.duzen) { setA(c.j.duzen); setKayitli(true); setKaydedildi(true) }
      else setHata(c.j.code === 'GECERSIZ' && (c.j.alan === 'gunler' || c.j.alan === 'saatler' || c.j.alan === 'sure' || c.j.alan === 'molalar') ? c.j.alan : 'kayit')
    } catch { setHata('baglanti') }
    setBekliyor(false)
  }

  if (!a) return <section className="uza-kart"><Hata>{yukHata ? u.m.kabuk.hata : null}</Hata>{yukHata ? <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu()}>{r.randevu.takvimeDon}</a></p> : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>}</section>
  return <DuzenGorunumu m={u.m} r={r} a={a} set={(y) => { setA(y); setHata(null); setKaydedildi(false) }} sureler={sureler} gonder={gonder} bekliyor={bekliyor} hata={hata} kaydedildi={kaydedildi} kayitli={kayitli} />
}

// ───────────────────────── the screen ─────────────────────────

export default function Takvim() {
  const u = useUygulama('takvim')
  const [p, setP] = useState<{ gun: string; gorunum: Gorunum; yeni: boolean; hasta: string; saat: string; randevu: string; duzen: boolean; q: string } | null>(null)
  useEffect(() => {
    const s = new URLSearchParams(window.location.search)
    setP({ gun: s.get('gun') ?? '', gorunum: s.get('gorunum') === 'hafta' ? 'hafta' : 'gun', yeni: s.get('yeni') === '1', hasta: s.get('hasta') ?? '', saat: s.get('saat') ?? '', randevu: s.get('randevu') ?? '', duzen: s.get('duzen') === '1', q: s.get('q') ?? '' })
  }, [])
  if (!u.hesap || !p) return <Yukleniyor m={u.m} dil={u.dil} />
  const r = randevuMetni(u.dil)
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="takvim" cikis={u.cikis}>
      {p.randevu ? <RandevuDetay u={u} r={r} id={p.randevu} />
        : p.duzen ? <Duzen u={u} r={r} />
          : p.yeni ? <YeniRandevu u={u} r={r} hastaId={p.hasta} gunParam={p.gun} saatParam={p.saat} q={p.q} />
            : <TakvimEkrani u={u} r={r} gunParam={p.gun} gorunum={p.gorunum} />}
    </Cerceve>
  )
}
