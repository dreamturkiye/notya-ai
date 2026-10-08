'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /visit?not=<id>: the note of a visit.
 *
 * The model wrote a DRAFT in the doctor's note language. The doctor reads it, edits it, and approves it — only then
 * is it in the patient's file. One click asks for the same note in the other language (Uzbek ↔ Russian): it arrives
 * as a SECOND draft beside the first, and the doctor approves whichever one they choose. An approved note is shown
 * as text and offers nothing that could change it; the server refuses a change as well.
 *
 * When the recording was heard with low confidence, a plain notice asks the doctor to check the note carefully.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, Secim, tarihYaz, saatYaz, YOL, type Uygulama } from './Kabuk'
import { tamAd } from './Hastalar'
import { KonusmaBildirimleri, konusmaDiliAdi, sablonAdi, type MuayeneDetayi } from './Muayene'
import type { UygulamaMetni, UzUygulamaDili } from './metinler'

export type NotIcerigi = { s: string; o: string; a: string; p: string }
export type NotDetayi = {
  notId: string; seansId: string; onayli: boolean; onayTarihi: string | null
  dil: UzUygulamaDili; icerik: NotIcerigi
  ikinci: { dil: UzUygulamaDili; icerik: NotIcerigi } | null
  yenidenYazilabilir: UzUygulamaDili | null
  muayene: MuayeneDetayi
}
export type NotIslemi = 'kaydediliyor' | 'cevriliyor' | 'onaylaniyor' | null
/** What the last action answered: a code of the note API, or one of the two good outcomes. */
export type NotBildirimi = 'KAYDEDILDI' | 'ONAYLANDI' | 'KAYDEDILEMEDI' | 'ONAYLANAMADI' | 'YENIDEN_YAZILAMADI' | 'ONAYLI' | 'BOS' | 'BAGLANTI' | null

const BOLUMLER = ['s', 'o', 'a', 'p'] as const
/** A language of notes, named in the screen's language (the script is not named: both Uzbek forms are "Uzbek"). */
export const notDiliAdi = (m: UygulamaMetni, dil: string): string => (dil === 'ru' ? m.diller.ru : m.diller.uz)

function bildirimMetni(m: UygulamaMetni, b: NotBildirimi): { iyi: string | null; kotu: string | null } {
  const n = m.not
  if (b === 'KAYDEDILDI') return { iyi: n.kaydedildi, kotu: null }
  if (b === 'ONAYLANDI') return { iyi: n.onaylandi, kotu: null }
  const kotu: Record<string, string> = { KAYDEDILEMEDI: n.kaydedilemedi, ONAYLANAMADI: n.onaylanamadi, YENIDEN_YAZILAMADI: n.cevrilemedi, ONAYLI: n.zatenOnayli, BOS: n.bosNot, BAGLANTI: m.kabuk.baglanti }
  return { iyi: null, kotu: b ? kotu[b] ?? m.kabuk.hata : null }
}

