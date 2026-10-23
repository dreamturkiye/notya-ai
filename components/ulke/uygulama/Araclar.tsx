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
 *
 * NOTYA-ULKE-OZEL-01 — what a country may add, drawn here from the pack and nothing else:
 *   - A UNIT THE DOCTOR CHOOSES, where the pack accepts several for a laboratory value: nothing is pre-selected, and
 *     a number without its unit gives no result (the pack's sentence says so under the field);
 *   - WHO THE TOOL IS FOR, where the pack limits it by the patient's age or sex: opened for a patient it is not for,
 *     the tool shows that sentence and no field; such a tool is not on that patient's grid at all;
 *   - A RIGHTS HOLDER'S NOTICE under every result of a tool that has one;
 *   - A LINK-OUT TILE: the pack's words and one link to an official calculator elsewhere. The address is fixed in the
 *     pack; nothing of the patient is put into it, it opens in a tab of its own and tells that site nothing of where
 *     the doctor came from.
 */
import { KayitSistemiKarti, ReferansAramalari, ReferansBolumleri } from './ReferansKarti'
import React, { useEffect, useMemo, useState } from 'react'
import { Bilgi, Cerceve, Hata, useUygulama, YOL, Yukleniyor, type Uygulama } from './Kabuk'
import { AramaFormu } from './Bugun'
import { aracRozeti } from '@/lib/ulke/araclar/gorunum'
import { arayuz, araclarMetni, girdiMetni, rolAdi, type AraclarMetni, type GirdiMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { hesapSaatDilimi } from '@/lib/ulke/arayuz/bicim'
import { Ipucu } from './Ipucu'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { alanAraligi, alanBirimi, alanBirimleri, birimAnahtari, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { birimiSecilmeyenler, girdiyiCoz, hamdanGosterilen, okunamayanAlanlar, type HamGirdi } from '@/lib/ulke/araclar/girdi'
import { alanEtiketi, aracAra, aracCalistir, aracGorunurMu, aracinKapisi, aracOzeti, bicimli, hesabinAraci, hesabinAraclari, lisansBildirimi, paketinTanimi, sayiMetni, type GorunurArac, type Yazici } from '@/lib/ulke/araclar/paket'
import type { AracAlani, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { alanVarMi, METIN_UZUNLUGU } from '@/lib/ulke/araclar/yardimci'
import type { DilKodu } from '@/lib/ulke/tipler'
import { panoyaKopyala } from './pano'
import { aracYolu, araclarYolu, birimOrtami, yazici } from './aracOrtak'
import { AracKayitKarti, TakipPaneli, useAracHastasi, useAracKaydi, type AracHastasi } from './AracKayitlari'
import { Sablonlarim } from './Sablonlarim'
import { Konsultasyonlar } from './Konsultasyonlar'
import { SayiGirisi } from '../girdi/SayiGirisi'
import { TarihGirisi } from '../girdi/TarihGirisi'

// What was typed → what a tool takes: one function for the screen and for the server (lib/ulke/araclar/girdi.ts).
export { girdiyiCoz, type HamGirdi } from '@/lib/ulke/araclar/girdi'

export { aracYolu, araclarYolu, birimOrtami, yazici } from './aracOrtak'

// ───────────────────────── the grid ─────────────────────────

function Kutu({ x, dil, hastaId, duvar }: { x: GorunurArac; dil: DilKodu; hastaId?: string | null; duvar?: boolean }) {
  // Türkiye's own badge for the same job (lib/ulke/araclar/gorunum.ts): stripe and round badge share its colour.
  const rozet = aracRozeti(x.tanim.anahtar)
  const ic = (
    <>
      <span className="uza-arac-serit" aria-hidden="true" style={{ backgroundColor: rozet.renk }} />
      <span className="uza-arac-ust">
        <span className="uza-arac-daire" aria-hidden="true" style={{ backgroundColor: rozet.renk }}>{rozet.simge}</span>
        <span className="uza-arac-ad">{bicimli(x.paket.metin.ad, dil)}</span>
        <span className="uza-arac-ok" aria-hidden="true" />
      </span>
      <span className="uza-arac-aciklama">{bicimli(x.paket.metin.aciklama, dil)}</span>
    </>
  )
  return (
    <li>
      {duvar ? <span className="uza-arac-kutu" data-duvar="evet">{ic}</span> : (
        <a className="uza-arac-kutu" href={aracYolu(x.tanim.anahtar, hastaId)} data-arac={x.tanim.anahtar} data-kapsam={x.paket.roller === null ? 'temel' : 'rol'} data-tur={x.tanim.tur === 'baglanti' ? 'baglanti' : undefined}>{ic}</a>
      )}
    </li>
  )
}

type IzgaraSatiri = { x: GorunurArac; duvar: boolean }

/** Open tools keep their link. A pack tool this role may see, but that the licence keeps shut, keeps the same slot as a wall. */
function izgaraSatirlari(icerik: UlkeAraclari, rol: string | null, hasta?: AracHastasi | null, bugun?: string): { temel: IzgaraSatiri[]; rol: IzgaraSatiri[] } {
  const gorunen = hesabinAraclari(icerik, rol, hasta && bugun ? { hasta, bugun } : null)
  const acik = new Set([...gorunen.temel, ...gorunen.rol].map((x) => x.tanim.anahtar))
  const temel: IzgaraSatiri[] = []
  const kendi: IzgaraSatiri[] = []
  for (const p of icerik.araclar ?? []) {
    if (!aracGorunurMu(p, rol)) continue
    const tanim = paketinTanimi(icerik, p)
    if (!tanim) continue
    const x = { tanim, paket: p }
    if (hasta && bugun && aracinKapisi(x, hasta, bugun) === 'degil') continue
    ;(p.roller === null ? temel : kendi).push({ x, duvar: !acik.has(p.anahtar) })
  }
  return { temel, rol: kendi }
}

export function AraclarIzgarasi({ a, dil, icerik, rol, q, hasta, bugun }: {
  a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari; rol: string | null; q: string
  /** The patient the tools were opened for (from that patient's file): every tile carries the patient to its tool. */
  hasta?: AracHastasi | null
  /** Today in the account's time zone. With a patient: a tool that is not for that patient's age or sex is left out. */
  bugun?: string
}) {
  const ham = izgaraSatirlari(icerik, rol, hasta, bugun)
  const katla = ulkePaketi().uygulama?.aramaKatla
  const daralt = (liste: IzgaraSatiri[]) => {
    const acik = new Set(aracAra(liste.filter((s) => !s.duvar).map((s) => s.x), q, dil, katla).map((x) => x.tanim.anahtar))
    const kapali = new Set(aracAra(liste.filter((s) => s.duvar).map((s) => s.x), q, dil, katla).map((x) => x.tanim.anahtar))
    return liste.filter((s) => acik.has(s.x.tanim.anahtar) || kapali.has(s.x.tanim.anahtar))
  }
  const [filtre, setFiltre] = useState<'hepsi' | 'temel' | 'rol'>('hepsi')
  const temel = daralt(ham.temel)
  const kendi = daralt(ham.rol)
  const gosterTemel = filtre !== 'rol' ? temel : []
  const gosterRol = filtre !== 'temel' ? kendi : []
  const hicYok = ham.temel.length + ham.rol.length === 0
  const rolunAdi = rolAdi(rol, dil)
  const toplam = ham.temel.length + ham.rol.length
  const acikRol = ham.rol.some((s) => !s.duvar)
  return (
    <>
      <section className="yg-arac-baslik">
        <p className="yg-kicker">{a.kabuk.araclar}</p>
        <h1 className="uza-h1">{a.izgara.baslik}</h1>
        {hicYok ? null : <p className="yg-arac-say">{rolunAdi ? <>{rolunAdi}{'\u00b7'}{toplam}</> : toplam}</p>}
        {hasta ? <p className="uza-ipucu" data-alan="arac-hastasi" data-hasta={hasta.id}><a className="uza-baglanti" href={`${YOL.hasta}?id=${hasta.id}`}>{yerine(a.kayit.hastaIcin, hasta.ad)}</a></p> : null}
        {hicYok || ham.temel.length === 0 || ham.rol.length === 0 ? null : (
          <div className="yg-arac-cipler">
            <button type="button" className="yg-arac-cip" data-aktif={filtre === 'hepsi' ? 'evet' : undefined} onClick={() => setFiltre('hepsi')}>{a.izgara.baslik} {toplam}</button>
            <button type="button" className="yg-arac-cip" data-filtre="temel" data-aktif={filtre === 'temel' ? 'evet' : undefined} onClick={() => setFiltre('temel')}>{a.izgara.temel} {ham.temel.length}</button>
            {rolunAdi ? <button type="button" className="yg-arac-cip" data-filtre="rol" data-aktif={filtre === 'rol' ? 'evet' : undefined} onClick={() => setFiltre('rol')}>{yerine(a.izgara.rol, rolunAdi)} {ham.rol.length}</button> : null}
          </div>
        )}
        {hicYok ? null : (
          <form className="uza-arama yg-arac-ara-gizli" action={YOL.araclar} method="get" role="search">
            <label className="uza-etiket" htmlFor="uza-arac-ara">{a.izgara.ara}</label>
            <div className="uza-arama-satir">
              {hasta ? <input type="hidden" name="hasta" value={hasta.id} /> : null}
              <input id="uza-arac-ara" name="q" type="search" defaultValue={q} placeholder={a.izgara.araOrnek} autoComplete="off" className="uza-girdi" />
            </div>
          </form>
        )}
      </section>
      {hicYok ? <p className="uza-bos">{a.izgara.bos}</p> : gosterTemel.length + gosterRol.length === 0 ? <p className="uza-bos" role="status">{a.izgara.sonucYok}</p> : null}
      {gosterTemel.length ? (
        <section data-grup="temel">
          <div className="yg-arac-grup"><span className="yg-arac-cubuk" data-grup="temel" /><h2 className="uza-h2">{a.izgara.temel}</h2></div>
          <ul className="uza-arac-izgara">{gosterTemel.map((s) => <Kutu key={s.x.tanim.anahtar} x={s.x} dil={dil} hastaId={hasta?.id} duvar={s.duvar} />)}</ul>
        </section>
      ) : null}
      {gosterRol.length && rolunAdi ? (
        <section data-grup={acikRol ? 'rol' : undefined} data-duvar-grup={acikRol ? undefined : 'rol'}>
          <div className="yg-arac-grup"><span className="yg-arac-cubuk yg-arac-cubuk-rol" /><h2 className="uza-h2">{yerine(a.izgara.rol, rolunAdi)}</h2></div>
          <ul className="uza-arac-izgara">{gosterRol.map((s) => <Kutu key={s.x.tanim.anahtar} x={s.x} dil={dil} hastaId={hasta?.id} duvar={s.duvar} />)}</ul>
        </section>
      ) : null}
    </>
  )
}

// ───────────────────────── one tool ─────────────────────────

function Alan({ x, alan, dil, a, gm, ham, degistir, o, y, birimEksik }: { x: GorunurArac; alan: AracAlani; dil: DilKodu; a: AraclarMetni; gm: GirdiMetni; ham: HamGirdi; degistir: (k: string, v: string | boolean) => void; o: BirimOrtami; y: Yazici; /** A number is typed here and its unit is not chosen yet. */ birimEksik?: boolean }) {
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
  if (alan.tur === 'metin') {
    return <div className="uza-alan" data-alan={alan.anahtar}><label className="uza-etiket" htmlFor={id}>{etiket}</label><input id={id} type="text" maxLength={METIN_UZUNLUGU} autoComplete="off" className="uza-girdi" value={typeof v === 'string' ? v : ''} onChange={(e) => degistir(alan.anahtar, e.target.value)} /></div>
  }
  if (alan.tur === 'tarih') {
    // The kit's own date field, in the pack's order: never the browser's (NOTYA-ULKE-DENETIM-01b).
    return <div className="uza-alan" data-alan={alan.anahtar}><TarihGirisi id={id} etiket={etiket} deger={typeof v === 'string' ? v : ''} degistir={(gun) => degistir(alan.anahtar, gun)} m={gm} /></div>
  }
  // WHERE THE PACK ACCEPTS SEVERAL UNITS, the doctor chooses one: nothing is selected for them (NOTYA-ULKE-OZEL-01).
  const birimleri = alanBirimleri(alan, o)
  const secilen = ham[birimAnahtari(alan.anahtar)]
  const birim = alanBirimi(alan, o, secilen)
  const aralik = alanAraligi(alan, o, secilen)
  return (
    <div className="uza-alan" data-alan={alan.anahtar}>
      <label className="uza-etiket" htmlFor={id}>{etiket}{birim ? <small> ({y.birim(birim)})</small> : null}</label>
      {/* Read by the pack's own number rules; what cannot be read without guessing is refused, with the pack's sentence (NOTYA-ULKE-DENETIM-01a). */}
      <SayiGirisi id={id} deger={typeof v === 'string' ? v : ''} degistir={(metin) => degistir(alan.anahtar, metin)} m={gm} kural={o.sayi} />
      {birimleri.length > 1 ? (
        <div className="uza-secim-satir" role="radiogroup" aria-label={etiket} data-birim-secimi={alan.anahtar}>
          {birimleri.map((b) => (
            <label key={b} className="uza-secenek" data-secili={secilen === b ? 'evet' : undefined}>
              <input type="radio" name={`${id}-birim`} value={b} checked={secilen === b} onChange={() => degistir(birimAnahtari(alan.anahtar), b)} />
              <span>{y.birim(b)}</span>
            </label>
          ))}
        </div>
      ) : null}
      {birimEksik ? <div data-birim-eksik={alan.anahtar}><Hata>{a.arac.birimSec ?? null}</Hata></div> : null}
      {aralik ? <p className="uza-ipucu">{yerine(a.arac.aralik, y.sayi(aralik.enAz, Number.isInteger(aralik.enAz) ? 0 : 1), y.sayi(aralik.enCok, Number.isInteger(aralik.enCok) ? 0 : 1))}</p> : null}
    </div>
  )
}

/** A tool with fields: what is asked, what comes out, and the summary to copy. Pure given `ham`; the state is the caller's. */
export function AracGorunumu({ x, a, dil, notDili, icerik, ham, degistir, temizle, bugun, kopya, kopyalaTikla, kayit }: {
  x: GorunurArac; a: AraclarMetni; dil: DilKodu; notDili: DilKodu; icerik: UlkeAraclari
  ham: HamGirdi; degistir: (k: string, v: string | boolean) => void; temizle: () => void
  /** Today in the account's time zone, YYYY-MM-DD. */
  bugun: string
  kopya: 'yok' | 'tamam' | 'hata'; kopyalaTikla: (metin: string) => void
  /** Where the tool was opened for a patient: the part that keeps the result, told whether there is one now. */
  kayit?: (tamam: boolean) => React.ReactNode
}) {
  const o = birimOrtami(icerik)
  const y = yazici(icerik, dil)
  const g = girdiyiCoz(x.tanim.alanlar, ham, o)
  // The one way a tool is run, here and on the server: the country's numbers and tables in the unit the arithmetic uses.
  const hesap = aracCalistir(x, g, bugun, icerik)
  const birimsiz = birimiSecilmeyenler(x.tanim.alanlar, ham, g, o)
  const bildirim = lisansBildirimi(x, dil)
  const kapi = bicimli(x.paket.metin.hastaKapisi, dil)
  // NO RESULT WHILE A FIELD HOLDS WHAT COULD NOT BE READ (NOTYA-ULKE-DENETIM-01a) — also an optional field: a limit
  // that was typed and not read is never worked with as "no limit". The field itself says what to type again.
  const sonuc = okunamayanAlanlar(x.tanim.alanlar, ham, g, o).length ? { ...hesap, tamam: false } : hesap
  const t = x.paket.metin
  // The summary is written in the account's NOTE language: it is pasted into a note.
  const ozet = aracOzeti(x, hamdanGosterilen(x.tanim.alanlar, ham, g, o), sonuc, notDili, araclarMetni(notDili), yazici(icerik, notDili), o)
  const gm = girdiMetni(dil)
  return (
    <>
      <section className="uza-kart" data-bolum="girdiler">
        <h2 className="uza-h2">{a.arac.girdiler}</h2>
        {/* Who the tool is for, where the pack limits it by the patient: said before anything is typed. */}
        {x.paket.hasta && kapi ? <p className="uza-ipucu" data-hasta-kapisi>{kapi}</p> : null}
        <div className="uza-form" style={{ marginTop: 0 }}>
          {x.tanim.alanlar.filter((alan) => alanVarMi(alan, g)).map((alan) => <Alan key={alan.anahtar} x={x} alan={alan} dil={dil} a={a} gm={gm} ham={ham} degistir={degistir} o={o} y={y} birimEksik={birimsiz.includes(alan.anahtar)} />)}
        </div>
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={temizle}>{a.arac.temizle}</button></div>
      </section>
      <section className="uza-kart" data-bolum="sonuc" aria-live="polite">
        <h2 className="uza-h2">{a.arac.sonuc}</h2>
        {!sonuc.tamam ? <p className="uza-bos" data-sonuc="eksik">{a.arac.eksik}</p> : (
          <>
            {sonuc.sayilar.length ? (
              <dl className="uza-bilgiler" style={{ marginTop: 0 }}>
                {sonuc.sayilar.map((s) => <React.Fragment key={s.anahtar}><dt>{bicimli(t.sayilar?.[s.anahtar], dil)}</dt><dd data-sayi={s.anahtar}>{sayiMetni(s, a, y, o)}</dd></React.Fragment>)}
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
        {/* The rights holder's notice, where the tool has one: under every result. */}
        {bildirim ? <p className="uza-ipucu" data-lisans-bildirimi>{bildirim}</p> : null}
        {kayit ? null : <><p className="uza-ipucu">{a.arac.saklanmaz}</p><p className="uza-ipucu" data-alan="kayit-hastasiz">{a.kayit.hastasiz}</p></>}
      </section>
      {kayit ? kayit(sonuc.tamam) : null}
    </>
  )
}

/**
 * A LINK-OUT TILE (NOTYA-ULKE-OZEL-01): the pack's words, the rights holder's notice where there is one, and ONE link
 * to an official calculator elsewhere. The address is the pack's, fixed; nothing typed here and nothing of a patient
 * goes into it. It opens in a tab of its own, and that site is not told where the doctor came from.
 */
export function DisBaglantiAraci({ x, dil }: { x: GorunurArac; dil: DilKodu }) {
  const bildirim = lisansBildirimi(x, dil)
  return (
    <section className="uza-kart" data-bolum="dis-baglanti">
      <div className="uza-eylemler" style={{ marginTop: 0 }}>
        <a className="uza-dugme" href={x.paket.baglanti?.adres} target="_blank" rel="noopener noreferrer external" referrerPolicy="no-referrer" data-eylem="dis-baglanti">{bicimli(x.paket.metin.baglanti, dil)}</a>
      </div>
      <p className="uza-ipucu" data-not>{bicimli(x.paket.metin.not, dil)}</p>
      {bildirim ? <p className="uza-ipucu" data-lisans-bildirimi>{bildirim}</p> : null}
    </section>
  )
}

/** A tool opened for a patient it is not for (the pack's limit on age or sex): the pack's sentence, and no field. */
export function HastaKapisiKapali({ x, dil }: { x: GorunurArac; dil: DilKodu }) {
  return (
    <section className="uza-kart" data-bolum="hasta-kapisi" data-kapi="degil">
      <div data-hasta-kapisi><Hata>{bicimli(x.paket.metin.hastaKapisi, dil)}</Hata></div>
    </section>
  )
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

export function AracBasligi({ x, a, dil, hastaId }: { x: GorunurArac; a: AraclarMetni; dil: DilKodu; hastaId?: string | null }) {
  return (
    <section className="uza-karsilama">
      <p className="uza-ust-yazi"><a className="uza-baglanti" href={araclarYolu(hastaId)} data-eylem="araclara-don">{a.arac.geri}</a></p>
      <h1 className="uza-h1">{bicimli(x.paket.metin.ad, dil)}</h1>
      <p className="uza-aciklama">{bicimli(x.paket.metin.aciklama, dil)}</p>
    </section>
  )
}

function AracEkrani({ x, a, u, dil, notDili, icerik, hasta }: { x: GorunurArac; a: AraclarMetni; u: Uygulama; dil: DilKodu; notDili: DilKodu; icerik: UlkeAraclari; hasta: AracHastasi | null }) {
  const [ham, setHam] = useState<HamGirdi>({})
  const [kopya, setKopya] = useState<'yok' | 'tamam' | 'hata'>('yok')
  const bugun = useMemo(() => ulkeGunu(new Date(), hesapSaatDilimi()), [])
  const k = useAracKaydi(u.api, hasta?.id ?? null, x.tanim.anahtar)
  return (
    <>
      <AracBasligi x={x} a={a} dil={dil} hastaId={hasta?.id} />
      {x.tanim.ekran === 'hastaPortali' ? <HastaPortaliAraci a={a} m={u.m} /> : x.tanim.ekran === 'takipPaneli' ? <TakipPaneli u={u} a={a} icerik={icerik} /> : x.tanim.ekran === 'sablonlarim' ? <Sablonlarim u={u} /> : x.tanim.ekran === 'konsultasyonlar' ? <Konsultasyonlar u={u} /> : x.tanim.tur === 'baglanti' ? <DisBaglantiAraci x={x} dil={dil} /> : hasta && aracinKapisi(x, hasta, bugun) === 'degil' ? <HastaKapisiKapali x={x} dil={dil} /> : (
        <AracGorunumu x={x} a={a} dil={dil} notDili={notDili} icerik={icerik} ham={ham} bugun={bugun} kopya={kopya}
          degistir={(anahtar, v) => { setKopya('yok'); k.degisti(); setHam((eski) => ({ ...eski, [anahtar]: v })) }}
          temizle={() => { setKopya('yok'); k.degisti(); setHam({}) }}
          kopyalaTikla={(metin) => { void panoyaKopyala(metin).then((tamam) => setKopya(tamam ? 'tamam' : 'hata')) }}
          kayit={hasta ? (tamam) => <AracKayitKarti a={a} g={u.m.girdi} hasta={hasta} tamam={tamam} takip={k.takip} takipDegistir={k.takipDegistir} kaydet={() => k.kaydet(ham)} durum={k.durum} /> : undefined} />
      )}
    </>
  )
}

export default function Araclar() {
  const u = useUygulama('araclar')
  const [adres, setAdres] = useState<{ arac: string | null; q: string; hasta: string | null } | null>(null)
  useEffect(() => { const p = new URLSearchParams(window.location.search); setAdres({ arac: p.get('arac'), q: p.get('q') ?? '', hasta: p.get('hasta') }) }, [])
  // The patient the tools were opened for, proven this account's own by the server before anything is offered for them.
  const h = useAracHastasi(u.api, Boolean(u.hesap && adres), adres?.hasta)
  const icerik = arayuz().araclar
  if (!u.hesap || !adres || !icerik || h.durum === 'yukleniyor') return <Yukleniyor m={u.m} dil={u.dil} />
  const a = araclarMetni(u.dil)
  const x = adres.arac ? hesabinAraci(icerik, u.hesap.rol, adres.arac) : null
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="araclar" cikis={u.cikis}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 8px' }}><Ipucu m={u.m} bolum="araclar" /></div>
      <Hata>{h.durum === 'bulunamadi' ? a.kayit.hastaBulunamadi : null}</Hata>
      {/* AU-BETA-01: official-site lookups, reference links and the record-system stub, where the pack brings them. */}
      {!x ? <><ReferansAramalari /><ReferansBolumleri /><KayitSistemiKarti /></> : null}
      {x ? <AracEkrani x={x} a={a} u={u} dil={u.dil} notDili={u.hesap.notDili} icerik={icerik} hasta={h.hasta} /> : (
        <>
          {/* An address that names a tool this account does not have: said once, above the grid it does have. */}
          <Hata>{adres.arac ? a.arac.yok : null}</Hata>
          <AraclarIzgarasi a={a} dil={u.dil} icerik={icerik} rol={u.hesap.rol} q={adres.q} hasta={h.hasta} bugun={ulkeGunu(new Date(), hesapSaatDilimi())} />
        </>
      )}
    </Cerceve>
  )
}
