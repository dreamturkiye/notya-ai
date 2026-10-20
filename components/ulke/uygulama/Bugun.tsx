'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /today: the doctor's home. Today's appointments in time order with their status
 * (NOTYA-UZ-RANDEVU-01), today's visits, a patient search, "new patient", "start a visit".
 * Replaces the holding page for accounts of a country where the application is switched on.
 */
import React, { useEffect, useState, type CSSProperties } from 'react'
import { Cerceve, Hata, HAZIR, saatYaz, useUygulama, YOL, Yukleniyor, type Api } from './Kabuk'
import { asistanAdi, asistanSatiri } from './Asistan'
import { AsistanSesKontrol } from './AsistanSes'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { hesapSaatDilimi } from '@/lib/ulke/arayuz/bicim'
import { OkunmamisMesajlarKarti } from './HastaMesajlari'
import { BekleyenKonsultasyonlarKarti } from './Konsultasyonlar'
import { Istekler } from './PortalIstekleri'
import { saatAraligi, DurumRozeti, muayeneBaslatilabilir, muayeneBaslatYolu, takvimYolu, type RandevuKaydi } from './randevuOrtak'
import { araclarMetni, asistanKimligi, asistanSesAdlari, metninDili, randevuMetni, rolAdi, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { roller } from '@/lib/ulke/arayuz'
import { Ipucu } from './Ipucu'
import { IlkAdimlarKarti } from './IlkAdimlar'

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
    <section data-alan="bugun-randevular">
      <div className="uza-ekran-disi">
        <h2 className="uza-h2">{r.bugun.randevular}</h2>
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

/** Hour in the account's zone. Bands match the reference clock: night, morning, afternoon, evening. */
function yerelSaat(tz: string): number {
  const h = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date())
  const n = Number(h)
  return Number.isFinite(n) ? n : 12
}

function gunSelami(p: NonNullable<UygulamaMetni['pano']>, tz: string): string {
  const s = yerelSaat(tz)
  if (s < 5 || s >= 23) return p.gece
  if (s < 11) return p.sabah
  if (s < 18) return p.gun
  return p.aksam
}