export function NotGorunumu({ m, not, aktifDil, setAktifDil, icerik, setIcerik, islem, bildirim, kaydet, yenidenYaz, onayla }: {
  m: UygulamaMetni; not: NotDetayi; aktifDil: UzUygulamaDili; setAktifDil: (d: UzUygulamaDili) => void
  icerik: NotIcerigi; setIcerik: (i: NotIcerigi) => void; islem: NotIslemi; bildirim: NotBildirimi
  kaydet: () => void; yenidenYaz: () => void; onayla: () => void
}) {
  const n = m.not
  const v = not.muayene
  const dil = konusmaDiliAdi(m, v.konusma)
  const mesgul = islem !== null
  const { iyi, kotu } = bildirimMetni(m, bildirim)
  const taslaklar = not.ikinci ? [not.dil, not.ikinci.dil] : [not.dil]
  return (
    <>
      <section className="uza-kart">
        <p className="uza-ust-yazi">{n.baslik} · {tarihYaz(v.baslangic)} {saatYaz(v.baslangic)}</p>
        <div className="uza-baslik-satiri">
          <h1 className="uza-h1">{v.hasta ? tamAd(v.hasta) : m.bugun.hastasiz}</h1>
          <span className="uza-rozet" data-durum={not.onayli ? 'onayli' : 'taslak'}>{not.onayli ? m.durum.onayli : m.durum.taslak}</span>
        </div>
        <dl className="uza-bilgiler">
          <dt>{m.muayene.sablon}</dt><dd>{sablonAdi(m, v.sablon)}</dd>
          {dil ? <><dt>{m.muayene.taninanDil}</dt><dd>{dil}</dd></> : null}
          <dt>{n.notDili}</dt><dd>{notDiliAdi(m, not.onayli ? not.dil : aktifDil)}</dd>
          {not.onayli && not.onayTarihi ? <><dt>{m.durum.onayli}</dt><dd>{tarihYaz(not.onayTarihi)} {saatYaz(not.onayTarihi)}</dd></> : null}
        </dl>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Low confidence of the recording: the doctor is asked, in plain words, to check the note carefully. */}
          <KonusmaBildirimleri m={m} k={v.konusma} />
          {not.onayli ? null : <p className="uza-ipucu" data-bildirim="yapay-zeka">{n.uyari}</p>}
        </div>
      </section>

      <section className="uza-kart" data-alan="not">
        {not.onayli ? (
          BOLUMLER.map((b) => (
            <div className="uza-not-bolum" key={b}>
              <h2 className="uza-h2">{n[b]}</h2>
              <p className="uza-not-metin" data-bolum={b}>{not.icerik[b]}</p>
            </div>
          ))
        ) : (
          <form className="uza-form" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); onayla() }}>
            {taslaklar.length > 1 ? (
              <div>
                <Secim etiket={n.notDili} ad="taslak-dili" deger={aktifDil} sec={setAktifDil} secenekler={taslaklar.map((d) => ({ deger: d, ad: notDiliAdi(m, d) }))} />
                {aktifDil !== not.dil ? <p className="uza-ipucu" data-bildirim="ikinci-taslak">{n.ikinciTaslak}</p> : null}
              </div>
            ) : null}
            {BOLUMLER.map((b) => (
              <div className="uza-alan" key={b}>
                <label className="uza-etiket" htmlFor={`uza-not-${b}`}>{n[b]}</label>
                <textarea id={`uza-not-${b}`} name={b} className="uza-girdi" lang={aktifDil} value={icerik[b]} onChange={(e) => setIcerik({ ...icerik, [b]: e.target.value })} disabled={mesgul} />
              </div>
            ))}
            <Hata>{kotu}</Hata>
            <Bilgi>{iyi}</Bilgi>
            <div className="uza-eylemler" style={{ marginTop: 0 }}>
              <button type="submit" className="uza-dugme" disabled={mesgul} data-eylem="onayla">{islem === 'onaylaniyor' ? n.onaylaniyor : n.onayla}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={mesgul} onClick={kaydet} data-eylem="kaydet">{n.kaydet}</button>
              {not.yenidenYazilabilir ? (
                <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={mesgul} onClick={yenidenYaz} data-eylem="yeniden-yaz">
                  {islem === 'cevriliyor' ? n.cevriliyor : not.yenidenYazilabilir === 'ru' ? n.cevirRu : n.cevirUz}
                </button>
              ) : null}
            </div>
          </form>
        )}
        {not.onayli ? <div style={{ marginTop: 16 }}><Bilgi>{iyi}</Bilgi></div> : null}
        {v.hasta ? <p className="uza-ipucu" style={{ marginTop: 16 }}><a className="uza-baglanti" href={`${YOL.hasta}?id=${v.hasta.id}`}>{n.dosyayaDon}</a></p> : null}
      </section>

      <section className="uza-kart">
        <details className="uza-transkript" style={{ marginTop: 0 }}>
          <summary>{n.transkript}</summary>
          <p data-alan="transkript">{v.metin}</p>
        </details>
      </section>
    </>
  )
}

