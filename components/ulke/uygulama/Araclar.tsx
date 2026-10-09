'use client'

/**
 * NOTYA-ULKE-ARACLAR-01 — /tools: the tools area of a country build. One address, two views:
 *
 *   /tools                 the grid: base tools (every role), then the tools of the account's own role; a search
 *   /tools?arac=<key>      one tool on its own screen
 *
 * THE KIT'S SCREEN, EVERY COUNTRY'S WORDS. Which tools exist is the kit's catalogue (lib/ulke/araclar/katalog.ts);
 * which are switched on, for which roles and in which words is the active pack's (lib/ulke/arayuz → `araclar`).
 * No word is written in this file, and no tool is named in it: one generic screen draws any tool from its
 * definition (fields in, numbers and keys out) and the pack's text.
 *
 * THE GATE is lib/ulke/araclar/paket.ts → hesabinAraci: the grid and the address ask the same function, so a tool
 * that is not on the account's grid does not open from its address either.
 *
 * NOTHING IS STORED AND NOTHING IS SENT. A tool works in the browser on what the doctor types; the result can be
 * copied, in the account's note language. No patient is attached and no request leaves the page.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Bilgi, Cerceve, Hata, tarihYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { AramaFormu } from './Bugun'
import { arayuz, araclarMetni, rolAdi, type AraclarMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { sayiYaz } from '@/lib/ulke/arayuz/sayi'
import { hesapSaatDilimi } from '@/lib/ulke/arayuz/bicim'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { alanAraligi, alanBirimi, kanonigeCevir, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { alanEtiketi, aracAra, aracOzeti, bicimli, hesabinAraci, hesabinAraclari, sayiMetni, type GorunurArac, type Yazici } from '@/lib/ulke/araclar/paket'
import type { AracAlani, AracGirdisi, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'
import { panoyaKopyala } from './pano'

/** The address of one tool. */
export const aracYolu = (anahtar: string): string => `${YOL.araclar}?arac=${encodeURIComponent(anahtar)}`

/** The pack's units, as the tools need them. */
export function birimOrtami(icerik: UlkeAraclari): BirimOrtami {
  const u = ulkePaketi().uygulama
  if (!u) throw new Error('[ulke/araclar] the pack has no application settings')
  return { birimler: u.birimler, lab: icerik.labBirimleri }
}

/** How this country writes a number, a day and a unit, in the form `dil`. */
export function yazici(icerik: UlkeAraclari, dil: string): Yazici {
  return { sayi: (d, o) => sayiYaz(d, o), tarih: (iso) => tarihYaz(iso), birim: (kod) => bicimli(icerik.birimler[kod], dil) }
}

// ───────────────────────── the grid ─────────────────────────

function Kutu({ x, dil }: { x: GorunurArac; dil: DilKodu }) {
  return (
    <li>
      <a className="uza-arac-kutu" href={aracYolu(x.tanim.anahtar)} data-arac={x.tanim.anahtar} data-kapsam={x.paket.roller === null ? 'temel' : 'rol'}>
        <span className="uza-arac-ad">{bicimli(x.paket.metin.ad, dil)}</span>
        <span className="uza-arac-aciklama">{bicimli(x.paket.metin.aciklama, dil)}</span>
      </a>
    </li>
  )
}

export function AraclarIzgarasi({ a, dil, icerik, rol, q }: { a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari; rol: string | null; q: string }) {
  const hepsi = hesabinAraclari(icerik, rol)
  const katla = ulkePaketi().uygulama?.aramaKatla
  const temel = aracAra(hepsi.temel, q, dil, katla), kendi = aracAra(hepsi.rol, q, dil, katla)
  const hicYok = hepsi.temel.length + hepsi.rol.length === 0
  const rolunAdi = rolAdi(rol, dil)
  return (
    <>
      <section className="uza-kart">
        <h1 className="uza-h1">{a.izgara.baslik}</h1>
        <p className="uza-aciklama">{a.izgara.aciklama}</p>
        {hicYok ? null : (
          <form className="uza-arama" action={YOL.araclar} method="get" role="search" style={{ marginTop: 16 }}>
            <label className="uza-etiket" htmlFor="uza-arac-ara">{a.izgara.ara}</label>
            <div className="uza-arama-satir">
              <input id="uza-arac-ara" name="q" type="search" defaultValue={q} placeholder={a.izgara.araOrnek} autoComplete="off" className="uza-girdi" />
            </div>
          </form>
        )}
      </section>
      {hicYok ? <p className="uza-bos">{a.izgara.bos}</p> : temel.length + kendi.length === 0 ? <p className="uza-bos" role="status">{a.izgara.sonucYok}</p> : null}
      {temel.length ? (
        <section className="uza-kart" data-grup="temel">
          <h2 className="uza-h2">{a.izgara.temel}</h2>
          <ul className="uza-arac-izgara">{temel.map((x) => <Kutu key={x.tanim.anahtar} x={x} dil={dil} />)}</ul>
        </section>
      ) : null}
      {kendi.length && rolunAdi ? (
        <section className="uza-kart" data-grup="rol">
          <h2 className="uza-h2">{yerine(a.izgara.rol, rolunAdi)}</h2>
          <ul className="uza-arac-izgara">{kendi.map((x) => <Kutu key={x.tanim.anahtar} x={x} dil={dil} />)}</ul>
        </section>
      ) : null}
    </>
  )
}

