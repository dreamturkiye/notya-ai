'use client'

/**
 * NOTYA-ULKE-MESAJ-01 — the patient's file: THE DOCTOR WRITES TO A PATIENT, reads the answers and closes the
 * conversation; and, on the home screen, the patients whose messages are unread.
 *
 * The patient reads and answers on their own page, after signing in with their link and PIN. THE APPLICATION TELLS
 * THE PATIENT NOTHING: there is no outbound channel, and the card says so. Where the patient has no link that works
 * the card says that too, because a message nobody can read is worse than none.
 *
 * A message of the patient's is marked as read only when it was drawn here: the card says "read up to the newest
 * message I showed", and the server marks nothing newer.
 *
 * Every sentence is the pack's (mesajMetni), in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Bilgi, Hata, saatYaz, tarihYaz, YOL, type Uygulama } from './Kabuk'
import { okunmamisSayisi, sonMesajAni } from '../mesajOrtak'
import { MesajBalonlari, MesajBalonu, MesajYazmaKutusu } from '@/components/doktor/MesajlarGorunumu'
import { SablonSecici, useSablonlar } from './Sablonlarim'
import { sonaEkle } from '@/lib/ulke/sablon/sabitler'
import { mesajMetni, sablonMetni, type MesajMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { HEKIM_MESAJ_API, MESAJ_AZAMI, mesajMetniAl, type HekimMesajGorunumu, type OkunmamisHasta } from '@/lib/ulke/mesaj/sabitler'

export type MesajHatasi = 'bos' | 'uzun' | 'limit' | 'gonderilemedi' | 'yapilamadi' | 'kapali' | null
/** The place on a patient's file the home screen's list links to. */
export const MESAJ_CAPASI = 'mesajlar'

const an = (iso: string): string => `${tarihYaz(iso)} ${saatYaz(iso)}`

