'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /visit: a visit, from the microphone to the transcript. One address, by its parameter:
 *
 *   (none)            choose the patient                         → ?hasta=<id>
 *   ?hasta=<id>       the recording consent, the recording itself. With &randevu=<id> (NOTYA-UZ-RANDEVU-01) the visit is
 *                     started FROM AN APPOINTMENT: it is shown here, and the stored visit is linked to it.
 *                     The recording consent and the recording are the same. The note template is not a choice: it is the
 *                     account's ROLE (NOTYA-UZ-BRANSLAR-01), or the general template for an account without one
 *   ?seans=<id>       a recorded visit: what was heard, in which language, how sure the engine was
 *   ?not=<id>         the visit's note: draft, second draft in the other language, approval (./Not.tsx)
 *
 * After the recording is transcribed the note is written straight away and the note opens. If the note cannot be
 * written, the recorded visit opens instead: the transcript is kept, and the note can be asked for again there.
 *
 * RECORDING. Nothing is recorded until the consent box is ticked: the button is disabled, and the server refuses a
 * visit without it as well. The audio is held in the browser while it records, uploaded once to the doctor's own
 * folder of the recordings bucket, transcribed by the server and removed there. It is never kept.
 *
 * The server answers with codes; every sentence here is the catalogue's, in the account's language.
 */
