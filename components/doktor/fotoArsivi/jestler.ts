/**
 * FOTO-ARSIV-01 — pointer gestures of a zoomable surface: one finger / mouse drag pans, two fingers pinch, wheel zooms at the
 * cursor, double tap / double click toggles 2.5x. All the arithmetic lives in lib/doktor/fotoArsiv/gorunum.ts (unit-tested);
 * this file only translates browser events. An optional tool (annotation drawing) can claim a single pointer.
 */
import { useEffect, useRef, type RefObject } from 'react'
import { ciftDokunus, imlecteYakinlastir, kaydir, pinchUygula, type Gorunum, type Kutu, type Parmak } from '@/lib/doktor/fotoArsiv/gorunum'

export interface JestSecenekleri {
  gorunum: Gorunum
  onGorunum: (g: Gorunum) => void
  kap: Kutu
  icerik: Kutu
  devreDisi?: boolean
  /** Return true to claim this pointer for a tool; false lets it pan. */
  aracBasla?: (p: Parmak) => boolean
  aracHareket?: (p: Parmak) => void
  aracBitir?: (p: Parmak) => void
  aracIptal?: () => void
}

export function useJestler(ref: RefObject<HTMLElement>, s: JestSecenekleri): void {
  const son = useRef(s)
  son.current = s
  const g = useRef<Gorunum>(s.gorunum)
  const gorulen = useRef<Gorunum>(s.gorunum)
  if (s.gorunum !== gorulen.current) { gorulen.current = s.gorunum; g.current = s.gorunum }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const parmaklar = new Map<number, Parmak>()
    let mod: 'yok' | 'kaydir' | 'pinch' | 'arac' = 'yok'
    let onceki: [Parmak, Parmak] | null = null
    let sonDokunus: { t: number; x: number; y: number } | null = null
    let basla: { x: number; y: number; t: number } | null = null
    let hareket = 0

    const nokta = (e: PointerEvent): Parmak => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const uygula = (y: Gorunum) => { g.current = y; gorulen.current = y; son.current.onGorunum(y) }
    const cift = (): [Parmak, Parmak] => { const [a, b] = [...parmaklar.values()]; return [{ ...a }, { ...b }] }

    const asagi = (e: PointerEvent) => {
      if (son.current.devreDisi) return
      try { el.setPointerCapture(e.pointerId) } catch { /* synthetic events */ }
      const p = nokta(e)
      parmaklar.set(e.pointerId, p)
      if (parmaklar.size === 2) {
        if (mod === 'arac') son.current.aracIptal?.()
        mod = 'pinch'; onceki = cift()
      } else if (parmaklar.size === 1) {
        hareket = 0; basla = { x: p.x, y: p.y, t: Date.now() }
        mod = son.current.aracBasla?.(p) ? 'arac' : 'kaydir'
      }
    }
    const tasi = (e: PointerEvent) => {
      const onc = parmaklar.get(e.pointerId)
      if (!onc || son.current.devreDisi) return
      const p = nokta(e)
      parmaklar.set(e.pointerId, p)
      const { kap, icerik } = son.current
      if (mod === 'pinch' && parmaklar.size >= 2 && onceki) {
        const simdi = cift()
        uygula(pinchUygula(g.current, onceki, simdi, kap, icerik))
        onceki = simdi
      } else if (mod === 'kaydir') {
        hareket += Math.abs(p.x - onc.x) + Math.abs(p.y - onc.y)
        uygula(kaydir(g.current, p.x - onc.x, p.y - onc.y, kap, icerik))
      } else if (mod === 'arac') {
        son.current.aracHareket?.(p)
      }
    }
    const yukari = (e: PointerEvent) => {
      if (!parmaklar.has(e.pointerId)) return
      const p = nokta(e)
      parmaklar.delete(e.pointerId)
      if (mod === 'arac' && parmaklar.size === 0) { son.current.aracBitir?.(p); mod = 'yok'; return }
      if (mod === 'pinch' && parmaklar.size < 2) { mod = parmaklar.size ? 'kaydir' : 'yok'; onceki = null; return }
      if (mod === 'kaydir' && parmaklar.size === 0) {
        mod = 'yok'
        // double tap (touch / pen): two short, nearly motionless taps close together
        if (basla && hareket < 10 && Date.now() - basla.t < 300) {
          if (sonDokunus && basla.t - sonDokunus.t < 320 && Math.hypot(p.x - sonDokunus.x, p.y - sonDokunus.y) < 32 && e.pointerType !== 'mouse') {
            uygula(ciftDokunus(g.current, p, son.current.kap, son.current.icerik)); sonDokunus = null
          } else sonDokunus = { t: basla.t, x: p.x, y: p.y }
        }
      }
    }
    const iptal = (e: PointerEvent) => {
      parmaklar.delete(e.pointerId)
      if (mod === 'arac') son.current.aracIptal?.()
      if (!parmaklar.size) { mod = 'yok'; onceki = null }
    }
    const tekerlek = (e: WheelEvent) => {
      if (son.current.devreDisi) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const birim = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      const carpan = Math.exp((-e.deltaY * birim) * (e.ctrlKey ? 0.01 : 0.0018))
      uygula(imlecteYakinlastir(g.current, { x: e.clientX - r.left, y: e.clientY - r.top }, carpan, son.current.kap, son.current.icerik))
    }
    const cifTik = (e: MouseEvent) => {
      if (son.current.devreDisi || son.current.aracBasla) return
      const r = el.getBoundingClientRect()
      uygula(ciftDokunus(g.current, { x: e.clientX - r.left, y: e.clientY - r.top }, son.current.kap, son.current.icerik))
    }
    el.addEventListener('pointerdown', asagi)
    el.addEventListener('pointermove', tasi)
    el.addEventListener('pointerup', yukari)
    el.addEventListener('pointercancel', iptal)
    el.addEventListener('wheel', tekerlek, { passive: false })
    el.addEventListener('dblclick', cifTik)
    return () => {
      el.removeEventListener('pointerdown', asagi)
      el.removeEventListener('pointermove', tasi)
      el.removeEventListener('pointerup', yukari)
      el.removeEventListener('pointercancel', iptal)
      el.removeEventListener('wheel', tekerlek)
      el.removeEventListener('dblclick', cifTik)
    }
  }, [ref])
}
