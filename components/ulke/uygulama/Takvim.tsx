'use client'

/**
 * NOTYA-UZ-RANDEVU-01 — /calendar: the doctor's appointments. One address, by its parameters:
 *
 *   (none) | ?gun=<YYYY-MM-DD>                   the month grid (the default): the same frame as the reference month
 *   ?gun=<YYYY-MM-DD>&gorunum=gun            one day
 *   ?gun=<YYYY-MM-DD>&gorunum=ajanda|liste   the next 30 days grouped by day | the month as a list of cards
 *   ?gun=<YYYY-MM-DD>&gorunum=hafta          that day's week (old links; not on the switch)
 *   ?yeni=1[&hasta=<id>][&gun=][&saat=]          the booking form; without a patient, first choose one
 *   ?randevu=<id>                                one appointment: status, start the visit, move, cancel, reminder text
 *   ?duzen=1                                     the working pattern: days, hours, default length, breaks
 *   ?istek=<id>                                  NOTYA-ULKE-PORTAL-01: the answer to a patient's appointment request
 *                                                (./PortalIstekleri.tsx); the waiting requests are listed on the calendar
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
import { gunCoz, gunEkle, gunYazDesenle, gunYazYilsiz, haftaGunu, haftaninIlkGunu, saatCoz, saatYazDk } from '@/lib/ulke/uygulama/zaman'
import { Bilgi, Cerceve, Hata, tarihYaz, useUygulama, YOL, Yukleniyor, type Uygulama } from './Kabuk'
import { tamAd, type HastaKaydi } from './Hastalar'
import { hesapSaatDilimi, saatGoster } from '@/lib/ulke/arayuz/bicim'
import { bitisSaati, saatAraligi, DurumRozeti, gunBasligi, muayeneBaslatilabilir, muayeneBaslatYolu, RANDEVU_TURLERI, takvimYolu, type DuzenKaydi, type Gorunum, type RandevuDurumu, type RandevuKaydi, type RandevuTuru } from './randevuOrtak'

/** The month grid is the default. Day and week stay addressable; the day and week tests render those two. */
type SayfaGorunumu = Gorunum | TakvimMod
import { temelDil, randevuMetni, gunAdi, type GirdiMetni, type UygulamaMetni, type RandevuMetni } from '@/lib/ulke/arayuz'
import { SaatGirisi } from '../girdi/SaatGirisi'
import { Ipucu } from './Ipucu'
import { TarihGirisi } from '../girdi/TarihGirisi'
import type { DilKodu } from '@/lib/ulke/tipler'
import { hatirlatmaMetni, tarihDeseni } from '@/lib/ulke/arayuz/hatirlatma'
import { panoyaKopyala } from './pano'
import { ISTEK_API, IstekCevabiGorunumu, Istekler, IstekYokGorunumu, type IstekCevapFormu, type IstekCevapHatasi } from './PortalIstekleri'
import { portalMetni } from '@/lib/ulke/arayuz'
import { bolgeSec, gununTatili, resmiGunKaynagi } from '@/lib/ulke/tatiller/oku'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import type { BekleyenIstek } from '@/lib/ulke/portal/tipler'
import { HastaFormuKarti } from './HastaFormuKarti'

export { bitisSaati, DurumRozeti, gunBasligi, muayeneBaslatilabilir, muayeneBaslatYolu, takvimYolu, type DuzenKaydi, type Gorunum, type RandevuDurumu, type RandevuKaydi } from './randevuOrtak'

const gunYaz = (gun: string) => gunYazDesenle(gun, tarihDeseni())

/** Keeps a non-default region on calendar links. The default region adds nothing, so existing addresses stay. */
function takvimAdresi(bolge: string | undefined, p: Record<string, string | undefined | null> = {}): string {
  const k = resmiGunKaynagi()
  const b = bolge && k && bolge !== k.varsayilan && k.bolgeler.some((x) => x.kod === bolge) ? bolge : undefined
  return takvimYolu({ ...p, bolge: b })
}

function TatilUyarisi({ gun, bolge }: { gun: string; bolge?: string }) {
  const tatil = gununTatili(gun, bolge)
  if (!tatil) return null
  return <p className="yg-ay-tatil-uyari" data-alan="resmi-gun">{tatil.ad}</p>
}

