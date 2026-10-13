'use client'

/**
 * NOTYA-ULKE-MESAJ-01 — "MY TEMPLATES": the screen of the tile where a doctor keeps their own reusable text blocks
 * (create, edit, delete), and THE PICKER that puts one into a section of a note or into a message.
 *
 * A TEMPLATE HOLDS NO PATIENT. The screen says so above everything else, and nothing here knows a patient: the
 * server's route takes no patient id (lib/ulke/sablon/sablon.ts).
 *
 * INSERTING ADDS, NEVER REPLACES. The picker puts the template's text at the end of what the doctor has already
 * written, on a line of its own. From then on it is part of that note or message: the doctor reads it, changes it and
 * sends or approves it by their own click. Nothing is inserted by itself, and no model writes a template.
 *
 * DELETING is asked twice: what it does is shown BEFORE the confirmation.
 *
 * Every sentence is the pack's (sablonMetni), in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Bilgi, Hata, Secim, tarihYaz, type Api, type Uygulama } from './Kabuk'
import { aracYolu } from './aracOrtak'
import { sablonMetni, type SablonMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { SABLON_AD_AZAMI, SABLON_ADET_AZAMI, SABLON_API, SABLON_ARACI, SABLON_KAPSAMLARI, SABLON_METIN_AZAMI, sablonAdiAl, sablonMetniAl, type Sablon, type SablonKapsami, type SablonYeri } from '@/lib/ulke/sablon/sabitler'

export type SablonFormu = { /** null = a new template. */ id: string | null; ad: string; metin: string; kapsam: SablonKapsami }
export const BOS_SABLON: SablonFormu = { id: null, ad: '', metin: '', kapsam: 'hepsi' }
export type SablonHatasi = 'ad' | 'metin' | 'uzun' | 'cok' | 'kaydedilemedi' | 'yapilamadi' | null
export type SablonBildirimi = 'kaydedildi' | 'silindi' | null

