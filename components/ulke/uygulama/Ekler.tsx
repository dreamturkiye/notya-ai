'use client'

/**
 * NOTYA-ULKE-EKLER-01 — "Add documents": the step between the recording and the note, and the same card on a draft note.
 *
 * Standard workflow (.cursor/skills/belge-otomatik-akis/SKILL.md), country edition; the pure rules are in
 * lib/ulke/belgeler/ekler.ts, the masking and the note-block logic are core/belgeler/*:
 *
 *   many files at once (pictures, PDFs — a PDF is drawn page by page on the device)
 *     → per picture, ON THE DEVICE: find and black out identity text in the OUTBOUND copy (the doctor keeps seeing the
 *       original; the original is never uploaded)
 *     → masking failed or was not confident: the file is NOT sent, the step goes on without it
 *     → the masked copy is read (3 at a time) in the note's language
 *     → every result goes into the FIRST note in one write, as labelled blocks — no per-document approval
 *
 * A document is never stored by this step. A failed or skipped document never blocks the note. Nothing on the screen
 * names an engine, a model or a runtime.
 */
import React, { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { gorseliOtomatikKimliksizlestir } from '@/core/belgeler/deid'
import { ocrAyarla, ocrIsit } from '@/core/belgeler/ocrKimlik'
import { adKarsilastir } from '@/core/belgeler/kimlikMaske'
import { sinirliKuyruk } from '@/core/belgeler/otoBatch'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeYolOnEki } from '@/lib/ulke/yol'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { EK_AZAMI_ADET, EK_DOSYA_AZAMI, EK_KABUL, EK_PDF_AZAMI_SAYFA, EK_TURLERI, ekDosyaTuru, ekGonderimi, gonderilebilir, type EkGonderimi, type EkSonucu, type EkTuruSecimi } from '@/lib/ulke/belgeler/ekler'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import { Bilgi, Hata, type Api } from './Kabuk'
import { pdfSayfalariniCiz } from './pdfSayfalari'

type Durum = 'bekliyor' | 'hazirlaniyor' | 'gizleniyor' | 'okunuyor' | 'tamam' | 'atlandi' | 'hata'
type Neden = 'gizlenemedi' | 'kaliteDusuk' | 'okunamadi' | 'pdfOkunamadi' | 'desteklenmiyor' | 'buyuk'
export type EkOgesi = {
  key: string
  /** The id the document has in the note (its block is keyed by it, so a repeat replaces instead of duplicating). */
  belgeId: string
  ad: string
  sayfa: { n: number; toplam: number } | null
  /** The ORIGINAL, kept in the browser only. */
  dosya: Blob | null
  onizleme: string | null
  tur: EkTuruSecimi
  durum: Durum
  neden: Neden | null
  sonuc: EkSonucu | null
  adUyuyorMu: boolean
}

