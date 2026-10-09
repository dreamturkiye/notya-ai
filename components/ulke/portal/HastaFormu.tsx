'use client'

/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM on the patient's own page (/portal, after the PIN).
 *
 *   The card on the page says a form is waiting (or was sent). Opening it shows, in order: the consent sentence
 *   (once), then the form one PART at a time — the core questions first, then the questions of the doctor's role —
 *   and at the end a button that sends it. Built for a phone: one column, large targets, no table.
 *
 *   SAVED AS THEY GO. After the consent is accepted, every change is saved as a draft a moment later, and again
 *   whenever the patient moves between parts or leaves the form. Closing the page loses nothing; opening the link
 *   again continues where the answers stand.
 *
 *   SUBMITTED ONCE. Before sending, the page says what sending means. Afterwards the same questions are shown with
 *   the answers as text, and nothing can be changed here (the doctor can reopen the form).
 *
 *   THE QUESTIONS COME FROM THE SERVER, already in the patient's own language form and already limited to this form
 *   (lib/ulke/intake/form.ts). This file holds no question, and never sees a question of another role.
 *
 * Like the rest of the patient's page, this file imports nothing of the signed-in application. Every sentence of
 * the frame is the pack's (formMetni); the server answers with codes.
 */
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { formMetni, portalMetni, type FormMetni } from '@/lib/ulke/arayuz'
import { tarihYaz } from '@/lib/ulke/arayuz/bicim'
import { sayiYaz } from '@/lib/ulke/arayuz/sayi'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { Cevap, Cevaplar, FormSorusu, HastaFormuGorunumu } from '@/lib/ulke/intake/tipler'
import { PORTAL_FORM_API, PORTAL_API } from '@/lib/ulke/portal/sabitler'
import type { PortalIcerigi } from '@/lib/ulke/portal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'

const Hata = ({ children }: { children: ReactNode }) => (children ? <div role="alert" className="uza-uyari-kutu">{children}</div> : null)
const Bilgi = ({ children }: { children: ReactNode }) => (children ? <div role="status" className="uza-bilgi-kutu">{children}</div> : null)

/** The route of the form below the portal's own routes ('/form'): the page's request helper adds the rest. */
export const FORM_YOLU = PORTAL_FORM_API.slice(PORTAL_API.length)

// ───────────────────────── the card on the patient's page ─────────────────────────

export function PortalFormKarti({ f, ozet, ac }: { f: FormMetni; ozet: NonNullable<PortalIcerigi['form']>; ac: () => void }) {
  const h = f.hasta
  const gonderildi = ozet.durum === 'gonderildi'
  return (
    <section className="uza-kart" data-alan="portal-form-karti" data-form-durumu={ozet.durum}>
      <h2 className="uza-h2">{gonderildi ? h.gonderildiBaslik : h.bekliyorBaslik}</h2>
      {gonderildi ? <p className="uza-aciklama">{yerine(h.gonderildi, tarihYaz(ozet.gonderildi))}</p> : (
        <>
          <p className="uza-aciklama">{ozet.veli ? h.veliAciklama : h.bekliyorAciklama}</p>
          {ozet.yenidenAcildi ? <div style={{ marginTop: 12 }}><Bilgi>{h.yenidenAcildi}</Bilgi></div> : null}
        </>
      )}
      <div className="uza-eylemler">
        <button type="button" className={gonderildi ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} onClick={ac} data-eylem="form-ac">{gonderildi ? h.cevaplarim : ozet.durum === 'taslak' ? h.devam : h.baslat}</button>
      </div>
    </section>
  )
}

// ───────────────────────── one question ─────────────────────────