/** A code of the appointment API → the catalogue's sentence. `tasima` = the request was a move, not a booking. */
export function randevuHataMetni(m: UygulamaMetni, r: RandevuMetni, kod: string | null, alan?: string | null, tasima = false): string | null {
  if (!kod) return null
  if (kod === 'DOLU') return r.form.dolu
  if (kod === 'MESAI_DISI') return tasima ? r.randevu.tasiMesaiDisi : r.form.mesaiDisi
  if (kod === 'GECERSIZ') return alan === 'gun' ? r.form.tarihGecersiz : alan === 'saat' ? r.form.saatGecersiz : alan === 'sure' ? r.form.sureGecersiz : alan === 'ad' ? r.ek.adGerekli : tasima ? r.randevu.degistirilemedi : r.form.kaydedilemedi
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
export function gunSatirlari(duzen: DuzenKaydi | null, gun: string, randevular: RandevuKaydi[], bolge?: string | null): GunSatiri[] {
  const gununki = randevular.filter((x) => x.gun === gun)
  const satirlar: GunSatiri[] = gununki.map((x) => ({ tur: 'randevu', dk: saatCoz(x.saat) ?? 0, randevu: x }))
  const bas = duzen ? saatCoz(duzen.baslangic) : null
  const bit = duzen ? saatCoz(duzen.bitis) : null
  const tatil = gununTatili(gun, bolge)
  if (duzen && bas !== null && bit !== null && duzen.sureDk >= 5 && duzen.gunler.includes(haftaGunu(gun))) {
    const molalar = duzen.molalar.map((x) => ({ bas: saatCoz(x.baslangic) ?? 0, bit: saatCoz(x.bitis) ?? 0 })).filter((x) => x.bit > x.bas)
    for (const x of molalar) satirlar.push({ tur: 'mola', dk: x.bas, saat: saatYazDk(x.bas), bitis: saatYazDk(x.bit) })
    // A full public day offers no free time. A half day closes from 13:00. Booked rows stay.
    if (!tatil || tatil.yarim) {
      const dolu = gununki.filter((x) => x.durum === 'planlandi' || x.durum === 'geldi' || x.durum === 'tamamlandi').map((x) => ({ bas: saatCoz(x.saat) ?? 0, bit: (saatCoz(x.saat) ?? 0) + x.sureDk }))
      for (let dk = bas; dk + duzen.sureDk <= bit; dk += duzen.sureDk) {
        if (tatil?.yarim && dk >= 780) continue
        const son = dk + duzen.sureDk
        if ([...molalar, ...dolu].some((x) => dk < x.bit && son > x.bas)) continue
        satirlar.push({ tur: 'bos', dk, saat: saatYazDk(dk) })
      }
    }
  }
  const sira = { mola: 0, randevu: 1, bos: 2 }
  return satirlar.sort((a, b) => a.dk - b.dk || sira[a.tur] - sira[b.tur])
}

function RandevuSatiri({ r, x, gunlu }: { r: RandevuMetni; x: RandevuKaydi; gunlu?: boolean }) {
  return (
    <a className="uza-satir" href={takvimYolu({ randevu: x.id })} data-randevu={x.id} data-soluk={x.durum === 'iptal' || x.durum === 'gelmedi' ? 'evet' : undefined}>
      <span className="uza-saat">{gunlu ? `${gunYaz(x.gun)} ` : ''}{saatAraligi(x.saat, x.sureDk)}</span>
      <span className="uza-liste-ad">
        {x.hastaAdi || '—'}
        {x.neden || x.mesaiDisi ? <span className="uza-liste-alt">{[x.neden, x.mesaiDisi ? r.takvim.mesaiDisi : ''].filter(Boolean).join(' · ')}</span> : null}
      </span>
      <DurumRozeti r={r} durum={x.durum} />
    </a>
  )
}

export function GunGorunumu({ r, gun, duzen, randevular, bolge }: { r: RandevuMetni; gun: string; duzen: DuzenKaydi | null; randevular: RandevuKaydi[]; bolge?: string }) {
  const satirlar = gunSatirlari(duzen, gun, randevular, bolge)
  const isGunu = !duzen || duzen.gunler.includes(haftaGunu(gun))
  return (
    <div data-gorunum="gun">
      <h2 className="uza-h2" style={{ marginBottom: 6 }}>{gunBasligi(r, gun)}</h2>
      <TatilUyarisi gun={gun} bolge={bolge} />
      {isGunu ? null : <p className="uza-ipucu" style={{ marginTop: 0, marginBottom: 8 }}>{r.takvim.isGunuDegil}</p>}
      {satirlar.length === 0 ? <p className="uza-bos">{r.takvim.bos}</p> : (
        <ul className="uza-liste">
          {satirlar.map((s) => s.tur === 'randevu' ? (
            <li key={`r-${s.randevu.id}`}><RandevuSatiri r={r} x={s.randevu} /></li>
          ) : s.tur === 'mola' ? (
            <li key={`m-${s.dk}`}><div className="uza-satir uza-takvim-mola"><span className="uza-saat">{saatGoster(s.saat)}–{saatGoster(s.bitis)}</span><span className="uza-liste-ad">{r.takvim.mola}</span></div></li>
          ) : (
            <li key={`b-${s.dk}`}>
              <a className="uza-satir uza-takvim-bos" href={takvimAdresi(bolge, { yeni: '1', gun, saat: s.saat })} data-bos={s.saat}>
                <span className="uza-saat">{saatGoster(s.saat)}</span>
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

export function HaftaGorunumu({ r, gunler, bugun, randevular, bolge }: { r: RandevuMetni; gunler: string[]; bugun: string; randevular: RandevuKaydi[]; bolge?: string }) {
  return (
    <div className="uza-hafta" data-gorunum="hafta">
      {gunler.map((g) => {
        const gununki = randevular.filter((x) => x.gun === g)
        const tatil = gununTatili(g, bolge)
        return (
          <section key={g} className="uza-hafta-gun" data-gun={g} data-bugun={g === bugun ? 'evet' : undefined}>
            <div className="uza-hafta-baslik">
              <a className="uza-baglanti" href={takvimAdresi(bolge, { gun: g })} title={r.takvim.gunuAc}>{gunAdi(r, haftaGunu(g))} · {gunYazYilsiz(g, tarihDeseni())}</a>
              {tatil ? <span className="yg-ay-tatil" data-alan="resmi-gun">{tatil.ad}</span> : null}
              <a className="uza-hafta-ekle" href={takvimAdresi(bolge, { yeni: '1', gun: g })} aria-label={`${r.takvim.yeni}: ${gunBasligi(r, g)}`}>+</a>
            </div>
            {gununki.length === 0 ? <p className="uza-hafta-bos" aria-hidden="true">—</p> : (
              <ul className="uza-hafta-liste">
                {gununki.map((x) => (
                  <li key={x.id}>
                    <a className="uza-hafta-randevu" href={takvimAdresi(bolge, { randevu: x.id })} data-randevu={x.id} data-randevu-durum={x.durum}>
                      <span className="uza-saat">{saatGoster(x.saat)}</span>
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

/** A month of days, Monday or Sunday first as the pack says, in the same place as the reference month rail. */
function AyIzgarasi({ r, gun, bugun, randevular, bolge }: { r: RandevuMetni; gun: string; bugun: string; randevular: RandevuKaydi[]; bolge?: string }) {
  const haftaBasi = ulkePaketi().bicim.haftaBasi
  const ay = gun.slice(0, 7)
  const bas = haftaninIlkGunu(`${ay}-01`, haftaBasi)
  const hucreler = Array.from({ length: 42 }, (_, i) => gunEkle(bas, i))
  const sira = (haftaBasi === 1 ? [1, 2, 3, 4, 5, 6, 7] : [7, 1, 2, 3, 4, 5, 6]) as readonly (1 | 2 | 3 | 4 | 5 | 6 | 7)[]
  const [yil, ayNo] = ay.split('-').map(Number)
  const baslik = new Intl.DateTimeFormat(ulkePaketi().bicim.yerel, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(yil, ayNo - 1, 1)))
  const dolu = new Set(randevular.filter((x) => x.durum !== 'iptal').map((x) => x.gun))
  return (
    <div className="yg-ay-kutu" data-alan="ay">
      <div className="yg-ay-baslik">{baslik}</div>
      <div className="yg-ay">
        {sira.map((k) => <div key={k} className="yg-ay-ad">{r.gunKisa[k]}</div>)}
        {hucreler.map((h) => (
          <a key={h} className="yg-ay-gun" href={takvimAdresi(bolge, { gun: h })} data-bugun={h === bugun ? 'evet' : undefined} data-baska={h.slice(0, 7) === ay ? undefined : 'evet'} data-dolu={dolu.has(h) ? 'evet' : undefined} data-secili={h === gun ? 'evet' : undefined} data-tatil={gununTatili(h, bolge) ? 'evet' : undefined}>
            <span>{Number(h.slice(8, 10))}</span>
            <span className="yg-ay-nokta" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  )
}

/** First of the month `delta` months from `gun` (YYYY-MM-DD). */
function ayKaydir(gun: string, delta: number): string {
  const tarih = new Date(Date.UTC(Number(gun.slice(0, 4)), Number(gun.slice(5, 7)) - 1 + delta, 1))
  return `${tarih.getUTCFullYear()}-${String(tarih.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function ayParcalari(gun: string): { ay: string; yil: string } {
  const yil = Number(gun.slice(0, 4))
  const ayNo = Number(gun.slice(5, 7))
  const tarih = new Date(Date.UTC(yil, ayNo - 1, 1))
  return { ay: new Intl.DateTimeFormat(ulkePaketi().bicim.yerel, { month: 'long', timeZone: 'UTC' }).format(tarih), yil: String(yil) }
}

function ayHucreleri(gun: string): string[] {
  const bas = haftaninIlkGunu(`${gun.slice(0, 7)}-01`, ulkePaketi().bicim.haftaBasi)
  return Array.from({ length: 42 }, (_, i) => gunEkle(bas, i))
}

function haftaSirasi(): readonly (1 | 2 | 3 | 4 | 5 | 6 | 7)[] {
  return ulkePaketi().bicim.haftaBasi === 1 ? [1, 2, 3, 4, 5, 6, 7] : [7, 1, 2, 3, 4, 5, 6]
}

/**
 * The reference month: a 264px rail (mini month, today, the next day) and a 7-column month of cells.
 * A cell opens that day; a chip opens that appointment. Nothing here is dragged.
 */
/** The calendar's time zone as a short chip ("AEDT", "GMT+5"), the full sentence in its title: as Türkiye's "TRT" chip. */
function saatDilimiKisa(): string {
  try {
    const parca = new Intl.DateTimeFormat(ulkePaketi().bicim.yerel, { timeZone: hesapSaatDilimi(), timeZoneName: 'short' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName')
    return parca?.value ?? ''
  } catch { return '' }
}

function BolgeSecici({ gun, bolge }: { gun: string; bolge?: string }) {
  const k = resmiGunKaynagi()
  if (!k || k.bolgeler.length < 2) return null
  const secili = bolgeSec(bolge) ?? k.varsayilan
  const ad = k.bolgeler.find((b) => b.kod === secili)?.ad ?? secili
  return (
    <label className="yg-ay-bolge">
      <select aria-label={ad} value={secili} onChange={(e) => { window.location.assign(takvimAdresi(e.target.value, { gun })) }}>
        {k.bolgeler.map((b) => <option key={b.kod} value={b.kod}>{b.ad}</option>)}
      </select>
    </label>
  )
}

export type TakvimMod = 'ay' | 'gun' | 'ajanda' | 'liste'
/** Calendar actions the page wires up: change a status, delete. Absent (a static render) = the buttons are drawn, inert. */
export type TakvimEylemleri = { durum: (id: string, d: RandevuDurumu) => void; sil: (id: string) => void; bekliyor: boolean }

const TUR_SIRASI: readonly RandevuTuru[] = RANDEVU_TURLERI
const turAdi = (r: RandevuMetni, t: RandevuTuru) => ({ ilk_muayene: r.ek.turIlk, muayene: r.ek.turMuayene, kontrol: r.ek.turKontrol, diger: r.ek.turDiger })[t]
const doluYer = (x: RandevuKaydi) => x.durum !== 'iptal'
/** Same fill rule as Türkiye: a booked appointment is a hollow dot in its type's colour; arrived or done is filled. */
const noktaDolu = (x: RandevuKaydi) => x.durum !== 'planlandi'

/** The type colours as a legend (month view only, as in Türkiye). */
function TurLejandi({ r }: { r: RandevuMetni }) {
  return (
    <div className="yg-tur-lejant" data-alan="tur-lejant">
      {TUR_SIRASI.map((t) => <span key={t} className="yg-tur-lejant-oge" data-tur={t}><span className="yg-tur-nokta" data-tur={t} />{turAdi(r, t)}</span>)}
      <span className="yg-tur-lejant-ipucu">· {r.ek.noktaIpucu}</span>
    </div>
  )
}

function DurumHapi({ r, durum }: { r: RandevuMetni; durum: RandevuDurumu }) {
  return <span className="yg-durum-hap" data-randevu-durum={durum}>{r.durum[durum]}</span>
}

const durumEtiketi = (r: RandevuMetni, x: RandevuKaydi, d: RandevuDurumu) => d === 'geldi' ? (x.durum === 'tamamlandi' ? r.randevu.geldiyeAl : r.randevu.geldi) : d === 'tamamlandi' ? r.randevu.tamamla : d === 'gelmedi' ? r.randevu.gelmedi : d === 'iptal' ? r.randevu.iptalEt : r.randevu.planaAl

/**
 * One appointment as Türkiye's day view draws it: a card with the type's colour on its edge, the time, the name
 * ("no record" tag when booked by name), the type and phone, the reason, the status, and the action row.
 */
export function RandevuKarti({ m, r, x, eylem }: { m: UygulamaMetni; r: RandevuMetni; x: RandevuKaydi; eylem?: TakvimEylemleri }) {
  const kayitli = x.kayitli !== false && x.hastaId !== ''
  const dosya = `${YOL.hasta}?id=${x.hastaId}`
  const eylemler = durumEylemleri(x).filter((d) => d !== 'iptal')
  const iptalEdilebilir = durumEylemleri(x).includes('iptal')
  const bekliyor = eylem?.bekliyor ?? false
  return (
    <div className="yg-gun-kart" data-randevu={x.id} data-tur={x.tur} data-randevu-durum={x.durum}>
      <div className="yg-gun-kart-ust">
        <div>
          <div className="yg-gun-saat">{saatAraligi(x.saat, x.sureDk)}</div>
          <div className="yg-gun-ad">{x.hastaAdi || '—'}{kayitli ? null : <span className="yg-gun-kayitsiz">{r.ek.kayitsiz}</span>}</div>
          <div className="yg-gun-alt">{turAdi(r, x.tur)}{x.hastaTelefon ? ` · ${x.hastaTelefon}` : ''}</div>
          {x.neden ? <div className="yg-gun-not">{x.neden}</div> : null}
          {x.mesaiDisi ? <div className="yg-gun-alt">{r.takvim.mesaiDisi}</div> : null}
        </div>
        <DurumHapi r={r} durum={x.durum} />
      </div>
      <div className="yg-gun-eylemler">
        {muayeneBaslatilabilir(x) ? <a className="yg-gun-dugme" data-birincil="evet" href={muayeneBaslatYolu(x)} data-eylem="muayene-baslat">{m.bugun.muayeneBaslat}</a> : null}
        {x.seansId ? <a className="yg-gun-dugme" data-birincil="evet" href={`${YOL.muayene}?seans=${x.seansId}`} data-eylem="muayene-ac">{r.randevu.muayeneyiAc}</a> : null}
        {kayitli ? <a className="yg-gun-dugme" data-vurgu="evet" href={dosya} data-eylem="hasta-dosyasi">{r.ek.hastaDosyasiAc}</a> : null}
        {kayitli ? <a className="yg-gun-dugme" data-vurgu="evet" href={`${dosya}#hasta-formu`} data-eylem="hasta-formu">{r.ek.hastaFormu}</a> : null}
        {kayitli ? null : <a className="yg-gun-dugme" data-birincil="evet" href={`${YOL.yeniHasta}?bagla=${x.id}&ad=${encodeURIComponent(x.hastaAdi)}${x.hastaTelefon ? `&telefon=${encodeURIComponent(x.hastaTelefon)}` : ''}`} data-eylem="kayit-olustur-bagla">{r.ek.kayitOlusturBagla}</a>}
        {x.durum === 'planlandi' || x.durum === 'geldi' ? <a className="yg-gun-dugme" href={takvimYolu({ randevu: x.id })} data-eylem="yeniden-planla">{r.ek.yenidenPlanla}</a> : null}
        {eylemler.map((d) => (
          <button key={d} type="button" className="yg-gun-dugme" data-ton={d === 'gelmedi' ? 'uyari' : undefined} disabled={bekliyor} onClick={() => eylem?.durum(x.id, d)} data-eylem={`durum-${d}`}>{durumEtiketi(r, x, d)}</button>
        ))}
        {iptalEdilebilir ? <button type="button" className="yg-gun-dugme" data-ton="tehlike" disabled={bekliyor} onClick={() => eylem?.durum(x.id, 'iptal')} data-eylem="durum-iptal">{r.randevu.iptalEt}</button> : null}
        {x.seansId ? null : <button type="button" className="yg-gun-dugme" data-ton="sessiz" disabled={bekliyor} onClick={() => eylem?.sil(x.id)} data-eylem="sil">{r.ek.sil}</button>}
      </div>
    </div>
  )
}

/** The month of a day as a sorted list, or the next 30 days grouped by day: the list and agenda views. */
function GunlerListesi({ r, gunler, randevular, bugun, bolge, bos, tamKart, m, eylem }: { r: RandevuMetni; gunler: string[]; randevular: RandevuKaydi[]; bugun: string; bolge?: string; bos: string; tamKart?: boolean; m: UygulamaMetni; eylem?: TakvimEylemleri }) {
  const gruplar = gunler.map((g) => ({ g, liste: randevular.filter((x) => x.gun === g) })).filter((x) => x.liste.length > 0)
  if (gruplar.length === 0) return <p className="yg-gun-bos" role="status">{bos}</p>
  return (
    <div className="yg-gun-gruplar">
      {gruplar.map(({ g, liste }) => (
        <div key={g} data-gun={g}>
          <div className="yg-gun-grup-ust" data-bugun={g === bugun ? 'evet' : undefined}>
            <a className="yg-gun-grup-baslik" href={takvimAdresi(bolge, { gun: g, gorunum: 'gun' })}>{gunBasligi(r, g)}</a>
            {gununTatili(g, bolge) ? <span className="yg-gun-grup-tatil">· {gununTatili(g, bolge)?.ad}</span> : null}
            <span className="yg-gun-grup-sayi">· {r.ek.randevuSayisi.replace('%', String(liste.length))}</span>
          </div>
          <div className="yg-gun-satirlar">
            {liste.map((x) => tamKart ? <RandevuKarti key={x.id} m={m} r={r} x={x} eylem={eylem} /> : (
              <a key={x.id} className="yg-gun-satir" href={takvimYolu({ randevu: x.id })} data-randevu={x.id} data-tur={x.tur} data-randevu-durum={x.durum}>
                <span className="yg-tur-nokta" data-tur={x.tur} data-dolu={noktaDolu(x) ? 'evet' : undefined} title={turAdi(r, x.tur)} />
                <span className="yg-gun-satir-saat">{saatAraligi(x.saat, x.sureDk)}</span>
                <span className="yg-gun-satir-ad">{x.hastaAdi || '—'}{x.kayitli !== false ? null : <span className="yg-gun-kayitsiz">{r.ek.kayitsiz}</span>}</span>
                <DurumHapi r={r} durum={x.durum} />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The calendar page, ONE frame for every view, as Türkiye draws it (app/dashboard/doktor/randevular): the month rail
 * with today and tomorrow, a toolbar (month | day | agenda | list switch, "+ appointment"), the type colours, and the
 * view. Words are the pack's; the layout is the same in every country.
 */
export function TakvimPlani({ m, r, mod, gun, bugun, randevular, hata, bolge, eylem }: {
  m: UygulamaMetni; r: RandevuMetni; mod: TakvimMod; gun: string; bugun: string; randevular: RandevuKaydi[] | null; hata: boolean; bolge?: string; eylem?: TakvimEylemleri
}) {
  const ay = gun.slice(0, 7)
  const hucreler = ayHucreleri(gun)
  const sira = haftaSirasi()
  const { ay: ayAd, yil } = ayParcalari(gun)
  const liste = (randevular ?? []).filter(doluYer)
  const dolu = new Set(liste.map((x) => x.gun))
  const gununde = (g: string) => liste.filter((x) => x.gun === g)
  const yarin = bugun ? gunEkle(bugun, 1) : ''
  const kenar = (g: string, etiket: string) => (
    <div key={g}>
      <div className="yg-ay-kenar-ad">{etiket}</div>
      {gununde(g).length === 0 ? <div className="yg-ay-kenar-bos">{r.takvim.bos}</div> : gununde(g).slice(0, 6).map((x) => (
        <a key={x.id} className="yg-ay-kenar-satir" href={takvimYolu({ randevu: x.id })}>
          <span>{saatAraligi(x.saat, x.sureDk)}</span>
          <span>{x.hastaAdi || '—'}</span>
        </a>
      ))}
    </div>
  )
  const adim = mod === 'gun' ? (g: string, d: number) => gunEkle(g, d) : mod === 'ajanda' ? (g: string, d: number) => gunEkle(g, 30 * d) : (g: string, d: number) => ayKaydir(g, d)
  const hedef = (g: string, gr: TakvimMod = mod) => takvimAdresi(bolge, { gun: g, gorunum: gr === 'ay' ? undefined : gr })
  const baslik = mod === 'gun' ? gunBasligi(r, gun) : mod === 'ajanda' ? `${gunYazYilsiz(gun, tarihDeseni())} – ${gunYazYilsiz(gunEkle(gun, 29), tarihDeseni())}` : `${ayAd} ${yil}`
  const hafta = (() => { const b = haftaninIlkGunu(gun, ulkePaketi().bicim.haftaBasi); return Array.from({ length: 7 }, (_, i) => gunEkle(b, i)) })()
  const ayGunleri = hucreler.filter((h) => h.slice(0, 7) === ay)
  return (
    <>
      <h1 className="yg-ay-sayfa-baslik">{r.takvim.baslik}</h1>
      <section className="yg-ay-plan" data-gorunum={mod}>
        <aside className="yg-ay-yan">
          <div className="yg-ay-yan-ust">
            <div className="yg-ay-baslik">{ayAd} {yil ? <span className="yg-ay-yil">{yil}</span> : null}</div>
            <a className="yg-ay-ok" href={hedef(ayKaydir(gun, -1), mod === 'gun' ? 'ay' : mod)} data-eylem="ay-onceki">{'‹'}</a>
            <a className="yg-ay-ok" href={hedef(ayKaydir(gun, 1), mod === 'gun' ? 'ay' : mod)} data-eylem="ay-sonraki">{'›'}</a>
          </div>
          <div className="yg-ay">
            {sira.map((k) => <div key={k} className="yg-ay-ad">{r.gunKisa[k]}</div>)}
            {hucreler.map((h) => (
              <a key={h} className="yg-ay-gun" href={takvimAdresi(bolge, { gun: h, gorunum: 'gun' })} data-bugun={h === bugun ? 'evet' : undefined} data-baska={h.slice(0, 7) === ay ? undefined : 'evet'} data-dolu={dolu.has(h) ? 'evet' : undefined} data-secili={h === gun ? 'evet' : undefined} data-tatil={gununTatili(h, bolge) ? 'evet' : undefined}>
                <span>{Number(h.slice(8, 10))}</span>
                <span className="yg-ay-nokta" aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="yg-ay-kenar">
            {kenar(bugun, r.takvim.bugun)}
            {yarin ? kenar(yarin, gunYaz(yarin)) : null}
          </div>
        </aside>
        <div className="yg-ay-ana">
          <div className="yg-ay-toolbar">
            <div className="yg-ay-gezin">
              <a className="yg-ay-ok" href={hedef(adim(gun, -1))} data-eylem="onceki">{'‹'}</a>
              <a className="yg-ay-bugun" href={hedef(bugun)} data-eylem="bugun">{r.takvim.bugun}</a>
              <a className="yg-ay-ok" href={hedef(adim(gun, 1))} data-eylem="sonraki">{'›'}</a>
            </div>
            <div className="yg-ay-toolbar-baslik">{baslik}</div>
            <BolgeSecici gun={gun} bolge={bolge} />
            <span className="yg-ay-rozet" title={r.duzen.saatDilimi}>{saatDilimiKisa()}</span>
            <div className="yg-ay-modlar" aria-label={r.takvim.baslik}>
              {([['ay', r.ek.ay], ['gun', r.takvim.gun], ['ajanda', r.ek.ajanda], ['liste', r.ek.liste]] as const).map(([k, ad]) => (
                <a key={k} className="yg-ay-mod" href={hedef(gun, k)} aria-current={mod === k ? 'page' : undefined} data-mod={k}>{ad}</a>
              ))}
            </div>
            <a className="yg-ay-ekle" href={takvimAdresi(bolge, { yeni: '1', gun })} data-eylem="yeni-randevu">+ {r.takvim.yeni}</a>
          </div>
          <Hata>{hata ? m.kabuk.hata : null}</Hata>
          <TatilUyarisi gun={bugun} bolge={bolge} />
          {mod === 'ay' ? <TurLejandi r={r} /> : null}
          {randevular === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : mod === 'ay' ? (
            <div className="yg-ay-buyuk">
              <div className="yg-ay-buyuk-adlar">
                {sira.map((k) => <div key={k}>{r.gunKisa[k]}</div>)}
              </div>
              <div className="yg-ay-izgara">
                {hucreler.map((h) => {
                  const gunun = gununde(h)
                  const goster = gunun.slice(0, 3)
                  return (
                    <div key={h} className="yg-ay-hucre" data-bugun={h === bugun ? 'evet' : undefined} data-baska={h.slice(0, 7) === ay ? undefined : 'evet'}>
                      <a className="yg-ay-sayi" href={takvimAdresi(bolge, { gun: h, gorunum: 'gun' })}>{Number(h.slice(8, 10))}</a>
                      {gununTatili(h, bolge) ? <span className="yg-ay-tatil" data-alan="resmi-gun">{gununTatili(h, bolge)?.ad}</span> : null}
                      {goster.map((x) => (
                        <a key={x.id} className="yg-ay-olay" href={takvimYolu({ randevu: x.id })} data-randevu={x.id} data-tur={x.tur} data-dolu={noktaDolu(x) ? 'evet' : undefined}>
                          <span>{saatGoster(x.saat)}</span>
                          <span>{x.hastaAdi || '—'}</span>
                        </a>
                      ))}
                      {gunun.length > goster.length ? <a className="yg-ay-fazla" href={takvimAdresi(bolge, { gun: h, gorunum: 'gun' })}>{r.ek.daha.replace('%', String(gunun.length - goster.length))}</a> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : mod === 'gun' ? (
            <div className="yg-gun" data-gorunum="gun">
              <div className="yg-gun-serit">
                {hafta.map((g) => (
                  <a key={g} className="yg-gun-serit-gun" href={takvimAdresi(bolge, { gun: g, gorunum: 'gun' })} data-secili={g === gun ? 'evet' : undefined} data-bugun={g === bugun ? 'evet' : undefined}>
                    <span>{r.gunKisa[haftaGunu(g) as 1]}</span>
                    <strong>{Number(g.slice(8, 10))}</strong>
                    <span className="yg-gun-serit-nokta" data-dolu={dolu.has(g) ? 'evet' : undefined} />
                  </a>
                ))}
              </div>
              <TatilUyarisi gun={gun} bolge={bolge} />
              {gununde(gun).length === 0 ? <p className="yg-gun-bos" role="status">{r.ek.gunBos}</p> : (
                <div className="yg-gun-kartlar">
                  {randevular.filter((x) => x.gun === gun).map((x) => <RandevuKarti key={x.id} m={m} r={r} x={x} eylem={eylem} />)}
                </div>
              )}
            </div>
          ) : mod === 'ajanda' ? (
            <div className="yg-gun" data-gorunum="ajanda">
              <GunlerListesi m={m} r={r} gunler={Array.from({ length: 30 }, (_, i) => gunEkle(gun, i))} randevular={liste} bugun={bugun} bolge={bolge} bos={r.ek.ajandaBos} />
            </div>
          ) : (
            <div className="yg-gun" data-gorunum="liste">
              <GunlerListesi m={m} r={r} gunler={ayGunleri} randevular={liste} bugun={bugun} bolge={bolge} bos={r.ek.ayBos} tamKart eylem={eylem} />
            </div>
          )}
        </div>
      </section>
    </>
  )
}

/** The month view alone (kept for the places and tests that draw it): `TakvimPlani` in its month mode. */
export function AyPlani({ m, r, gun, bugun, randevular, hata, bolge }: {
  m: UygulamaMetni; r: RandevuMetni; gun: string; bugun: string; randevular: RandevuKaydi[] | null; hata: boolean; bolge?: string
}) {
  return <TakvimPlani m={m} r={r} mod="ay" gun={gun} bugun={bugun} randevular={randevular} hata={hata} bolge={bolge} />
}

export function TakvimGorunumu({ m, r, gorunum, gun, gunler, bugun, duzen, randevular, hata, bolge }: {
  m: UygulamaMetni; r: RandevuMetni; gorunum: Gorunum
  /** The day the calendar stands on (the country's day). */
  gun: string
  /** The days shown: one for the day view, seven for the week. */
  gunler: string[]; bugun: string; duzen: DuzenKaydi | null
  /** null = still loading. */
  randevular: RandevuKaydi[] | null; hata: boolean; bolge?: string
}) {
  const adim = gorunum === 'hafta' ? 7 : 1
  const g = (x: string, gr: Gorunum = gorunum) => takvimAdresi(bolge, { gun: x, gorunum: gr === 'hafta' ? 'hafta' : undefined })
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <h1 className="uza-h1">{r.takvim.baslik}</h1>
        <a className="uza-dugme" href={takvimAdresi(bolge, { yeni: '1', gun })} data-eylem="yeni-randevu">{r.takvim.yeni}</a>
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
      <div className="yg-takvim-govde">
        {randevular ? <AyIzgarasi r={r} gun={gun} bugun={bugun} randevular={randevular} bolge={bolge} /> : null}
        <div className="yg-takvim-ana">
          {randevular === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : gorunum === 'hafta'
            ? <HaftaGorunumu r={r} gunler={gunler} bugun={bugun} randevular={randevular} bolge={bolge} />
            : <GunGorunumu r={r} gun={gunler[0] ?? gun} duzen={duzen} randevular={randevular} bolge={bolge} />}
        </div>
      </div>
      <p className="uza-ipucu" style={{ marginTop: 14 }}>
        <a className="uza-baglanti" href={takvimAdresi(bolge, { duzen: '1' })}>{r.takvim.duzen}</a> · {r.duzen.saatDilimi}
      </p>
    </section>
  )
}

function TakvimEkrani({ u, r, gunParam, gorunum, bolge }: { u: Uygulama; r: RandevuMetni; gunParam: string; gorunum: SayfaGorunumu; bolge?: string }) {
  const [veri, setVeri] = useState<{ gunler: string[]; bugun: string; randevular: RandevuKaydi[] } | null>(null)
  const [duzen, setDuzen] = useState<DuzenKaydi | null>(null)
  const [hata, setHata] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [yenile, setYenile] = useState(0)
  const { hesap, api } = u
  // The day view reads its week (the strip shows which days are booked); the others read their own range.
  const istek = gorunum === 'gun' ? 'hafta' : gorunum
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const s = new URLSearchParams()
    if (gunParam) s.set('gun', gunParam)
    s.set('gorunum', istek)
    api(`/api/ulke/randevular?${s.toString()}`)
      .then((c) => { if (iptal) return; if (c.ok && Array.isArray(c.j.randevular) && Array.isArray(c.j.gunler)) setVeri({ gunler: c.j.gunler, bugun: String(c.j.bugun ?? ''), randevular: c.j.randevular }); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    // The working pattern only draws the free rows; the calendar is still a calendar without it.
    api('/api/ulke/calisma-duzeni').then((c) => { if (!iptal && c.ok && c.j.duzen) setDuzen(c.j.duzen) }).catch(() => { /* no free rows */ })
    return () => { iptal = true }
  }, [hesap, api, gunParam, istek, yenile])
  // Until the server has said which day "today" is, the address's own day is the only day known.
  const gun = (gunParam && gunCoz(gunParam, tarihDeseni())) || veri?.bugun || ''
  const eylem: TakvimEylemleri = {
    bekliyor,
    durum: (id, d) => {
      setBekliyor(true); setHata(false)
      api('/api/ulke/randevu', { method: 'PATCH', govde: { id, durum: d } })
        .then((c) => { if (!c.ok) setHata(true); else setYenile((n) => n + 1) })
        .catch(() => setHata(true))
        .finally(() => setBekliyor(false))
    },
    sil: (id) => {
      if (!window.confirm(r.ek.silOnay)) return
      setBekliyor(true); setHata(false)
      api(`/api/ulke/randevu?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        .then((c) => { if (!c.ok) setHata(true); else setYenile((n) => n + 1) })
        .catch(() => setHata(true))
        .finally(() => setBekliyor(false))
    },
  }
  if (!gun) return <section className="uza-kart"><Hata>{hata ? u.m.kabuk.hata : null}</Hata>{hata ? null : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>}</section>
  // The week view stays addressable (old links, the Uzbek tests); the page's own switch is month | day | agenda | list.
  if (gorunum === 'hafta') return <TakvimGorunumu m={u.m} r={r} gorunum={gorunum} gun={gun} gunler={veri?.gunler ?? [gun]} bugun={veri?.bugun ?? gun} duzen={duzen} randevular={veri?.randevular ?? null} hata={hata} bolge={bolge} />
  return <TakvimPlani m={u.m} r={r} mod={gorunum} gun={gun} bugun={veri?.bugun ?? gun} randevular={veri?.randevular ?? null} hata={hata} bolge={bolge} eylem={eylem} />
}

// ───────────────────────── booking ─────────────────────────

/** `tur` defaults to a visit. `ad` and `telefon` are only used when the appointment is booked without a patient record. */
export type RandevuFormu = { gun: string; saat: string; sureDk: number; neden: string; tur?: RandevuTuru; ad?: string; telefon?: string }
export type FormHatasi = { kod: string; alan?: string | null } | null

function ZamanAlanlari({ r, g, a, set, sureler, on }: { r: RandevuMetni; g: GirdiMetni; a: Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>; set: (y: Partial<RandevuFormu>) => void; sureler: readonly number[]; on: string }) {
  return (
    <>
      <div className="uza-iki">
        {/* The kit's own date and time fields (NOTYA-ULKE-DENETIM-01b): the parts in the pack's order, the pack's clock,
            never a browser's own field. `a.gun` is the day as YYYY-MM-DD and `a.saat` 24-hour HH:MM, as they are sent. */}
        <div className="uza-alan">
          <TarihGirisi id={`${on}-gun`} etiket={r.form.tarih} deger={a.gun} degistir={(gun) => set({ gun })} m={g} ad="gun" zorunlu />
        </div>
        <div className="uza-alan">
          <SaatGirisi id={`${on}-saat`} etiket={r.form.saat} deger={a.saat} degistir={(saat) => set({ saat })} m={g} ad="saat" zorunlu />
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

export function RandevuFormuGorunumu({ m, r, hasta, a, set, sureler, gonder, bekliyor, hata, geri, bolge }: {
  /** null = booked by name, without a patient record. */
  m: UygulamaMetni; r: RandevuMetni; hasta: Pick<HastaKaydi, 'id' | 'ad' | 'otaIsmi'> | null
  a: RandevuFormu; set: (y: Partial<RandevuFormu>) => void; sureler: readonly number[]
  /** `yineDe` true = the explicit "book anyway", offered only after the server said "outside working hours". */
  gonder: (yineDe: boolean) => void; bekliyor: boolean; hata: FormHatasi; geri: string; bolge?: string
}) {
  const mesaiDisi = hata?.kod === 'MESAI_DISI'
  return (
    <section className="uza-kart uza-dar">
      <p className="uza-ust-yazi">{r.form.baslik}</p>
      <h1 className="uza-h1">{hasta ? tamAd(hasta) : r.ek.kayitsizBaslik}</h1>
      <TatilUyarisi gun={a.gun} bolge={bolge} />
      {hasta ? null : <p className="uza-aciklama">{r.ek.kayitsizAciklama}</p>}
      <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu({ yeni: '1', gun: gunCoz(a.gun, tarihDeseni()) ?? undefined, saat: a.saat })}>{r.form.hastaDegistir}</a></p>
      <form className="uza-form" onSubmit={(e: FormEvent) => { e.preventDefault(); gonder(false) }} noValidate>
        {hasta ? null : (
          <div className="uza-iki">
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-rf-ad">{r.ek.adAlani}</label>
              <input id="uza-rf-ad" name="serbestAd" className="uza-girdi" maxLength={120} value={a.ad ?? ''} onChange={(e) => set({ ad: e.target.value })} autoComplete="off" required />
            </div>
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-rf-tel">{r.ek.telefonAlani}</label>
              <input id="uza-rf-tel" name="serbestTelefon" type="tel" className="uza-girdi" maxLength={40} value={a.telefon ?? ''} onChange={(e) => set({ telefon: e.target.value })} autoComplete="off" />
            </div>
          </div>
        )}
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-rf-tur">{r.ek.turAlani}</label>
          <select id="uza-rf-tur" name="tur" className="uza-girdi" value={a.tur ?? 'muayene'} onChange={(e) => set({ tur: e.target.value as RandevuTuru })}>
            {RANDEVU_TURLERI.map((t) => <option key={t} value={t}>{turAdi(r, t)}</option>)}
          </select>
        </div>
        <ZamanAlanlari r={r} g={m.girdi} a={a} set={set} sureler={sureler} on="uza-rf" />
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
      <p className="uza-ipucu" style={{ marginTop: 0 }}><a className="uza-baglanti" href={takvimYolu({ yeni: '1', kayitsiz: '1', gun, saat })} data-eylem="kayitsiz-randevu">{r.ek.kayitsizSecenek}</a></p>
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

function YeniRandevu({ u, r, hastaId, kayitsiz, gunParam, saatParam, q, bolge }: { u: Uygulama; r: RandevuMetni; hastaId: string; kayitsiz: boolean; gunParam: string; saatParam: string; q: string; bolge?: string }) {
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
        if (kayitsiz && !hastaId) {
          // By name: no patient is read; only the working pattern (the lengths) and today's day.
          const d = await api('/api/ulke/calisma-duzeni')
          if (iptal) return
          if (!d.ok || !d.j.duzen) { setYuk('hata'); return }
          const dc = d.j as unknown as DuzenCevabi
          setSureler(dc.sureSecenekleri ?? [])
          setA({ gun: gun || dc.bugun, saat, sureDk: dc.duzen.sureDk, neden: '', tur: 'muayene', ad: '', telefon: '' })
          setYuk('tamam')
          return
        }
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
        setA({ gun: gun || dc.bugun, saat, sureDk: dc.duzen.sureDk, neden: '', tur: 'muayene' })
        setYuk('tamam')
      } catch { if (!iptal) setYuk('hata') }
    })()
    return () => { iptal = true }
  }, [hesap, api, hastaId, kayitsiz, q, gun, saat])

  async function gonder(yineDe: boolean) {
    if (!a || (!hasta && !kayitsiz)) return
    if (!hasta && !(a.ad ?? '').trim()) { setHata({ kod: 'GECERSIZ', alan: 'ad' }); return }
    setBekliyor(true); setHata(null)
    try {
      const kisi = hasta ? { hastaId: hasta.id } : { serbestAd: (a.ad ?? '').trim(), serbestTelefon: (a.telefon ?? '').trim() }
      const c = await api('/api/ulke/randevu', { method: 'POST', govde: { ...kisi, gun: a.gun, saat: a.saat, sureDk: a.sureDk, neden: a.neden, tur: a.tur ?? 'muayene', ...(yineDe ? { yineDe: true } : {}) } })
      if (c.ok && c.j.randevu?.id) { window.location.assign(takvimYolu({ randevu: c.j.randevu.id })); return }
      setHata({ kod: typeof c.j.code === 'string' ? c.j.code : 'BASARISIZ', alan: typeof c.j.alan === 'string' ? c.j.alan : null })
    } catch { setHata({ kod: 'BAGLANTI' }) }
    setBekliyor(false)
  }

  if (!hastaId && !kayitsiz) return <RandevuHastaSecGorunumu m={u.m} r={r} q={q} hastalar={hastalar} hata={yuk === 'hata'} gun={gun || undefined} saat={saat || undefined} />
  if (yuk !== 'tamam' || (!hasta && !kayitsiz) || !a) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.hasta.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={takvimYolu()}>{r.randevu.takvimeDon}</a></p>}
      </section>
    )
  }
  return <RandevuFormuGorunumu m={u.m} r={r} hasta={hasta} a={a} set={(y) => { setA({ ...a, ...y }); setHata(null) }} sureler={sureler} gonder={gonder} bekliyor={bekliyor} hata={hata} geri={takvimAdresi(bolge, { gun: gun || undefined })} bolge={bolge} />
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

export function RandevuDetayGorunumu({ m, r, randevu, hekim, sureler, tasi, setTasi, hata, bildirim, bekliyor, durumDegistir, tasiGonder, kopyala, form }: {
  m: UygulamaMetni; r: RandevuMetni; randevu: RandevuKaydi
  /** The account: its two forms and its name, for the reminder text. */
  hekim: { dil: DilKodu; notDili: DilKodu; ad: string }
  sureler: readonly number[]; tasi: Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>; setTasi: (y: Partial<RandevuFormu>) => void
  hata: DetayHatasi; bildirim: DetayBildirimi; bekliyor: boolean
  durumDegistir: (d: RandevuDurumu) => void; tasiGonder: (yineDe: boolean) => void; kopyala: (metin: string) => void
  /** NOTYA-ULKE-INTAKE-01: the intake form's card for this appointment's patient, where the country has the form. */
  form?: React.ReactNode
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
          <dt>{r.randevu.vakit}</dt><dd data-alan="saat">{saatAraligi(x.saat, x.sureDk)} ({x.sureDk} {r.form.dakika})</dd>
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
      {form ?? null}
      {tasinabilir ? (
        <section className="uza-kart" data-alan="tasi">
          <h2 className="uza-h2">{r.randevu.tasi}</h2>
          <form className="uza-form" style={{ marginTop: 0 }} onSubmit={(e: FormEvent) => { e.preventDefault(); tasiGonder(false) }} noValidate>
            <ZamanAlanlari r={r} g={m.girdi} a={tasi} set={setTasi} sureler={sureler} on="uza-rt" />
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

function RandevuDetay({ u, r, id }: { u: Uygulama; r: RandevuMetni; id: string }) {
  const [randevu, setRandevu] = useState<RandevuKaydi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [sureler, setSureler] = useState<number[]>([])
  const [tasi, setTasi] = useState<Pick<RandevuFormu, 'gun' | 'saat' | 'sureDk'>>({ gun: '', saat: '', sureDk: 30 })
  const [hata, setHata] = useState<DetayHatasi>(null)
  const [bildirim, setBildirim] = useState<DetayBildirimi>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const { hesap, api } = u
  const yerlestir = (x: RandevuKaydi) => { setRandevu((eski) => ({ ...x, hastaDili: x.hastaDili ?? eski?.hastaDili })); setTasi({ gun: x.gun, saat: x.saat, sureDk: x.sureDk }) }

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
      // The form is asked for an appointment that is still to come; afterwards the patient's file has it.
      form={ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu') && (randevu.durum === 'planlandi' || randevu.durum === 'geldi') ? <HastaFormuKarti u={u} hastaId={randevu.hastaId} randevuId={randevu.id} /> : null}
    />
  )
}

// ───────────────────────── a patient's appointment request (NOTYA-ULKE-PORTAL-01) ─────────────────────────

function IstekCevabi({ u, r, id }: { u: Uygulama; r: RandevuMetni; id: string }) {
  const [istek, setIstek] = useState<BekleyenIstek | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [sureler, setSureler] = useState<number[]>([])
  const [a, setA] = useState<IstekCevapFormu>({ gun: '', saat: '', sureDk: 30 })
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<IstekCevapHatasi>(null)
  const { hesap, api } = u
  const p = portalMetni(u.dil)

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    ;(async () => {
      try {
        const [c, d] = await Promise.all([api(ISTEK_API), api('/api/ulke/calisma-duzeni')])
        if (iptal) return
        if (!c.ok || !Array.isArray(c.j.istekler) || !d.ok || !d.j.duzen) { setYuk('hata'); return }
        const bulunan = (c.j.istekler as BekleyenIstek[]).find((x) => x.id === id)
        if (!bulunan) { setYuk('yok'); return }
        const dc = d.j as unknown as DuzenCevabi
        setIstek(bulunan); setSureler(dc.sureSecenekleri ?? [])
        setA({ gun: bulunan.gunler[0] ?? dc.bugun, saat: dc.duzen.baslangic, sureDk: dc.duzen.sureDk })
        setYuk('tamam')
      } catch { if (!iptal) setYuk('hata') }
    })()
    return () => { iptal = true }
  }, [hesap, api, id])

  async function cevapla(govde: Record<string, unknown>) {
    setBekliyor(true); setHata(null)
    try {
      const c = await api(ISTEK_API, { method: 'PATCH', govde: { id, ...govde } })
      if (c.ok && typeof c.j.randevuId === 'string') { window.location.assign(takvimYolu({ randevu: c.j.randevuId })); return }
      if (c.ok) { window.location.assign(takvimYolu()); return }
      setHata({ kod: typeof c.j.code === 'string' ? c.j.code : 'BASARISIZ', alan: typeof c.j.alan === 'string' ? c.j.alan : null })
    } catch { setHata({ kod: 'BAGLANTI' }) }
    setBekliyor(false)
  }

  if (yuk !== 'tamam' || !istek) return <IstekYokGorunumu p={p} r={r} m={u.m} durum={yuk === 'tamam' ? 'yok' : yuk} />
  const set = (y: Partial<IstekCevapFormu>) => { setA({ ...a, ...y }); setHata(null) }
  const bilinen = hata && ['DOLU', 'MESAI_DISI', 'GECERSIZ', 'BAGLANTI'].includes(hata.kod)
  return (
    <IstekCevabiGorunumu p={p} r={r} istek={istek} a={a} set={set} zaman={<ZamanAlanlari r={r} g={u.m.girdi} a={a} set={set} sureler={sureler} on="uza-ri" />}
      hataMetni={bilinen ? randevuHataMetni(u.m, r, hata?.kod ?? null, hata?.alan) : null}
      gonder={(yineDe) => { void cevapla({ gun: a.gun, saat: a.saat, sureDk: a.sureDk, neden: istek.neden, ...(yineDe ? { yineDe: true } : {}) }) }}
      reddet={() => { void cevapla({ red: true }) }} bekliyor={bekliyor} hata={hata} />
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
          {/* The kit's own time field, on the pack's clock: never the browser's (NOTYA-ULKE-DENETIM-01b). */}
          <div className="uza-alan">
            <SaatGirisi id="uza-d-bas" etiket={d.baslangic} deger={a.baslangic} degistir={(baslangic) => set({ ...a, baslangic })} m={m.girdi} ad="baslangic" zorunlu />
          </div>
          <div className="uza-alan">
            <SaatGirisi id="uza-d-bit" etiket={d.bitis} deger={a.bitis} degistir={(bitis) => set({ ...a, bitis })} m={m.girdi} ad="bitis" zorunlu />
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
              <div className="uza-alan"><SaatGirisi id={`uza-d-mola-bas-${i}`} etiket={d.molaBas} deger={x.baslangic} degistir={(baslangic) => mola(i, { baslangic })} m={m.girdi} ad={`mola-bas-${i}`} /></div>
              <div className="uza-alan"><SaatGirisi id={`uza-d-mola-bit-${i}`} etiket={d.molaBit} deger={x.bitis} degistir={(bitis) => mola(i, { bitis })} m={m.girdi} ad={`mola-bit-${i}`} /></div>
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
        {/* The calendar shows the pack's public days. This screen still does not close one: a booking stays the doctor's. */}
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
  const [p, setP] = useState<{ gun: string; gorunum: SayfaGorunumu; yeni: boolean; hasta: string; kayitsiz: boolean; saat: string; randevu: string; duzen: boolean; q: string; istek: string; bolge: string } | null>(null)
  useEffect(() => {
    const s = new URLSearchParams(window.location.search)
    const istenen = s.get('gorunum')
    setP({ gun: s.get('gun') ?? '', gorunum: istenen === 'hafta' || istenen === 'gun' || istenen === 'ajanda' || istenen === 'liste' ? istenen : 'ay', yeni: s.get('yeni') === '1', hasta: s.get('hasta') ?? '', kayitsiz: s.get('kayitsiz') === '1', saat: s.get('saat') ?? '', randevu: s.get('randevu') ?? '', duzen: s.get('duzen') === '1', q: s.get('q') ?? '', istek: s.get('istek') ?? '', bolge: s.get('bolge') ?? '' })
  }, [])
  if (!u.hesap || !p) return <Yukleniyor m={u.m} dil={u.dil} />
  const r = randevuMetni(u.dil)
  // NOTYA-ULKE-PORTAL-01: patients' requests exist only where the country has the patient portal.
  const portal = ozellikAcik('hastaPortali')
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="takvim" cikis={u.cikis}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 8px' }}><Ipucu m={u.m} bolum="takvim" /></div>
      {p.randevu ? <RandevuDetay u={u} r={r} id={p.randevu} />
        : p.duzen ? <Duzen u={u} r={r} />
          : p.istek && portal ? <IstekCevabi u={u} r={r} id={p.istek} />
            : p.yeni ? <YeniRandevu u={u} r={r} hastaId={p.hasta} kayitsiz={p.kayitsiz} gunParam={p.gun} saatParam={p.saat} q={p.q} bolge={p.bolge} />
              : <>{portal ? <Istekler u={u} r={r} /> : null}<TakvimEkrani u={u} r={r} gunParam={p.gun} gorunum={p.gorunum} bolge={p.bolge} /></>}
    </Cerceve>
  )
}
