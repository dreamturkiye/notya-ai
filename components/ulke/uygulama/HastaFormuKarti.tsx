'use client'

/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM on the doctor's screens.
 *
 *   the patient's file   ask the patient to fill in the form; the invitation text; the answers; reopen; withdraw
 *   an appointment       the same card, and the form is asked for THAT appointment
 *   the visit screen     the answers only, read while the visit is recorded
 *
 * ASKING. The doctor gets an INVITATION TEXT in the patient's language to copy and send themselves — the application
 * sends nothing to anybody. Where the patient had no link that works, one was made in the same step: the link and its
 * PIN are shown ONCE, here, and the text carries the link (never the PIN). A patient who already has a link keeps it:
 * it cannot be shown again, so the text asks them to open the link they have. The doctor may ask for a NEW link
 * instead — and is told, BEFORE confirming, that the old link stops working at once and the PIN changes.
 *
 * THE ANSWERS ARE THE PATIENT'S OWN WORDS. Every place that shows them says so, in the first line: "said by the
 * patient, not verified" (or "filled in by a parent or guardian"). They are not used when the note is written, and
 * the card says that too. Only a SUBMITTED form shows answers; a form the patient is still filling in shows none.
 *
 * Every sentence is the pack's (formMetni, and the portal catalogue's words for the link and the PIN), in the
 * account's form; the invitation is in the patient's. The server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, tarihYaz, type Uygulama } from './Kabuk'
import { panoyaKopyala } from './pano'
import { portalAdresi } from './PortalErisimi'
import { dilAdi, formMetni, portalMetni, temelDil, type FormMetni, type PortalMetni } from '@/lib/ulke/arayuz'
import { formDavetMetni } from '@/lib/ulke/arayuz/formDaveti'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { HekimFormu } from '@/lib/ulke/intake/tipler'
import { HEKIM_FORM_API } from '@/lib/ulke/portal/sabitler'
import type { DilKodu } from '@/lib/ulke/tipler'

/** What asking for the form answered, kept on the screen until the doctor leaves it. */
export type FormDaveti = {
  /** The language form the text is written in: the patient's. */
  dil: DilKodu
  metin: string
  /** Present only when a link was made in this step: the whole address, and the PIN. Shown once. */
  adres: string | null
  pin: string | null
  /** false = the patient already had an open form, which was kept. */
  yeniForm: boolean
}
export type FormBildirimi = 'yapilamadi' | 'kopyalandi' | 'kopyalanamadi' | 'yeniden-acildi' | 'geri-cekildi' | null

/** The answers of ONE submitted form, under the line that says whose words they are. */
export function FormCevaplari({ f, form }: { f: FormMetni; form: HekimFormu }) {
  if (!form.bolumler) return null
  return (
    <div data-alan="form-cevaplari" data-form={form.id} data-veli={form.veli ? 'evet' : undefined}>
      {/* FIRST, before any answer: whose words these are, and that nobody checked them. */}
      <Bilgi><span data-alan="form-beyan">{form.veli ? f.hekim.veliBeyani : f.hekim.beyan}</span></Bilgi>
      <p className="uza-ipucu">{yerine(f.hekim.durumGonderildi, tarihYaz(form.gonderildi))}{form.rolAdi ? ` · ${form.rolAdi}` : ''}</p>
      {form.surumFarkli ? <p className="uza-ipucu">{f.hekim.surumFarkli}</p> : null}
      {form.bolumler.map((b, i) => (
        <div className="uza-not-bolum" key={`${b.baslik}-${i}`} style={{ marginTop: 14 }}>
          <h3 className="uza-ust-yazi">{b.baslik}</h3>
          <dl className="uza-bilgiler">
            {b.satirlar.map((s, j) => <React.Fragment key={j}><dt>{s.soru}</dt><dd>{s.cevap}</dd></React.Fragment>)}
          </dl>
        </div>
      ))}
    </div>
  )
}