// ───────────────────────── one tool ─────────────────────────

/** What is typed, as it is typed: a field's text, an option key, a tick. */
export type HamGirdi = Readonly<Record<string, string | boolean>>

/** What was typed → what the tool's arithmetic takes. A number out of its range, or not a number, is "nothing". */
export function girdiyiCoz(alanlar: readonly AracAlani[], ham: HamGirdi, o: BirimOrtami): AracGirdisi {
  const g: Record<string, number | string | boolean | null> = {}
  for (const a of alanlar) {
    const v = ham[a.anahtar]
    if (a.tur === 'isaret') { g[a.anahtar] = v === true; continue }
    if (a.tur === 'secim') { g[a.anahtar] = typeof v === 'string' && (a.secenekler ?? []).includes(v) ? v : null; continue }
    if (a.tur === 'tarih') { g[a.anahtar] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; continue }
    const metin = typeof v === 'string' ? v.trim().replace(',', '.') : ''
    const n = metin === '' ? NaN : Number(metin)
    const aralik = alanAraligi(a, o)
    if (!Number.isFinite(n) || (a.tam && !Number.isInteger(n)) || (aralik && (n < aralik.enAz || n > aralik.enCok))) { g[a.anahtar] = null; continue }
    g[a.anahtar] = kanonigeCevir(a, n, o)
  }
  return g
}

