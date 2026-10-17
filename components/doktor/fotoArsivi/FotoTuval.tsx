'use client'

/**
 * FOTO-ARSIV-01 — one zoomable, pannable photo surface (canvas). Shows the decrypted original with its non-destructive
 * adjustments applied client-side and its vector annotations on top, and (optionally) lets the doctor draw annotations.
 * The view transform is controlled by the parent so two surfaces can share one zoom/pan (compare mode).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cikisBoyutu, gorunumdenKaynaga, tonDegistiMi, varsayilanAyarlar, mmPerPiksel,
  type Ayarlar, type Notasyon, type NotasyonRengi,
} from '@/lib/doktor/fotoArsiv/duzenleme'
import { kapsayicidanIceriye, sigdir, type Gorunum, type Kutu } from '@/lib/doktor/fotoArsiv/gorunum'
import { bitmapAl } from './api'
import { kareCiz, notasyonlariCiz } from './istemciGorsel'
import { useJestler } from './jestler'

export type AracTuru = 'ok' | 'daire' | 'serbest' | 'metin' | 'olcum' | 'olcek'

export interface FotoTuvalProps {
  patientId: string
  belgeId: string
  ayarlar: Ayarlar
  notasyonlar: Notasyon[]
  gorunum: Gorunum
  onGorunum: (g: Gorunum) => void
  /** Active annotation tool; null = pan / zoom only. */
  arac?: AracTuru | null
  renk?: NotasyonRengi
  /** Millimetres of the reference when the "olcek" tool is used. */
  olcekMm?: number
  seciliNotasyon?: string | null
  onNotasyon?: (n: Notasyon) => void
  /** The text tool needs a typed label: the parent asks for it and then adds the annotation. */
  onMetinIstegi?: (p: { x: number; y: number }) => void
  /** Show the untouched original (hold-to-compare). */
  orijinalGoster?: boolean
  /** No gestures (a layer under another surface). */
  pasif?: boolean
  onHazir?: (boyut: { w: number; h: number }) => void
  onKap?: (k: Kutu, icerik: Kutu) => void
  etiket?: string
  stil?: React.CSSProperties
}