function uzunGun(tz: string): string {
  return new Intl.DateTimeFormat(ulkePaketi().bicim.yerel, { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(new Date())
}

const S = (s: CSSProperties) => s
const KART: CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, boxShadow: '0 16px 34px rgba(58,44,34,0.06)' }
const ETIKET: CSSProperties = { fontSize: 14, fontWeight: 700, color: '#4A4030', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }
const ARAC: CSSProperties = { color: R.pine, fontSize: 13, fontWeight: 600 }

/** Stroke icons for the seven quick-access tiles. Paths only — the words sit beside them. */
function KaroIkon({ ad }: { ad: string }) {
  const ortak = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (ad) {
    case 'takvim': return <svg {...ortak}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
    case 'asistan': return <svg {...ortak}><rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9 20.5h6" /></svg>
    case 'hastaEkle': return <svg {...ortak}><circle cx="10" cy="8.5" r="3.5" /><path d="M4 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" /><path d="M18.5 8v5M16 10.5h5" /></svg>
    case 'belge': return <svg {...ortak}><path d="M7 3.5h7l4 4V19a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 19V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4.5" /></svg>
    case 'inceleme': return <svg {...ortak}><rect x="4.5" y="4.5" width="15" height="16" rx="2.5" /><path d="m8.6 13.6 2.2 2.2 4.6-4.8" /></svg>
    case 'araclar': return <svg {...ortak}><path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" /><circle cx="15" cy="7.5" r="2.2" /><circle cx="9" cy="16.5" r="2.2" /></svg>
    default: return <svg {...ortak}><path d="M4.5 20V4.5M4.5 20H20" /><path d="M8.5 16.5v-5M12.5 16.5V8M16.5 16.5v-8.5" /></svg>
  }
}

export function BugunGorunumu({ m, ad, muayeneler, hata, rol, randevular, mesajlar, konsultasyon, istekler, ilkAdimlar, api }: {
  m: UygulamaMetni; ad: string; muayeneler: BugunMuayenesi[] | null; hata: boolean
  /** NOTYA-UZ-RANDEVU-01: today's appointments. Absent or null = not loaded, or the country has none: no list is drawn. */
  randevular?: RandevuKaydi[] | null
  /** NOTYA-UZ-BRANSLAR-01: the account's role — decides which assistant is shown. No role = the neutral assistant. */
  rol?: string | null
  /** NOTYA-ULKE-MESAJ-01: the patients whose messages are unread, where the country has messages. Draws nothing while there is none. */
  mesajlar?: React.ReactNode
  /** NOTYA-ULKE-MESAJ-01: how many consultations wait for this doctor's answer, where the country has consultation. Draws nothing while none waits. */
  konsultasyon?: React.ReactNode
  /** Appointment requests from the patient's page. Draws nothing while there is none. */
  istekler?: React.ReactNode
  /** YENI-DOKTOR-UX-2026-10: the first-run checklist of a new account. Draws nothing once set up. */
  ilkAdimlar?: React.ReactNode
  /** Present on the live page. A static render without it still shows the two voice names. */
  api?: Api
}) {
  const p = m.pano
  const tz = hesapSaatDilimi()
  const [gorunum, setGorunum] = useState<'bugun' | 'hafta'>('bugun')
  const dil = metninDili(m)
  const r = randevuMetni(dil)
  const arac = ozellikAcik('araclar') ? araclarMetni(dil) : null
  const bekleyen = (muayeneler ?? []).filter((v) => v.durum === 'taslak').length
  const onayli = (muayeneler ?? []).filter((v) => v.durum === 'onayli').length
  const bugunSayi = muayeneler?.length ?? 0
  const hastaSayi = new Set((muayeneler ?? []).map((v) => v.hastaId).filter(Boolean)).size
  const asistan = asistanAdi(m, rol)
  const satir = asistanSatiri(m, rol)
  const sesler = satir ? asistanSesAdlari() : null
  const kaynaklar = sesler ? asistanKimligi(rol, dil)?.kaynaklar : undefined
  const karo = (href: string | null, text: string, not?: string) => {
    const ic = (
      <>
        <span style={S({ fontSize: 14, fontWeight: 600, lineHeight: 1.15 })}>{text}</span>
        {not ? <span style={S({ fontSize: 11, lineHeight: 1, color: R.muted })}>{not}</span> : null}
      </>
    )
    const stil = S({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minHeight: 64, padding: 8, borderRadius: 16, border: '1px solid rgba(30,51,54,0.18)', background: '#d0d8d5', color: R.ink, textAlign: 'left', textDecoration: 'none' })
    return href ? <a key={text} href={href} style={stil}>{ic}</a> : <span key={text} className="uza-duvar" style={stil}>{ic}</span>
  }
  return (
    <div className="yg-ana" style={S({ display: 'flex', flexDirection: 'column', gap: 22 })}>
      <section className="uza-karsilama">
        <p className="uza-ust-yazi">{p ? `${gunSelami(p, tz)}, ${uzunGun(tz)}` : m.bugun.selam}</p>
        <div style={S({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' })}>
          <h1 className="uza-h1" style={S({ margin: 0 })}>{m.bugun.selam}, {ad}</h1>
          <Ipucu m={m} bolum="bugun" />
        </div>
        <div className="uza-ekran-disi">
          <span data-alan="asistan-ad">{asistan}</span>
          {satir ? <span data-alan="asistan-satir">{`: ${satir}`}</span> : null}
        </div>
        {sesler && satir ? (
          <section id="asistan" className="uza-kart" data-alan="asistan-kart" data-rol={rol ?? undefined}>
            <p className="uza-ust-yazi">{m.asistan.etiket}</p>
            <p className="uza-asistan-ad" data-alan="asistan-kart-ad">{asistan}</p>
            <p className="uza-ipucu" data-alan="asistan-kart-satir">{satir}</p>
            {kaynaklar ? (
              <>
                <p className="uza-ipucu" data-alan="asistan-kaynak-not">{kaynaklar.not}</p>
                <p className="uza-ust-yazi uza-asistan-baslik" data-alan="asistan-yetki-baslik">{kaynaklar.yetkiBaslik}</p>
                <ul className="uza-asistan-kaynak" data-alan="asistan-yetki">{kaynaklar.yetki.map((sat) => <li key={sat}>{sat}</li>)}</ul>
                <p className="uza-ust-yazi uza-asistan-baslik" data-alan="asistan-kitap-baslik">{kaynaklar.kitapBaslik}</p>
                <ul className="uza-asistan-kaynak" data-alan="asistan-kitap">{kaynaklar.kitaplar.map((sat) => <li key={sat}>{sat}</li>)}</ul>
              </>
            ) : null}
            <AsistanSesKontrol m={m} api={api} sesler={sesler} />
          </section>
        ) : null}
      </section>

      {ilkAdimlar ?? null}

      {p ? (
        <div className="yg-fisilti">
          <div className="yg-fisilti-ad">{p.fisilti}</div>
          <div className="yg-fisilti-bos">{p.fisiltiBos}</div>
        </div>
      ) : null}

      {p ? (
        <div className="yg-masa-arac">
          <h2 style={ETIKET}>{p.hizliAraclar}</h2>
          <div style={S({ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', ...KART, borderRadius: 16, padding: '14px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' })}>
            <span style={ARAC}>{m.asistan.etiket} ›</span>
            <span style={ARAC}>{p.epikriz} ›</span>
            <span style={ARAC}>{p.kodlama} ›</span>
          </div>
        </div>
      ) : null}

      {p ? (
        <div className="yg-mobil-ust">
          <h2 style={S({ ...ETIKET, fontSize: 12, marginBottom: 8 })}>{p.hizliErisim}</h2>
          <div style={S({ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 })}>
            {karo(YOL.bugun, m.kabuk.bugun)}
            {HAZIR.takvim ? karo(YOL.takvim, r.kabuk.takvim) : null}
            {karo(YOL.hastalar, m.kabuk.hastalar)}
            {karo(YOL.yeniHasta, m.bugun.yeniHasta)}
            {karo(null, p.epikriz, p.kodlama)}
            {karo(null, p.mesajlar)}
            {karo(ozellikAcik('fotoArsivi') ? YOL.hastalar : null, p.belgeler)}
            {karo(null, p.raporlar)}
            {arac ? karo(YOL.araclar, arac.izgara.baslik) : karo(null, p.inceleme)}
          </div>
        </div>
      ) : null}

      <div className="yg-takvim">
        {p && HAZIR.takvim ? (
          <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 })}>
            <div style={S({ display: 'flex', background: '#EFE9DC', borderRadius: 11, padding: 4, gap: 2 })}>
              {([['bugun', p.bugun], ['hafta', p.buHafta]] as const).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setGorunum(k)} style={S({ background: gorunum === k ? R.pine : 'transparent', border: 'none', color: gorunum === k ? '#FAF8F4' : '#4A4030', fontWeight: gorunum === k ? 700 : 600, borderRadius: 8, padding: '9px 18px', fontSize: 13.5, cursor: 'pointer' })}>{v}</button>
              ))}
            </div>
            <div style={S({ display: 'flex', gap: 8, flexWrap: 'wrap' })}>
              <a href={takvimYolu()} style={S({ background: 'transparent', border: `1.5px solid ${R.border}`, color: R.ink, borderRadius: 999, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' })}>{r.bugun.takvimiAc}</a>
              <a href={takvimYolu({ yeni: '1' })} style={S({ background: R.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' })}>+ {p.randevuEkle}</a>
            </div>
          </div>
        ) : null}
        <div style={S({ ...KART, padding: '6px 20px' })}>
          {HAZIR.takvim && randevular && (gorunum === 'bugun' || !p) ? <BugunRandevulari m={m} randevular={randevular} /> : null}
          {p && HAZIR.takvim && gorunum === 'hafta' ? <div style={S({ padding: '16px 0', fontSize: 14, color: R.muted })}>{p.haftaYok}</div> : null}
          {p && !(HAZIR.takvim && randevular) ? <div style={S({ padding: '16px 0', fontSize: 14, color: R.muted })}>{p.planYok}</div> : null}
        </div>
      </div>

      {mesajlar ? <div id="mesajlar">{mesajlar}</div> : null}
      {konsultasyon ?? null}
      {istekler ?? null}

      {p ? (
        <div className="yg-kpi" style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 })}>
          {[
            { label: p.kpiMuayene, value: muayeneler === null ? null : bugunSayi, color: R.pine, sub: p.kpiMuayeneAlt },
            { label: p.kpiOnay, value: muayeneler === null ? null : bekleyen, color: '#B4832F', sub: p.kpiOnayAlt },
            { label: p.kpiAy, value: muayeneler === null ? null : bugunSayi, color: '#4A5C8A', sub: p.kpiAyAlt },
            { label: p.kpiHasta, value: muayeneler === null ? null : hastaSayi, color: R.pine, sub: p.kpiHastaAlt, href: YOL.hastalar },
          ].map((c) => {
            const govde = (
              <>
                <div style={S({ fontSize: 13, color: R.muted })}>{c.label}</div>
                {c.value === null ? <div style={S({ height: 40, width: 60, background: '#EFE9DC', borderRadius: 8, margin: '10px 0 6px' })} /> : <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 40, fontWeight: 600, color: c.color, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', margin: '4px 0 2px' })}>{c.value}</div>}
                <div style={S({ fontSize: 12, color: R.muted })}>{c.sub}</div>
              </>
            )
            const stil = S({ ...KART, padding: 22, display: 'block', textDecoration: 'none', color: 'inherit' })
            return c.href ? <a key={c.label} href={c.href} style={stil}>{govde}</a> : <div key={c.label} style={stil}>{govde}</div>
          })}
        </div>
      ) : null}

      {p ? (
        <div className="yg-erisim">
          <div style={ETIKET}>{p.hizliErisim}</div>
          <div className="yg-erisim-izgara" style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 })}>
            {[
              HAZIR.takvim ? { href: YOL.takvim, text: r.kabuk.takvim, ikon: 'takvim' } : null,
              { href: null, text: p.asistanAc, ikon: 'asistan' },
              { href: YOL.yeniHasta, text: m.bugun.yeniHasta, ikon: 'hastaEkle' },
              arac ? { href: YOL.araclar, text: arac.izgara.baslik, ikon: 'araclar' } : null,
              { href: ozellikAcik('fotoArsivi') ? YOL.hastalar : null, text: p.belgeYukle, ikon: 'belge' },
              { href: null, text: p.inceleme, ikon: 'inceleme' },
              { href: null, text: p.raporlar, ikon: 'raporlar' },
            ].filter((x): x is { href: string | null; text: string; ikon: string } => Boolean(x)).map((k) => {
              const ic = (
                <>
                  <span style={S({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: '#E4F3F1', color: R.pine })}><KaroIkon ad={k.ikon} /></span>
                  <span style={S({ fontSize: 13.5, fontWeight: 600 })}>{k.text}</span>
                </>
              )
              const stil = S({ ...KART, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16, color: R.ink, textAlign: 'left', textDecoration: 'none' })
              return k.href ? <a key={k.text} href={k.href} style={stil}>{ic}</a> : <span key={k.text} style={stil}>{ic}</span>
            })}
          </div>
        </div>
      ) : null}

      <div className="yg-alt" style={S({ display: 'flex', gap: 16, flexWrap: 'wrap' })}>
        <div className={muayeneler !== null && muayeneler.length === 0 && !hata ? 'uza-ekran-disi' : 'yg-notlar'} style={S({ flex: '1 1 280px', minWidth: 0 })}>
          <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 })}>
            <div style={S({ ...ETIKET, margin: 0 })}>{p ? p.onayBekleyen : m.bugun.baslik}</div>
            {p ? <span style={S({ fontSize: 13, color: R.pine, fontWeight: 600 })}>{p.tumunuGor} ›</span> : null}
          </div>
          <div style={S({ ...KART, padding: '8px 20px' })}>
            <h2 className="uza-h2 uza-ekran-disi">{m.bugun.baslik}</h2>
            <Hata>{hata ? m.kabuk.hata : null}</Hata>
            {muayeneler === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : muayeneler.length === 0 ? (
              <p className="uza-bos">{m.bugun.bos}</p>
            ) : (
              <ul className="uza-liste">
                {muayeneler.map((v) => {
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
          </div>
        </div>
        {p ? (
          <div className="yg-hafta" style={S({ flex: '1 1 240px', minWidth: 0 })}>
            <div className="yg-ozet-bos" aria-hidden="true">&nbsp;</div>
            <div style={S({ ...KART, padding: '20px 20px 18px' })}>
              <div style={ETIKET}>{p.haftaOzeti}</div>
              {[
                { dot: R.pine, label: p.haftaSeans, val: bugunSayi },
                { dot: '#3F7D4A', label: p.haftaOnay, val: onayli },
                { dot: '#B4832F', label: p.haftaBekleyen, val: bekleyen },
              ].map((row, i) => (
                <div key={row.label} style={S({ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? `1px solid ${R.border}` : 'none' })}>
                  <span style={S({ width: 8, height: 8, background: row.dot, borderRadius: '50%' })} />
                  <span style={S({ flex: 1, fontSize: 14, color: R.ink })}>{row.label}</span>
                  <span style={S({ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: R.ink })}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="uza-ekran-disi">
        <section className="uza-kart yg-arama">
          <AramaFormu m={m} />
          <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{m.bugun.tumHastalar}</a></p>
        </section>
        {HAZIR.muayene ? <a href={YOL.muayene}>{m.bugun.muayeneBaslat}</a> : null}
        {arac ? (
          <section data-alan="bugun-araclar">
            <a className="uza-baglanti" href={YOL.araclar} data-eylem="araclari-ac">{arac.izgara.ac}</a>
          </section>
        ) : null}
      </div>
    </div>
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
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="bugun" cikis={u.cikis}>
      <BugunGorunumu m={u.m} ad={hesap.ad} muayeneler={muayeneler} hata={hata} rol={hesap.rol} api={api} randevular={randevular} mesajlar={ozellikAcik('hastaPortali') && ozellikAcik('hastaMesajlari') ? <OkunmamisMesajlarKarti u={u} /> : null} konsultasyon={ozellikAcik('konsultasyon') && ozellikAcik('araclar') ? <BekleyenKonsultasyonlarKarti u={u} /> : null} istekler={ozellikAcik('hastaPortali') && ozellikAcik('randevu') ? <Istekler u={u} r={randevuMetni(u.dil)} /> : null} ilkAdimlar={<IlkAdimlarKarti m={u.m} api={api} rolTamam={Boolean(hesap.rol) || roller().length === 0} />} />
    </Cerceve>
  )
}