export function SablonlarimGorunumu({ x, sablonlar, yuklenemedi, form, setForm, kaydet, bekliyor, hata, bildirim, duzenle, vazgec, silSorulan, silIste, silOnayla, silVazgec }: {
  x: SablonMetni
  /** null = not loaded yet (or could not be read). */
  sablonlar: readonly Sablon[] | null
  yuklenemedi?: boolean
  form: SablonFormu; setForm: (f: SablonFormu) => void; kaydet: (e: FormEvent) => void; bekliyor: boolean
  hata: SablonHatasi; bildirim: SablonBildirimi
  duzenle: (s: Sablon) => void
  /** Leaves an edit that was begun: the form is the empty one again. */
  vazgec: () => void
  /** The template the doctor is being asked to confirm deleting, or null. */
  silSorulan: string | null
  silIste: (id: string) => void; silOnayla: () => void; silVazgec: () => void
}) {
  const hataMetni = hata === 'ad' ? x.adGerekli : hata === 'metin' ? x.metinGerekli : hata === 'uzun' ? yerine(x.cokUzun, SABLON_METIN_AZAMI) : hata === 'cok' ? yerine(x.cokFazla, SABLON_ADET_AZAMI) : hata === 'kaydedilemedi' ? x.kaydedilemedi : null
  return (
    <>
      <section className="uza-kart" data-bolum="sablonlarim" data-sablon-adedi={sablonlar ? sablonlar.length : undefined}>
        <p className="uza-ipucu" data-alan="sablon-uyari" style={{ marginTop: 0 }}>{x.uyari}</p>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bilgi>{bildirim === 'silindi' ? x.silindi : null}</Bilgi>
          <Hata>{hata === 'yapilamadi' ? x.kaydedilemedi : null}</Hata>
        </div>
        {!sablonlar ? (yuklenemedi ? <Hata>{x.yuklenemedi}</Hata> : null) : sablonlar.length === 0 ? <p className="uza-bos" data-alan="sablon-bos">{x.bos}</p> : (
          <ul className="uza-liste uza-sablonlar">
            {sablonlar.map((s) => (
              <li key={s.id} className="uza-sablon" data-sablon={s.id} data-kapsam={s.kapsam}>
                <div className="uza-baslik-satiri" style={{ marginBottom: 4 }}>
                  <span className="uza-liste-ad">{s.ad}<span className="uza-liste-alt">{tarihYaz(s.guncellendi)}</span></span>
                  <span className="uza-rozet">{x.kapsam[s.kapsam]}</span>
                </div>
                <p className="uza-not-metin">{s.metin}</p>
                {silSorulan === s.id ? (
                  <div className="uza-form" data-alan="sablon-sil-onay" style={{ marginTop: 10 }}>
                    <Hata>{x.silUyari}</Hata>
                    <div className="uza-eylemler" style={{ marginTop: 0 }}>
                      <button type="button" className="uza-dugme uza-dugme-uyari uza-dugme-kucuk" disabled={bekliyor} onClick={silOnayla} data-eylem="sablon-sil-onayla">{x.silOnay}</button>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={silVazgec} data-eylem="sablon-sil-vazgec">{x.vazgec}</button>
                    </div>
                  </div>
                ) : (
                  <div className="uza-eylemler">
                    <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => duzenle(s)} data-eylem="sablon-duzenle">{x.duzenle}</button>
                    <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => silIste(s.id)} data-eylem="sablon-sil">{x.sil}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {sablonlar ? (
        <section className="uza-kart" data-bolum="sablon-formu" data-duzenlenen={form.id ?? undefined}>
          <h2 className="uza-h2">{form.id ? x.duzenleBaslik : x.yeni}</h2>
          <form className="uza-form" style={{ marginTop: 0 }} onSubmit={kaydet} noValidate>
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-sablon-ad">{x.ad}</label>
              <input id="uza-sablon-ad" name="ad" className="uza-girdi" autoComplete="off" maxLength={SABLON_AD_AZAMI} value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} />
            </div>
            <Secim etiket={x.kapsamEtiketi} ad="sablon-kapsam" deger={form.kapsam} sec={(kapsam) => setForm({ ...form, kapsam })} secenekler={SABLON_KAPSAMLARI.map((k) => ({ deger: k, ad: x.kapsam[k] }))} />
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-sablon-metin">{x.metin}</label>
              <textarea id="uza-sablon-metin" name="metin" className="uza-girdi" rows={6} maxLength={SABLON_METIN_AZAMI} value={form.metin} onChange={(e) => setForm({ ...form, metin: e.target.value })} />
            </div>
            <Bilgi>{bildirim === 'kaydedildi' ? x.kaydedildi : null}</Bilgi>
            <Hata>{hataMetni}</Hata>
            <div className="uza-eylemler" style={{ marginTop: 0 }}>
              <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="sablon-kaydet">{bekliyor ? x.kaydediliyor : x.kaydet}</button>
              {form.id ? <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={vazgec} data-eylem="sablon-vazgec">{x.vazgec}</button> : null}
            </div>
          </form>
        </section>
      ) : null}
    </>
  )
}

export function Sablonlarim({ u }: { u: Uygulama }) {
  const [sablonlar, setSablonlar] = useState<Sablon[] | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [form, setForm] = useState<SablonFormu>(BOS_SABLON)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<SablonHatasi>(null)
  const [bildirim, setBildirim] = useState<SablonBildirimi>(null)
  const [silSorulan, setSilSorulan] = useState<string | null>(null)
  const { hesap, api } = u

  const yukle = useCallback(async () => {
    const r = await api(SABLON_API)
    if (r.ok && Array.isArray(r.j.sablonlar)) { setSablonlar(r.j.sablonlar); setYuklenemedi(false) } else setYuklenemedi(true)
  }, [api])
  useEffect(() => { if (hesap) yukle().catch(() => setYuklenemedi(true)) }, [hesap, yukle])

  async function kaydet(e: FormEvent) {
    e.preventDefault()
    const ad = sablonAdiAl(form.ad), metin = sablonMetniAl(form.metin)
    if (!ad) { setHata('ad'); return }
    if (!metin) { setHata('metin'); return }
    if (ad.length > SABLON_AD_AZAMI || metin.length > SABLON_METIN_AZAMI) { setHata('uzun'); return }
    setBekliyor(true); setHata(null); setBildirim(null)
    try {
      const r = await api(SABLON_API, { method: form.id ? 'PATCH' : 'POST', govde: { ...(form.id ? { id: form.id } : {}), ad, metin, kapsam: form.kapsam } })
      if (r.ok) { setForm(BOS_SABLON); await yukle(); setBildirim('kaydedildi') }
      else setHata(r.j.code === 'AD_GEREKLI' ? 'ad' : r.j.code === 'METIN_GEREKLI' ? 'metin' : r.j.code === 'UZUN' ? 'uzun' : r.j.code === 'COK_FAZLA' ? 'cok' : 'kaydedilemedi')
    } catch { setHata('kaydedilemedi') }
    setBekliyor(false)
  }
  async function sil() {
    if (!silSorulan) return
    setBekliyor(true); setHata(null); setBildirim(null)
    try {
      const r = await api(SABLON_API, { method: 'DELETE', govde: { id: silSorulan } })
      // Already deleted from another window: the list shows it as it is.
      if (r.ok || r.status === 404) { if (form.id === silSorulan) setForm(BOS_SABLON); setSilSorulan(null); await yukle(); if (r.ok) setBildirim('silindi') } else setHata('yapilamadi')
    } catch { setHata('yapilamadi') }
    setBekliyor(false)
  }

  return (
    <SablonlarimGorunumu x={sablonMetni(u.dil)} sablonlar={sablonlar} yuklenemedi={yuklenemedi} form={form} setForm={(f) => { setForm(f); setHata(null); setBildirim(null) }} kaydet={kaydet} bekliyor={bekliyor} hata={hata} bildirim={bildirim}
      duzenle={(s) => { setForm({ id: s.id, ad: s.ad, metin: s.metin, kapsam: s.kapsam }); setHata(null); setBildirim(null); setSilSorulan(null) }} vazgec={() => { setForm(BOS_SABLON); setHata(null) }}
      silSorulan={silSorulan} silIste={(id) => { setSilSorulan(id); setBildirim(null) }} silOnayla={() => { void sil() }} silVazgec={() => setSilSorulan(null)} />
  )
}

// ───────────────────────── the picker ─────────────────────────

/** The doctor's templates for one place (a note, a message). null = not loaded, or switched off: the picker then offers nothing. */
export function useSablonlar(api: Api, etkin: boolean, yer: SablonYeri): Sablon[] | null {
  const [sablonlar, setSablonlar] = useState<Sablon[] | null>(null)
  useEffect(() => {
    if (!etkin) return
    let iptal = false
    // A note or a message is written without them just as well: if the list cannot be read, the picker is not drawn.
    api(`${SABLON_API}?yer=${yer}`).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.sablonlar)) setSablonlar(r.j.sablonlar) }).catch(() => { /* no picker */ })
    return () => { iptal = true }
  }, [api, etkin, yer])
  return sablonlar
}

