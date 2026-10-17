'use client'

/**
 * FOTO-ARSIV-01 — full-screen photo viewer. Pinch / wheel zoom and pan, swipe and arrow keys between photos of the same
 * region, non-destructive adjustments (stored as parameters, applied here), vector annotations incl. a calibrated
 * measurement, region / tags / stars / key photo / note, and Ayşe's decision-support panel for the doctor.
 * The original in the vault is never modified; "Orijinale dön" is always available.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ayarDegistiMi, mmPerPiksel, NOT_AZAMI, NOTASYON_AZAMI, NOTASYON_RENK_KODU, NOTASYON_RENKLERI, OLCEK_REFERANSLARI, olcumMetni, olcumMm,
  varsayilanAyarlar, type Ayarlar, type Notasyon, type NotasyonRengi,
} from '@/lib/doktor/fotoArsiv/duzenleme'
import { BASLANGIC_GORUNUMU, imlecteYakinlastir, sinirla, type Gorunum, type Kutu } from '@/lib/doktor/fotoArsiv/gorunum'
import { bolgeEtiketi, ETIKET_AZAMI, etiketAnahtari, etiketTemizle } from '@/lib/doktor/fotoArsiv/bolgeler'
import { bolgedeKomsu, listedeKomsu, oncekiAyniBolge, type FotoOge } from '@/lib/doktor/fotoArsiv/zamanCizelgesi'
import type { MetaYamasi } from '@/lib/doktor/fotoArsiv/meta'
import { detayGetir, metaYama } from './api'
import FotoAiPaneli from './FotoAiPaneli'
import FotoTuval, { type AracTuru } from './FotoTuval'
import VucutHaritasi from './VucutHaritasi'
import { baslikKucuk, birincil, dugme, girdi, R, rozet, tehlike } from './stil'

export const tarihMetni = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' })
}

const ARACLAR: { id: AracTuru; etiket: string; ipucu: string }[] = [
  { id: 'ok', etiket: 'Ok', ipucu: 'Sürükleyerek ok çizin' },
  { id: 'daire', etiket: 'Daire', ipucu: 'Sürükleyerek daire çizin' },
  { id: 'serbest', etiket: 'Serbest', ipucu: 'Parmağınızla serbest çizin' },
  { id: 'metin', etiket: 'Metin', ipucu: 'Yazı koyacağınız noktaya dokunun' },
  { id: 'olcum', etiket: 'Ölçüm', ipucu: 'İki uç noktayı sürükleyin' },
  { id: 'olcek', etiket: 'Ölçek', ipucu: 'Referans nesnenin iki ucunu işaretleyin' },
]
const RENK_TR: Record<NotasyonRengi, string> = { kirmizi: 'Kırmızı', sari: 'Sarı', mavi: 'Mavi', yesil: 'Yeşil', beyaz: 'Beyaz' }
const NOTASYON_TR: Record<Notasyon['t'], string> = { ok: 'Ok', daire: 'Daire', serbest: 'Serbest çizim', metin: 'Metin', olcum: 'Ölçüm', olcek: 'Ölçek referansı' }

const SLIDERLER: { alan: 'pozlama' | 'parlaklik' | 'kontrast' | 'sicaklik' | 'doygunluk'; etiket: string }[] = [
  { alan: 'pozlama', etiket: 'Pozlama' }, { alan: 'parlaklik', etiket: 'Parlaklık' }, { alan: 'kontrast', etiket: 'Kontrast' },
  { alan: 'sicaklik', etiket: 'Beyaz dengesi' }, { alan: 'doygunluk', etiket: 'Doygunluk' },
]

export const GV_CSS = `
.fa-gv{position:fixed;inset:0;z-index:1200;background:#0f0d0b;color:#f4eee3;display:flex;flex-direction:column;font-family:inherit}
.fa-gv-ust{display:flex;align-items:center;gap:6px;padding:8px 10px;padding-top:max(8px,env(safe-area-inset-top));background:#1b1713;border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap}
.fa-gv-ust button{min-height:40px;min-width:40px}
.fa-gv-ana{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
.fa-gv-sahne{flex:1;min-height:0;position:relative}
.fa-gv-panel{background:#faf6ee;color:#3b2e24;overflow:auto;-webkit-overflow-scrolling:touch}
.fa-gv-sekmeler{display:flex;gap:4px;padding:6px 8px;background:#f1ebdf;position:sticky;top:0;z-index:2}
.fa-gv-sekmeler button{flex:1;min-height:40px;border:0;border-radius:8px;background:transparent;font-size:13px;cursor:pointer;color:#3b2e24}
.fa-gv-sekmeler button[aria-selected="true"]{background:#2f4334;color:#fff}
.fa-gv-govde{padding:12px;display:grid;gap:12px}
@media (max-width:899px){.fa-gv-panel{max-height:48vh;border-radius:14px 14px 0 0;padding-bottom:env(safe-area-inset-bottom)}.fa-gv-panel[data-kapali="1"]{display:none}.fa-gv-yan-yalniz{display:none}}
@media (min-width:900px){.fa-gv-ana{flex-direction:row}.fa-gv-panel{width:380px;flex:none;border-left:1px solid rgba(0,0,0,.15)}.fa-gv-mobil-yalniz{display:none !important}}
.fa-gv input[type=range]{width:100%;accent-color:#2f4334;min-height:28px}
`

interface Props {
  patientId: string
  ogeler: FotoOge[]
  gorunen: FotoOge[]
  belgeId: string
  rol: string | undefined
  veliDili: boolean
  etiketOnerileri: string[]
  onGit: (belgeId: string) => void
  onKapat: () => void
  onDegisti: (belgeId: string, yama: Partial<FotoOge>) => void
  onKarsilastir: (eski: string, yeni: string) => void
}

export default function FotoGoruntuleyici({ patientId, ogeler, gorunen, belgeId, rol, veliDili, etiketOnerileri, onGit, onKapat, onDegisti, onKarsilastir }: Props) {
  const oge = ogeler.find((o) => o.belgeId === belgeId)
  const doktorMu = rol === undefined || rol === 'doktor'
  const [ayarlar, setAyarlar] = useState<Ayarlar>(varsayilanAyarlar())
  const [notasyonlar, setNotasyonlar] = useState<Notasyon[]>([])
  const [yuklendi, setYuklendi] = useState(false)
  const [gorunum, setGorunum] = useState<Gorunum>({ ...BASLANGIC_GORUNUMU })
  const [kap, setKap] = useState<{ kap: Kutu; icerik: Kutu }>({ kap: { w: 0, h: 0 }, icerik: { w: 0, h: 0 } })
  const [arac, setArac] = useState<AracTuru | null>(null)
  const [renk, setRenk] = useState<NotasyonRengi>('kirmizi')
  const [olcekRef, setOlcekRef] = useState(OLCEK_REFERANSLARI[0].id)
  const [seciliN, setSeciliN] = useState<string | null>(null)
  const [metinBekleyen, setMetinBekleyen] = useState<{ x: number; y: number } | null>(null)
  const [metin, setMetin] = useState('')
  const [sekme, setSekme] = useState<'duzenle' | 'notasyon' | 'bilgi' | 'ai'>('duzenle')
  const [panelAcik, setPanelAcik] = useState(false)
  const [orijinal, setOrijinal] = useState(false)
  const [boyut, setBoyut] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [hata, setHata] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [etiketGirdisi, setEtiketGirdisi] = useState('')
  const [notYerel, setNotYerel] = useState('')
  const [cekimTarihi, setCekimTarihi] = useState('')
  const ayarZamani = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const bekleyenAyar = useRef<Ayarlar | null>(null)

  const sirala = useCallback(async (yama: MetaYamasi): Promise<boolean> => {
    setKaydediliyor(true); setHata('')
    try { await metaYama(patientId, belgeId, yama); return true }
    catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi.'); return false }
    finally { setKaydediliyor(false) }
  }, [patientId, belgeId])

  const ayariHemenYaz = useCallback(() => {
    if (ayarZamani.current) { clearTimeout(ayarZamani.current); ayarZamani.current = undefined }
    const a = bekleyenAyar.current
    if (!a) return
    bekleyenAyar.current = null
    void sirala({ ayarlar: a }).then((ok) => { if (ok) onDegisti(belgeId, { duzenlendi: ayarDegistiMi(a) }) })
  }, [sirala, onDegisti, belgeId])

  // load the photo's parameters whenever the photo changes (pending edits of the previous one are flushed first)
  useEffect(() => {
    let iptal = false
    setYuklendi(false); setGorunum({ ...BASLANGIC_GORUNUMU }); setArac(null); setSeciliN(null); setMetinBekleyen(null); setHata('')
    detayGetir(patientId, belgeId).then((d) => {
      if (iptal) return
      setAyarlar(d.meta.ozel.ayarlar); setNotasyonlar(d.meta.ozel.notasyonlar); setNotYerel(d.meta.ozel.not); setCekimTarihi(d.meta.cekimTarihi ?? ''); setYuklendi(true)
    }).catch((e: unknown) => { if (!iptal) setHata(e instanceof Error ? e.message : 'Fotoğraf bilgisi alınamadı.') })
    return () => { iptal = true; ayariHemenYaz() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, belgeId])

  const ayarDegistir = (yama: Partial<Ayarlar>) => {
    const yeni = { ...ayarlar, ...yama }
    setAyarlar(yeni)
    bekleyenAyar.current = yeni
    if (ayarZamani.current) clearTimeout(ayarZamani.current)
    ayarZamani.current = setTimeout(ayariHemenYaz, 700)
  }
  const orijinaleDon = () => {
    const bos = varsayilanAyarlar()
    setAyarlar(bos)
    bekleyenAyar.current = bos
    ayariHemenYaz()
  }

  const notasyonKaydet = (liste: Notasyon[]) => {
    setNotasyonlar(liste)
    void sirala({ notasyonlar: liste }).then((ok) => { if (ok) onDegisti(belgeId, { notasyonSayisi: liste.length }) })
  }
  const notasyonEkle = (n: Notasyon) => {
    if (notasyonlar.length >= NOTASYON_AZAMI) { setHata(`En fazla ${NOTASYON_AZAMI} notasyon eklenebilir.`); return }
    // a single scale reference per photo: a new one replaces the old
    const taban = n.t === 'olcek' ? notasyonlar.filter((x) => x.t !== 'olcek') : notasyonlar
    notasyonKaydet([...taban, n])
    setSeciliN(n.id)
  }

  // metadata
  const metaGuncelle = async (yama: MetaYamasi, yerel: Partial<FotoOge>) => {
    onDegisti(belgeId, yerel)
    await sirala(yama)
  }
  const etiketler = oge?.etiketler ?? []
  const etiketEkle = (ham: string) => {
    const t = etiketTemizle(ham)
    if (!t || etiketler.some((x) => etiketAnahtari(x) === etiketAnahtari(t))) { setEtiketGirdisi(''); return }
    const yeni = [...etiketler, t]
    setEtiketGirdisi('')
    void metaGuncelle({ etiketler: yeni }, { etiketler: yeni })
  }

  // neighbours
  const eski = oge ? (oge.bolge ? bolgedeKomsu(ogeler, oge, -1) : listedeKomsu(gorunen, belgeId, 1)) : null
  const yeni = oge ? (oge.bolge ? bolgedeKomsu(ogeler, oge, 1) : listedeKomsu(gorunen, belgeId, -1)) : null
  const oncekiBolge = oge ? oncekiAyniBolge(ogeler, oge) : null
  const bolgeSirasi = oge?.bolge ? ogeler.filter((o) => o.bolge === oge.bolge).length : 0

  // zoom helpers
  const yakinlastir = (carpan: number) => {
    if (!kap.kap.w) return
    setGorunum((g) => imlecteYakinlastir(g, { x: kap.kap.w / 2, y: kap.kap.h / 2 }, carpan, kap.kap, kap.icerik))
  }
  const sigdirDugme = () => setGorunum({ ...BASLANGIC_GORUNUMU })

  // keyboard
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') { if (arac) setArac(null); else onKapat() }
      else if (e.key === 'ArrowLeft' && eski) { e.preventDefault(); onGit(eski.belgeId) }
      else if (e.key === 'ArrowRight' && yeni) { e.preventDefault(); onGit(yeni.belgeId) }
      else if (e.key === '+' || e.key === '=') yakinlastir(1.35)
      else if (e.key === '-') yakinlastir(1 / 1.35)
      else if (e.key === '0') sigdirDugme()
      else if (e.key.toLowerCase() === 'f' && oge) void metaGuncelle({ favori: !oge.favori }, { favori: !oge.favori })
      else if (/^[1-5]$/.test(e.key) && oge) { const y = Number(e.key); void metaGuncelle({ yildiz: oge.yildiz === y ? 0 : y }, { yildiz: oge.yildiz === y ? 0 : y }) }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        setGorunum((g) => sinirla({ ...g, y: g.y + (e.key === 'ArrowUp' ? 60 : -60) }, kap.kap, kap.icerik))
      }
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  })

  // body scroll lock while open
  useEffect(() => {
    const onceki = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = onceki }
  }, [])

  // swipe between photos (only when not zoomed and no tool)
  const swipe = useRef<{ x: number; y: number; t: number; cok: boolean } | null>(null)
  const sahneAsagi = (e: React.PointerEvent) => {
    if (e.isPrimary) swipe.current = { x: e.clientX, y: e.clientY, t: Date.now(), cok: false }
    else if (swipe.current) swipe.current.cok = true
  }
  const sahneYukari = (e: React.PointerEvent) => {
    const s = swipe.current
    if (!e.isPrimary || !s) return
    swipe.current = null
    if (s.cok || arac || gorunum.olcek > 1.05 || Date.now() - s.t > 700) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 70 && Math.abs(dy) < 60) {
      if (dx > 0 && eski) onGit(eski.belgeId)
      else if (dx < 0 && yeni) onGit(yeni.belgeId)
    }
  }

  const mmPx = useMemo(() => (boyut.w ? mmPerPiksel(notasyonlar, boyut.w, boyut.h) : null), [notasyonlar, boyut])
  const degisti = ayarDegistiMi(ayarlar)
  const aracBilgisi = ARACLAR.find((a) => a.id === arac)
  const referans = OLCEK_REFERANSLARI.find((r) => r.id === olcekRef) ?? OLCEK_REFERANSLARI[0]
  const kirp = ayarlar.kirp ?? { x: 0, y: 0, w: 1, h: 1 }
  const kirpDegistir = (sol: number, ust: number, sag: number, alt: number) => {
    const x = Math.min(0.9, Math.max(0, sol)), y = Math.min(0.9, Math.max(0, ust))
    const w = Math.max(0.1, 1 - x - Math.max(0, sag)), h = Math.max(0.1, 1 - y - Math.max(0, alt))
    ayarDegistir({ kirp: x < 0.002 && y < 0.002 && w > 0.996 && h > 0.996 ? null : { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) } })
  }
  const sagKirp = Math.max(0, 1 - kirp.x - kirp.w), altKirp = Math.max(0, 1 - kirp.y - kirp.h)

  if (typeof document === 'undefined') return null
  if (!oge) return null

  const sekmeBtn = (id: typeof sekme, etiket: string) => (
    <button key={id} role="tab" aria-selected={sekme === id} onClick={() => { setSekme(id); setPanelAcik(true) }}>{etiket}</button>
  )

  return createPortal(
    <div className="fa-gv" role="dialog" aria-modal="true" aria-label="Fotoğraf görüntüleyici" data-testid="foto-goruntuleyici">
      <style>{GV_CSS}</style>
      <div className="fa-gv-ust">
        <button onClick={onKapat} aria-label="Kapat" style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} data-testid="gv-kapat">✕</button>
        <button onClick={() => eski && onGit(eski.belgeId)} disabled={!eski} aria-label={oge.bolge ? 'Aynı bölgenin önceki fotoğrafı' : 'Önceki fotoğraf'} style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', opacity: eski ? 1 : 0.35 }} data-testid="gv-onceki">‹</button>
        <button onClick={() => yeni && onGit(yeni.belgeId)} disabled={!yeni} aria-label={oge.bolge ? 'Aynı bölgenin sonraki fotoğrafı' : 'Sonraki fotoğraf'} style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', opacity: yeni ? 1 : 0.35 }} data-testid="gv-sonraki">›</button>
        <div style={{ flex: 1, minWidth: 120, lineHeight: 1.25 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{oge.bolge ? bolgeEtiketi(oge.bolge) : 'Bölge belirtilmedi'}{oge.bolgeKaynagi === 'ayse' ? ' · Ayşe önerisi' : ''}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{tarihMetni(oge.cekimAt)}{oge.bolge ? ` · aynı bölgede ${bolgeSirasi} fotoğraf` : ''}</div>
        </div>
        <button onClick={() => metaGuncelle({ favori: !oge.favori }, { favori: !oge.favori })} aria-pressed={oge.favori} aria-label="Favori" style={{ ...dugme, background: oge.favori ? '#d4c196' : 'transparent', color: oge.favori ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} data-testid="gv-favori">{oge.favori ? '♥' : '♡'}</button>
        <button
          onClick={() => oncekiBolge && onKarsilastir(oncekiBolge.belgeId, belgeId)} disabled={!oncekiBolge}
          title={oncekiBolge ? `${tarihMetni(oncekiBolge.cekimAt)} tarihli fotoğrafla karşılaştır` : 'Aynı bölgede daha eski fotoğraf yok'}
          style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', opacity: oncekiBolge ? 1 : 0.4 }} data-testid="gv-karsilastir">Karşılaştır</button>
        <button className="fa-gv-mobil-yalniz" onClick={() => setPanelAcik((a) => !a)} aria-expanded={panelAcik} style={{ ...dugme, background: panelAcik ? '#d4c196' : 'transparent', color: panelAcik ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} data-testid="gv-panel">Araçlar</button>
      </div>

      <div className="fa-gv-ana">
        <div className="fa-gv-sahne" onPointerDown={sahneAsagi} onPointerUp={sahneYukari} data-testid="gv-sahne">
          <FotoTuval
            patientId={patientId} belgeId={belgeId} ayarlar={ayarlar} notasyonlar={notasyonlar}
            gorunum={gorunum} onGorunum={setGorunum} arac={arac} renk={renk} olcekMm={referans.mm}
            seciliNotasyon={seciliN} onNotasyon={notasyonEkle} onMetinIstegi={(p) => { setMetinBekleyen(p); setMetin(''); setSekme('notasyon'); setPanelAcik(true) }}
            orijinalGoster={orijinal} onHazir={setBoyut} onKap={(k, i) => setKap({ kap: k, icerik: i })}
            etiket={`${oge.bolge ? bolgeEtiketi(oge.bolge) : 'Fotoğraf'} ${tarihMetni(oge.cekimAt)}`}
          />
          {!yuklendi && !hata && <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 11, opacity: 0.7 }}>Ayarlar yükleniyor…</div>}
          {aracBilgisi && <div role="status" style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.65)', padding: '4px 10px', borderRadius: 999, fontSize: 12, pointerEvents: 'none' }}>{aracBilgisi.etiket}: {aracBilgisi.ipucu}</div>}
          <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button style={{ ...dugme, background: 'rgba(20,17,14,.8)', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', minWidth: 44 }} onClick={() => yakinlastir(1.5)} aria-label="Yakınlaştır">+</button>
            <button style={{ ...dugme, background: 'rgba(20,17,14,.8)', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', minWidth: 44 }} onClick={() => yakinlastir(1 / 1.5)} aria-label="Uzaklaştır">−</button>
            <button style={{ ...dugme, background: 'rgba(20,17,14,.8)', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', minWidth: 44, fontSize: 11 }} onClick={sigdirDugme} aria-label="Sığdır">{Math.round(gorunum.olcek * 100)}%</button>
          </div>
          <button
            onPointerDown={(e) => { e.stopPropagation(); setOrijinal(true) }} onPointerUp={() => setOrijinal(false)} onPointerLeave={() => setOrijinal(false)} onPointerCancel={() => setOrijinal(false)}
            style={{ ...dugme, position: 'absolute', left: 10, bottom: 10, background: orijinal ? '#d4c196' : 'rgba(20,17,14,.8)', color: orijinal ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)', fontSize: 12, touchAction: 'none' }}
            data-testid="gv-orijinal-tut">Orijinali göster (basılı tut)</button>
          {arac && (
            <div className="fa-gv-mobil-yalniz" data-testid="gv-arac-seridi" role="toolbar" aria-label="Notasyon araçları" style={{ position: 'absolute', left: 8, right: 64, bottom: 56, display: 'flex', gap: 6, overflowX: 'auto', padding: 4, background: 'rgba(20,17,14,.82)', borderRadius: 12 }}>
              {ARACLAR.map((a) => (
                <button key={a.id} data-testid={`serit-${a.id}`} aria-pressed={arac === a.id} onClick={() => { setArac(a.id); setMetinBekleyen(null) }}
                  style={{ ...dugme, flex: 'none', minHeight: 38, padding: '4px 10px', fontSize: 12.5, background: arac === a.id ? '#d4c196' : 'transparent', color: arac === a.id ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }}>{a.etiket}</button>
              ))}
              {NOTASYON_RENKLERI.map((r) => (
                <button key={r} aria-label={RENK_TR[r]} aria-pressed={renk === r} onClick={() => setRenk(r)}
                  style={{ flex: 'none', width: 30, height: 30, alignSelf: 'center', borderRadius: '50%', background: NOTASYON_RENK_KODU[r], border: renk === r ? '3px solid #f4eee3' : '1px solid rgba(255,255,255,.4)', cursor: 'pointer' }} />
              ))}
              <button style={{ ...dugme, flex: 'none', minHeight: 38, padding: '4px 10px', fontSize: 12.5, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} disabled={!notasyonlar.length} onClick={() => notasyonKaydet(notasyonlar.slice(0, -1))}>Geri al</button>
              <button style={{ ...dugme, flex: 'none', minHeight: 38, padding: '4px 10px', fontSize: 12.5 }} onClick={() => setArac(null)} data-testid="serit-bitti">Bitti</button>
            </div>
          )}
          {hata && <div role="alert" style={{ position: 'absolute', left: 10, right: 10, bottom: 60, background: R.warn, color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: 12.5 }}>{hata}</div>}
          {kaydediliyor && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 11, opacity: 0.7 }}>Kaydediliyor…</div>}
        </div>

        <div className="fa-gv-panel" data-kapali={panelAcik ? '0' : '1'} data-testid="gv-panel-govde">
          <div className="fa-gv-sekmeler" role="tablist">
            {sekmeBtn('duzenle', 'Düzenle')}
            {sekmeBtn('notasyon', 'Notasyon')}
            {sekmeBtn('bilgi', 'Bilgi')}
            {doktorMu && sekmeBtn('ai', 'Ayşe')}
          </div>
          <div className="fa-gv-govde">
            {sekme === 'duzenle' && (
              <>
                {SLIDERLER.map((s) => (
                  <label key={s.alan} style={{ display: 'block', fontSize: 13 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span onDoubleClick={() => ayarDegistir({ [s.alan]: 0 })} title="Sıfırlamak için çift tıklayın">{s.etiket}</span>
                      <span style={{ color: R.muted }}>{ayarlar[s.alan]}</span>
                    </span>
                    <input type="range" min={-100} max={100} step={1} value={ayarlar[s.alan]} onChange={(e) => ayarDegistir({ [s.alan]: Number(e.target.value) })} aria-label={s.etiket} data-testid={`ayar-${s.alan}`} />
                  </label>
                ))}
                <div>
                  <div style={baslikKucuk}>Döndür</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={dugme} onClick={() => ayarDegistir({ dondur: ((ayarlar.dondur + 270) % 360) as Ayarlar['dondur'] })} data-testid="gv-sola">↺ 90° sola</button>
                    <button style={dugme} onClick={() => ayarDegistir({ dondur: ((ayarlar.dondur + 90) % 360) as Ayarlar['dondur'] })} data-testid="gv-saga">↻ 90° sağa</button>
                  </div>
                </div>
                <div>
                  <div style={baslikKucuk}>Kırp (kenarlardan %)</div>
                  {([['Sol', kirp.x, (v: number) => kirpDegistir(v, kirp.y, sagKirp, altKirp)], ['Üst', kirp.y, (v: number) => kirpDegistir(kirp.x, v, sagKirp, altKirp)], ['Sağ', sagKirp, (v: number) => kirpDegistir(kirp.x, kirp.y, v, altKirp)], ['Alt', altKirp, (v: number) => kirpDegistir(kirp.x, kirp.y, sagKirp, v)]] as const).map(([e, v, f]) => (
                    <label key={e} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                      <span style={{ width: 34 }}>{e}</span>
                      <input type="range" min={0} max={60} step={1} value={Math.round(v * 100)} onChange={(ev) => f(Number(ev.target.value) / 100)} aria-label={`${e} kırpma`} />
                      <span style={{ width: 30, textAlign: 'right', color: R.muted }}>{Math.round(v * 100)}</span>
                    </label>
                  ))}
                  <p style={{ fontSize: 11.5, color: R.muted, margin: '4px 0 0' }}>Kırpma yalnızca görünümü değiştirir; özgün fotoğraf olduğu gibi saklanır.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button style={degisti ? birincil : dugme} onClick={orijinaleDon} data-testid="gv-orijinale-don">Orijinale dön</button>
                  <span style={{ fontSize: 12, color: R.muted }}>{degisti ? 'Ayarlar uygulanıyor' : 'Özgün görünüm'}</span>
                </div>
              </>
            )}

            {sekme === 'notasyon' && (
              <>
                <div>
                  <div style={baslikKucuk}>Araç</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ARACLAR.map((a) => (
                      <button key={a.id} aria-pressed={arac === a.id} data-testid={`arac-${a.id}`}
                        onClick={() => { setArac(arac === a.id ? null : a.id); setMetinBekleyen(null); setPanelAcik(false) }}
                        style={{ ...dugme, ...(arac === a.id ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }}>{a.etiket}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={baslikKucuk}>Renk</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {NOTASYON_RENKLERI.map((r) => (
                      <button key={r} aria-label={RENK_TR[r]} aria-pressed={renk === r} onClick={() => setRenk(r)}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: NOTASYON_RENK_KODU[r], border: renk === r ? `3px solid ${R.ink}` : '1px solid rgba(0,0,0,.25)', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={baslikKucuk}>Ölçek kalibrasyonu</div>
                  <select style={girdi} value={olcekRef} onChange={(e) => setOlcekRef(e.target.value)} aria-label="Referans nesne">
                    {OLCEK_REFERANSLARI.map((r) => <option key={r.id} value={r.id}>{r.etiket}</option>)}
                  </select>
                  <button style={{ ...dugme, marginTop: 6 }} onClick={() => { setArac('olcek'); setPanelAcik(false) }} data-testid="gv-kalibre-et">Referansın iki ucunu işaretle</button>
                  <p style={{ fontSize: 12, color: mmPx ? R.pine : R.muted, margin: '6px 0 0' }} data-testid="gv-olcek-durumu">
                    {mmPx ? `Kalibre edildi: 1 piksel ≈ ${mmPx.toLocaleString('tr-TR', { maximumSignificantDigits: 3 })} mm. Ölçümler mm olarak gösterilir.` : 'Kalibre edilmedi: ölçümler mm olarak gösterilemez. Fotoğrafta cetvel, madeni para veya kart varsa uçlarını işaretleyin.'}
                  </p>
                  <p style={{ fontSize: 11.5, color: R.muted, margin: '2px 0 0' }}>Ölçek yalnızca referansın bulunduğu düzlem için geçerlidir; eğri yüzeylerde ve açılı çekimlerde sapma olur.</p>
                </div>
                {metinBekleyen && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input autoFocus style={girdi} value={metin} maxLength={80} placeholder="Notasyon metni" onChange={(e) => setMetin(e.target.value)} aria-label="Notasyon metni"
                      onKeyDown={(e) => { if (e.key === 'Enter' && metin.trim()) { notasyonEkle({ id: `n${Date.now().toString(36)}`, t: 'metin', p: metinBekleyen, metin: metin.trim(), renk }); setMetinBekleyen(null) } }} />
                    <button style={birincil} disabled={!metin.trim()} onClick={() => { notasyonEkle({ id: `n${Date.now().toString(36)}`, t: 'metin', p: metinBekleyen, metin: metin.trim(), renk }); setMetinBekleyen(null) }}>Ekle</button>
                    <button style={dugme} onClick={() => setMetinBekleyen(null)}>Vazgeç</button>
                  </div>
                )}
                <div>
                  <div style={baslikKucuk}>Notasyonlar ({notasyonlar.length})</div>
                  {notasyonlar.length === 0 && <div style={{ fontSize: 12.5, color: R.muted }}>Henüz notasyon yok.</div>}
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
                    {notasyonlar.map((n) => (
                      <li key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 8, background: seciliN === n.id ? 'rgba(47,67,52,0.1)' : 'transparent' }}>
                        <button onClick={() => setSeciliN(seciliN === n.id ? null : n.id)} style={{ ...dugme, flex: 1, textAlign: 'left', minHeight: 36, borderWidth: 0, background: 'transparent' }}>
                          {NOTASYON_TR[n.t]}
                          {n.t === 'metin' ? `: ${n.metin}` : ''}
                          {n.t === 'olcum' ? `: ${mmPx ? olcumMetni(olcumMm(n.a, n.b, boyut.w, boyut.h, mmPx)) : 'ölçek yok'}` : ''}
                          {n.t === 'olcek' ? `: ${olcumMetni(n.mm)}` : ''}
                        </button>
                        <button style={{ ...tehlike, minHeight: 34, padding: '2px 10px', fontSize: 12.5 }} onClick={() => notasyonKaydet(notasyonlar.filter((x) => x.id !== n.id))} aria-label={`${NOTASYON_TR[n.t]} sil`}>Sil</button>
                      </li>
                    ))}
                  </ul>
                  {notasyonlar.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button style={dugme} onClick={() => notasyonKaydet(notasyonlar.slice(0, -1))}>Son notasyonu geri al</button>
                      <button style={tehlike} onClick={() => notasyonKaydet([])}>Hepsini sil</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {sekme === 'bilgi' && (
              <>
                <div>
                  <div style={baslikKucuk}>Değerlendirme</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }} role="group" aria-label="Yıldız">
                    {[1, 2, 3, 4, 5].map((y) => (
                      <button key={y} aria-pressed={oge.yildiz >= y} aria-label={`${y} yıldız`} onClick={() => metaGuncelle({ yildiz: oge.yildiz === y ? 0 : y }, { yildiz: oge.yildiz === y ? 0 : y })}
                        style={{ ...dugme, minWidth: 40, padding: 0, fontSize: 18, color: oge.yildiz >= y ? '#b9892a' : R.muted }}>{oge.yildiz >= y ? '★' : '☆'}</button>
                    ))}
                    <button style={{ ...dugme, ...(oge.anahtar ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }} aria-pressed={oge.anahtar}
                      onClick={() => metaGuncelle({ anahtar: !oge.anahtar }, { anahtar: !oge.anahtar })} data-testid="gv-anahtar">Anahtar fotoğraf</button>
                  </div>
                </div>
                <div>
                  <div style={baslikKucuk}>Vücut bölgesi {oge.bolgeKaynagi === 'ayse' && <span style={rozet(R.warn, 'rgba(164,91,62,0.12)')}>Ayşe önerisi — onaylamak için seçin</span>}</div>
                  <VucutHaritasi deger={oge.bolge} oneri={oge.bolgeKaynagi === 'ayse' ? oge.bolge : null}
                    onSec={(id) => metaGuncelle({ bolge: id, bolgeKaynagi: 'hekim' }, { bolge: id, bolgeKaynagi: id ? 'hekim' : null })} />
                </div>
                <div>
                  <div style={baslikKucuk}>Etiketler</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {etiketler.map((t) => (
                      <span key={t} style={{ ...rozet(), padding: '4px 4px 4px 10px', fontSize: 12.5 }}>#{t}
                        <button aria-label={`${t} etiketini kaldır`} onClick={() => { const y = etiketler.filter((x) => x !== t); void metaGuncelle({ etiketler: y }, { etiketler: y }) }} style={{ border: 0, background: 'transparent', cursor: 'pointer', minWidth: 28, minHeight: 28 }}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input style={girdi} value={etiketGirdisi} maxLength={ETIKET_AZAMI} placeholder="Etiket ekle (Enter)" list="fa-etiketler" aria-label="Etiket ekle"
                    onChange={(e) => setEtiketGirdisi(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); etiketEkle(etiketGirdisi) } }} />
                  <datalist id="fa-etiketler">{etiketOnerileri.map((t) => <option key={t} value={t} />)}</datalist>
                </div>
                <div>
                  <div style={baslikKucuk}>Not</div>
                  <textarea style={{ ...girdi, minHeight: 90 }} value={notYerel} maxLength={NOT_AZAMI} aria-label="Fotoğraf notu" placeholder="Bu fotoğrafa özel not…"
                    onChange={(e) => setNotYerel(e.target.value)} onBlur={() => { if (notYerel !== oge.not) void metaGuncelle({ not: notYerel }, { not: notYerel }) }} />
                </div>
                <div>
                  <div style={baslikKucuk}>Çekim tarihi</div>
                  <input type="date" style={girdi} value={cekimTarihi} aria-label="Çekim tarihi" onChange={(e) => { setCekimTarihi(e.target.value); if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) void metaGuncelle({ cekimTarihi: e.target.value }, { cekimAt: `${e.target.value}T12:00:00.000Z` }) }} />
                  <p style={{ fontSize: 11.5, color: R.muted, margin: '4px 0 0' }}>Fotoğraf eski bir tarihte çekildiyse gerçek tarihi girin; zaman çizelgesi ve “N gün arayla” hesabı bunu kullanır.</p>
                </div>
                <div style={{ fontSize: 12, color: R.muted }}>
                  Dosya: {oge.dosyaAdi} · {(oge.boyut / 1024).toFixed(0)} KB<br />
                  Görüntü, konum ve cihaz bilgisi (EXIF) temizlenmiş olarak gösterilir.
                  {oge.seansId ? <><br />Bu fotoğraf bir muayeneye bağlıdır; imzalı notta “Yüklenen dosyalar” bölümünde görünür.</> : null}
                </div>
              </>
            )}

            {sekme === 'ai' && doktorMu && (
              <FotoAiPaneli patientId={patientId} belgeId={belgeId} bolge={oge.bolge} veliDili={veliDili}
                onBolgeUygula={(id) => metaGuncelle({ bolge: id, bolgeKaynagi: 'ayse' }, { bolge: id, bolgeKaynagi: 'ayse' })} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