const ESZAMANLI = 3
const yeniId = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(16).padStart(8, '0').slice(-8)}-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)}`)
let sayac = 0

const SURUYOR = new Set<Durum>(['bekliyor', 'hazirlaniyor', 'gizleniyor', 'okunuyor'])

/** The on-device engines are served under the build's path prefix; the pack that reads Russian reads Cyrillic too. */
function motorlariAyarla(): void {
  ocrAyarla({ varlikOnEki: ulkeYolOnEki(), diller: ulkePaketi().diller.includes('ru') ? 'tur+eng+rus' : 'tur+eng' })
  ocrIsit()
}

/** The step's state and its pipeline. `seansId` = the visit the documents belong to (the server checks it is the doctor's own). */
export function useEkler({ seansId, hastaAdi, api }: { seansId: string; hastaAdi: string; api: Api }) {
  const depo = useRef(new Map<string, EkOgesi>())
  const [, setSurum] = useState(0)
  const kuyruk = useRef(sinirliKuyruk(ESZAMANLI))
  const ucuslar = useRef(new Set<Promise<void>>())
  const [uyari, setUyari] = useState<'cokDosya' | null>(null)
  const yenile = useCallback(() => setSurum((v) => v + 1), [])

  useEffect(() => {
    motorlariAyarla()
    const o = depo.current
    return () => { for (const x of o.values()) if (x.onizleme) URL.revokeObjectURL(x.onizleme) }
  }, [])

  const guncelle = useCallback((key: string, y: Partial<EkOgesi>) => {
    const o = depo.current.get(key)
    if (!o) return // removed meanwhile: its answer is dropped
    Object.assign(o, y)
    yenile()
  }, [yenile])

  const isleBir = useCallback(async (key: string): Promise<void> => {
    const o0 = depo.current.get(key)
    if (!o0 || !o0.dosya) return
    guncelle(key, { durum: 'gizleniyor', neden: null, sonuc: null })
    let base64 = ''
    try {
      const m = await gorseliOtomatikKimliksizlestir(o0.dosya, { modalite: 'us' }) // 'us': the header-band safety net is on
      const ad = adKarsilastir(m.bulgu.ad, hastaAdi)
      if (m.maske.durum !== 'maskelendi') { guncelle(key, { durum: 'atlandi', neden: 'gizlenemedi' }); return }
      base64 = m.gorsel.base64
      guncelle(key, { adUyuyorMu: ad !== 'eslesmiyor' })
    } catch {
      guncelle(key, { durum: 'atlandi', neden: 'gizlenemedi' })
      return
    }
    if (!depo.current.has(key)) return
    guncelle(key, { durum: 'okunuyor' })
    try {
      const r = await api('/api/ulke/belge-degerlendir', { method: 'POST', govde: { seansId, tur: depo.current.get(key)?.tur ?? 'auto', base64 } })
      if (r.ok && r.j.sonuc) guncelle(key, { durum: 'tamam', sonuc: r.j.sonuc as EkSonucu })
      else if (r.j.code === 'DUSUK_KALITE') guncelle(key, { durum: 'atlandi', neden: 'kaliteDusuk' })
      else guncelle(key, { durum: 'hata', neden: 'okunamadi' })
    } catch {
      guncelle(key, { durum: 'hata', neden: 'okunamadi' })
    }
  }, [api, guncelle, hastaAdi, seansId])

  const baslat = useCallback((key: string) => {
    guncelle(key, { durum: 'bekliyor' })
    const p: Promise<void> = kuyruk.current(() => isleBir(key)).catch(() => undefined).finally(() => { ucuslar.current.delete(p) })
    ucuslar.current.add(p)
  }, [guncelle, isleBir])

  const ogeEkle = useCallback((k: Partial<EkOgesi> & { ad: string }): string => {
    const key = `e${++sayac}`
    const blob = k.dosya ?? null
    depo.current.set(key, { belgeId: yeniId(), sayfa: null, dosya: null, onizleme: blob && blob.type.startsWith('image/') ? URL.createObjectURL(blob) : null, tur: 'auto', durum: 'bekliyor', neden: null, sonuc: null, adUyuyorMu: true, ...k, key })
    yenile()
    return key
  }, [yenile])

  const ekle = useCallback((dosyalar: File[]) => {
    setUyari(null)
    const bos = EK_AZAMI_ADET - depo.current.size
    if (dosyalar.length > bos) setUyari('cokDosya')
    for (const f of dosyalar.slice(0, Math.max(0, bos))) {
      const tur = ekDosyaTuru(f.name, f.type)
      if (!tur) { ogeEkle({ ad: f.name, durum: 'hata', neden: 'desteklenmiyor' }); continue }
      if (f.size > EK_DOSYA_AZAMI || f.size <= 0) { ogeEkle({ ad: f.name, durum: 'hata', neden: 'buyuk' }); continue }
      if (tur === 'gorsel') { baslat(ogeEkle({ ad: f.name, dosya: f })); continue }
      // A PDF: drawn page by page on the device; each page then goes the same way as a picture.
      const yer = ogeEkle({ ad: f.name, dosya: null, durum: 'hazirlaniyor' })
      const p: Promise<void> = (async () => {
        try {
          const { sayfalar, toplam } = await pdfSayfalariniCiz(f, Math.min(EK_PDF_AZAMI_SAYFA, EK_AZAMI_ADET - depo.current.size + 1))
          if (!depo.current.has(yer)) return
          if (!sayfalar.length) { guncelle(yer, { durum: 'hata', neden: 'pdfOkunamadi' }); return }
          depo.current.delete(yer)
          const yeniler = sayfalar.map((b, n) => ogeEkle({ ad: f.name, dosya: b, sayfa: { n: n + 1, toplam } }))
          yeniler.forEach(baslat)
        } catch { guncelle(yer, { durum: 'hata', neden: 'pdfOkunamadi' }) }
      })().finally(() => { ucuslar.current.delete(p) })
      ucuslar.current.add(p)
    }
  }, [baslat, guncelle, ogeEkle])

  const kaldir = useCallback((key: string) => {
    const o = depo.current.get(key)
    if (o?.onizleme) URL.revokeObjectURL(o.onizleme)
    depo.current.delete(key); yenile(); setUyari(null)
  }, [yenile])
  const turDegistir = useCallback((key: string, tur: EkTuruSecimi) => { guncelle(key, { tur }); baslat(key) }, [baslat, guncelle])
  const yeniden = useCallback((key: string) => baslat(key), [baslat])

  /** Resolves when nothing is being prepared, masked or read any more. */
  const bekle = useCallback(async (): Promise<void> => {
    while (ucuslar.current.size) await Promise.all(Array.from(ucuslar.current))
  }, [])
  /** What goes into the note: the documents that were read and have something to say. */
  const sonuclar = useCallback((): EkGonderimi[] => Array.from(depo.current.values()).filter((o) => gonderilebilir(o.sonuc ?? undefined)).map((o) => ekGonderimi(o.belgeId, o.sonuc as EkSonucu)), [])

  const ogeler = Array.from(depo.current.values())
  return { ogeler, uyari, ekle, kaldir, turDegistir, yeniden, bekle, sonuclar, suruyor: ogeler.some((o) => SURUYOR.has(o.durum)) }
}

type Ekler = ReturnType<typeof useEkler>

function durumMetni(m: UygulamaMetni, o: EkOgesi): string {
  const e = m.ekler
  if (o.durum === 'tamam') return e.durumTamam
  if (o.durum === 'bekliyor') return e.durumBekliyor
  if (o.durum === 'hazirlaniyor') return e.durumHazirlaniyor
  if (o.durum === 'gizleniyor') return e.durumGizleniyor
  if (o.durum === 'okunuyor') return e.durumOkunuyor
  return o.durum === 'atlandi' ? e.durumAtlandi : e.durumHata
}

function nedenMetni(m: UygulamaMetni, n: Neden | null): string | null {
  return n ? m.ekler[n] : null
}

/** The drop area, the list of documents with their types and states. Used by the step and by the note's card. */
export function EklerListesi({ m, e }: { m: UygulamaMetni; e: Ekler }) {
  const [surukle, setSurukle] = useState(false)
  const girdi = useRef<HTMLInputElement>(null)
  const turSecenekleri = useMemo(() => [{ deger: 'auto' as EkTuruSecimi, ad: m.ekler.turOtomatik }, ...EK_TURLERI.map((t) => ({ deger: t as EkTuruSecimi, ad: m.ekler.turler[t] }))], [m])
  return (
    <div data-alan="ekler">
      <div
        className="uza-ek-birak"
        data-surukle={surukle ? 'evet' : undefined}
        style={{ border: '1.5px dashed var(--uza-cizgi, #c9c2ad)', borderRadius: 12, padding: 16, textAlign: 'center', background: surukle ? 'rgba(47, 67, 52, 0.06)' : 'transparent' }}
        onDragOver={(ev) => { ev.preventDefault(); setSurukle(true) }}
        onDragLeave={() => setSurukle(false)}
        onDrop={(ev) => { ev.preventDefault(); setSurukle(false); e.ekle(Array.from(ev.dataTransfer.files)) }}
      >
        <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => girdi.current?.click()} data-eylem="ekler-sec">{m.ekler.dosyaSec}</button>
        <span className="uza-ipucu" style={{ marginLeft: 10 }}>{m.ekler.birak}</span>
        <input ref={girdi} type="file" multiple accept={EK_KABUL} hidden onChange={(ev) => { const f = Array.from(ev.target.files ?? []); ev.target.value = ''; if (f.length) e.ekle(f) }} />
      </div>
      <p className="uza-ipucu" data-bildirim="gizlilik">{m.ekler.gizlilik}</p>
      <Hata>{e.uyari ? yerine(m.ekler.cokDosya, EK_AZAMI_ADET) : null}</Hata>
      {e.ogeler.length ? (
        <ul className="uza-liste" style={{ marginTop: 10 }}>
          {e.ogeler.map((o) => (
            <li key={o.key} data-ek={o.belgeId} data-durum={o.durum}>
              <div className="uza-satir" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {o.onizleme
                  // The doctor's original (never the masked copy), small.
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={o.onizleme} alt="" width={52} height={52} style={{ objectFit: 'cover', borderRadius: 8, flex: 'none' }} />
                  : <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 8, flex: 'none', background: 'rgba(212, 193, 150, 0.35)' }} />}
                <span className="uza-liste-ad" style={{ flex: '1 1 220px', minWidth: 0 }}>
                  {o.ad}{o.sayfa ? ` · ${yerine(m.ekler.sayfa, o.sayfa.n, o.sayfa.toplam)}` : ''}
                  <span className="uza-liste-alt" data-alan="ek-durum">{durumMetni(m, o)}</span>
                </span>
                <div className="uza-eylemler" style={{ marginTop: 0 }} data-yazdirma-gizle>
                  {o.durum !== 'hazirlaniyor' && o.neden !== 'desteklenmiyor' && o.neden !== 'buyuk' && o.neden !== 'pdfOkunamadi' ? (
                    <label className="uza-ipucu" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <span>{m.ekler.turEtiketi}</span>
                      <select className="uza-girdi" style={{ width: 'auto', minHeight: 36 }} value={o.tur} disabled={SURUYOR.has(o.durum)} onChange={(ev) => e.turDegistir(o.key, ev.target.value as EkTuruSecimi)} aria-label={m.ekler.turEtiketi}>
                        {turSecenekleri.map((s) => <option key={s.deger} value={s.deger}>{s.ad}</option>)}
                      </select>
                    </label>
                  ) : null}
                  {o.durum === 'hata' && o.neden === 'okunamadi' ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => e.yeniden(o.key)}>{m.ekler.yeniden}</button> : null}
                  <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => e.kaldir(o.key)} data-eylem="ek-kaldir">{m.ekler.kaldir}</button>
                </div>
              </div>
              {nedenMetni(m, o.neden) ? <p className="uza-ipucu" data-alan="ek-neden" style={{ margin: '0 4px 8px' }}>{nedenMetni(m, o.neden)}</p> : null}
              {o.adUyuyorMu ? null : <p className="uza-ipucu" role="alert" data-bildirim="ad-uyusmuyor" style={{ margin: '0 4px 8px' }}>{m.ekler.adUyusmuyor}</p>}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

// A broken step must never stop the note: the fallback offers the note without documents.
class Sinir extends Component<{ devam: () => void; yazi: string; children: ReactNode }, { hata: boolean }> {
  state = { hata: false }
  static getDerivedStateFromError() { return { hata: true } }
  componentDidCatch() { console.error('[ulke/ekler] the step failed; the note can still be written') }
  render() {
    if (!this.state.hata) return this.props.children
    return <div className="uza-eylemler"><button type="button" className="uza-dugme" onClick={this.props.devam}>{this.props.yazi}</button></div>
  }
}

/**
 * The step. `yaz(ekler)` writes the note (the caller's: it posts the visit id and the documents and opens the note);
 * it answers false when the note could not be written, and the step stays so that it can be tried again.
 */
export function EklerAdimi({ m, api, seansId, hastaAdi, yaz, hataMetni }: {
  m: UygulamaMetni; api: Api; seansId: string; hastaAdi: string
  yaz: (ekler: EkGonderimi[]) => Promise<boolean>
  hataMetni: string
}) {
  const e = useEkler({ seansId, hastaAdi, api })
  const [yaziliyor, setYaziliyor] = useState(false)
  const [basarisiz, setBasarisiz] = useState(false)
  async function devam(belgesiz: boolean) {
    if (yaziliyor) return
    setYaziliyor(true); setBasarisiz(false)
    try {
      if (!belgesiz) await e.bekle()
      const tamam = await yaz(belgesiz ? [] : e.sonuclar())
      if (!tamam) setBasarisiz(true)
    } catch { setBasarisiz(true) }
    setYaziliyor(false)
  }
  const n = m.ekler
  return (
    <section className="uza-kart" data-alan="ekler-adimi">
      <p className="uza-ust-yazi">{m.muayene.baslik}</p>
      <h1 className="uza-h1">{n.baslik}</h1>
      <p className="uza-aciklama" style={{ marginBottom: 14 }}>{n.aciklama}</p>
      <Sinir devam={() => void devam(true)} yazi={n.devamBelgesiz}>
        <EklerListesi m={m} e={e} />
      </Sinir>
      <Hata>{basarisiz ? hataMetni : null}</Hata>
      {yaziliyor && e.suruyor ? <Bilgi>{n.devamBekliyor}</Bilgi> : null}
      <div className="uza-eylemler">
        <button type="button" className="uza-dugme" disabled={yaziliyor} onClick={() => void devam(false)} data-eylem="ekler-devam">
          {yaziliyor ? n.devamYaziyor : e.ogeler.length ? n.devam : n.devamBelgesiz}
        </button>
        {e.ogeler.length ? <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={yaziliyor} onClick={() => void devam(true)} data-eylem="ekler-belgesiz">{n.devamBelgesiz}</button> : null}
      </div>
    </section>
  )
}

/** A result's identity: the same document read again with another answer (a changed type) is sent again. */
const imza = (x: EkGonderimi): string => `${x.belgeId}\u0001${x.tur}\u0001${x.ozet}\u0001${x.bulgular.join('\u0002')}`

/**
 * On a DRAFT note: documents added later are read and merged into the note's Examination section as soon as all of
 * them are done — one write per batch. `onEklendi(o)` gets the section as saved, for the screen to merge into the text
 * the doctor is still editing (core/belgeler/notaBlok.ts → bloklariAktar).
 */
export function EklerNotKarti({ m, api, notId, seansId, hastaAdi, onEklendi }: {
  m: UygulamaMetni; api: Api; notId: string; seansId: string; hastaAdi: string
  onEklendi: (o: string) => void
}) {
  const e = useEkler({ seansId, hastaAdi, api })
  const denendi = useRef(new Set<string>())
  const yaziyor = useRef(false)
  const [iyi, setIyi] = useState<string | null>(null)
  const [kotu, setKotu] = useState<string | null>(null)
  const [tekrar, setTekrar] = useState(false)
  const n = m.ekler
  const { ogeler, suruyor, sonuclar } = e
  const gonder = useCallback(async (bekleyen: EkGonderimi[]) => {
    yaziyor.current = true; setIyi(null); setKotu(null); setTekrar(false)
    for (const x of bekleyen) denendi.current.add(imza(x))
    try {
      const r = await api('/api/ulke/not/belge', { method: 'POST', govde: { notId, ekler: bekleyen } })
      if (r.ok && typeof r.j.o === 'string') { setIyi(n.notEklendi); onEklendi(r.j.o) }
      else { setKotu(r.j.code === 'ONAYLI' ? n.notOnayli : n.notEklenemedi); setTekrar(r.j.code !== 'ONAYLI') }
    } catch { setKotu(n.notEklenemedi); setTekrar(true) }
    yaziyor.current = false
  }, [api, notId, onEklendi, n])
  // As soon as every document of the batch is done, the results not yet tried go into the note in ONE write. A failed
  // write is not retried by itself: the doctor is told and can press the button.
  useEffect(() => {
    if (suruyor || yaziyor.current || !ogeler.length) return
    const bekleyen = sonuclar().filter((x) => !denendi.current.has(imza(x)))
    if (bekleyen.length) void gonder(bekleyen)
  }, [suruyor, ogeler, sonuclar, gonder])
  return (
    <section className="uza-kart" data-alan="ekler-not">
      <h2 className="uza-h2">{n.notBaslik}</h2>
      <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.notAciklama}</p>
      <EklerListesi m={m} e={e} />
      <Hata>{kotu}</Hata>
      <Bilgi>{iyi}</Bilgi>
      {tekrar ? <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => void gonder(sonuclar())} data-eylem="ekler-not-tekrar">{n.yeniden}</button></div> : null}
    </section>
  )
}