/** A number as the patient typed it → the number, or null. Both decimal marks are accepted: people type either. */
export function sayiCoz(ham: string): number | null {
  const t = ham.trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** An answer as text, for the read-only view: option names, yes/no and the unit in the form's own language. '' = no answer. */
export function gorunumCevapMetni(q: FormSorusu, c: Cevap | undefined, f: FormMetni): string {
  if (c === undefined || c === null) return ''
  if (q.tur === 'tek-secim') return q.secenekler?.find((o) => o.anahtar === c)?.ad ?? ''
  if (q.tur === 'cok-secim') return Array.isArray(c) ? (q.secenekler ?? []).filter((o) => c.includes(o.anahtar)).map((o) => o.ad).join('; ') : ''
  if (q.tur === 'tarih') return typeof c === 'string' ? tarihYaz(c) : ''
  if (q.tur === 'kisa-metin' || q.tur === 'uzun-metin') return typeof c === 'string' ? c : ''
  if (typeof c !== 'object' || Array.isArray(c)) return ''
  if (q.tur === 'evet-hayir') return 'e' in c ? (c.e ? (c.a ? `${f.hasta.evet}: ${c.a}` : f.hasta.evet) : f.hasta.hayir) : ''
  return 'n' in c ? `${sayiYaz(c.n, Number.isInteger(c.n) ? 0 : 1)} ${q.birim?.ad ?? ''}`.trim() : ''
}

export function SoruAlani({ q, f, cevap, ham, eksik, degistir, hamDegistir }: {
  q: FormSorusu; f: FormMetni; cevap: Cevap | undefined
  /** What is typed into a number field, kept as text until it is a number in range. */
  ham: string
  /** true = required and unanswered, after the patient tried to send. */
  eksik: boolean
  degistir: (c: Cevap | undefined) => void; hamDegistir: (metin: string) => void
}) {
  const id = `uzf-${q.anahtar}`
  const baslik = (<>{q.metin}{q.zorunlu ? <small> ({f.hasta.zorunlu})</small> : null}</>)
  const yardim = q.yardim ? <p className="uza-ipucu" style={{ marginTop: 0 }}>{q.yardim}</p> : null
  const sarici = { 'data-soru': q.anahtar, 'data-tur': q.tur, 'data-eksik': eksik ? 'evet' : undefined }
  if (q.tur === 'tek-secim' || q.tur === 'cok-secim') {
    const secili = (k: string) => (q.tur === 'tek-secim' ? cevap === k : Array.isArray(cevap) && cevap.includes(k))
    const sec = (k: string, tek: boolean) => {
      if (q.tur === 'tek-secim') { degistir(cevap === k ? undefined : k); return }
      const simdiki = Array.isArray(cevap) ? cevap : []
      // "None of these" stands alone: choosing it clears the others, and choosing another clears it.
      const tekler = new Set((q.secenekler ?? []).filter((o) => o.tek).map((o) => o.anahtar))
      const yeni = simdiki.includes(k) ? simdiki.filter((x) => x !== k) : tek ? [k] : [...simdiki.filter((x) => !tekler.has(x)), k]
      degistir(yeni.length ? yeni : undefined)
    }
    return (
      <fieldset className="uza-secim" {...sarici}>
        <legend className="uza-etiket">{baslik}</legend>
        {yardim}
        <div className="uza-secim-satir">
          {(q.secenekler ?? []).map((o) => (
            <label key={o.anahtar} className="uza-secenek" data-secili={secili(o.anahtar) ? 'evet' : undefined}>
              <input type="checkbox" name={`${id}-${o.anahtar}`} value={o.anahtar} checked={secili(o.anahtar)} onChange={() => sec(o.anahtar, o.tek)} />
              <span>{o.ad}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
  if (q.tur === 'evet-hayir') {
    const c = cevap && typeof cevap === 'object' && !Array.isArray(cevap) && 'e' in cevap ? cevap : undefined
    return (
      <fieldset className="uza-secim" {...sarici}>
        <legend className="uza-etiket">{baslik}</legend>
        {yardim}
        <div className="uza-secim-satir">
          {([[true, f.hasta.evet], [false, f.hasta.hayir]] as const).map(([deger, ad]) => (
            <label key={String(deger)} className="uza-secenek" data-secili={c?.e === deger ? 'evet' : undefined}>
              <input type="checkbox" name={`${id}-${deger ? 'evet' : 'hayir'}`} value={deger ? 'evet' : 'hayir'} checked={c?.e === deger} onChange={() => degistir(c?.e === deger ? undefined : deger && c?.a ? { e: true, a: c.a } : { e: deger })} />
              <span>{ad}</span>
            </label>
          ))}
        </div>
        {c?.e === true && q.ayrinti ? (
          <div className="uza-alan" style={{ marginTop: 10 }}>
            <label className="uza-etiket" htmlFor={`${id}-ayrinti`}>{q.ayrinti}</label>
            <textarea id={`${id}-ayrinti`} className="uza-girdi" rows={2} maxLength={500} value={c.a ?? ''} onChange={(e) => degistir(e.target.value ? { e: true, a: e.target.value } : { e: true })} />
          </div>
        ) : null}
      </fieldset>
    )
  }
  const ortak = { id, className: 'uza-girdi', 'aria-required': q.zorunlu || undefined }
  let girdi: ReactNode
  if (q.tur === 'uzun-metin') girdi = (<textarea {...ortak} rows={3} maxLength={2000} value={typeof cevap === 'string' ? cevap : ''} onChange={(e) => degistir(e.target.value || undefined)} />)
  else if (q.tur === 'kisa-metin') girdi = (<input {...ortak} maxLength={200} autoComplete="off" value={typeof cevap === 'string' ? cevap : ''} onChange={(e) => degistir(e.target.value || undefined)} />)
  else if (q.tur === 'tarih') girdi = (<input {...ortak} type="date" value={typeof cevap === 'string' ? cevap : ''} onChange={(e) => degistir(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : undefined)} />)
  else {
    const b = q.birim
    const n = sayiCoz(ham)
    const gecersiz = ham.trim() !== '' && (n === null || !b || n < b.enAz || n > b.enCok)
    girdi = (
      <>
        <div className="uza-arama-satir">
          <input {...ortak} inputMode="decimal" autoComplete="off" maxLength={12} value={ham} data-birim={b?.kod || undefined} aria-invalid={gecersiz || undefined}
            onChange={(e) => {
              const metin = e.target.value
              hamDegistir(metin)
              const sayi = sayiCoz(metin)
              degistir(sayi !== null && b && sayi >= b.enAz && sayi <= b.enCok ? { n: sayi, b: b.kod } : undefined)
            }} />
          <span className="uza-rozet" data-alan="birim">{b?.ad}</span>
        </div>
        {gecersiz && b ? <p className="uza-ipucu" role="alert" style={{ marginTop: 6 }}>{yerine(f.hasta.sayiGecersiz, sayiYaz(b.enAz, Number.isInteger(b.enAz) ? 0 : 1), sayiYaz(b.enCok, 0))}</p> : null}
      </>
    )
  }
  return (
    <div className="uza-alan" {...sarici}>
      <label className="uza-etiket" htmlFor={id}>{baslik}</label>
      {yardim}
      {girdi}
    </div>
  )
}

// ───────────────────────── the form ─────────────────────────

export type FormKaydi = 'yok' | 'kaydediliyor' | 'kaydedildi' | 'hata'
export type FormGonderimi = 'yok' | 'gonderiliyor' | 'eksik' | 'hata'

/** The form as it is drawn. Pure: it renders in a plain test. `bolum` -1 = the consent step. */
export function HastaFormuGorunumu({ f, form, cevaplar, sayilar, bolum, riza, setRiza, rizaHatasi, kayit, gonderim, eksik, degistir, hamDegistir, git, gonder, kapat }: {
  f: FormMetni; form: HastaFormuGorunumu; cevaplar: Cevaplar; sayilar: Record<string, string>
  bolum: number; riza: boolean; setRiza: (r: boolean) => void; rizaHatasi: boolean
  kayit: FormKaydi; gonderim: FormGonderimi; eksik: readonly string[]
  degistir: (anahtar: string, c: Cevap | undefined) => void; hamDegistir: (anahtar: string, metin: string) => void
  git: (bolum: number) => void; gonder: () => void; kapat: () => void
}) {
  const h = f.hasta
  if (form.durum === 'gonderildi') {
    return (
      <section className="uza-kart" data-alan="hasta-formu" data-form-durumu="gonderildi">
        <h1 className="uza-h1">{h.cevaplarim}</h1>
        <p className="uza-aciklama">{yerine(h.gonderildi, tarihYaz(form.gonderildi))}</p>
        <div style={{ marginTop: 12 }}><Bilgi>{h.degistirilemez}</Bilgi></div>
        {form.bolumler.map((b) => {
          const satirlar = b.sorular.map((q) => ({ q, metin: gorunumCevapMetni(q, cevaplar[q.anahtar], f) })).filter((x) => x.metin)
          return satirlar.length ? (
            <div className="uza-not-bolum" key={b.anahtar} data-bolum={b.anahtar} style={{ marginTop: 18 }}>
              <h2 className="uza-h2">{b.baslik}</h2>
              <dl className="uza-bilgiler">
                {satirlar.map(({ q, metin }) => <React.Fragment key={q.anahtar}><dt>{q.metin}</dt><dd data-cevap={q.anahtar}>{metin}</dd></React.Fragment>)}
              </dl>
            </div>
          ) : null
        })}
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kapat} data-eylem="form-kapat">{h.kapat}</button></div>
      </section>
    )
  }
  if (bolum < 0) {
    return (
      <section className="uza-kart uza-dar" data-alan="hasta-formu" data-form-durumu={form.durum} data-bolum="riza">
        <h1 className="uza-h1">{h.bekliyorBaslik}</h1>
        <p className="uza-aciklama">{form.veli ? h.veliAciklama : h.bekliyorAciklama}</p>
        <div className="uza-form">
          <h2 className="uza-h2">{h.rizaBaslik}</h2>
          <p className="uza-not-metin" data-alan="form-riza">{form.riza.metin}</p>
          <label className="uza-onay">
            <input type="checkbox" name="form-riza" checked={riza} onChange={(e) => setRiza(e.target.checked)} />
            <span>{h.rizaKabul}</span>
          </label>
          <Hata>{rizaHatasi ? h.rizaGerekli : null}</Hata>
          <div className="uza-eylemler" style={{ marginTop: 0 }}>
            <button type="button" className="uza-dugme" onClick={() => git(0)} data-eylem="form-baslat">{h.baslat}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kapat} data-eylem="form-kapat">{h.kapat}</button>
          </div>
        </div>
      </section>
    )
  }
  const b = form.bolumler[Math.min(bolum, form.bolumler.length - 1)]
  const son = bolum >= form.bolumler.length - 1
  return (
    <section className="uza-kart" data-alan="hasta-formu" data-form-durumu={form.durum} data-bolum={b.anahtar} data-kayit={kayit}>
      <p className="uza-ust-yazi">{h.bekliyorBaslik} · {yerine(h.bolum, bolum + 1, form.bolumler.length)}</p>
      <h1 className="uza-h1">{b.baslik}</h1>
      <div className="uza-form">
        {b.sorular.map((q) => (
          <SoruAlani key={q.anahtar} q={q} f={f} cevap={cevaplar[q.anahtar]} ham={sayilar[q.anahtar] ?? ''} eksik={eksik.includes(q.anahtar)} degistir={(c) => degistir(q.anahtar, c)} hamDegistir={(metin) => hamDegistir(q.anahtar, metin)} />
        ))}
        <p className="uza-ipucu" role="status" data-alan="form-kayit" style={{ marginTop: 0, minHeight: '1.4em' }}>{kayit === 'kaydediliyor' ? h.kaydediliyor : kayit === 'kaydedildi' ? h.kaydedildi : ''}</p>
        <Hata>{kayit === 'hata' ? h.kaydedilemedi : gonderim === 'eksik' ? h.eksik : gonderim === 'hata' ? h.gonderilemedi : null}</Hata>
        {son ? <p className="uza-ipucu" style={{ marginTop: 0 }}>{h.gonderUyari}</p> : null}
        <div className="uza-eylemler" style={{ marginTop: 0 }}>
          {son ? <button type="button" className="uza-dugme" disabled={gonderim === 'gonderiliyor'} onClick={gonder} data-eylem="form-gonder">{gonderim === 'gonderiliyor' ? h.gonderiliyor : h.gonder}</button>
            : <button type="button" className="uza-dugme" onClick={() => git(bolum + 1)} data-eylem="form-ileri">{h.ileri}</button>}
          {bolum > 0 ? <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => git(bolum - 1)} data-eylem="form-geri">{h.geri}</button> : null}
          <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kapat} data-eylem="form-kapat">{h.kapat}</button>
        </div>
      </div>
    </section>
  )
}

/** A stored number as the text of its field. */
const sayiMetni = (c: Cevap | undefined): string => (c && typeof c === 'object' && !Array.isArray(c) && 'n' in c ? String(c.n) : '')
const sayiAlanlari = (form: HastaFormuGorunumu): Record<string, string> => Object.fromEntries(form.bolumler.flatMap((b) => b.sorular.filter((q) => q.tur === 'sayi').map((q) => [q.anahtar, sayiMetni(form.cevaplar[q.anahtar])])))

export type PortalIstegi = (yol: string, govde?: unknown, yontem?: 'GET' | 'POST' | 'PUT') => Promise<{ status: number; j: Record<string, any> }> // eslint-disable-line @typescript-eslint/no-explicit-any
/** After this long without a change, the answers are saved. */
export const KAYIT_GECIKMESI_MS = 1200

/**
 * The open form (or the last submitted one), loaded and kept by itself. `iste` is the page's own request helper:
 * same origin, the portal cookie, the link's mark. `oturumBitti` = the server no longer knows the session.
 */
export function PortalFormu({ dil, iste, kapat, oturumBitti }: { dil: DilKodu; iste: PortalIstegi; kapat: () => void; oturumBitti: () => void }) {
  const [form, setForm] = useState<HastaFormuGorunumu | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [cevaplar, setCevaplar] = useState<Cevaplar>({})
  const [sayilar, setSayilar] = useState<Record<string, string>>({})
  const [bolum, setBolum] = useState(-1)
  const [riza, setRiza] = useState(false)
  const [rizaHatasi, setRizaHatasi] = useState(false)
  const [kayit, setKayit] = useState<FormKaydi>('yok')
  const [gonderim, setGonderim] = useState<FormGonderimi>('yok')
  const [eksik, setEksik] = useState<string[]>([])
  const son = useRef<Cevaplar>({})
  const kirli = useRef(false)
  const rizaVerildi = useRef(false)
  son.current = cevaplar

  const yerlestir = useCallback((yeni: HastaFormuGorunumu, ilk: boolean) => {
    setForm(yeni)
    if (ilk) {
      setCevaplar(yeni.cevaplar); setSayilar(sayiAlanlari(yeni))
      // Consent is asked once: a form that already carries it opens on its first part.
      rizaVerildi.current = yeni.riza.kabul
      setRiza(yeni.riza.kabul); setBolum(yeni.riza.kabul ? 0 : -1)
    }
  }, [])

  useEffect(() => {
    let iptal = false
    iste(FORM_YOLU)
      .then((r) => {
        if (iptal) return
        if (r.status === 401) { oturumBitti(); return }
        if (r.status !== 200) { setYuk('hata'); return }
        if (!r.j.form) { setYuk('yok'); return }
        yerlestir(r.j.form as HastaFormuGorunumu, true); setYuk('tamam')
      })
      .catch(() => { if (!iptal) setYuk('hata') })
    return () => { iptal = true }
  }, [iste, oturumBitti, yerlestir])

  /** Saves what is on the screen now. true = saved (or nothing to save). */
  const kaydet = useCallback(async (): Promise<boolean> => {
    if (!rizaVerildi.current) return true
    kirli.current = false
    setKayit('kaydediliyor')
    try {
      const r = await iste(FORM_YOLU, { cevaplar: son.current, riza: true }, 'PUT')
      if (r.status === 401) { oturumBitti(); return false }
      if (r.status === 200 && r.j.form) { yerlestir(r.j.form as HastaFormuGorunumu, false); setKayit(kirli.current ? 'kaydediliyor' : 'kaydedildi'); return true }
      // Submitted or withdrawn from elsewhere a moment ago: show what the server has now.
      if (r.status === 404) { const g = await iste(FORM_YOLU); if (g.status === 200 && g.j.form) yerlestir(g.j.form as HastaFormuGorunumu, true); else setYuk('yok'); return false }
    } catch { /* said below */ }
    kirli.current = true
    setKayit('hata')
    return false
  }, [iste, oturumBitti, yerlestir])

  // SAVED AS THEY GO: a moment after the last change.
  useEffect(() => {
    if (!kirli.current || !rizaVerildi.current) return
    const z = window.setTimeout(() => { if (kirli.current) void kaydet() }, KAYIT_GECIKMESI_MS)
    return () => window.clearTimeout(z)
  }, [cevaplar, kaydet])

  // … and AT ONCE when the page is left: another app, a locked phone, a closed tab. A patient who answers the last
  // question and puts the phone down has not pressed anything; the moment above may never come.
  useEffect(() => {
    const birak = () => { if (kirli.current && rizaVerildi.current) void kaydet() }
    const gizlendi = () => { if (document.visibilityState === 'hidden') birak() }
    document.addEventListener('visibilitychange', gizlendi)
    window.addEventListener('pagehide', birak)
    return () => { document.removeEventListener('visibilitychange', gizlendi); window.removeEventListener('pagehide', birak) }
  }, [kaydet])

  function degistir(anahtar: string, c: Cevap | undefined) {
    kirli.current = true
    setEksik((e) => e.filter((x) => x !== anahtar)); setGonderim('yok')
    setCevaplar((eski) => { const yeni = { ...eski }; if (c === undefined) delete yeni[anahtar]; else yeni[anahtar] = c; return yeni })
  }

  async function git(hedef: number) {
    if (!rizaVerildi.current) {
      if (!riza) { setRizaHatasi(true); return }
      // The consent is stored with the first save, before any question is shown.
      rizaVerildi.current = true
      if (!(await kaydet())) { rizaVerildi.current = false; return }
    } else if (kirli.current) void kaydet()
    setBolum(hedef)
    window.scrollTo?.(0, 0)
  }

  async function gonder() {
    if (!form) return
    setGonderim('gonderiliyor'); setEksik([])
    try {
      const r = await iste(FORM_YOLU, { cevaplar: son.current, riza: true }, 'POST')
      if (r.status === 401) { oturumBitti(); return }
      if (r.status === 200 && r.j.form) { kirli.current = false; yerlestir(r.j.form as HastaFormuGorunumu, true); setGonderim('yok'); window.scrollTo?.(0, 0); return }
      if (r.j.code === 'EKSIK' && Array.isArray(r.j.eksik)) {
        const anahtarlar = (r.j.eksik as unknown[]).filter((x): x is string => typeof x === 'string')
        setEksik(anahtarlar); setGonderim('eksik')
        // The part that holds the first unanswered question is shown.
        const i = form.bolumler.findIndex((b) => b.sorular.some((q) => anahtarlar.includes(q.anahtar)))
        if (i >= 0) setBolum(i)
        return
      }
    } catch { /* said below */ }
    setGonderim('hata')
  }

  async function kapatVeKaydet() {
    if (kirli.current && rizaVerildi.current) await kaydet()
    kapat()
  }

  const f = formMetni(form?.dil ?? dil)
  if (yuk !== 'tamam' || !form) {
    return (
      <section className="uza-kart uza-dar" data-alan="hasta-formu" data-form-durumu={yuk}>
        <h1 className="uza-h1">{f.hasta.bekliyorBaslik}</h1>
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{portalMetni(dil).giris.yukleniyor}</p> : yuk === 'hata' ? <div style={{ marginTop: 12 }}><Hata>{portalMetni(dil).giris.hata}</Hata></div> : null}
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kapat} data-eylem="form-kapat">{f.hasta.kapat}</button></div>
      </section>
    )
  }
  return (
    <HastaFormuGorunumu f={f} form={form} cevaplar={cevaplar} sayilar={sayilar} bolum={bolum} riza={riza} setRiza={(r) => { setRiza(r); setRizaHatasi(false) }} rizaHatasi={rizaHatasi}
      kayit={kayit} gonderim={gonderim} eksik={eksik} degistir={degistir} hamDegistir={(k, metin) => setSayilar((s) => ({ ...s, [k]: metin }))}
      git={(b) => { void git(b) }} gonder={() => { void gonder() }} kapat={() => { void kapatVeKaydet() }} />
  )
}
