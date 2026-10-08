'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /visit: a visit, from the microphone to the transcript. One address, by its parameter:
 *
 *   (none)            choose the patient                         → ?hasta=<id>
 *   ?hasta=<id>       the note template, the recording consent, the recording itself
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
import { MUAYENE_SES_KOVASI } from '@/lib/ulke/tipler'
import { UZ_ACIK_SABLONLAR, type UzSablon } from '../klinik/branslar'
import { AramaFormu } from './Bugun'
import { Bilgi, Cerceve, Hata, Secim, tarihYaz, saatYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { tamAd, type HastaKaydi } from './Hastalar'
import { Not } from './Not'
import type { UygulamaMetni } from './metinler'

export type KonusmaOzeti = { dil: string; dilKesin: boolean; ikinciGecis: boolean; dusukGuven: boolean }
export type MuayeneDetayi = {
  seansId: string; baslangic: string; sablon: string; metin: string
  hasta: { id: string; ad: string; otaIsmi: string; dogumTarihi: string } | null
  notId: string | null; notDurumu: 'taslak' | 'onayli' | 'notsuz'; konusma: KonusmaOzeti | null
}

/** A code of the visit API (or of the browser) → the catalogue's sentence for it. Unknown codes get the general one. */
export function muayeneHataMetni(m: UygulamaMetni, kod: string | null): string | null {
  if (!kod) return null
  const v = m.muayene
  const harita: Record<string, string> = {
    RIZA_GEREKLI: v.rizaGerekli, KISA_KAYIT: v.kisaKayit, SES_OKUNAMADI: v.sesOkunamadi, LIMIT: v.limit, HAZIR_DEGIL: v.hazirDegil,
    NOT_FOUND: m.hasta.bulunamadi, MIKROFON: v.mikrofonYok, BAGLANTI: m.kabuk.baglanti, NOT_YAZILAMADI: v.notYazilamadi,
  }
  return harita[kod] ?? m.kabuk.hata
}

export const sablonAdi = (m: UygulamaMetni, s: string): string => (s === 'pediatri' ? m.muayene.sablonPediatri : m.muayene.sablonGenel)

/** The language of a visit, named in the screen's language; "not determined" when the engine was not sure. */
export function konusmaDiliAdi(m: UygulamaMetni, k: KonusmaOzeti | null): string {
  if (!k || !k.dil) return ''
  if (!k.dilKesin) return m.muayene.dilKarma
  return k.dil === 'uz' ? m.muayene.dilUz : k.dil === 'ru' ? m.muayene.dilRu : m.muayene.dilBaska
}

/** Under 18 on the day of the visit → the pediatric template is offered first. */
export function varsayilanSablon(dogumTarihi: string, bugun: Date = new Date()): UzSablon {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi) || !UZ_ACIK_SABLONLAR.includes('pediatri')) return UZ_ACIK_SABLONLAR[0]
  const [y, a, g] = dogumTarihi.split('-').map(Number)
  let yas = bugun.getUTCFullYear() - y
  if (bugun.getUTCMonth() + 1 < a || (bugun.getUTCMonth() + 1 === a && bugun.getUTCDate() < g)) yas -= 1
  return yas >= 0 && yas < 18 ? 'pediatri' : UZ_ACIK_SABLONLAR[0]
}

const sureYaz = (sn: number) => `${String(Math.floor(sn / 60)).padStart(2, '0')}:${String(sn % 60).padStart(2, '0')}`

// ───────────────────────── choose the patient ─────────────────────────