export function HastaMesajGorunumu({ x, g, yuklenemedi, metin, setMetin, gonder, bekliyor, hata, kapatildi, kapatSorulan, kapatIste, kapatOnayla, kapatVazgec, ek }: {
  x: MesajMetni['hekim']
  /** null = not loaded yet (or could not be read). */
  g: HekimMesajGorunumu | null
  yuklenemedi?: boolean
  metin: string; setMetin: (y: string) => void; gonder: (e: FormEvent) => void; bekliyor: boolean; hata: MesajHatasi
  kapatildi?: boolean
  /** The conversation the doctor is being asked to confirm closing, or null. */
  kapatSorulan: string | null
  kapatIste: (yazismaId: string) => void; kapatOnayla: () => void; kapatVazgec: () => void
  /** Under the text area: the doctor's own templates, where the country has them. */
  ek?: ReactNode
}) {
  const yeni = g ? okunmamisSayisi(g.yazismalar, 'hekim') : 0
  const kapaliMetni = (k: string) => yerine(x.kapali, tarihYaz(k))
  const hataMetni = hata === 'bos' ? x.bosMesaj : hata === 'uzun' ? yerine(x.cokUzun, MESAJ_AZAMI) : hata === 'limit' ? x.limit : hata === 'gonderilemedi' ? x.gonderilemedi : hata === 'yapilamadi' || hata === 'kapali' ? x.yapilamadi : null
  return (
    <section className="uza-kart" id={MESAJ_CAPASI} data-alan="hasta-mesajlari" data-okunmamis={g ? yeni : undefined}>
      <div className="uza-baslik-satiri" style={{ marginBottom: 0 }}>
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{x.baslik}</h2>
        {yeni ? <span className="uza-rozet" data-mesaj-durum="yeni" data-alan="mesaj-okunmamis">{yerine(x.okunmamisAdet, yeni)}</span> : null}
      </div>
      <p className="uza-aciklama">{x.aciklama}</p>
      <p className="uza-ipucu" data-alan="mesaj-bildirim-yok">{x.bildirimYok}</p>
      {!g ? (yuklenemedi ? <div style={{ marginTop: 12 }}><Hata>{x.yuklenemedi}</Hata></div> : null) : (
        <>
          {g.erisim !== 'acik' ? <div style={{ marginTop: 12 }} data-alan="mesaj-erisim-yok" data-erisim={g.erisim}><Hata>{x.erisimYok}</Hata></div> : null}
          {g.yazismalar.length === 0 ? <p className="uza-bos" data-alan="mesaj-bos">{x.bos}</p> : (
            <div className="uza-yazismalar">
              {g.yazismalar.map((y) => (
                <div key={y.id} className="uza-yazisma" data-yazisma={y.id} data-yazisma-durumu={y.kapandi ? 'kapali' : 'acik'}>
                  {(y.kapandi ? kapaliMetni(y.kapandi) : x.acik) ? <p className="uza-ust-yazi" data-alan="yazisma-durumu">{y.kapandi ? kapaliMetni(y.kapandi) : x.acik}</p> : null}
                  {/* Türkiye's conversation look (components/doktor/MesajlarGorunumu.tsx): the patient's bubbles left, the doctor's right. */}
                  <MesajBalonlari>
                    {y.mesajlar.map((mj) => {
                      const benim = mj.gonderen === 'hekim'
                      const yeniMi = !benim && !mj.okundu
                      return (
                        <MesajBalonu key={mj.id} karsi={!benim} kimden={<>{benim ? x.siz : x.hasta}{yeniMi ? <> <span className="uza-rozet" data-mesaj-durum="yeni">{x.yeni}</span></> : null}</>}
                          metin={mj.metin} zaman={an(mj.an)}
                          veri={{ 'data-mesaj': mj.id, 'data-gonderen': mj.gonderen, 'data-benim': benim ? 'evet' : undefined, 'data-okunmamis': yeniMi ? 'evet' : undefined }}
                          alt={benim ? <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(250,248,244,0.7)' }} data-okundu={mj.okundu ? 'evet' : 'hayir'}>{mj.okundu ? x.okundu : x.okunmadi}</p> : null} />
                      )
                    })}
                  </MesajBalonlari>
                  {y.kapandi ? null : kapatSorulan === y.id ? (
                    <div className="uza-form" data-alan="mesaj-kapat-onay" style={{ marginTop: 10 }}>
                      <Hata>{x.kapatUyari}</Hata>
                      <div className="uza-eylemler" style={{ marginTop: 0 }}>
                        <button type="button" className="uza-dugme uza-dugme-uyari uza-dugme-kucuk" disabled={bekliyor} onClick={kapatOnayla} data-eylem="mesaj-kapat-onayla">{x.kapatOnay}</button>
                        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={kapatVazgec} data-eylem="mesaj-kapat-vazgec">{x.vazgec}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => kapatIste(y.id)} data-eylem="mesaj-kapat">{x.kapat}</button></div>
                  )}
                </div>
              ))}
            </div>
          )}
          <form className="uza-form" onSubmit={gonder} noValidate data-alan="mesaj-yaz" style={{ marginTop: 0 }}>
            <MesajYazmaKutusu etiket={x.yaz} etiketFor="uza-mesaj-metin" kimlik="uza-mesaj-metin" ad="metin" satir={4} azami={MESAJ_AZAMI} deger={metin} onDegis={setMetin}
              ara={<>
                {ek ?? null}
                <Bilgi>{kapatildi ? x.kapatildi : null}</Bilgi>
                <Hata>{hataMetni}</Hata>
              </>}
              tur="submit" pasif={bekliyor} veri={{ 'data-eylem': 'mesaj-gonder' }} gonderMetni={bekliyor ? x.gonderiliyor : x.gonder} />
          </form>
        </>
      )}
    </section>
  )
}