/**
 * The visit screen's view: the last submitted form, and nothing else. Draws NOTHING where the patient has none —
 * an empty box on the visit screen would only be in the way.
 */
export function MuayeneFormuGorunumu({ f, formlar }: { f: FormMetni; formlar: readonly HekimFormu[] | null }) {
  const son = (formlar ?? []).find((x) => x.durum === 'gonderildi' && x.bolumler)
  if (!son) return null
  return (
    <section className="uza-kart" data-alan="muayene-formu">
      <h2 className="uza-h2">{f.hekim.cevaplar}</h2>
      <FormCevaplari f={f} form={son} />
      <p className="uza-ipucu" data-alan="form-nota-girmez">{f.hekim.notaGirmez}</p>
    </section>
  )
}

export function HastaFormuKartiGorunumu({ f, p, formlar, davet, davetDilAdi, bekliyor, bildirim, onayBekliyor, baglantiHatasi, iste, yeniBaglantiSor, yeniBaglantiVazgec, yenidenAc, geriCek, kopyala }: {
  f: FormMetni; p: PortalMetni
  /** null = not loaded yet (or could not be read): the card says so and offers nothing. */
  formlar: readonly HekimFormu[] | null
  davet: FormDaveti | null
  /** The name of the language the invitation is written in, in the doctor's own form. */
  davetDilAdi?: string
  bekliyor: boolean; bildirim: FormBildirimi
  /** true = the doctor pressed "a new link" and is shown what it does, before anything happens. */
  onayBekliyor: boolean
  baglantiHatasi?: string | null
  iste: (yeniBaglanti: boolean) => void; yeniBaglantiSor: () => void; yeniBaglantiVazgec: () => void
  yenidenAc: (formId: string) => void; geriCek: (formId: string) => void; kopyala: (ne: 'davet' | 'baglanti' | 'pin') => void
}) {
  const h = f.hekim
  const acik = formlar?.find((x) => x.durum === 'bekliyor' || x.durum === 'taslak') ?? null
  const gonderilenler = (formlar ?? []).filter((x) => x.durum === 'gonderildi' && x.bolumler)
  const son = gonderilenler[0] ?? null
  const durum = acik ? (acik.durum === 'taslak' ? yerine(h.durumTaslak, tarihYaz(acik.guncellendi ?? acik.olusturuldu)) : yerine(h.durumBekliyor, tarihYaz(acik.olusturuldu))) : son ? yerine(h.durumGonderildi, tarihYaz(son.gonderildi)) : h.durumYok
  return (
    <section className="uza-kart" data-alan="hasta-formu-karti" data-form-durumu={acik?.durum ?? (son ? 'gonderildi' : 'yok')}>
      <h2 className="uza-h2">{h.baslik}</h2>
      <p className="uza-aciklama">{h.aciklama}</p>
      {formlar ? (
        <>
          <p className="uza-ipucu" data-alan="form-durumu">{durum}</p>
          {davet ? (
            <div className="uza-form" data-alan="form-daveti" style={{ marginTop: 14 }}>
              <Bilgi>{davet.yeniForm ? h.istendi : h.acikVar}</Bilgi>
              {davet.adres && davet.pin ? (
                <>
                  <Bilgi>{p.erisim.birKez}</Bilgi>
                  <div className="uza-alan">
                    <label className="uza-etiket" htmlFor="uza-hf-baglanti">{p.erisim.baglanti}</label>
                    <div className="uza-arama-satir">
                      <input id="uza-hf-baglanti" className="uza-girdi" readOnly value={davet.adres} data-alan="portal-baglanti" onFocus={(x) => x.currentTarget.select()} />
                      <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('baglanti')} data-eylem="baglanti-kopyala">{p.erisim.kopyala}</button>
                    </div>
                  </div>
                  <div className="uza-alan">
                    <label className="uza-etiket" htmlFor="uza-hf-pin">{p.erisim.pin}</label>
                    <div className="uza-arama-satir">
                      <input id="uza-hf-pin" className="uza-girdi" readOnly value={davet.pin} data-alan="portal-pin" inputMode="numeric" onFocus={(x) => x.currentTarget.select()} />
                      <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('pin')} data-eylem="pin-kopyala">{p.erisim.kopyala}</button>
                    </div>
                  </div>
                </>
              ) : (
                // The patient has a link that cannot be shown again: said plainly, with the way to a new one.
                <p className="uza-ipucu" data-alan="form-baglanti-var" style={{ marginTop: 0 }}>{h.baglantiVar}</p>
              )}
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uza-hf-davet">{h.davetBaslik}</label>
                <p className="uza-ust-yazi" data-alan="form-davet-dili">{h.davetDil}: {davetDilAdi ?? ''}</p>
                <textarea id="uza-hf-davet" className="uza-girdi uza-hatirlatma" readOnly rows={5} value={davet.metin} lang={davet.dil} data-alan="form-davet-metni" data-dil={davet.dil} onFocus={(e) => e.currentTarget.select()} />
              </div>
              <div className="uza-eylemler" style={{ marginTop: 0 }}>
                <button type="button" className="uza-dugme" onClick={() => kopyala('davet')} data-eylem="davet-kopyala">{p.erisim.kopyala}</button>
              </div>
              <p className="uza-ipucu" style={{ marginTop: 0 }}>{h.davetIzoh}</p>
              {!davet.adres && !onayBekliyor ? (
                <div className="uza-eylemler" style={{ marginTop: 0 }}>
                  <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={yeniBaglantiSor} data-eylem="yeni-baglanti">{h.yeniBaglanti}</button>
                </div>
              ) : null}
            </div>
          ) : null}
          {onayBekliyor ? (
            // BEFORE anything happens: what a new link does to the one the patient holds.
            <div data-alan="yeni-baglanti-onayi" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Hata>{h.yeniBaglantiUyari}</Hata>
              <div className="uza-eylemler" style={{ marginTop: 0 }}>
                <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={() => iste(true)} data-eylem="yeni-baglanti-onay">{bekliyor ? h.bekliyor : h.yeniBaglantiOnay}</button>
                <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={yeniBaglantiVazgec} data-eylem="yeni-baglanti-vazgec">{h.vazgec}</button>
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bilgi>{bildirim === 'kopyalandi' ? p.erisim.kopyalandi : bildirim === 'yeniden-acildi' ? h.yenidenAcildi : bildirim === 'geri-cekildi' ? h.geriCekildi : null}</Bilgi>
            <Hata>{bildirim === 'yapilamadi' ? h.yapilamadi : bildirim === 'kopyalanamadi' ? p.erisim.kopyalanamadi : baglantiHatasi ?? null}</Hata>
          </div>
          <div className="uza-eylemler">
            <button type="button" className={acik || davet ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} disabled={bekliyor} onClick={() => iste(false)} data-eylem="form-iste">{bekliyor && !onayBekliyor ? h.bekliyor : h.iste}</button>
            {acik ? <button type="button" className="uza-dugme uza-dugme-uyari" disabled={bekliyor} onClick={() => geriCek(acik.id)} data-eylem="form-geri-cek">{h.geriCek}</button> : null}
          </div>
          {son ? (
            <div style={{ marginTop: 18 }} data-alan="form-son">
              <h3 className="uza-h2">{h.cevaplar}</h3>
              <FormCevaplari f={f} form={son} />
              <p className="uza-ipucu" data-alan="form-nota-girmez">{h.notaGirmez}</p>
              {!acik ? (
                <>
                  <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={() => yenidenAc(son.id)} data-eylem="form-yeniden-ac">{h.yenidenAc}</button></div>
                  <p className="uza-ipucu">{h.yenidenAcUyari}</p>
                </>
              ) : null}
            </div>
          ) : null}
          {gonderilenler.length > 1 ? (
            <details className="uza-transkript" data-alan="form-oncekiler">
              <summary>{h.oncekiler}</summary>
              {gonderilenler.slice(1).map((x) => <div key={x.id} style={{ marginTop: 14 }}><FormCevaplari f={f} form={x} /></div>)}
            </details>
          ) : null}
        </>
      ) : <div style={{ marginTop: 12 }}><Hata>{baglantiHatasi ?? null}</Hata></div>}
    </section>
  )
}