export function HastaSecGorunumu({ m, q, hastalar, hata }: { m: UygulamaMetni; q: string; hastalar: HastaKaydi[] | null; hata: boolean }) {
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <h1 className="uza-h1">{m.muayene.baslik}</h1>
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

export function KayitGorunumu({ m, hasta, sablon, setSablon, riza, setRiza, durum, sure, hataKodu, baslat, durdur, vazgec }: {
  m: UygulamaMetni; hasta: Pick<HastaKaydi, 'id' | 'ad' | 'otaIsmi'>; sablon: UzSablon; setSablon: (s: UzSablon) => void
  riza: boolean; setRiza: (r: boolean) => void; durum: KayitDurumu; sure: number; hataKodu: string | null
  baslat: () => void; durdur: () => void; vazgec: () => void
}) {
  const v = m.muayene
  return (
    <section className="uza-kart uza-dar">
      <p className="uza-ust-yazi">{v.baslik}</p>
      <h1 className="uza-h1">{tamAd(hasta)}</h1>
      {durum === 'hazir' ? (
        <div className="uza-form">
          <Secim etiket={v.sablon} ad="sablon" deger={sablon} sec={setSablon} secenekler={UZ_ACIK_SABLONLAR.map((s) => ({ deger: s, ad: sablonAdi(m, s) }))} />
          <label className="uza-onay">
            <input type="checkbox" name="riza" checked={riza} onChange={(e) => setRiza(e.target.checked)} />
            <span>{v.riza}</span>
          </label>
          <Hata>{muayeneHataMetni(m, hataKodu)}</Hata>
          <div>
            {/* Recording cannot start before consent: the button is disabled, and the reason is written under it. */}
            <button type="button" className="uza-dugme" disabled={!riza} onClick={baslat}>{v.kayitBaslat}</button>
            {riza ? null : <p className="uza-ipucu" id="uza-riza-ipucu">{v.rizaGerekli}</p>}
          </div>
          <p className="uza-ipucu"><a className="uza-baglanti" href={`${YOL.hasta}?id=${hasta.id}`}>{m.kabuk.geri}</a></p>
        </div>
      ) : durum === 'kayit' ? (
        <div className="uza-kayit" role="status">
          <p><span className="uza-nabiz" aria-hidden="true" />{v.kaydediliyor}</p>
          <p className="uza-sure" aria-live="off">{sureYaz(sure)}</p>
          <div className="uza-eylemler" style={{ justifyContent: 'center', marginTop: 0 }}>
            <button type="button" className="uza-dugme" onClick={durdur}>{v.kayitDurdur}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={vazgec}>{v.vazgec}</button>
          </div>
        </div>
      ) : (
        <div className="uza-kayit" role="status">
          <p>{durum === 'yukleniyor' ? v.yukleniyor : v.isleniyor}</p>
        </div>
      )}
    </section>
  )
}

function YeniMuayene({ u, hastaId }: { u: ReturnType<typeof useUygulama>; hastaId: string }) {
  const [hasta, setHasta] = useState<HastaKaydi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [sablon, setSablon] = useState<UzSablon>(UZ_ACIK_SABLONLAR[0])
  const [riza, setRiza] = useState(false)
  const [durum, setDurum] = useState<KayitDurumu>('hazir')
  const [sure, setSure] = useState(0)
  const [hataKodu, setHataKodu] = useState<string | null>(null)
  const kayitci = useRef<MediaRecorder | null>(null)
  const akis = useRef<MediaStream | null>(null)
  const parcalar = useRef<Blob[]>([])
  const sayac = useRef<ReturnType<typeof setInterval> | null>(null)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`/api/ulke/hasta?id=${encodeURIComponent(hastaId)}`)
      .then((r) => {
        if (iptal) return
        if (r.ok && r.j.hasta) { setHasta(r.j.hasta); setSablon(varsayilanSablon(String(r.j.hasta.dogumTarihi || ''))); setYuk('tamam') } else setYuk(r.status === 404 ? 'yok' : 'hata')
      })
      .catch(() => { if (!iptal) setYuk('hata') })
    return () => { iptal = true }
  }, [hesap, api, hastaId])

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

  async function gonder(ses: Blob) {
    const geri = (kod: string) => { parcalar.current = []; setHataKodu(kod); setDurum('hazir') }
    try {
      const supabase = ulkeIstemciSupabase()
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
      const hesapId = data.session?.user?.id
      if (!supabase || !hesapId) { u.cikis(); return }
      // The recording goes to the doctor's OWN folder; the storage policy accepts nothing else.
      const ad = (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      const yol = `${hesapId}/${ad}.${ses.type.includes('mp4') ? 'm4a' : 'webm'}`
      const { error } = await supabase.storage.from(MUAYENE_SES_KOVASI).upload(yol, ses, { contentType: ses.type || 'audio/webm' })
      if (error) { geri('SES_OKUNAMADI'); return }
      setDurum('isleniyor')
      const r = await api('/api/ulke/muayene', { method: 'POST', govde: { yol, hastaId, sablon, riza: true } })
      if (!r.ok || !r.j.seansId) { geri(typeof r.j.code === 'string' ? r.j.code : 'BASARISIZ'); return }
      // The visit is saved. Now its note; if that fails, the recorded visit opens and says so — nothing is lost.
      let notId = ''
      try { const n = await api('/api/ulke/not', { method: 'POST', govde: { seansId: r.j.seansId } }); if (n.ok && typeof n.j.notId === 'string') notId = n.j.notId } catch { /* the visit screen offers to try again */ }
      window.location.assign(notId ? `${YOL.muayene}?not=${notId}` : `${YOL.muayene}?seans=${r.j.seansId}&xato=not`)
    } catch { geri('BAGLANTI') }
  }

  if (yuk !== 'tamam' || !hasta) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.hasta.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.muayene}>{u.m.kabuk.geri}</a></p>}
      </section>
    )
  }
  return <KayitGorunumu m={u.m} hasta={hasta} sablon={sablon} setSablon={setSablon} riza={riza} setRiza={(r) => { setRiza(r); setHataKodu(null) }} durum={durum} sure={sure} hataKodu={hataKodu} baslat={baslat} durdur={durdur} vazgec={vazgec} />
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
  if (yuk === 'tamam' && muayene) return <MuayeneOzetiGorunumu m={u.m} muayene={muayene}><NotEylemi m={u.m} muayene={muayene} yaziliyor={yaziliyor} yazilamadi={yazilamadi && !muayene.notId} yaz={yaz} /></MuayeneOzetiGorunumu>
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
  const [param, setParam] = useState<{ hasta: string; seans: string; not: string; q: string; xato: string } | null>(null)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setParam({ hasta: p.get('hasta') ?? '', seans: p.get('seans') ?? '', not: p.get('not') ?? '', q: p.get('q') ?? '', xato: p.get('xato') ?? '' })
  }, [])
  if (!u.hesap || !param) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="bugun" cikis={u.cikis}>
      {param.not ? <Not u={u} notId={param.not} /> : param.seans ? <KayitliMuayene u={u} seansId={param.seans} yazilamadiBaslangic={param.xato === 'not'} /> : param.hasta ? <YeniMuayene u={u} hastaId={param.hasta} /> : <HastaSec u={u} q={param.q} />}
    </Cerceve>
  )
}