export function HastaMesajKarti({ u, hastaId, sablonlar: sablonlarAcik }: {
  u: Uygulama; hastaId: string
  /** NOTYA-ULKE-MESAJ-01: true = the country has "my templates": the doctor's templates for a message are offered under the text box. */
  sablonlar?: boolean
}) {
  const [g, setG] = useState<HekimMesajGorunumu | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [metin, setMetin] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<MesajHatasi>(null)
  const [kapatildi, setKapatildi] = useState(false)
  const [kapatSorulan, setKapatSorulan] = useState<string | null>(null)
  const okunan = useRef('')
  const { hesap, api } = u
  const sablonlar = useSablonlar(api, Boolean(hesap) && sablonlarAcik === true, 'mesaj')

  const yukle = useCallback(async () => {
    const r = await api(`${HEKIM_MESAJ_API}?hasta=${encodeURIComponent(hastaId)}`)
    if (!r.ok || !Array.isArray(r.j.yazismalar)) { setYuklenemedi(true); return }
    const yeni = r.j as unknown as HekimMesajGorunumu
    setG(yeni); setYuklenemedi(false)
    // What was just drawn is read: said once per newest message, and only if something of the patient's is unread.
    const son = sonMesajAni(yeni.yazismalar)
    if (son && son !== okunan.current && okunmamisSayisi(yeni.yazismalar, 'hekim') > 0) {
      okunan.current = son
      void api(HEKIM_MESAJ_API, { method: 'PATCH', govde: { hastaId, islem: 'okundu', kadar: son } }).catch(() => { okunan.current = '' })
    }
  }, [api, hastaId])
  useEffect(() => { if (hesap) yukle().catch(() => setYuklenemedi(true)) }, [hesap, yukle])
  // Opened from the home screen's list: the card arrives after the page, so the page is moved to it once it is there.
  const yuklendi = g !== null
  useEffect(() => { if (yuklendi && window.location.hash === `#${MESAJ_CAPASI}`) document.getElementById(MESAJ_CAPASI)?.scrollIntoView() }, [yuklendi])

  async function gonder(e: FormEvent) {
    e.preventDefault()
    const temiz = mesajMetniAl(metin)
    if (!temiz) { setHata('bos'); return }
    if (temiz.length > MESAJ_AZAMI) { setHata('uzun'); return }
    setBekliyor(true); setHata(null); setKapatildi(false)
    try {
      const r = await api(HEKIM_MESAJ_API, { method: 'POST', govde: { hastaId, metin: temiz } })
      if (r.ok) { setMetin(''); await yukle() }
      else setHata(r.j.code === 'BOS' ? 'bos' : r.j.code === 'UZUN' ? 'uzun' : r.j.code === 'LIMIT' ? 'limit' : 'gonderilemedi')
    } catch { setHata('gonderilemedi') }
    setBekliyor(false)
  }
  async function kapat() {
    if (!kapatSorulan) return
    setBekliyor(true); setHata(null); setKapatildi(false)
    try {
      const r = await api(HEKIM_MESAJ_API, { method: 'PATCH', govde: { yazismaId: kapatSorulan, islem: 'kapat' } })
      // Already closed from another window: the card shows it as it is.
      if (r.ok || r.j.code === 'DURUM') { setKapatSorulan(null); setKapatildi(r.ok); await yukle() } else setHata('yapilamadi')
    } catch { setHata('yapilamadi') }
    setBekliyor(false)
  }

  return (
    <HastaMesajGorunumu x={mesajMetni(u.dil).hekim} g={g} yuklenemedi={yuklenemedi} metin={metin} setMetin={(y) => { setMetin(y); setHata(null) }} gonder={gonder} bekliyor={bekliyor} hata={hata}
      kapatildi={kapatildi} kapatSorulan={kapatSorulan} kapatIste={(id) => { setKapatSorulan(id); setKapatildi(false) }} kapatOnayla={() => { void kapat() }} kapatVazgec={() => setKapatSorulan(null)}
      ek={sablonlarAcik ? <SablonSecici x={sablonMetni(u.dil)} sablonlar={sablonlar} hedef="mesaj" mesgul={bekliyor} ekle={(t) => { setMetin((eski) => sonaEkle(eski, t, MESAJ_AZAMI)); setHata(null) }} /> : null} />
  )
}

// ───────────────────────── the home screen: whose messages are unread ─────────────────────────

/** Nothing is drawn while there is nothing unread: the home screen stays as it is. */
export function OkunmamisMesajlarGorunumu({ x, liste }: { x: MesajMetni['hekim']; liste: readonly OkunmamisHasta[] }) {
  if (!liste.length) return null
  return (
    <section className="uza-kart" data-alan="bugun-mesajlar">
      <h2 className="uza-h2">{x.okunmamisBaslik}</h2>
      <ul className="uza-liste">
        {liste.map((h) => (
          <li key={h.hastaId}>
            <a className="uza-satir" href={`${YOL.hasta}?id=${h.hastaId}#${MESAJ_CAPASI}`} data-mesaj-hastasi={h.hastaId}>
              <span className="uza-saat">{an(h.son)}</span>
              <span className="uza-liste-ad">{h.hastaAdi}</span>
              <span className="uza-rozet" data-mesaj-durum="yeni">{yerine(x.okunmamisAdet, h.adet)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function OkunmamisMesajlarKarti({ u }: { u: Uygulama }) {
  const [liste, setListe] = useState<OkunmamisHasta[]>([])
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    // The home screen is the home screen without it: if the list cannot be read, it is simply not drawn.
    api(HEKIM_MESAJ_API).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.okunmamis)) setListe(r.j.okunmamis) }).catch(() => { /* no list */ })
    return () => { iptal = true }
  }, [hesap, api])
  return <OkunmamisMesajlarGorunumu x={mesajMetni(u.dil).hekim} liste={liste} />
}