import React, { useEffect, useRef, useState } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { saatGoster } from '@/lib/ulke/arayuz/bicim'
import { MUAYENE_SES_KOVASI } from '@/lib/ulke/tipler'
import { sesKlasoru } from '@/lib/ulke/uygulama/tablolar'
import { AramaFormu } from './Bugun'
import { Bilgi, Cerceve, Hata, tarihYaz, saatYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { tamAd, type HastaKaydi } from './Hastalar'
import { Not } from './Not'
import { asistanAdi } from './Asistan'
import { HastaFormuKarti } from './HastaFormuKarti'
import { MuayeneMotorPaneli } from './MuayeneMotorPaneli'
import { EklerAdimi } from './Ekler'
import type { EkGonderimi } from '@/lib/ulke/belgeler/ekler'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { Ipucu } from './Ipucu'
import { SeansSayfasi, SeansKarti, SeansBanner, SeansEtiketi, SeansBaslatDugmesi, SeansAyirac, SeansYuklemeKutusu, SeansKayitKarti, SeansEylemSatiri, SeansIsleniyorKarti } from '@/components/doktor/SeansKurulumu'
import { gunBasligi, muayeneBaslatilabilir, takvimYolu, type RandevuKaydi } from './randevuOrtak'
import { metninDili, randevuMetni, rolAdi, genelSablon, sablonMu, type UygulamaMetni } from '@/lib/ulke/arayuz'

export type KonusmaOzeti = { dil: string; dilKesin: boolean; ikinciGecis: boolean; dusukGuven: boolean }
export type MuayeneDetayi = {
  seansId: string; baslangic: string; sablon: string; metin: string
  hasta: { id: string; ad: string; otaIsmi: string; dogumTarihi: string } | null
  notId: string | null; notDurumu: 'taslak' | 'onayli' | 'notsuz'; konusma: KonusmaOzeti | null; rizaAt?: string | null; rizaSurumu?: string | null
}

/** A code of the visit API (or of the browser) → the catalogue's sentence for it. Unknown codes get the general one. */
export function muayeneHataMetni(m: UygulamaMetni, kod: string | null): string | null {
  if (!kod) return null
  const v = m.muayene
  const harita: Record<string, string> = {
    RIZA_GEREKLI: v.rizaGerekli, KISA_KAYIT: v.kisaKayit, SES_OKUNAMADI: v.sesOkunamadi, LIMIT: v.limit, HAZIR_DEGIL: v.hazirDegil,
    NOT_FOUND: m.hasta.bulunamadi, MIKROFON: v.mikrofonYok, BAGLANTI: m.kabuk.baglanti, NOT_YAZILAMADI: v.notYazilamadi,
    SES_BUYUK: v.sesBuyuk, SES_TUR: v.sesTur,
  }
  return harita[kod] ?? m.kabuk.hata
}

/** A template named for a person: the role's name in the screen's form, or "General". The key itself is never shown. */
export const sablonAdi = (m: UygulamaMetni, s: string): string => rolAdi(s, metninDili(m)) ?? m.muayene.sablonGenel

/** The template an account's visits are written with: its role's, or the general one while it has no role. */
export const hesapSablonu = (rol: string | null | undefined): string => (rol && sablonMu(rol) ? rol : genelSablon())

/** The language of a visit, named in the screen's language; "not determined" when the engine was not sure. */
export function konusmaDiliAdi(m: UygulamaMetni, k: KonusmaOzeti | null): string {
  if (!k || !k.dil) return ''
  if (!k.dilKesin) return m.muayene.dilKarma
  return Object.prototype.hasOwnProperty.call(m.muayene.konusmaDili, k.dil) ? m.muayene.konusmaDili[k.dil] : m.muayene.dilBaska
}

/** NOTYA-ULKE-INTAKE-01: true = the country has the intake form (which needs the portal). */
const formAcik = (): boolean => ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu')

// Türkiye's timer form (m:ss), so the recording card reads the same.
const sureYaz = (sn: number) => `${Math.floor(sn / 60)}:${String(sn % 60).padStart(2, '0')}`

// ───────────────────────── choose the patient ─────────────────────────

export function HastaSecGorunumu({ m, q, hastalar, hata }: { m: UygulamaMetni; q: string; hastalar: HastaKaydi[] | null; hata: boolean }) {
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <h1 className="uza-h1">{m.muayene.baslik}</h1>
          <Ipucu m={m} bolum="muayene" />
        </span>
        <a className="uza-dugme uza-dugme-cizgi" href={YOL.yeniHasta}>{m.muayene.yeniHasta}</a>
      </div>
      <p className="uza-aciklama" style={{ marginBottom: 14 }}>{m.muayene.hastaSec}</p>
      <AramaFormu m={m} q={q} hedef={YOL.muayene} />
      <Hata>{hata ? m.kabuk.hata : null}</Hata>
      {hastalar === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : hastalar.length === 0 ? (
        <p className="uza-bos">{q ? m.arama.sonucYok : m.hastalar.bos}</p>
      ) : (
        <ul className="uza-liste" style={{ marginTop: 10 }}>
          {hastalar.map((h) => (
            <li key={h.id}>
              <a className="uza-satir" href={`${YOL.muayene}?hasta=${h.id}`}>
                <span className="uza-liste-ad">
                  {tamAd(h)}
                  <span className="uza-liste-alt">{[tarihYaz(h.dogumTarihi), h.telefon].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="uza-rozet">{m.bugun.muayeneBaslat}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ───────────────────────── consent and recording ─────────────────────────

export type KayitDurumu = 'hazir' | 'kayit' | 'yukleniyor' | 'isleniyor'

const SES_AZAMI = 25 * 1024 * 1024

export function KayitGorunumu({ m, hasta, sablon, riza, setRiza, durum, sure, hataKodu, baslat, durdur, vazgec, rol, randevu, dosyaSec, children }: {
  /** Under the card, inside the page (the intake form the patient wrote). */
  children?: React.ReactNode
  /** NOTYA-UZ-RANDEVU-01: the appointment this visit is started from, if any — shown, and where "back" leads. */
  randevu?: Pick<RandevuKaydi, 'id' | 'gun' | 'saat'> | null
  m: UygulamaMetni; hasta: Pick<HastaKaydi, 'id' | 'ad' | 'otaIsmi'>; /** The template the note will be written with: shown, not chosen. */ sablon: string
  riza: boolean; setRiza: (r: boolean) => void; durum: KayitDurumu; sure: number; hataKodu: string | null
  baslat: () => void; durdur: () => void; vazgec: () => void
  /** An audio file the doctor already has. Same consent and the same upload as a recording just made. */
  dosyaSec?: (dosya: File) => void
  /** NOTYA-UZ-BRANSLAR-01: the account's role — names the assistant that will prepare the note. No role = the neutral assistant. */
  rol?: string | null
}) {
  const v = m.muayene
  const geriHref = randevu ? takvimYolu({ randevu: randevu.id }) : `${YOL.hasta}?id=${hasta.id}`
  const hata = muayeneHataMetni(m, hataKodu)
  const gizliBaslik = (
    <>
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{tamAd(hasta)}</h1>
      <p style={{ display: 'none' }} data-alan="asistan">{m.asistan.qayd}: <span data-alan="asistan-ad">{asistanAdi(m, rol)}</span></p>
    </>
  )
  const ust = (
    <>
      <SeansBanner metin={tamAd(hasta)} alt={`${m.asistan.qayd}: ${asistanAdi(m, rol)}`} />
      {gizliBaslik}
      {randevu ? <p style={{ margin: '0 0 14px', fontSize: 13, color: '#8b7d70' }} data-alan="randevu">{randevuMetni(metninDili(m)).randevu.baslik}: {gunBasligi(randevuMetni(metninDili(m)), randevu.gun)} · {saatGoster(randevu.saat)}</p> : null}
    </>
  )
  // Türkiye's "new visit" screen (app/session/new, step setup): its page, header row, cream card, banner, big dark button and
  // dashed boxes are drawn by components/doktor/SeansKurulumu.tsx. Every sentence here is the catalogue's.
  return (
    <SeansSayfasi geri={m.kabuk.geri} geriHref={geriHref} baslik={v.baslik} ipucu={<Ipucu m={m} bolum="muayene" />} genis={false}>
      {durum === 'hazir' ? (
      <SeansKarti>
        {ust}
        <div>
          <SeansEtiketi>{v.sablon}</SeansEtiketi>
          <dl className="uza-seans-sablon" style={{ margin: '0 0 18px', fontSize: 14, color: '#3b2e24' }}><style>{'.uza-seans-sablon dd{margin:0}'}</style><dd data-alan="sablon">{sablonAdi(m, sablon)}</dd></dl>
          <label className="uza-onay" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#3b2e24', lineHeight: 1.45, marginBottom: 16 }}>
            <input type="checkbox" name="riza" checked={riza} onChange={(e) => setRiza(e.target.checked)} />
            <span>{v.riza}</span>
          </label>
          <Hata>{hata}</Hata>
          <SeansBaslatDugmesi onClick={baslat} disabled={!riza}>{'\u{1F399}\uFE0F'} {v.kayitBaslat}</SeansBaslatDugmesi>
          {riza ? null : <p className="uza-ipucu" id="uza-riza-ipucu" style={{ textAlign: 'center' }}>{v.rizaGerekli}</p>}
          {dosyaSec ? (
            <div data-alan="ses-dosyasi" data-yazdirma-gizle>
              <SeansAyirac>{v.yada}</SeansAyirac>
              <SeansYuklemeKutusu id="uza-ses-dosyasi" etiket={v.sesDosyasi} accept="audio/*" disabled={!riza || durum !== 'hazir'} onDosya={dosyaSec} />
              <p className="uza-ipucu" style={{ textAlign: 'center' }}>{v.sesDosyasiIzoh}</p>
            </div>
          ) : null}
        </div>
      </SeansKarti>
      ) : durum === 'kayit' ? (
        <div role="status">
          {/* Türkiye's recording card (components/doktor/SeansKurulumu.tsx): icon disc, timer, status line, cancel / finish row. */}
          <SeansKayitKarti aktif sure={sureYaz(sure)} ust={ust}
            durum={<><span className="uza-nabiz" aria-hidden="true" />{v.kaydediliyor}</>}>
            <SeansEylemSatiri vazgecMetni={v.vazgec} onVazgec={vazgec} bitirMetni={<>{'\u23F9'} {v.kayitDurdur}</>} onBitir={durdur} />
          </SeansKayitKarti>
        </div>
      ) : (
        <>
          {gizliBaslik}
          <SeansIsleniyorKarti rol="status" baslik={durum === 'yukleniyor' ? v.yukleniyor : v.isleniyor} />
        </>
      )}
      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </SeansSayfasi>
  )
}

function YeniMuayene({ u, hastaId, randevuId }: { u: ReturnType<typeof useUygulama>; hastaId: string; /** NOTYA-UZ-RANDEVU-01: '' = a visit without an appointment. */ randevuId: string }) {
  const [hasta, setHasta] = useState<HastaKaydi | null>(null)
  const [randevu, setRandevu] = useState<RandevuKaydi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'randevu-yok' | 'hata' | 'tamam'>('yukleniyor')
  const [riza, setRiza] = useState(false)
  const [durum, setDurum] = useState<KayitDurumu>('hazir')
  const [sure, setSure] = useState(0)
  const [hataKodu, setHataKodu] = useState<string | null>(null)
  const kayitci = useRef<MediaRecorder | null>(null)
  const akis = useRef<MediaStream | null>(null)
  const parcalar = useRef<Blob[]>([])
  const sayac = useRef<ReturnType<typeof setInterval> | null>(null)
  const { hesap, api } = u
  // The template is the account's role. The server checks it again: another role's template is refused there.
  const sablon = hesapSablonu(hesap?.rol)

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    ;(async () => {
      try {
        const r = await api(`/api/ulke/hasta?id=${encodeURIComponent(hastaId)}`)
        if (iptal) return
        if (!r.ok || !r.j.hasta) { setYuk(r.status === 404 ? 'yok' : 'hata'); return }
        if (randevuId) {
          // The appointment is checked BEFORE anything is recorded: it must exist for this doctor, be this patient's
          // and still be one a visit can start from. Otherwise nothing is recorded "for" it at all.
          const a = await api(`/api/ulke/randevu?id=${encodeURIComponent(randevuId)}`)
          if (iptal) return
          const x = a.ok ? (a.j.randevu as RandevuKaydi | undefined) : undefined
          if (!x || x.hastaId !== hastaId || !muayeneBaslatilabilir(x)) { setYuk(a.ok || a.status === 404 ? 'randevu-yok' : 'hata'); return }
          setRandevu(x)
        }
        setHasta(r.j.hasta); setYuk('tamam')
      } catch { if (!iptal) setYuk('hata') }
    })()
    return () => { iptal = true }
  }, [hesap, api, hastaId, randevuId])

  const birak = () => {
    if (sayac.current) { clearInterval(sayac.current); sayac.current = null }
    akis.current?.getTracks().forEach((t) => t.stop())
    akis.current = null
  }
  // Leaving the page stops the microphone.
  useEffect(() => () => { try { if (kayitci.current && kayitci.current.state !== 'inactive') { kayitci.current.onstop = null; kayitci.current.stop() } } catch { /* already stopped */ } birak() }, [])

  async function baslat() {
    if (!riza) { setHataKodu('RIZA_GEREKLI'); return }
    setHataKodu(null)
    try {
      akis.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch { setHataKodu('MIKROFON'); return }
    try {
      const tur = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t))
      const k = new MediaRecorder(akis.current, tur ? { mimeType: tur } : undefined)
      parcalar.current = []
      k.ondataavailable = (e) => { if (e.data.size) parcalar.current.push(e.data) }
      k.start(1000)
      kayitci.current = k
    } catch { birak(); setHataKodu('MIKROFON'); return }
    setSure(0)
    sayac.current = setInterval(() => setSure((s) => s + 1), 1000)
    setDurum('kayit')
  }

  function vazgec() {
    const k = kayitci.current
    if (k && k.state !== 'inactive') { k.onstop = null; k.stop() }
    parcalar.current = []
    birak()
    setDurum('hazir')
  }

  function durdur() {
    const k = kayitci.current
    if (!k || k.state === 'inactive') { vazgec(); return }
    k.onstop = () => { void gonder(new Blob(parcalar.current, { type: k.mimeType || 'audio/webm' })) }
    k.stop()
    birak()
    setDurum('yukleniyor')
  }

  function dosyaSec(dosya: File) {
    if (!riza) { setHataKodu('RIZA_GEREKLI'); return }
    if (!dosya.type.startsWith('audio/')) { setHataKodu('SES_TUR'); return }
    if (dosya.size > SES_AZAMI) { setHataKodu('SES_BUYUK'); return }
    setHataKodu(null)
    setDurum('yukleniyor')
    void gonder(dosya)
  }

  async function gonder(ses: Blob) {
    const geri = (kod: string) => { parcalar.current = []; setHataKodu(kod); setDurum('hazir') }
    try {
      const supabase = ulkeIstemciSupabase()
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
      const hesapId = data.session?.user?.id
      if (!supabase || !hesapId) { u.cikis(); return }
      // The recording goes to the doctor's OWN folder; the storage policy accepts nothing else.
      const ad = (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      const uzanti = ses.type.includes('mp4') || ses.type.includes('m4a') ? 'm4a' : ses.type.includes('mpeg') || ses.type.includes('mp3') ? 'mp3' : ses.type.includes('wav') ? 'wav' : ses.type.includes('ogg') ? 'ogg' : 'webm'
      const yol = `${sesKlasoru(hesapId)}/${ad}.${uzanti}`
      const { error } = await supabase.storage.from(MUAYENE_SES_KOVASI).upload(yol, ses, { contentType: ses.type || 'audio/webm' })
      if (error) { geri('SES_OKUNAMADI'); return }
      setDurum('isleniyor')
      const r = await api('/api/ulke/muayene', { method: 'POST', govde: { yol, hastaId, sablon, riza: true, ...(randevu ? { randevuId: randevu.id } : {}) } })
      if (!r.ok || !r.j.seansId) { geri(typeof r.j.code === 'string' ? r.j.code : 'BASARISIZ'); return }
      // The visit is saved. NOTYA-ULKE-EKLER-01: before its note is written, the "add documents" step (always shown; one
      // click skips it). The visit is saved, so a reload of that step loses nothing.
      // AU-LAUNCH-01: the step reads images with the model, so it exists only where the pack switches `goruntuDegerlendirme` on.
      window.location.assign(`${YOL.muayene}?seans=${r.j.seansId}${ozellikAcik('goruntuDegerlendirme') ? '&ekler=1' : ''}`)
    } catch { geri('BAGLANTI') }
  }

  if (yuk !== 'tamam' || !hasta) {
    return (
      <Cerceve dil={u.dil} m={u.m} ad={u.hesap?.ad} aktif="bugun" cikis={u.cikis}><section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.hasta.bulunamadi : yuk === 'randevu-yok' ? randevuMetni(u.dil).randevu.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={yuk === 'randevu-yok' ? takvimYolu() : YOL.muayene}>{u.m.kabuk.geri}</a></p>}
      </section></Cerceve>
    )
  }
  return (
    <>
      <KayitGorunumu m={u.m} hasta={hasta} sablon={sablon} randevu={randevu} riza={riza} setRiza={(r) => { setRiza(r); setHataKodu(null) }} durum={durum} sure={sure} hataKodu={hataKodu} baslat={baslat} durdur={durdur} vazgec={vazgec} rol={u.hesap?.rol} dosyaSec={dosyaSec}>
        {/* NOTYA-ULKE-INTAKE-01: what the patient wrote before the visit, to read while it is recorded. Never sent to the model. */}
        {formAcik() ? <HastaFormuKarti u={u} hastaId={hasta.id} mod="muayene" /> : null}
        {/* AU gold depth / pack muayeneMotorlari — per-role visit prompts when the pack declares them. */}
        <MuayeneMotorPaneli rol={u.hesap?.rol} hastaId={hasta.id} />
      </KayitGorunumu>
    </>
  )
}

// ───────────────────────── a recorded visit ─────────────────────────

/** The notices about how the recording was heard: a second pass ran; confidence stayed low. Plain sentences. */
export function KonusmaBildirimleri({ m, k }: { m: UygulamaMetni; k: KonusmaOzeti | null }) {
  if (!k) return null
  return (
    <>
      {k.dusukGuven ? <div role="alert" className="uza-uyari-kutu" data-bildirim="dusuk-guven">{m.muayene.dusukGuven}</div> : null}
      {k.ikinciGecis ? <p className="uza-ipucu" data-bildirim="ikinci-gecis">{m.muayene.ikinciGecis}</p> : null}
    </>
  )
}

export function MuayeneOzetiGorunumu({ m, muayene, children }: { m: UygulamaMetni; muayene: MuayeneDetayi; children?: React.ReactNode }) {
  const dil = konusmaDiliAdi(m, muayene.konusma)
  return (
    <>
      <section className="uza-kart">
        <p className="uza-ust-yazi">{m.muayene.baslik} · {tarihYaz(muayene.baslangic)} {saatYaz(muayene.baslangic)}</p>
        <h1 className="uza-h1">{muayene.hasta ? tamAd(muayene.hasta) : m.bugun.hastasiz}</h1>
        <dl className="uza-bilgiler">
          <dt>{m.muayene.sablon}</dt><dd>{sablonAdi(m, muayene.sablon)}</dd>
          {dil ? <><dt>{m.muayene.taninanDil}</dt><dd>{dil}</dd></> : null}
        </dl>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <KonusmaBildirimleri m={m} k={muayene.konusma} />
        </div>
        {children}
        {muayene.hasta ? <p className="uza-ipucu" style={{ marginTop: 14 }}><a className="uza-baglanti" href={`${YOL.hasta}?id=${muayene.hasta.id}`}>{m.not.dosyayaDon}</a></p> : null}
      </section>
      <section className="uza-kart">
        <h2 className="uza-h2">{m.not.transkript}</h2>
        <Bilgi>{m.muayene.metinKaydedildi}</Bilgi>
        <p className="uza-not-metin" style={{ marginTop: 12 }} data-alan="transkript">{muayene.metin}</p>
      </section>
    </>
  )
}

/** On a recorded visit: open its note, or — when it has none — ask for it (again). */
export function NotEylemi({ m, muayene, yaziliyor, yazilamadi, yaz }: { m: UygulamaMetni; muayene: MuayeneDetayi; yaziliyor: boolean; yazilamadi: boolean; yaz: () => void }) {
  if (muayene.notId) return <div className="uza-eylemler"><a className="uza-dugme" href={`${YOL.muayene}?not=${muayene.notId}`}>{m.muayene.notuAc}</a></div>
  return (
    <div style={{ marginTop: 14 }}>
      <Hata>{yazilamadi ? m.muayene.notYazilamadi : null}</Hata>
      <div className="uza-eylemler" style={{ marginTop: yazilamadi ? 10 : 0 }}>
        <button type="button" className="uza-dugme" disabled={yaziliyor} onClick={yaz} data-eylem="not-yaz">{yaziliyor ? m.muayene.notYaziliyor : yazilamadi ? m.muayene.yenidenDene : m.muayene.notHazirla}</button>
      </div>
    </div>
  )
}

function KayitliMuayene({ u, seansId, yazilamadiBaslangic }: { u: ReturnType<typeof useUygulama>; seansId: string; yazilamadiBaslangic: boolean }) {
  const [muayene, setMuayene] = useState<MuayeneDetayi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [yaziliyor, setYaziliyor] = useState(false)
  const [yazilamadi, setYazilamadi] = useState(yazilamadiBaslangic)
  const { hesap, api } = u
  async function yaz() {
    setYaziliyor(true); setYazilamadi(false)
    try {
      const r = await api('/api/ulke/not', { method: 'POST', govde: { seansId } })
      if (r.ok && typeof r.j.notId === 'string') { window.location.assign(`${YOL.muayene}?not=${r.j.notId}`); return }
    } catch { /* shown below */ }
    setYazilamadi(true); setYaziliyor(false)
  }
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`/api/ulke/muayene?id=${encodeURIComponent(seansId)}`)
      .then((r) => { if (iptal) return; if (r.ok && r.j.muayene) { setMuayene(r.j.muayene); setYuk('tamam') } else setYuk(r.status === 404 ? 'yok' : 'hata') })
      .catch(() => { if (!iptal) setYuk('hata') })
    return () => { iptal = true }
  }, [hesap, api, seansId])
  if (yuk === 'tamam' && muayene) return (
    <>
      <MuayeneOzetiGorunumu m={u.m} muayene={muayene}><NotEylemi m={u.m} muayene={muayene} yaziliyor={yaziliyor} yazilamadi={yazilamadi && !muayene.notId} yaz={yaz} /></MuayeneOzetiGorunumu>
      {formAcik() && muayene.hasta ? <HastaFormuKarti u={u} hastaId={muayene.hasta.id} mod="muayene" /> : null}
    </>
  )
  return (
    <section className="uza-kart">
      {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.muayene.bulunamadi : u.m.kabuk.hata}</Hata>}
      {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.bugun}>{u.m.kabuk.geri}</a></p>}
    </section>
  )
}