/**
 * The picker under a section of a note or under a message. Folded away until the doctor opens it; a click on a
 * template's name hands its text to `ekle` — the caller puts it at the end of what is written.
 */
export function SablonSecici({ x, sablonlar, ekle, hedef, mesgul }: {
  x: SablonMetni; sablonlar: readonly Sablon[] | null; ekle: (metin: string) => void
  /** What the picker belongs to (a section's key, "mesaj"): for the tests and the walk-through, never shown. */
  hedef: string
  mesgul?: boolean
}) {
  if (!sablonlar) return null
  const yonet = ozellikAcik('araclar') ? <a className="uza-baglanti" href={aracYolu(SABLON_ARACI)} data-eylem="sablon-yonet">{x.yonet}</a> : null
  return (
    <details className="uza-transkript uza-sablon-secici" data-alan="sablon-secici" data-hedef={hedef} data-sablon-adedi={sablonlar.length}>
      <summary>{x.seciciEkle}</summary>
      {sablonlar.length === 0 ? <p>{x.seciciBos} {yonet}</p> : (
        <>
          <p>{x.seciciNot}</p>
          <div className="uza-eylemler" style={{ marginTop: 8 }}>
            {sablonlar.map((s) => <button key={s.id} type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={mesgul} onClick={() => ekle(s.metin)} data-sablon={s.id} title={x.kapsam[s.kapsam]}>{s.ad}</button>)}
          </div>
          {yonet ? <p>{yonet}</p> : null}
        </>
      )}
    </details>
  )
}