const yeniId = () => `n${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export default function FotoTuval(p: FotoTuvalProps) {
  const kapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [kap, setKap] = useState<Kutu>({ w: 0, h: 0 })
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [hata, setHata] = useState('')
  const [kare, setKare] = useState<HTMLCanvasElement | null>(null)
  const [taslak, setTaslak] = useState<Notasyon | null>(null)
  const taslakRef = useRef<Notasyon | null>(null)

  const ay = useMemo(() => (p.orijinalGoster ? varsayilanAyarlar() : p.ayarlar), [p.orijinalGoster, p.ayarlar])

  // container size
  useEffect(() => {
    const el = kapRef.current
    if (!el) return
    const oku = () => setKap({ w: el.clientWidth, h: el.clientHeight })
    oku()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(oku)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // original -> decoded bitmap (cached, authenticated)
  useEffect(() => {
    let iptal = false
    setBitmap(null); setHata(''); setKare(null)
    bitmapAl(p.patientId, p.belgeId).then((b) => { if (!iptal) { setBitmap(b); p.onHazir?.({ w: b.width, h: b.height }) } }).catch((e: unknown) => { if (!iptal) setHata(e instanceof Error ? e.message : 'Görüntü açılamadı.') })
    return () => { iptal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.patientId, p.belgeId])

  // adjusted frame: instant low-res pass while sliders move, full pass when they settle
  const ayAnahtar = JSON.stringify(ay)
  useEffect(() => {
    if (!bitmap) return
    let iptal = false
    let zamanlayici: ReturnType<typeof setTimeout> | undefined
    if (tonDegistiMi(ay)) {
      setKare(kareCiz(bitmap, ay, 1024))
      zamanlayici = setTimeout(() => { if (!iptal) setKare(kareCiz(bitmap, ay, 3072)) }, 260)
    } else setKare(kareCiz(bitmap, ay, 3072))
    return () => { iptal = true; if (zamanlayici) clearTimeout(zamanlayici) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitmap, ayAnahtar])

  const cerceve = useMemo(() => (bitmap ? cikisBoyutu(bitmap.width, bitmap.height, ay) : { w: 0, h: 0 }), [bitmap, ay])
  const icerik = useMemo(() => sigdir(cerceve.w, cerceve.h, kap), [cerceve, kap])
  useEffect(() => { p.onKap?.(kap, icerik) }, [kap, icerik]) // eslint-disable-line react-hooks/exhaustive-deps

  // paint
  const cizimRaf = useRef(0)
  useEffect(() => {
    cancelAnimationFrame(cizimRaf.current)
    cizimRaf.current = requestAnimationFrame(() => {
      const c = canvasRef.current
      if (!c || !kap.w || !kap.h) return
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const W = Math.round(kap.w * dpr), H = Math.round(kap.h * dpr)
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, kap.w, kap.h)
      if (!kare || !bitmap || !icerik.w) return
      const g = p.gorunum
      const bosX = (kap.w - icerik.w) / 2, bosY = (kap.h - icerik.h) / 2
      const x0 = bosX + g.x, y0 = bosY + g.y, w = icerik.w * g.olcek, h = icerik.h * g.olcek
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(kare, x0, y0, w, h)
      const liste = taslak ? [...p.notasyonlar, taslak] : p.notasyonlar
      notasyonlariCiz(ctx, liste, ay, { x0, y0, w, h }, { birim: 1, orijinal: { w: bitmap.width, h: bitmap.height }, secili: p.seciliNotasyon })
    })
    return () => cancelAnimationFrame(cizimRaf.current)
  }, [kare, kap, icerik, p.gorunum, p.notasyonlar, taslak, ay, bitmap, p.seciliNotasyon])

  // tool -> annotation
  const kaynakNokta = useCallback((pt: { x: number; y: number }) => {
    const v = kapsayicidanIceriye(p.gorunum, pt, kap, icerik)
    return v ? gorunumdenKaynaga(v, ay) : null
  }, [p.gorunum, kap, icerik, ay])

  const aracBasla = p.arac && p.onNotasyon
    ? (pt: { x: number; y: number }) => {
        const n = kaynakNokta(pt)
        if (!n) return true // outside the photo: swallow, do not pan
        const renk = p.renk ?? 'kirmizi'
        let t: Notasyon
        switch (p.arac) {
          case 'serbest': t = { id: yeniId(), t: 'serbest', noktalar: [n], renk }; break
          case 'metin': t = { id: yeniId(), t: 'metin', p: n, metin: '', renk }; break
          case 'olcek': t = { id: yeniId(), t: 'olcek', a: n, b: n, mm: p.olcekMm ?? 10 }; break
          default: t = { id: yeniId(), t: p.arac as 'ok' | 'daire' | 'olcum', a: n, b: n, renk }
        }
        taslakRef.current = t
        if (p.arac !== 'metin') setTaslak(t)
        return true
      }
    : undefined
  const aracHareket = (pt: { x: number; y: number }) => {
    const t = taslakRef.current
    const n = kaynakNokta(pt)
    if (!t || !n || t.t === 'metin') return
    const yeni: Notasyon = t.t === 'serbest'
      ? { ...t, noktalar: t.noktalar.length < 280 ? [...t.noktalar, n] : t.noktalar }
      : { ...t, b: n } as Notasyon
    taslakRef.current = yeni
    setTaslak(yeni)
  }
  const aracBitir = (pt: { x: number; y: number }) => {
    const t = taslakRef.current
    taslakRef.current = null
    setTaslak(null)
    if (!t) return
    if (t.t === 'metin') { p.onMetinIstegi?.(t.p); return }
    if (t.t === 'serbest') { if (t.noktalar.length >= 3) p.onNotasyon?.(t); return }
    const bit = kaynakNokta(pt) ?? t.b
    const son = bit ? ({ ...t, b: bit } as Notasyon) : t
    if (son.t !== 'serbest' && son.t !== 'metin' && Math.hypot((son.b.x - son.a.x) * (bitmap?.width ?? 1), (son.b.y - son.a.y) * (bitmap?.height ?? 1)) < 8) return
    p.onNotasyon?.(son)
  }
  const aracIptal = () => { taslakRef.current = null; setTaslak(null) }

  useJestler(kapRef, {
    gorunum: p.gorunum, onGorunum: p.onGorunum, kap, icerik, devreDisi: p.pasif,
    aracBasla, aracHareket, aracBitir, aracIptal,
  })

  const kalibre = mmPerPiksel(p.notasyonlar, bitmap?.width ?? 0, bitmap?.height ?? 0) != null
  return (
    <div
      ref={kapRef}
      data-testid="foto-tuval"
      data-kalibre={kalibre ? '1' : '0'}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', background: '#14110e', cursor: p.arac ? 'crosshair' : p.gorunum.olcek > 1 ? 'grab' : 'default', pointerEvents: p.pasif ? 'none' : 'auto', ...p.stil }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} aria-label={p.etiket || 'Klinik fotoğraf'} role="img" />
      {!bitmap && !hata && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#d8cfc2', fontSize: 13 }}>Fotoğraf açılıyor…</div>}
      {hata && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#f1c9b8', fontSize: 13, padding: 16, textAlign: 'center' }}>{hata}</div>}
    </div>
  )
}

