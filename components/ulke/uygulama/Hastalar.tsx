'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — patients: the list with its search (/patients), the form for a new patient (/patients/new)
 * and one patient's file (/patient?id=…). A doctor sees only their own patients: the server answers with nothing
 * else (lib/ulke/uygulama/hastalar.ts), and another doctor's patient id answers "not found".
 */
import React, { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import dinamikYukle from 'next/dynamic'
import { AramaFormu } from './Bugun'
import { Bilgi, Cerceve, Hata, HAZIR, Secim, tarihYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { saatAraligi, DurumRozeti, takvimYolu, type RandevuKaydi } from './randevuOrtak'
import { dilAdi, dilBirlestir, metninDili, randevuMetni, rolAdi, uygulamaMetni, yaziSec, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { PortalErisimKarti } from './PortalErisimi'
import { HastaFormuKarti } from './HastaFormuKarti'
import { HastaAracKayitlariKarti } from './AracKayitlari'
import { HastaMesajKarti } from './HastaMesajlari'
import { KonsultasyonKarti } from './Konsultasyonlar'
import { FotoArsivKarti } from './FotoArsivi'
import type { DilKodu } from '@/lib/ulke/tipler'
import { GIRDI_GECERSIZ } from '@/lib/ulke/arayuz/zamanGirdisi'
import { TarihGirisi } from '../girdi/TarihGirisi'
import { TelefonGirisi } from '../girdi/TelefonGirisi'
import { telefonHatasi } from '@/lib/ulke/arayuz/telefon'
import { Ipucu } from './Ipucu'

/**
 * AU-ARAC-GORUNUM-01 / PERF-SAGLAMLIK-2026-10 — the calendar view is a tab-gated, additional card on an already
 * heavy page: lazy-loaded the same way TR's own patient-file page already lazy-loads its heavy, tab-gated panels
 * (`next/dynamic`, commit `3c18a116`). Renders nothing itself for a pack that names no `takvimliListeAraci` — see
 * ./AsiTakvimi.tsx — so this costs other packs nothing beyond the dynamic-import wrapper.
 */
const KartYukleniyor = () => <p className="uza-bos" role="status" aria-hidden="true" />
const TakvimliListeKarti = dinamikYukle(() => import('./AsiTakvimi').then((m) => m.TakvimliListeKarti), { loading: KartYukleniyor })
const BuyumeGrafigiKarti = dinamikYukle(() => import('./BuyumeGrafigi').then((m) => m.BuyumeGrafigiKarti), { loading: KartYukleniyor })
const AntropometriTrendKarti = dinamikYukle(() => import('./AntropometriTrend').then((m) => m.AntropometriTrendKarti), { loading: KartYukleniyor })
const BeslenmeDosyaKarti = dinamikYukle(() => import('./BeslenmeDosya').then((m) => m.BeslenmeDosyaKarti), { loading: KartYukleniyor })
const TakipOzetiKarti = dinamikYukle(() => import('./TakipOzeti').then((m) => m.TakipOzetiKarti), { loading: KartYukleniyor })

export type HastaKaydi = { id: string; ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: 'male' | 'female' | ''; telefon: string; dil: string; ulusalKimlik: string }
export type DosyaMuayenesi = { seansId: string; notId: string | null; baslangic: string; durum: 'taslak' | 'onayli' | 'notsuz' }

/** "Familiya Ism Otasining ismi" — the patronymic follows the name when there is one. */
export const tamAd = (h: Pick<HastaKaydi, 'ad' | 'otaIsmi'>) => [h.ad, h.otaIsmi].filter(Boolean).join(' ')

/** The patient's language, named in the screen's language. */
export function hastaDiliAdi(m: UygulamaMetni, dil: string): string {
  return dilAdi(m, dil)
}

/** Whole years; under two years, months ("7 oy"). '' when there is no birth date. */
export function yasYaz(m: UygulamaMetni, dogumTarihi: string, bugun: Date = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi)) return ''
  const [y, a, g] = dogumTarihi.split('-').map(Number)
  let ay = (bugun.getUTCFullYear() - y) * 12 + (bugun.getUTCMonth() + 1 - a)
  if (bugun.getUTCDate() < g) ay -= 1
  if (ay < 0) return ''
  return ay < 24 ? `${ay} ${m.hasta.ay}` : String(Math.floor(ay / 12))
}

// ───────────────────────── list ─────────────────────────

export function HastalarGorunumu({ m, q, hastalar, hata }: { m: UygulamaMetni; q: string; hastalar: HastaKaydi[] | null; hata: boolean }) {
  return (
    <div className="yg-sayfa">
      <div className="uza-baslik-satiri">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <h1 className="uza-h1">{m.hastalar.baslik}</h1>
          <Ipucu m={m} bolum="hastalar" />
        </span>
        <a className="uza-dugme" href={YOL.yeniHasta} style={{ borderRadius: 999, background: 'var(--uza-cam)', color: '#FAF8F4', padding: '10px 18px', minHeight: 0 }}>+ {m.bugun.yeniHasta}</a>
      </div>
      <div className="yg-arama-sade"><AramaFormu m={m} q={q} /></div>
      <Hata>{hata ? m.kabuk.hata : null}</Hata>
      {hastalar === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : hastalar.length === 0 ? (
        <div data-alan="hastalar-bos">
          <p className="uza-bos">{q ? m.arama.sonucYok : m.hastalar.bos}</p>
          {/* YENI-DOKTOR-UX-2026-10: the empty list carries its first action. */}
          {!q && <a className="uza-dugme" href={YOL.yeniHasta} data-eylem="ilk-hasta" style={{ borderRadius: 999 }}>+ {m.bugun.yeniHasta}</a>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hastalar.map((h) => (
            <a key={h.id} className="yg-satir" href={`${YOL.hasta}?id=${h.id}`} aria-label={`${m.hastalar.dosya}: ${tamAd(h)}`}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{tamAd(h)}</span>
                <span className="uza-liste-alt" style={{ display: 'block', color: 'var(--uza-soluk)', fontSize: 13, marginTop: 4 }}>{[tarihYaz(h.dogumTarihi), h.telefon].filter(Boolean).join(' · ')}</span>
              </span>
              {m.pano ? <span style={{ color: '#3F7D4A', flexShrink: 0, fontSize: 13, fontWeight: 600 }}>{m.pano.aktif}</span> : null}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function Hastalar() {
  const u = useUygulama('hastalar')
  const [q, setQ] = useState('')
  const [hastalar, setHastalar] = useState<HastaKaydi[] | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const aranan = new URLSearchParams(window.location.search).get('q') ?? ''
    setQ(aranan)
    api(`/api/ulke/hastalar${aranan ? `?q=${encodeURIComponent(aranan)}` : ''}`)
      .then((r) => { if (iptal) return; if (r.ok && Array.isArray(r.j.hastalar)) setHastalar(r.j.hastalar); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="hastalar" cikis={u.cikis}>
      <HastalarGorunumu key={q} m={u.m} q={q} hastalar={hastalar} hata={hata} />
    </Cerceve>
  )
}

// ───────────────────────── new patient ─────────────────────────

export type YeniHastaAlanlari = { ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: 'male' | 'female' | ''; telefon: string; dil: string; ulusalKimlik: string }
export const BOS_HASTA: YeniHastaAlanlari = { ad: '', otaIsmi: '', dogumTarihi: '', cinsiyet: '', telefon: '', dil: '', ulusalKimlik: '' }
export type YeniHastaHatasi = 'ad' | 'dogumTarihi' | 'telefon' | 'dil' | 'kayit' | 'baglanti' | null

export function YeniHastaGorunumu({ m, dil, a, set, gonder, bekliyor, hata, telefonOrnek, baslik, iptal }: {
  m: UygulamaMetni; dil: DilKodu; a: YeniHastaAlanlari; set: (a: YeniHastaAlanlari) => void
  gonder: (e: FormEvent) => void; bekliyor: boolean; hata: YeniHastaHatasi; telefonOrnek: string
  baslik?: string
  /** When set, Cancel stays on this page instead of leaving for the patient list. */
  iptal?: () => void
}) {
  const y = m.yeniHasta
  const hataMetni = hata === 'ad' ? y.adGerekli : hata === 'dogumTarihi' ? y.dogumGecersiz : hata === 'dil' ? y.dilGerekli : hata === 'kayit' ? y.kaydedilemedi : hata === 'baglanti' ? m.kabuk.baglanti : null
  const p = ulkePaketi()
  // The patient's language is offered in that language (a language with several scripts: in the doctor's script).
  const hastaDilleri = (p.uygulama?.hastaDilleri ?? []).map((temel) => { const bicim = dilBirlestir(temel, yaziSec(dil)); return { deger: temel, ad: dilAdi(uygulamaMetni(bicim), temel), dil: bicim } })
  const istegeBagli = <small> ({y.istegeBagli})</small>
  return (
    <div className="uza-dar" data-alan={iptal ? undefined : 'yeni-hasta'}>
    {iptal ? null : <a href={YOL.hastalar} style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#4A4030', textDecoration: 'none', margin: '0 0 12px', padding: '10px 0', minHeight: 40, boxSizing: 'border-box' }}>{'\u2190'} {m.hastalar.baslik}</a>}
    <section className="uza-kart" style={iptal ? undefined : { borderRadius: 16, padding: '20px 20px 22px' }}>
      <h1 className="uza-h1" style={iptal ? undefined : { fontSize: 28, fontWeight: 600, margin: '0 0 14px' }}>{baslik ?? y.baslik}</h1>
      <form className="uza-form" onSubmit={gonder} noValidate>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-h-ad">{y.ad}</label>
          <input id="uza-h-ad" className="uza-girdi" value={a.ad} onChange={(e) => set({ ...a, ad: e.target.value })} autoComplete="off" maxLength={160} />
        </div>
        {p.uygulama?.adAlanlari.ikinciAd ? (
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-h-ota">{y.otaIsmi}{istegeBagli}</label>
            <input id="uza-h-ota" className="uza-girdi" value={a.otaIsmi} onChange={(e) => set({ ...a, otaIsmi: e.target.value })} autoComplete="off" maxLength={120} />
          </div>
        ) : null}
        <div className="uza-iki">
          <div className="uza-alan">
            {/* The kit's own date field, in the pack's order: never the browser's (NOTYA-ULKE-DENETIM-01b). */}
            <TarihGirisi id="uza-h-dogum" etiket={y.dogumTarihi} deger={a.dogumTarihi} degistir={(dogumTarihi) => set({ ...a, dogumTarihi })} m={m.girdi} ad="dogumTarihi" hata={hata === 'dogumTarihi'} />
          </div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-h-tel">{y.telefon}</label>
            <TelefonGirisi id="uza-h-tel" ad="telefon" deger={a.telefon} degistir={(telefon) => set({ ...a, telefon })} hata={hata === 'telefon' ? telefonHatasi(m.girdi, a.telefon) : null} />
          </div>
        </div>
        <Secim etiket={y.cinsiyet} ad="cinsiyet" deger={a.cinsiyet} sec={(cinsiyet) => set({ ...a, cinsiyet })} secenekler={[{ deger: 'female', ad: y.kadin }, { deger: 'male', ad: y.erkek }]} />
        {/* The patient's language is offered in that language, so the patient can point at it. */}
        {hastaDilleri.length > 1 ? <Secim etiket={y.dil} ad="hasta-dili" deger={a.dil} sec={(d) => set({ ...a, dil: d })} secenekler={hastaDilleri} /> : null}
        {p.ulusalKimlik ? (
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-h-kimlik">{y.ulusalKimlik}{istegeBagli}</label>
            <input id="uza-h-kimlik" className="uza-girdi" value={a.ulusalKimlik} onChange={(e) => set({ ...a, ulusalKimlik: e.target.value })} inputMode="numeric" autoComplete="off" maxLength={40} />
          </div>
        ) : null}
        <Hata>{hataMetni}</Hata>
        <div className="uza-eylemler">
          <button type="submit" className="uza-dugme" disabled={bekliyor}>{bekliyor ? y.kaydediliyor : y.kaydet}</button>
          {iptal ? <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={iptal}>{y.iptal}</button> : <a className="uza-dugme uza-dugme-cizgi" href={YOL.hastalar}>{y.iptal}</a>}
        </div>
      </form>
    </section>
    </div>
  )
}

export function YeniHasta() {
  const u = useUygulama('yeniHasta')
  // A country with one patient language asks nothing: every patient is recorded with it.
  const [a, setA] = useState<YeniHastaAlanlari>(() => { const d = ulkePaketi().uygulama?.hastaDilleri ?? []; return d.length === 1 ? { ...BOS_HASTA, dil: d[0] } : BOS_HASTA })
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<YeniHastaHatasi>(null)
  // INNER-A: "Create patient record and link" on a calendar card arrives with the name and phone typed at booking and
  // the appointment to link. The values only fill the form; the doctor still saves the record, and only then is it linked.
  const [bagla, setBagla] = useState('')
  useEffect(() => {
    const s = new URLSearchParams(window.location.search)
    const ad = (s.get('ad') ?? '').slice(0, 160)
    const telefon = (s.get('telefon') ?? '').slice(0, 40)
    if (ad || telefon) setA((o) => ({ ...o, ad: o.ad || ad, telefon: o.telefon || telefon }))
    const b = s.get('bagla') ?? ''
    if (/^[0-9a-f-]{36}$/i.test(b)) setBagla(b)
  }, [])
  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (a.ad.trim().length < 2) { setHata('ad'); return }
    if (!a.dil) { setHata('dil'); return }
    if (telefonHatasi(u.m.girdi, a.telefon)) { setHata('telefon'); return }
    // A date of birth that is typed and is not a day is never sent as "no date of birth".
    if (a.dogumTarihi === GIRDI_GECERSIZ) { setHata('dogumTarihi'); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await u.api('/api/ulke/hastalar', { method: 'POST', govde: a })
      if (r.ok && r.j.hasta?.id) {
        // The appointment is linked to the new record by the server, which proves the record is this doctor's.
        if (bagla) await u.api('/api/ulke/randevu', { method: 'PATCH', govde: { id: bagla, hastaId: r.j.hasta.id } }).catch(() => null)
        window.location.assign(`${YOL.hasta}?id=${r.j.hasta.id}`); return
      }
      setHata(r.j.code === 'GECERSIZ' && (r.j.alan === 'ad' || r.j.alan === 'dogumTarihi' || r.j.alan === 'telefon' || r.j.alan === 'dil') ? r.j.alan : 'kayit')
    } catch { setHata('baglanti') }
    setBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="hastalar" cikis={u.cikis}>
      <YeniHastaGorunumu m={u.m} dil={u.dil} a={a} set={(yeni) => { setA(yeni); setHata(null) }} gonder={gonder} bekliyor={bekliyor} hata={hata} telefonOrnek={ulkePaketi().telefon.ornek} />
    </Cerceve>
  )
}

// ───────────────────────── one patient's file ─────────────────────────

export function HastaDosyasiGorunumu({ m, hasta, muayeneler, bugun, randevular, portal, form, araclar, aracTakvimi, buyumeGrafigi, antropometriTrend, beslenmeDosya, takipOzeti, mesajlar, konsultasyon, fotograflar, duzenle }: {
  m: UygulamaMetni; hasta: HastaKaydi; muayeneler: DosyaMuayenesi[]; bugun?: Date
  /** NOTYA-UZ-RANDEVU-01: this patient's appointments from today on. Absent = not loaded: no list is drawn. */
  randevular?: RandevuKaydi[] | null
  /** NOTYA-ULKE-PORTAL-01: the card that gives this patient access to their page, where the country has the portal. */
  portal?: ReactNode
  /** NOTYA-ULKE-INTAKE-01: the intake form's card (ask, invitation, answers), where the country has the form. */
  form?: ReactNode
  /** NOTYA-ULKE-ARACLAR-01: the tool results kept on this patient, and the way to the tools for them, where the country has the tools area. */
  araclar?: ReactNode
  /** AU-ARAC-GORUNUM-01: the calendar view of one checklist tool's own milestones, where the pack names one (`UlkeAraclari.takvimliListeAraci`). Drawn beside the flat list — both show the same kept results. */
  aracTakvimi?: ReactNode
  /** AU-ARAC-GORUNUM-01-A: WHO growth chart from kept `buyume-persentili` results, where the pack has switched that tool on. */
  buyumeGrafigi?: ReactNode
  /** AU-DIETETICS-TREND-01: adult anthropometry trend from the pack-named body-size tool. */
  antropometriTrend?: ReactNode
  /** AU-DIETETICS-MEAL-01 / AU-GOLD-DEPTH-02: care-plan + between-visit log (pack-named tools via portalKoclukAyari). */
  beslenmeDosya?: ReactNode
  /** AU-GOLD-DEPTH-02: next clinical-review chip from the latest kept review studio. */
  takipOzeti?: ReactNode
  /** NOTYA-ULKE-MESAJ-01: the messages with this patient, where the country has them. Drawn after the portal's card: a patient reads them there. */
  mesajlar?: ReactNode
  /** NOTYA-ULKE-MESAJ-01: asking a colleague for an opinion on this patient, and this patient's consultations, where the country has consultation. */
  konsultasyon?: ReactNode
  /** FOTO-ARSIV-01: the patient photo archive's card, where the country has it. */
  fotograflar?: ReactNode
  /** Opens the editor for this patient's identity fields. */
  duzenle?: () => void
}) {
  const r = randevuMetni(metninDili(m))
  const yas = yasYaz(m, hasta.dogumTarihi, bugun)
  const onayli = muayeneler.filter((v) => v.durum === 'onayli' && v.notId)
  const taslak = muayeneler.filter((v) => v.durum === 'taslak' && v.notId)
  // Recorded, transcribed, but no note yet: listed so that the visit can be reached again.
  const notsuz = HAZIR.muayene ? muayeneler.filter((v) => v.durum === 'notsuz') : []
  const satir = (v: DosyaMuayenesi) => (
    <li key={v.seansId}>
      <a className="uza-satir" href={HAZIR.muayene ? `${YOL.muayene}?not=${v.notId}` : undefined}>
        <span className="uza-saat">{tarihYaz(v.baslangic)}</span>
        <span className="uza-liste-ad">{m.not.baslik}</span>
        <span className="uza-rozet" data-durum={v.durum}>{v.durum === 'onayli' ? m.durum.onayli : m.durum.taslak}</span>
      </a>
    </li>
  )
  const ad = tamAd(hasta)
  const cipler = [
    yas ? `${m.hasta.yas}: ${yas}` : '',
    hasta.cinsiyet ? (hasta.cinsiyet === 'female' ? m.yeniHasta.kadin : m.yeniHasta.erkek) : '',
    hasta.dogumTarihi ? tarihYaz(hasta.dogumTarihi) : '',
    hasta.telefon,
    hasta.dil ? hastaDiliAdi(m, hasta.dil) : '',
    hasta.ulusalKimlik,
  ].filter(Boolean)
  const randevuListesi = HAZIR.takvim && randevular && randevular.length ? (
    <section className="uza-kart" data-alan="hasta-randevular">
      <h2 className="uza-h2">{r.hasta.randevular}</h2>
      <ul className="uza-liste">
        {randevular.map((x) => (
          <li key={x.id}>
            <a className="uza-satir" href={takvimYolu({ randevu: x.id })} data-randevu={x.id}>
              <span className="uza-saat">{tarihYaz(x.gun)} {saatAraligi(x.saat, x.sureDk)}</span>
              <span className="uza-liste-ad">{x.neden}</span>
              <DurumRozeti r={r} durum={x.durum} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  ) : null
  // The tabs of Türkiye's patient file (app/dashboard/doktor/hastalar/[id]): pill tabs under the header. Only the
  // tabs this country has something for are drawn. Every panel is in the page; the others are `hidden`, so nothing
  // here changes what is loaded or who may see it.
  const sekmeler: { id: string; ad: string; icerik: ReactNode }[] = [
    { id: 'ozet', ad: r.ek.sekmeOzet, icerik: <>{randevuListesi}{taslak.length ? (
      <section className="uza-kart">
        <h2 className="uza-h2">{m.hasta.taslaklar}</h2>
        <ul className="uza-liste">{taslak.map(satir)}</ul>
      </section>
    ) : null}{notsuz.length ? (
      <section className="uza-kart">
        <h2 className="uza-h2">{m.hasta.notsuzlar}</h2>
        <ul className="uza-liste">
          {notsuz.map((v) => (
            <li key={v.seansId}>
              <a className="uza-satir" href={`${YOL.muayene}?seans=${v.seansId}`}>
                <span className="uza-saat">{tarihYaz(v.baslangic)}</span>
                <span className="uza-liste-ad">{m.hasta.notsuz}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    ) : null}</> },
    { id: 'muayene', ad: r.ek.sekmeMuayeneler, icerik: (
      <section className="uza-kart">
        <h2 className="uza-h2">{m.hasta.notlar}</h2>
        {onayli.length ? <ul className="uza-liste">{onayli.map(satir)}</ul> : <p className="uza-bos">{m.hasta.notYok}</p>}
      </section>
    ) },
    ...(fotograflar ? [{ id: 'belgeler', ad: r.ek.sekmeBelgeler, icerik: fotograflar }] : []),
    ...(araclar ? [{ id: 'araclar', ad: r.ek.sekmeAraclar, icerik: araclar }] : []),
    ...(form || portal ? [{ id: 'formu', ad: r.ek.hastaFormu, icerik: <div id="hasta-formu">{form ?? null}{portal ?? null}</div> }] : []),
    ...(aracTakvimi || buyumeGrafigi || antropometriTrend || beslenmeDosya || takipOzeti ? [{ id: 'asilar', ad: r.ek.sekmeAsilar, icerik: <>{buyumeGrafigi ?? null}{antropometriTrend ?? null}{takipOzeti ?? null}{beslenmeDosya ?? null}{aracTakvimi ?? null}</> }] : []),
    ...(mesajlar || konsultasyon ? [{ id: 'iletisim', ad: r.ek.sekmeIletisim, icerik: <>{mesajlar ?? null}{konsultasyon ?? null}</> }] : []),
  ]
  const [aktif, setAktif] = useState('ozet')
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('tab') ?? ''
    const hedef = q || (window.location.hash === '#hasta-formu' ? 'formu' : '')
    if (hedef && sekmeler.some((x) => x.id === hedef)) setAktif(hedef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <section className="yg-dosya-ust" aria-label={m.hasta.baslik}>
        <div className="yg-dosya-avatar" aria-hidden="true">{(ad.trim().charAt(0) || 'P').toUpperCase()}</div>
        <div className="yg-dosya-kimlik">
          <h1 className="yg-dosya-ad">{ad}</h1>
          {cipler.length ? <div className="yg-dosya-cipler">{cipler.map((c, i) => <span key={i} className="yg-dosya-cip">{c}</span>)}</div> : null}
        </div>
        <div className="yg-dosya-eylemler">
          {duzenle ? <button type="button" className="yg-dosya-dugme" onClick={duzenle} data-eylem="hasta-duzenle" data-yazdirma-gizle>{m.hasta.duzenle}</button> : null}
          {/* NOTYA-UZ-RANDEVU-01: booking from the patient's file — the form opens with this patient chosen. */}
          {HAZIR.takvim ? <a className="yg-dosya-dugme" href={takvimYolu({ yeni: '1', hasta: hasta.id })} data-eylem="randevu-al">{r.hasta.randevuAl}</a> : null}
          {HAZIR.muayene ? <a className="yg-dosya-dugme" data-birincil="evet" href={`${YOL.muayene}?hasta=${hasta.id}`}>{m.bugun.muayeneBaslat}</a> : null}
        </div>
      </section>
      <p className="yg-dosya-geri"><a className="uza-baglanti" href={YOL.hastalar}>{'\u2190'} {r.ek.geriHastalar}</a></p>
      <div className="yg-dosya-sekmeler" role="tablist">
        {sekmeler.map((x) => (
          <button key={x.id} type="button" role="tab" id={`yg-sekme-${x.id}`} aria-selected={aktif === x.id} aria-controls={`yg-panel-${x.id}`} className="yg-dosya-sekme" data-aktif={aktif === x.id ? 'evet' : undefined} onClick={() => setAktif(x.id)}>{x.ad}</button>
        ))}
      </div>
      {sekmeler.map((x) => (
        <div key={x.id} role="tabpanel" id={`yg-panel-${x.id}`} aria-labelledby={`yg-sekme-${x.id}`} hidden={aktif !== x.id} data-sekme={x.id}>{x.icerik}</div>
      ))}
    </>
  )
}

export function HastaDosyasi() {
  const u = useUygulama('hasta')
  const [veri, setVeri] = useState<{ hasta: HastaKaydi; muayeneler: DosyaMuayenesi[] } | null>(null)
  const [randevular, setRandevular] = useState<RandevuKaydi[] | null>(null)
  const [durum, setDurum] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [duzenleme, setDuzenleme] = useState(false)
  const [alanlar, setAlanlar] = useState<YeniHastaAlanlari>(BOS_HASTA)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<YeniHastaHatasi>(null)
  const [kaydedildi, setKaydedildi] = useState(false)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const id = new URLSearchParams(window.location.search).get('id') ?? ''
    api(`/api/ulke/hasta?id=${encodeURIComponent(id)}`)
      .then((r) => {
        if (iptal) return
        if (r.ok && r.j.hasta) { setVeri({ hasta: r.j.hasta, muayeneler: Array.isArray(r.j.muayeneler) ? r.j.muayeneler : [] }); setDurum('tamam') }
        else setDurum(r.status === 404 ? 'yok' : 'hata')
      })
      .catch(() => { if (!iptal) setDurum('hata') })
    // The file is the file without them: if the appointments cannot be read, the list is simply not drawn.
    if (HAZIR.takvim) api(`/api/ulke/randevular?hasta=${encodeURIComponent(id)}`).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.randevular)) setRandevular(r.j.randevular) }).catch(() => { /* no list */ })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  function duzenleAc() {
    if (!veri) return
    const h = veri.hasta
    setAlanlar({ ad: h.ad, otaIsmi: h.otaIsmi, dogumTarihi: h.dogumTarihi, cinsiyet: h.cinsiyet, telefon: h.telefon, dil: h.dil, ulusalKimlik: h.ulusalKimlik })
    setHata(null); setKaydedildi(false); setDuzenleme(true)
  }
  async function duzenleKaydet(e: FormEvent) {
    e.preventDefault()
    if (!veri) return
    if (alanlar.ad.trim().length < 2) { setHata('ad'); return }
    if (!alanlar.dil) { setHata('dil'); return }
    if (telefonHatasi(u.m.girdi, alanlar.telefon)) { setHata('telefon'); return }
    if (alanlar.dogumTarihi === GIRDI_GECERSIZ) { setHata('dogumTarihi'); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await api(`/api/ulke/hasta?id=${encodeURIComponent(veri.hasta.id)}`, { method: 'PATCH', govde: alanlar })
      if (r.ok && r.j.hasta) { setVeri({ ...veri, hasta: r.j.hasta as HastaKaydi }); setDuzenleme(false); setKaydedildi(true) }
      else setHata(r.j.code === 'GECERSIZ' && (r.j.alan === 'ad' || r.j.alan === 'dogumTarihi' || r.j.alan === 'telefon' || r.j.alan === 'dil') ? r.j.alan : 'kayit')
    } catch { setHata('baglanti') }
    setBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="hastalar" cikis={u.cikis}>
      {durum === 'tamam' && veri ? <>
        <Bilgi>{kaydedildi ? u.m.hasta.duzenlendi : null}</Bilgi>
        {duzenleme ? <YeniHastaGorunumu m={u.m} dil={u.dil} a={alanlar} set={(yeni) => { setAlanlar(yeni); setHata(null) }} gonder={duzenleKaydet} bekliyor={bekliyor} hata={hata} telefonOrnek={ulkePaketi().telefon.ornek} baslik={u.m.hasta.duzenle} iptal={() => { setDuzenleme(false); setHata(null) }} /> : null}
        <HastaDosyasiGorunumu m={u.m} hasta={veri.hasta} muayeneler={veri.muayeneler} randevular={randevular} duzenle={duzenleAc} portal={ozellikAcik('hastaPortali') ? <PortalErisimKarti u={u} hastaId={veri.hasta.id} /> : null} form={ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu') ? <HastaFormuKarti u={u} hastaId={veri.hasta.id} /> : null} araclar={ozellikAcik('araclar') ? <HastaAracKayitlariKarti u={u} hastaId={veri.hasta.id} /> : null} aracTakvimi={ozellikAcik('araclar') ? <TakvimliListeKarti u={u} hastaId={veri.hasta.id} /> : null} buyumeGrafigi={ozellikAcik('araclar') ? <BuyumeGrafigiKarti u={u} hastaId={veri.hasta.id} cinsiyetVarsayilan={veri.hasta.cinsiyet || null} /> : null} antropometriTrend={ozellikAcik('araclar') ? <AntropometriTrendKarti u={u} hastaId={veri.hasta.id} /> : null} beslenmeDosya={ozellikAcik('araclar') ? <BeslenmeDosyaKarti u={u} hastaId={veri.hasta.id} /> : null} takipOzeti={ozellikAcik('araclar') ? <TakipOzetiKarti u={u} hastaId={veri.hasta.id} /> : null} mesajlar={ozellikAcik('hastaPortali') && ozellikAcik('hastaMesajlari') ? <HastaMesajKarti u={u} hastaId={veri.hasta.id} sablonlar={ozellikAcik('hekimSablonlari')} /> : null} konsultasyon={ozellikAcik('konsultasyon') ? <KonsultasyonKarti u={u} hastaId={veri.hasta.id} /> : null} fotograflar={ozellikAcik('fotoArsivi') ? <FotoArsivKarti u={u} hastaId={veri.hasta.id} /> : null} />
      </> : (
        <section className="uza-kart">
          {durum === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{durum === 'yok' ? u.m.hasta.bulunamadi : u.m.kabuk.hata}</Hata>}
          {durum === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{u.m.kabuk.geri}</a></p>}
        </section>
      )}
    </Cerceve>
  )
}
