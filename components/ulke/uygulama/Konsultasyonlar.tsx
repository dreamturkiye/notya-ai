'use client'

/**
 * NOTYA-ULKE-MESAJ-01 — CONSULTATION BETWEEN DOCTORS of the same country: the tile's screen (the account's own
 * consultation code, what it was asked, what it asked), the card on a patient's file where a consultation is asked,
 * and the line on the home screen that says how many wait for an answer.
 *
 * WHAT THE CONSULTED DOCTOR IS SHOWN: who asked, the question, and THE COPY that was shared — one approved note or
 * its summary for the patient, as it was when the consultation was asked. No patient name, no link to a file, nothing
 * else: the server's answer holds none of it (lib/ulke/konsultasyon/sabitler.ts → GelenKonsultasyon), and this screen
 * says so above the list.
 *
 * NO DIRECTORY. A colleague is named by typing their code; the screen shows the name the code belongs to, and only
 * that one. Nothing here lists doctors.
 *
 * CONSENT. The form cannot be sent before the doctor ticks the pack's sentence; the server refuses it as well.
 * CLOSING and A NEW CODE are asked twice: what each does is shown BEFORE the confirmation.
 * AN ANSWER is sent once: the screen says so under the box, before it is sent.
 *
 * NOTHING IS SENT TO ANYBODY: the asking doctor tells the colleague. No model writes a question or an answer.
 * Every sentence is the pack's (konsultasyonMetni), in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Bilgi, Hata, Secim, tarihYaz, YOL, type Uygulama } from './Kabuk'
import { aracYolu } from './aracOrtak'
import { panoyaKopyala } from './pano'
import { alanAdi, alanTanimi, bolumAdi, konsultasyonMetni, NOT_BOLUMLERI, type KonsultasyonMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { CEVAP_AZAMI, KONSULTASYON_API, KONSULTASYON_ARACI, konsultasyonMetniAl, koduDuzelt, koduYaz, SORU_AZAMI, type GelenKonsultasyon, type GidenKonsultasyon, type Meslektas, type PaylasilabilirNot, type PaylasilanKopya, type PaylasimTuru } from '@/lib/ulke/konsultasyon/sabitler'
import type { DilKodu } from '@/lib/ulke/tipler'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'

const kisi = (x: Meslektas): string => [x.ad, x.rol].filter(Boolean).join(' · ')
/** The days a colleague can still read a consultation after it was closed: the pack's own period. */
export const kapanisSonrasiGun = (): number => ulkePaketi().uygulama?.konsultasyon?.kapanisSonrasiGun ?? 0

// ───────────────────────── the copy that was shared ─────────────────────────

/**
 * The read-only copy, as text. A note is drawn with the headings of the template it was written with and with the
 * fields the pack defines; a key the pack does not know is not drawn. Nothing here can be edited.
 */