/**
 * NOTYA-ULKE-EKLER-01 — /visit?seans=<id>&ekler=1: the "add documents" step of a recorded visit that has no note yet.
 * A visit that already has a note opens that note instead. Writing the note posts the documents with the visit.
 */
function EklerSeansi({ u, seansId }: { u: ReturnType<typeof useUygulama>; seansId: string }) {
  const [muayene, setMuayene] = useState<MuayeneDetayi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`/api/ulke/muayene?id=${encodeURIComponent(seansId)}`)
      .then((r) => {
        if (iptal) return
        const x = r.ok ? (r.j.muayene as MuayeneDetayi | undefined) : undefined
        if (!x) { setYuk(r.status === 404 ? 'yok' : 'hata'); return }
        if (x.notId) { window.location.replace(`${YOL.muayene}?not=${x.notId}`); return }
        setMuayene(x); setYuk('tamam')
      })
      .catch(() => { if (!iptal) setYuk('hata') })
    return () => { iptal = true }
  }, [hesap, api, seansId])
  if (yuk === 'tamam' && muayene) {
    const yaz = async (ekler: EkGonderimi[]): Promise<boolean> => {
      const n = await api('/api/ulke/not', { method: 'POST', govde: { seansId, ...(ekler.length ? { ekler } : {}) } })
      if (!n.ok || typeof n.j.notId !== 'string') return false
      window.location.assign(`${YOL.muayene}?not=${n.j.notId}`)
      return true
    }
    return <EklerAdimi m={u.m} api={api} seansId={seansId} hastaAdi={muayene.hasta ? tamAd(muayene.hasta) : ''} yaz={yaz} hataMetni={u.m.muayene.notYazilamadi} />
  }
  return (
    <section className="uza-kart">
      {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.muayene.bulunamadi : u.m.kabuk.hata}</Hata>}
      {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.bugun}>{u.m.kabuk.geri}</a></p>}
    </section>
  )
}