function Alan({ x, alan, dil, a, ham, degistir, o, y }: { x: GorunurArac; alan: AracAlani; dil: DilKodu; a: AraclarMetni; ham: HamGirdi; degistir: (k: string, v: string | boolean) => void; o: BirimOrtami; y: Yazici }) {
  const etiket = alanEtiketi(x, alan.anahtar, dil, a)
  const id = `uza-arac-${alan.anahtar}`
  const v = ham[alan.anahtar]
  if (alan.tur === 'isaret') {
    return <label className="uza-onay" data-alan={alan.anahtar}><input type="checkbox" checked={v === true} onChange={(e) => degistir(alan.anahtar, e.target.checked)} /><span>{etiket}</span></label>
  }
  if (alan.tur === 'secim' || alan.tur === 'puan') {
    const secenekler = alan.tur === 'secim' ? (alan.secenekler ?? []).map((k) => ({ k, ad: bicimli(x.paket.metin.secenekler?.[alan.anahtar]?.[k], dil) })) : Array.from({ length: (alan.enCok ?? 0) - (alan.enAz ?? 0) + 1 }, (_, i) => String((alan.enAz ?? 0) + i)).map((k) => ({ k, ad: k }))
    return (
      <fieldset className="uza-secim" data-alan={alan.anahtar}>
        <legend className="uza-etiket">{etiket}</legend>
        <div className="uza-secim-satir">
          {secenekler.map((s) => (
            <label key={s.k} className="uza-secenek" data-secili={v === s.k ? 'evet' : undefined}>
              <input type="radio" name={id} value={s.k} checked={v === s.k} onChange={() => degistir(alan.anahtar, s.k)} />
              <span>{s.ad}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
  if (alan.tur === 'tarih') {
    return <div className="uza-alan" data-alan={alan.anahtar}><label className="uza-etiket" htmlFor={id}>{etiket}</label><input id={id} type="date" className="uza-girdi" value={typeof v === 'string' ? v : ''} onChange={(e) => degistir(alan.anahtar, e.target.value)} /></div>
  }
  const birim = alanBirimi(alan, o)
  const aralik = alanAraligi(alan, o)
  return (
    <div className="uza-alan" data-alan={alan.anahtar}>
      <label className="uza-etiket" htmlFor={id}>{etiket}{birim ? <small> ({y.birim(birim)})</small> : null}</label>
      <input id={id} type="text" inputMode="decimal" autoComplete="off" className="uza-girdi" value={typeof v === 'string' ? v : ''} onChange={(e) => degistir(alan.anahtar, e.target.value)} />
      {aralik ? <p className="uza-ipucu">{yerine(a.arac.aralik, y.sayi(aralik.enAz, Number.isInteger(aralik.enAz) ? 0 : 1), y.sayi(aralik.enCok, Number.isInteger(aralik.enCok) ? 0 : 1))}</p> : null}
    </div>
  )
}

/** A tool with fields: what is asked, what comes out, and the summary to copy. Pure given `ham`; the state is the caller's. */
export function AracGorunumu({ x, a, dil, notDili, icerik, ham, degistir, temizle, bugun, kopya, kopyalaTikla }: {
  x: GorunurArac; a: AraclarMetni; dil: DilKodu; notDili: DilKodu; icerik: UlkeAraclari
  ham: HamGirdi; degistir: (k: string, v: string | boolean) => void; temizle: () => void
  /** Today in the account's time zone, YYYY-MM-DD. */
  bugun: string
  kopya: 'yok' | 'tamam' | 'hata'; kopyalaTikla: (metin: string) => void
}) {
  const o = birimOrtami(icerik)
  const y = yazici(icerik, dil)
  const g = girdiyiCoz(x.tanim.alanlar, ham, o)
  const sonuc = x.tanim.hesapla(g, { bugun })
  const t = x.paket.metin
  // The summary is written in the account's NOTE language: it is pasted into a note.
  const ozet = aracOzeti(x, hamdanGosterilen(x.tanim.alanlar, ham, g), sonuc, notDili, araclarMetni(notDili), yazici(icerik, notDili), o)
  return (
    <>
      <section className="uza-kart" data-bolum="girdiler">
        <h2 className="uza-h2">{a.arac.girdiler}</h2>
        <div className="uza-form" style={{ marginTop: 0 }}>
          {x.tanim.alanlar.map((alan) => <Alan key={alan.anahtar} x={x} alan={alan} dil={dil} a={a} ham={ham} degistir={degistir} o={o} y={y} />)}
        </div>
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={temizle}>{a.arac.temizle}</button></div>
      </section>
      <section className="uza-kart" data-bolum="sonuc" aria-live="polite">
        <h2 className="uza-h2">{a.arac.sonuc}</h2>
        {!sonuc.tamam ? <p className="uza-bos" data-sonuc="eksik">{a.arac.eksik}</p> : (
          <>
            {sonuc.sayilar.length ? (
              <dl className="uza-bilgiler" style={{ marginTop: 0 }}>
                {sonuc.sayilar.map((s) => <React.Fragment key={s.anahtar}><dt>{bicimli(t.sayilar?.[s.anahtar], dil)}</dt><dd data-sayi={s.anahtar}>{sayiMetni(s, a, y)}</dd></React.Fragment>)}
              </dl>
            ) : null}
            {sonuc.bant ? <p className="uza-arac-bant" data-bant={sonuc.bant}>{bicimli(t.bantlar?.[sonuc.bant], dil)}</p> : null}
            {sonuc.uyarilar.length ? <ul className="uza-arac-uyarilar">{sonuc.uyarilar.map((u) => <li key={u} data-uyari={u}>{bicimli(t.uyarilar?.[u], dil)}</li>)}</ul> : null}
            {sonuc.tarihler.length ? (
              <dl className="uza-bilgiler">
                {sonuc.tarihler.map((d) => <React.Fragment key={d.anahtar}><dt>{bicimli(t.tarihler?.[d.anahtar], dil)}</dt><dd data-tarih={d.anahtar}>{y.tarih(d.tarih)}</dd></React.Fragment>)}
              </dl>
            ) : null}
            <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => kopyalaTikla(ozet)} data-eylem="kopyala">{a.arac.kopyala}</button></div>
            <Bilgi>{kopya === 'tamam' ? a.arac.kopyalandi : null}</Bilgi>
            <Hata>{kopya === 'hata' ? a.arac.kopyalanamadi : null}</Hata>
          </>
        )}
        <p className="uza-ipucu" data-not>{bicimli(t.not, dil)}</p>
        {x.tanim.kaynak ? <p className="uza-ipucu" data-kaynak>{yerine(a.arac.kaynak, x.tanim.kaynak)}</p> : null}
        <p className="uza-ipucu">{a.arac.saklanmaz}</p>
      </section>
    </>
  )
}

/** For the summary: a number is repeated as the doctor typed it (their unit), not in the unit the arithmetic used. */
function hamdanGosterilen(alanlar: readonly AracAlani[], ham: HamGirdi, g: AracGirdisi): AracGirdisi {
  const cikti: Record<string, number | string | boolean | null> = { ...g }
  for (const a of alanlar) if ((a.tur === 'sayi' || a.tur === 'puan') && g[a.anahtar] !== null) { const v = ham[a.anahtar]; cikti[a.anahtar] = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : null }
  return cikti
}

/** The patient portal's tile: access is given from a patient's file, so the tool finds the patient. */
export function HastaPortaliAraci({ a, m }: { a: AraclarMetni; m: UygulamaMetni }) {
  return (
    <section className="uza-kart" data-bolum="hasta-portali">
      <p className="uza-aciklama" style={{ marginTop: 0, marginBottom: 16 }}>{a.portal.nasil}</p>
      <AramaFormu m={m} />
      <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{m.bugun.tumHastalar}</a></p>
    </section>
  )
}

export function AracBasligi({ x, a, dil }: { x: GorunurArac; a: AraclarMetni; dil: DilKodu }) {
  return (
    <section className="uza-karsilama">
      <p className="uza-ust-yazi"><a className="uza-baglanti" href={YOL.araclar} data-eylem="araclara-don">{a.arac.geri}</a></p>
      <h1 className="uza-h1">{bicimli(x.paket.metin.ad, dil)}</h1>
      <p className="uza-aciklama">{bicimli(x.paket.metin.aciklama, dil)}</p>
    </section>
  )
}

function AracEkrani({ x, a, m, dil, notDili, icerik }: { x: GorunurArac; a: AraclarMetni; m: UygulamaMetni; dil: DilKodu; notDili: DilKodu; icerik: UlkeAraclari }) {
  const [ham, setHam] = useState<HamGirdi>({})
  const [kopya, setKopya] = useState<'yok' | 'tamam' | 'hata'>('yok')
  const bugun = useMemo(() => ulkeGunu(new Date(), hesapSaatDilimi()), [])
  return (
    <>
      <AracBasligi x={x} a={a} dil={dil} />
      {x.tanim.ekran === 'hastaPortali' ? <HastaPortaliAraci a={a} m={m} /> : (
        <AracGorunumu x={x} a={a} dil={dil} notDili={notDili} icerik={icerik} ham={ham} bugun={bugun} kopya={kopya}
          degistir={(k, v) => { setKopya('yok'); setHam((eski) => ({ ...eski, [k]: v })) }}
          temizle={() => { setKopya('yok'); setHam({}) }}
          kopyalaTikla={(metin) => { void panoyaKopyala(metin).then((tamam) => setKopya(tamam ? 'tamam' : 'hata')) }} />
      )}
    </>
  )
}

export default function Araclar() {
  const u = useUygulama('araclar')
  const [adres, setAdres] = useState<{ arac: string | null; q: string } | null>(null)
  useEffect(() => { const p = new URLSearchParams(window.location.search); setAdres({ arac: p.get('arac'), q: p.get('q') ?? '' }) }, [])
  const icerik = arayuz().araclar
  if (!u.hesap || !adres || !icerik) return <Yukleniyor m={u.m} dil={u.dil} />
  const a = araclarMetni(u.dil)
  const x = adres.arac ? hesabinAraci(icerik, u.hesap.rol, adres.arac) : null
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="araclar" cikis={u.cikis}>
      {x ? <AracEkrani x={x} a={a} m={u.m} dil={u.dil} notDili={u.hesap.notDili} icerik={icerik} /> : (
        <>
          {/* An address that names a tool this account does not have: said once, above the grid it does have. */}
          <Hata>{adres.arac ? a.arac.yok : null}</Hata>
          <AraclarIzgarasi a={a} dil={u.dil} icerik={icerik} rol={u.hesap.rol} q={adres.q} />
        </>
      )}
    </Cerceve>
  )
}