export function PaylasilanKopyaGorunumu({ kopya, m, dil }: { kopya: PaylasilanKopya; m: UygulamaMetni; dil: DilKodu }) {
  if (kopya.tur === 'ozet') return <div className="uza-not-bolum" data-alan="konsultasyon-kopya" data-kopya="ozet" lang={kopya.dil}><p className="uza-not-metin">{kopya.metin}</p></div>
  return (
    <div data-alan="konsultasyon-kopya" data-kopya="not" lang={kopya.dil}>
      {NOT_BOLUMLERI.map((b) => (
        <div className="uza-not-bolum" key={b}>
          <h4 className="uza-alt-baslik">{bolumAdi(kopya.sablon, b, dil) ?? m.not[b]}</h4>
          <p className="uza-not-metin" data-bolum={b}>{kopya[b]}</p>
          {Object.entries(kopya.alanlar).filter(([k, v]) => v.trim() && alanTanimi(k)?.bolum === b && alanAdi(k, dil)).map(([k, v]) => (
            <div className="uza-alt-alan" key={k} data-alan-anahtar={k}>
              <h5 className="uza-alt-baslik">{alanAdi(k, dil)}</h5>
              <p className="uza-not-metin">{v}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const kopyaBasligi = (g: KonsultasyonMetni['gelen'], tur: PaylasimTuru, kopya: PaylasilanKopya | null): string => (tur === 'yok' || !kopya ? g.paylasimYok : yerine(tur === 'not' ? g.paylasimNot : g.paylasimOzet, tarihYaz(kopya.muayeneGunu)))

// ───────────────────────── the account's own code ─────────────────────────

export type KodBildirimi = 'kopyalandi' | 'kopyalanamadi' | 'yapilamadi' | null

export function KodKarti({ k, kod, bekliyor, bildirim, onaySoruluyor, uret, yenileSor, yenileVazgec, kopyala }: {
  k: KonsultasyonMetni['kod']
  /** undefined = not loaded yet; null = the account has no code. */
  kod: string | null | undefined
  bekliyor: boolean; bildirim: KodBildirimi
  /** true = the doctor is being asked to confirm a new code. */
  onaySoruluyor: boolean
  uret: () => void; yenileSor: () => void; yenileVazgec: () => void; kopyala: () => void
}) {
  return (
    <section className="uza-kart" data-bolum="konsultasyon-kodu" data-kod-durumu={kod === undefined ? undefined : kod ? 'var' : 'yok'}>
      <h2 className="uza-h2">{k.baslik}</h2>
      <p className="uza-aciklama">{k.aciklama}</p>
      {kod === undefined ? null : kod ? (
        <div className="uza-form" style={{ marginTop: 14 }}>
          <div className="uza-arama-satir">
            <input className="uza-girdi" readOnly value={koduYaz(kod)} aria-label={k.baslik} data-alan="konsultasyon-kodu" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kopyala} data-eylem="kod-kopyala">{k.kopyala}</button>
          </div>
          {onaySoruluyor ? (
            <div data-alan="kod-yenile-onay">
              <Hata>{k.yenileUyari}</Hata>
              <div className="uza-eylemler">
                <button type="button" className="uza-dugme uza-dugme-uyari uza-dugme-kucuk" disabled={bekliyor} onClick={uret} data-eylem="kod-yenile-onayla">{k.yenileOnay}</button>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={yenileVazgec} data-eylem="kod-yenile-vazgec">{k.vazgec}</button>
              </div>
            </div>
          ) : <div className="uza-eylemler" style={{ marginTop: 0 }}><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={yenileSor} data-eylem="kod-yenile">{k.yenile}</button></div>}
        </div>
      ) : (
        <>
          <p className="uza-bos" data-alan="kod-yok">{k.yok}</p>
          <div className="uza-eylemler"><button type="button" className="uza-dugme" disabled={bekliyor} onClick={uret} data-eylem="kod-uret">{k.uret}</button></div>
        </>
      )}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bilgi>{bildirim === 'kopyalandi' ? k.kopyalandi : null}</Bilgi>
        <Hata>{bildirim === 'kopyalanamadi' ? k.kopyalanamadi : bildirim === 'yapilamadi' ? k.yapilamadi : null}</Hata>
      </div>
    </section>
  )
}

// ───────────────────────── what this doctor was asked ─────────────────────────

export type CevapHatasi = { id: string; kod: 'bos' | 'uzun' | 'gonderilemedi' } | null

export function GelenListesi({ x, m, dil, liste, yuklenemedi, cevaplar, setCevap, gonder, bekleyen, hata }: {
  x: KonsultasyonMetni; m: UygulamaMetni; dil: DilKodu
  /** null = not loaded yet (or could not be read). */
  liste: readonly GelenKonsultasyon[] | null
  yuklenemedi?: boolean
  /** The answer being written, per consultation. */
  cevaplar: Readonly<Record<string, string>>; setCevap: (id: string, metin: string) => void
  gonder: (id: string) => void
  /** The consultation whose answer is being sent, or null. */
  bekleyen: string | null
  hata: CevapHatasi
}) {
  const g = x.gelen
  return (
    <section className="uza-kart" data-bolum="konsultasyon-gelen" data-adet={liste ? liste.length : undefined}>
      <h2 className="uza-h2">{g.baslik}</h2>
      <p className="uza-aciklama" data-alan="gelen-aciklama">{g.aciklama}</p>
      {!liste ? (yuklenemedi ? <div style={{ marginTop: 12 }}><Hata>{x.giden.yuklenemedi}</Hata></div> : null) : liste.length === 0 ? <p className="uza-bos" data-alan="gelen-bos">{g.bos}</p> : (
        <ul className="uza-liste uza-konsultasyonlar">
          {liste.map((c) => {
            const yazilabilir = !c.kapandi && !c.cevapAni
            const h = hata?.id === c.id ? hata.kod : null
            return (
              <li key={c.id} className="uza-konsultasyon" data-konsultasyon={c.id} data-durum={c.kapandi ? 'kapali' : c.cevapAni ? 'cevaplandi' : 'bekliyor'}>
                <div className="uza-baslik-satiri" style={{ marginBottom: 4 }}>
                  <span className="uza-liste-ad">{yerine(g.isteyen, kisi(c.isteyen))}<span className="uza-liste-alt">{tarihYaz(c.olusturuldu)}</span></span>
                  {!c.okundu ? <span className="uza-rozet" data-mesaj-durum="yeni">{g.yeni}</span> : c.kapandi ? <span className="uza-rozet">{g.kapali}</span> : null}
                </div>
                <h3 className="uza-alt-baslik">{g.soru}</h3>
                <p className="uza-not-metin" data-alan="konsultasyon-soru">{c.soru}</p>
                <h3 className="uza-alt-baslik">{g.paylasilan}</h3>
                <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="kopya-basligi">{kopyaBasligi(g, c.paylasimTuru, c.kopya)}</p>
                {c.kopya ? <><PaylasilanKopyaGorunumu kopya={c.kopya} m={m} dil={dil} /><p className="uza-ipucu">{g.kopyaNotu}</p></> : null}
                <p className="uza-ipucu" data-alan="okunabilir">{yerine(g.okunabilir, tarihYaz(c.okunabilir))}</p>
                {c.cevapAni ? (
                  <>
                    <h3 className="uza-alt-baslik">{yerine(g.cevabiniz, tarihYaz(c.cevapAni))}</h3>
                    <p className="uza-not-metin" data-alan="konsultasyon-cevap">{c.cevap ?? ''}</p>
                  </>
                ) : yazilabilir ? (
                  <form className="uza-form" data-alan="konsultasyon-cevap-formu" onSubmit={(e) => { e.preventDefault(); gonder(c.id) }} noValidate>
                    <div className="uza-alan">
                      <label className="uza-etiket" htmlFor={`uza-kc-${c.id}`}>{g.cevapEtiketi}</label>
                      <textarea id={`uza-kc-${c.id}`} name="cevap" className="uza-girdi" rows={5} maxLength={CEVAP_AZAMI} value={cevaplar[c.id] ?? ''} onChange={(e) => setCevap(c.id, e.target.value)} />
                    </div>
                    <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="cevap-uyari">{g.cevapUyari}</p>
                    <Hata>{h === 'bos' ? g.cevapBos : h === 'uzun' ? yerine(g.cokUzun, CEVAP_AZAMI) : h === 'gonderilemedi' ? g.cevapGonderilemedi : null}</Hata>
                    <div className="uza-eylemler" style={{ marginTop: 0 }}>
                      <button type="submit" className="uza-dugme" disabled={bekleyen !== null} data-eylem="konsultasyon-cevapla">{bekleyen === c.id ? g.cevapGonderiliyor : g.cevapGonder}</button>
                    </div>
                  </form>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ───────────────────────── what this doctor asked ─────────────────────────

export function GidenListesi({ x, m, dil, liste, yuklenemedi, bekliyor, hastaBaglantisi, kapatSorulan, kapatIste, kapatOnayla, kapatVazgec, kapatildi, hata, baslik }: {
  x: KonsultasyonMetni; m: UygulamaMetni; dil: DilKodu
  liste: readonly GidenKonsultasyon[] | null
  yuklenemedi?: boolean; bekliyor: boolean
  /** true = each row names its patient with a link to the file (the tile); false = the list is on that patient's own file. */
  hastaBaglantisi: boolean
  /** The consultation the doctor is being asked to confirm closing, or null. */
  kapatSorulan: string | null
  kapatIste: (id: string) => void; kapatOnayla: () => void; kapatVazgec: () => void
  kapatildi?: boolean; hata?: boolean
  /** false = no heading of its own (the list sits inside another card). */
  baslik?: boolean
}) {
  const g = x.giden
  const durum = (c: GidenKonsultasyon): string => (c.kapandi ? yerine(g.durumKapali, tarihYaz(c.kapandi), tarihYaz(c.erisimBitis ?? c.kapandi)) : c.suresiDoldu ? g.durumSuresiDoldu : yerine(g.durumAcik, tarihYaz(c.sonGecerlilik)))
  const govde = !liste ? (yuklenemedi ? <Hata>{g.yuklenemedi}</Hata> : null) : liste.length === 0 ? <p className="uza-bos" data-alan="giden-bos">{g.bos}</p> : (
    <ul className="uza-liste uza-konsultasyonlar">
      {liste.map((c) => (
        <li key={c.id} className="uza-konsultasyon" data-konsultasyon={c.id} data-durum={c.kapandi ? 'kapali' : c.suresiDoldu ? 'suresi-doldu' : 'acik'}>
          <div className="uza-baslik-satiri" style={{ marginBottom: 4 }}>
            <span className="uza-liste-ad">
              {hastaBaglantisi ? <a className="uza-baglanti" href={`${YOL.hasta}?id=${c.hastaId}`} data-konsultasyon-hastasi={c.hastaId}>{c.hastaAdi}</a> : null}
              <span className="uza-liste-alt">{yerine(g.meslektas, kisi(c.meslektas))} · {tarihYaz(c.olusturuldu)}</span>
            </span>
            <span className="uza-rozet" data-okundu={c.okundu ? 'evet' : 'hayir'}>{c.okundu ? yerine(g.okundu, tarihYaz(c.okundu)) : g.okunmadi}</span>
          </div>
          <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="konsultasyon-durumu">{durum(c)}</p>
          <h3 className="uza-alt-baslik">{g.soru}</h3>
          <p className="uza-not-metin" data-alan="konsultasyon-soru">{c.soru}</p>
          <details className="uza-transkript" data-alan="giden-paylasilan">
            <summary>{g.paylasilan}: {kopyaBasligi(x.gelen, c.paylasimTuru, c.kopya)}</summary>
            {c.kopya ? <PaylasilanKopyaGorunumu kopya={c.kopya} m={m} dil={dil} /> : null}
          </details>
          <h3 className="uza-alt-baslik">{c.cevapAni ? yerine(g.cevap, tarihYaz(c.cevapAni)) : g.cevapYok}</h3>
          {c.cevapAni ? <p className="uza-not-metin" data-alan="konsultasyon-cevap">{c.cevap ?? ''}</p> : null}
          {c.kapandi ? null : kapatSorulan === c.id ? (
            <div className="uza-form" data-alan="konsultasyon-kapat-onay" style={{ marginTop: 10 }}>
              <Hata>{yerine(g.kapatUyari, kapanisSonrasiGun())}</Hata>
              <div className="uza-eylemler" style={{ marginTop: 0 }}>
                <button type="button" className="uza-dugme uza-dugme-uyari uza-dugme-kucuk" disabled={bekliyor} onClick={kapatOnayla} data-eylem="konsultasyon-kapat-onayla">{g.kapatOnay}</button>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={kapatVazgec} data-eylem="konsultasyon-kapat-vazgec">{g.vazgec}</button>
              </div>
            </div>
          ) : <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => kapatIste(c.id)} data-eylem="konsultasyon-kapat">{g.kapat}</button></div>}
        </li>
      ))}
    </ul>
  )
  const bildirimler = (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Bilgi>{kapatildi ? g.kapatildi : null}</Bilgi>
      <Hata>{hata ? g.yapilamadi : null}</Hata>
    </div>
  )
  if (baslik === false) return <div data-bolum="konsultasyon-giden" data-adet={liste ? liste.length : undefined}>{bildirimler}{govde}</div>
  return (
    <section className="uza-kart" data-bolum="konsultasyon-giden" data-adet={liste ? liste.length : undefined}>
      <h2 className="uza-h2">{g.baslik}</h2>
      {bildirimler}
      {govde}
    </section>
  )
}

/** Closing one of the doctor's own consultations, shared by the tile and by the patient's file. */
function useKapatma(u: Uygulama, yukle: () => Promise<void>) {
  const [kapatSorulan, setKapatSorulan] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [kapatildi, setKapatildi] = useState(false)
  const [hata, setHata] = useState(false)
  const { api } = u
  async function kapat() {
    if (!kapatSorulan) return
    setBekliyor(true); setHata(false); setKapatildi(false)
    try {
      const r = await api(KONSULTASYON_API, { method: 'PATCH', govde: { id: kapatSorulan, islem: 'kapat' } })
      // Already closed from another window: the list shows it as it is.
      if (r.ok || r.j.code === 'DURUM') { setKapatSorulan(null); setKapatildi(r.ok); await yukle() } else setHata(true)
    } catch { setHata(true) }
    setBekliyor(false)
  }
  return { kapatSorulan, bekliyor, kapatildi, hata, kapatIste: (id: string) => { setKapatSorulan(id); setKapatildi(false); setHata(false) }, kapatOnayla: () => { void kapat() }, kapatVazgec: () => setKapatSorulan(null) }
}

// ───────────────────────── the tile's screen ─────────────────────────

export function Konsultasyonlar({ u }: { u: Uygulama }) {
  const [kod, setKod] = useState<string | null | undefined>(undefined)
  const [kodBekliyor, setKodBekliyor] = useState(false)
  const [kodBildirimi, setKodBildirimi] = useState<KodBildirimi>(null)
  const [kodOnayi, setKodOnayi] = useState(false)
  const [gelen, setGelen] = useState<GelenKonsultasyon[] | null>(null)
  const [giden, setGiden] = useState<GidenKonsultasyon[] | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [cevaplar, setCevaplar] = useState<Record<string, string>>({})
  const [bekleyen, setBekleyen] = useState<string | null>(null)
  const [cevapHatasi, setCevapHatasi] = useState<CevapHatasi>(null)
  const { hesap, api } = u

  const gideniYukle = useCallback(async () => {
    const r = await api(`${KONSULTASYON_API}?gorunum=giden`)
    if (r.ok && Array.isArray(r.j.konsultasyonlar)) setGiden(r.j.konsultasyonlar); else setYuklenemedi(true)
  }, [api])
  const geleniYukle = useCallback(async () => {
    const r = await api(`${KONSULTASYON_API}?gorunum=gelen`)
    if (!r.ok || !Array.isArray(r.j.konsultasyonlar)) { setYuklenemedi(true); return }
    const liste = r.j.konsultasyonlar as GelenKonsultasyon[]
    setGelen(liste)
    // What was just drawn has been opened: the first reading is recorded, once per consultation.
    for (const c of liste) if (!c.okundu) void api(KONSULTASYON_API, { method: 'PATCH', govde: { id: c.id, islem: 'okundu' } }).catch(() => { /* recorded on the next visit */ })
  }, [api])
  useEffect(() => {
    if (!hesap) return
    api(`${KONSULTASYON_API}?gorunum=kod`).then((r) => { if (r.ok) setKod(typeof r.j.kod === 'string' ? r.j.kod : null) }).catch(() => { /* the card stays empty */ })
    geleniYukle().catch(() => setYuklenemedi(true)); gideniYukle().catch(() => setYuklenemedi(true))
  }, [hesap, api, geleniYukle, gideniYukle])
  const kapatma = useKapatma(u, gideniYukle)

  async function kodUret() {
    setKodBekliyor(true); setKodBildirimi(null)
    try {
      const r = await api(KONSULTASYON_API, { method: 'POST', govde: { islem: 'kod' } })
      if (r.ok && typeof r.j.kod === 'string') { setKod(r.j.kod); setKodOnayi(false) } else setKodBildirimi('yapilamadi')
    } catch { setKodBildirimi('yapilamadi') }
    setKodBekliyor(false)
  }
  async function cevapla(id: string) {
    const metin = konsultasyonMetniAl(cevaplar[id] ?? '')
    if (!metin) { setCevapHatasi({ id, kod: 'bos' }); return }
    if (metin.length > CEVAP_AZAMI) { setCevapHatasi({ id, kod: 'uzun' }); return }
    setBekleyen(id); setCevapHatasi(null)
    try {
      const r = await api(KONSULTASYON_API, { method: 'PATCH', govde: { id, islem: 'cevap', cevap: metin } })
      // Closed or answered a moment ago, or its period is over: the list reads again and shows it as it is.
      if (r.ok || r.j.code === 'DURUM' || r.status === 404) { if (r.ok) setCevaplar((eski) => { const { [id]: _giden, ...kalan } = eski; return kalan }); await geleniYukle() }
      else setCevapHatasi({ id, kod: r.j.code === 'CEVAP_GEREKLI' ? 'bos' : r.j.code === 'UZUN' ? 'uzun' : 'gonderilemedi' })
    } catch { setCevapHatasi({ id, kod: 'gonderilemedi' }) }
    setBekleyen(null)
  }

  const x = konsultasyonMetni(u.dil)
  return (
    <>
      <KodKarti k={x.kod} kod={kod} bekliyor={kodBekliyor} bildirim={kodBildirimi} onaySoruluyor={kodOnayi} uret={() => { void kodUret() }} yenileSor={() => { setKodOnayi(true); setKodBildirimi(null) }} yenileVazgec={() => setKodOnayi(false)}
        kopyala={() => { if (kod) void panoyaKopyala(koduYaz(kod)).then((tamam) => setKodBildirimi(tamam ? 'kopyalandi' : 'kopyalanamadi')) }} />
      <GelenListesi x={x} m={u.m} dil={u.dil} liste={gelen} yuklenemedi={yuklenemedi} cevaplar={cevaplar} setCevap={(id, metin) => { setCevaplar((eski) => ({ ...eski, [id]: metin })); setCevapHatasi(null) }} gonder={(id) => { void cevapla(id) }} bekleyen={bekleyen} hata={cevapHatasi} />
      <GidenListesi x={x} m={u.m} dil={u.dil} liste={giden} yuklenemedi={yuklenemedi} hastaBaglantisi {...kapatma} />
    </>
  )
}

// ───────────────────────── asking, on the patient's file ─────────────────────────

export type IstekFormu = { kod: string; soru: string; paylasimTuru: PaylasimTuru; notId: string; riza: boolean }
export const BOS_ISTEK: IstekFormu = { kod: '', soru: '', paylasimTuru: 'yok', notId: '', riza: false }
export type IstekHatasi = 'meslektas' | 'bulunamadi' | 'soru' | 'uzun' | 'riza' | 'not' | 'ozet' | 'limit' | 'gonderilemedi' | null

export function KonsultasyonIsteGorunumu({ x, form, setForm, notlar, meslektas, bul, gonder, bekliyor, hata, gonderildi, liste }: {
  x: KonsultasyonMetni
  form: IstekFormu; setForm: (f: IstekFormu) => void
  /** The approved notes of this patient that can be shared. null = not loaded yet. */
  notlar: readonly PaylasilabilirNot[] | null
  /** The colleague the typed code names, once found. */
  meslektas: Meslektas | null
  bul: () => void; gonder: (e: FormEvent) => void; bekliyor: boolean; hata: IstekHatasi; gonderildi?: boolean
  /** This patient's consultations, drawn under the form. */
  liste?: React.ReactNode
}) {
  const i = x.iste
  const secili = notlar?.find((n) => n.notId === form.notId) ?? null
  const hataMetni = hata === 'meslektas' ? i.meslektasGerekli : hata === 'bulunamadi' ? i.bulunamadi : hata === 'soru' ? i.soruBos : hata === 'uzun' ? yerine(i.cokUzun, SORU_AZAMI) : hata === 'riza' ? i.rizaGerekli : hata === 'not' ? i.onayliNotYok : hata === 'ozet' ? i.ozetYok : hata === 'limit' ? i.limit : hata === 'gonderilemedi' ? i.gonderilemedi : null
  const notVar = Boolean(notlar && notlar.length)
  return (
    <section className="uza-kart" data-alan="hasta-konsultasyon">
      <div className="uza-baslik-satiri" style={{ marginBottom: 0 }}>
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{i.baslik}</h2>
        {ozellikAcik('araclar') ? <a className="uza-baglanti" href={aracYolu(KONSULTASYON_ARACI)} data-eylem="konsultasyonlari-ac">{i.tumu}</a> : null}
      </div>
      <p className="uza-aciklama">{i.aciklama}</p>
      <details className="uza-transkript" data-alan="konsultasyon-iste">
        <summary>{i.gonder}</summary>
        <form className="uza-form" onSubmit={gonder} noValidate>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ki-kod">{i.kodEtiketi}</label>
            <div className="uza-arama-satir">
              <input id="uza-ki-kod" name="kod" className="uza-girdi" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={24} value={form.kod} onChange={(e) => setForm({ ...form, kod: e.target.value })} />
              <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={bul} data-eylem="meslektas-bul">{i.bul}</button>
            </div>
            {meslektas ? <p className="uza-ipucu" data-alan="meslektas">{yerine(i.bulundu, kisi(meslektas))}</p> : null}
          </div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ki-soru">{i.soruEtiketi}</label>
            <textarea id="uza-ki-soru" name="soru" className="uza-girdi" rows={5} maxLength={SORU_AZAMI} value={form.soru} onChange={(e) => setForm({ ...form, soru: e.target.value })} />
            <p className="uza-ipucu">{i.soruIpucu}</p>
          </div>
          <Secim etiket={i.paylasimEtiketi} ad="konsultasyon-paylasim" deger={form.paylasimTuru} sec={(paylasimTuru) => setForm({ ...form, paylasimTuru, notId: paylasimTuru === 'yok' ? '' : form.notId || notlar?.[0]?.notId || '' })}
            secenekler={[{ deger: 'yok' as PaylasimTuru, ad: i.secenekYok }, ...(notVar ? [{ deger: 'not' as PaylasimTuru, ad: i.secenekNot }, { deger: 'ozet' as PaylasimTuru, ad: i.secenekOzet }] : [])]} />
          {notlar && !notVar ? <p className="uza-ipucu" data-alan="onayli-not-yok">{i.onayliNotYok}</p> : null}
          {form.paylasimTuru !== 'yok' && notVar ? (
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-ki-not">{i.notSec}</label>
              <select id="uza-ki-not" name="notId" className="uza-girdi" value={form.notId} onChange={(e) => setForm({ ...form, notId: e.target.value })}>
                {(notlar ?? []).map((n) => <option key={n.notId} value={n.notId}>{tarihYaz(n.gun)}</option>)}
              </select>
              {form.paylasimTuru === 'ozet' && secili && !secili.ozetVar ? <p className="uza-ipucu" data-alan="ozet-yok">{i.ozetYok}</p> : null}
            </div>
          ) : null}
          <fieldset className="uza-secim" data-alan="konsultasyon-riza">
            <legend className="uza-etiket">{i.rizaBaslik}</legend>
            <label className="uza-onay"><input type="checkbox" name="riza" checked={form.riza} onChange={(e) => setForm({ ...form, riza: e.target.checked })} /><span>{i.riza}</span></label>
          </fieldset>
          <p className="uza-ipucu" style={{ marginTop: 0 }} data-alan="konsultasyon-bildirim-yok">{i.bildirimYok}</p>
          <Hata>{hataMetni}</Hata>
          <div className="uza-eylemler" style={{ marginTop: 0 }}>
            <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="konsultasyon-iste">{bekliyor ? i.gonderiliyor : i.gonder}</button>
          </div>
        </form>
      </details>
      <div style={{ marginTop: 12 }}><Bilgi>{gonderildi ? i.gonderildi : null}</Bilgi></div>
      {liste ?? null}
    </section>
  )
}

export function KonsultasyonKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [form, setForm] = useState<IstekFormu>(BOS_ISTEK)
  const [notlar, setNotlar] = useState<PaylasilabilirNot[] | null>(null)
  const [meslektas, setMeslektas] = useState<Meslektas | null>(null)
  const [liste, setListe] = useState<GidenKonsultasyon[] | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<IstekHatasi>(null)
  const [gonderildi, setGonderildi] = useState(false)
  const { hesap, api } = u

  const yukle = useCallback(async () => {
    const r = await api(`${KONSULTASYON_API}?gorunum=giden&hasta=${encodeURIComponent(hastaId)}`)
    if (r.ok && Array.isArray(r.j.konsultasyonlar)) { setListe(r.j.konsultasyonlar); setYuklenemedi(false) } else setYuklenemedi(true)
  }, [api, hastaId])
  useEffect(() => {
    if (!hesap) return
    yukle().catch(() => setYuklenemedi(true))
    api(`${KONSULTASYON_API}?gorunum=notlar&hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (r.ok && Array.isArray(r.j.notlar)) setNotlar(r.j.notlar) }).catch(() => { /* only the question can then be sent */ })
  }, [hesap, api, hastaId, yukle])
  const kapatma = useKapatma(u, yukle)

  async function bul() {
    if (!koduDuzelt(form.kod)) { setMeslektas(null); setHata('bulunamadi'); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await api(KONSULTASYON_API, { method: 'POST', govde: { islem: 'bul', kod: form.kod } })
      if (r.ok && r.j.meslektas) setMeslektas(r.j.meslektas); else { setMeslektas(null); setHata('bulunamadi') }
    } catch { setHata('gonderilemedi') }
    setBekliyor(false)
  }
  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (!koduDuzelt(form.kod)) { setHata('meslektas'); return }
    const soru = konsultasyonMetniAl(form.soru)
    if (!soru) { setHata('soru'); return }
    if (soru.length > SORU_AZAMI) { setHata('uzun'); return }
    if (!form.riza) { setHata('riza'); return }
    setBekliyor(true); setHata(null); setGonderildi(false)
    try {
      const r = await api(KONSULTASYON_API, { method: 'POST', govde: { islem: 'iste', hastaId, kod: form.kod, soru, paylasimTuru: form.paylasimTuru, notId: form.paylasimTuru === 'yok' ? null : form.notId || null, riza: true } })
      if (r.ok) { setForm(BOS_ISTEK); setMeslektas(null); await yukle(); setGonderildi(true) }
      else setHata(r.j.code === 'MESLEKTAS_YOK' ? 'bulunamadi' : r.j.code === 'SORU_GEREKLI' ? 'soru' : r.j.code === 'UZUN' ? 'uzun' : r.j.code === 'RIZA_GEREKLI' ? 'riza' : r.j.code === 'NOT_UYGUN' || r.j.code === 'PAYLASIM' ? 'not' : r.j.code === 'OZET_YOK' ? 'ozet' : r.j.code === 'LIMIT' ? 'limit' : 'gonderilemedi')
    } catch { setHata('gonderilemedi') }
    setBekliyor(false)
  }

  const x = konsultasyonMetni(u.dil)
  return (
    <KonsultasyonIsteGorunumu x={x} form={form} setForm={(f) => { if (f.kod !== form.kod) setMeslektas(null); setForm(f); setHata(null); setGonderildi(false) }} notlar={notlar} meslektas={meslektas} bul={() => { void bul() }} gonder={gonder} bekliyor={bekliyor} hata={hata} gonderildi={gonderildi}
      liste={liste && liste.length === 0 ? null : <GidenListesi x={x} m={u.m} dil={u.dil} liste={liste} yuklenemedi={yuklenemedi} hastaBaglantisi={false} baslik={false} {...kapatma} />} />
  )
}

// ───────────────────────── the home screen: how many wait for an answer ─────────────────────────

/** Nothing is drawn while nothing waits. */
export function BekleyenKonsultasyonGorunumu({ g, adet }: { g: KonsultasyonMetni['gelen']; adet: number }) {
  if (adet < 1) return null
  return (
    <section className="uza-kart" data-alan="bugun-konsultasyon" data-adet={adet}>
      <div className="uza-baslik-satiri" style={{ marginBottom: 0 }}>
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{yerine(g.bekleyen, adet)}</h2>
        <a className="uza-baglanti" href={aracYolu(KONSULTASYON_ARACI)} data-eylem="konsultasyonlari-ac">{g.ac}</a>
      </div>
    </section>
  )
}

export function BekleyenKonsultasyonlarKarti({ u }: { u: Uygulama }) {
  const [adet, setAdet] = useState(0)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    // The home screen is the home screen without it: if the list cannot be read, the line is simply not drawn.
    api(`${KONSULTASYON_API}?gorunum=gelen`).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.konsultasyonlar)) setAdet((r.j.konsultasyonlar as GelenKonsultasyon[]).filter((c) => !c.kapandi && !c.cevapAni).length) }).catch(() => { /* no line */ })
    return () => { iptal = true }
  }, [hesap, api])
  return <BekleyenKonsultasyonGorunumu g={konsultasyonMetni(u.dil).gelen} adet={adet} />
}