function HastaSec({ u, q }: { u: ReturnType<typeof useUygulama>; q: string }) {
  const [hastalar, setHastalar] = useState<HastaKaydi[] | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`/api/ulke/hastalar${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then((r) => { if (iptal) return; if (r.ok && Array.isArray(r.j.hastalar)) setHastalar(r.j.hastalar); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [hesap, api, q])
  return <HastaSecGorunumu m={u.m} q={q} hastalar={hastalar} hata={hata} />
}

export default function Muayene() {
  const u = useUygulama('muayene')
  const [param, setParam] = useState<{ hasta: string; seans: string; not: string; q: string; xato: string; randevu: string; ekler: string } | null>(null)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setParam({ hasta: p.get('hasta') ?? '', seans: p.get('seans') ?? '', not: p.get('not') ?? '', q: p.get('q') ?? '', xato: p.get('xato') ?? '', randevu: p.get('randevu') ?? '', ekler: p.get('ekler') ?? '' })
  }, [])
  if (!u.hesap || !param) return <Yukleniyor m={u.m} dil={u.dil} />
  if (param.hasta && !param.seans && !param.not) return <YeniMuayene u={u} hastaId={param.hasta} randevuId={param.randevu} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="bugun" cikis={u.cikis}>
      {param.not ? <Not u={u} notId={param.not} /> : param.seans ? (param.ekler === '1' && ozellikAcik('goruntuDegerlendirme') ? <EklerSeansi u={u} seansId={param.seans} /> : <KayitliMuayene u={u} seansId={param.seans} yazilamadiBaslangic={param.xato === 'not'} />) : param.hasta ? <YeniMuayene u={u} hastaId={param.hasta} randevuId={param.randevu} /> : <HastaSec u={u} q={param.q} />}
    </Cerceve>
  )
}