export function Not({ u, notId }: { u: Uygulama; notId: string }) {
  const [not, setNot] = useState<NotDetayi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [aktifDil, setAktifDil] = useState<UzUygulamaDili>('uz-Latn')
  // The text on the screen, per draft language: what the doctor has typed is kept while they look at the other draft.
  const [metinler, setMetinler] = useState<Partial<Record<UzUygulamaDili, NotIcerigi>>>({})
  const [islem, setIslem] = useState<NotIslemi>(null)
  const [bildirim, setBildirim] = useState<NotBildirimi>(null)
  const { hesap, api } = u

  const yukle = useCallback(async (gecilecekDil?: UzUygulamaDili): Promise<void> => {
    const r = await api(`/api/ulke/not?id=${encodeURIComponent(notId)}`)
    if (!r.ok || !r.j.not) { setYuk(r.status === 404 ? 'yok' : 'hata'); return }
    const n = r.j.not as NotDetayi
    setNot(n)
    setMetinler((eski) => ({ [n.dil]: eski[n.dil] ?? n.icerik, ...(n.ikinci ? { [n.ikinci.dil]: eski[n.ikinci.dil] ?? n.ikinci.icerik } : {}) }))
    setAktifDil((eski) => gecilecekDil ?? (eski === n.dil || eski === n.ikinci?.dil ? eski : n.dil))
    setYuk('tamam')
  }, [api, notId])

  useEffect(() => { if (hesap) yukle().catch(() => setYuk('hata')) }, [hesap, yukle])

  if (yuk !== 'tamam' || !not) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.not.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.bugun}>{u.m.kabuk.geri}</a></p>}
      </section>
    )
  }

  const icerik = metinler[aktifDil] ?? (aktifDil === not.dil ? not.icerik : not.ikinci?.icerik ?? not.icerik)
  const govde = (dil: UzUygulamaDili) => ({ notId, dil, ...(metinler[dil] ?? not.icerik) })
  const kodu = (j: Record<string, unknown>, yedek: NotBildirimi): NotBildirimi => (j.code === 'ONAYLI' ? 'ONAYLI' : j.code === 'BOS' ? 'BOS' : yedek)

  async function kaydet() {
    setIslem('kaydediliyor'); setBildirim(null)
    try {
      const r = await api('/api/ulke/not', { method: 'PATCH', govde: govde(aktifDil) })
      setBildirim(r.ok ? 'KAYDEDILDI' : kodu(r.j, 'KAYDEDILEMEDI'))
      if (r.j.code === 'ONAYLI') await yukle()
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  async function yenidenYaz() {
    if (!not) return
    setIslem('cevriliyor'); setBildirim(null)
    try {
      // The rewrite is made from the note as the doctor has it on the screen: save it first.
      const k = await api('/api/ulke/not', { method: 'PATCH', govde: govde(not.dil) })
      if (!k.ok) { setBildirim(kodu(k.j, 'KAYDEDILEMEDI')); setIslem(null); return }
      const r = await api('/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId } })
      if (r.ok && typeof r.j.dil === 'string') await yukle(r.j.dil as UzUygulamaDili)
      else setBildirim(kodu(r.j, 'YENIDEN_YAZILAMADI'))
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  async function onayla() {
    setIslem('onaylaniyor'); setBildirim(null)
    try {
      const r = await api('/api/ulke/not/onayla', { method: 'POST', govde: govde(aktifDil) })
      if (r.ok) { await yukle(); setBildirim('ONAYLANDI') } else {
        setBildirim(kodu(r.j, 'ONAYLANAMADI'))
        if (r.j.code === 'ONAYLI') await yukle()
      }
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  return (
    <NotGorunumu m={u.m} not={not} aktifDil={aktifDil} setAktifDil={(d) => { setAktifDil(d); setBildirim(null) }} icerik={icerik}
      setIcerik={(i) => { setMetinler((eski) => ({ ...eski, [aktifDil]: i })); setBildirim(null) }} islem={islem} bildirim={bildirim} kaydet={kaydet} yenidenYaz={yenidenYaz} onayla={onayla} />
  )
}