/** `mod` 'kart' = the whole card (a patient's file, an appointment); 'muayene' = the answers only (the visit screen). */
export function HastaFormuKarti({ u, hastaId, randevuId, mod = 'kart' }: { u: Uygulama; hastaId: string; randevuId?: string | null; mod?: 'kart' | 'muayene' }) {
  const [formlar, setFormlar] = useState<HekimFormu[] | null>(null)
  const [davet, setDavet] = useState<FormDaveti | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<FormBildirimi>(null)
  const [onayBekliyor, setOnayBekliyor] = useState(false)
  const [kopuk, setKopuk] = useState(false)
  const { hesap, api } = u

  const yukle = useCallback(async () => {
    const r = await api(`${HEKIM_FORM_API}?hasta=${encodeURIComponent(hastaId)}`)
    if (r.ok && Array.isArray(r.j.formlar)) { setFormlar(r.j.formlar); setKopuk(false) } else setKopuk(true)
  }, [api, hastaId])
  useEffect(() => { if (hesap) yukle().catch(() => setKopuk(true)) }, [hesap, yukle])

  async function iste(yeniBaglanti: boolean) {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(HEKIM_FORM_API, { method: 'POST', govde: { hastaId, ...(randevuId ? { randevuId } : {}), ...(yeniBaglanti ? { yeniBaglanti: true } : {}) } })
      if (r.ok && typeof r.j.formId === 'string' && typeof r.j.davetDili === 'string') {
        const adres = r.j.erisim === 'yeni' && typeof r.j.yol === 'string' ? portalAdresi(window.location.origin, r.j.yol) : null
        const d = formDavetMetni({ dil: r.j.davetDili as DilKodu, hekimAd: hesap?.ad ?? '', adres })
        setDavet({ dil: d.dil, metin: d.metin, adres, pin: adres && typeof r.j.pin === 'string' ? r.j.pin : null, yeniForm: r.j.yeniForm === true })
        setOnayBekliyor(false)
        await yukle()
      } else setBildirim('yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  async function degistir(formId: string, islem: 'yeniden-ac' | 'geri-cek') {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(HEKIM_FORM_API, { method: 'PATCH', govde: { formId, islem } })
      if (r.ok) { if (islem === 'geri-cek') setDavet(null); await yukle(); setBildirim(islem === 'yeniden-ac' ? 'yeniden-acildi' : 'geri-cekildi') } else setBildirim('yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }

  const f = formMetni(u.dil)
  if (mod === 'muayene') return <MuayeneFormuGorunumu f={f} formlar={formlar} />
  return (
    <HastaFormuKartiGorunumu f={f} p={portalMetni(u.dil)} formlar={formlar} davet={davet} davetDilAdi={davet ? dilAdi(u.m, temelDil(davet.dil)) : ''} bekliyor={bekliyor} bildirim={bildirim} onayBekliyor={onayBekliyor} baglantiHatasi={kopuk ? u.m.kabuk.hata : null}
      iste={(yeni) => { void iste(yeni) }} yeniBaglantiSor={() => { setOnayBekliyor(true); setBildirim(null) }} yeniBaglantiVazgec={() => setOnayBekliyor(false)}
      yenidenAc={(id) => { void degistir(id, 'yeniden-ac') }} geriCek={(id) => { void degistir(id, 'geri-cek') }}
      kopyala={(ne) => { if (davet) void panoyaKopyala(ne === 'davet' ? davet.metin : ne === 'pin' ? davet.pin ?? '' : davet.adres ?? '').then((tamam) => setBildirim(tamam ? 'kopyalandi' : 'kopyalanamadi')) }} />
  )
}
