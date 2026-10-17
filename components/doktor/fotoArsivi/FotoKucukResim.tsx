'use client'

/**
 * FOTO-ARSIV-01 — lazy thumbnail. Loads only when the tile nears the viewport (IntersectionObserver), through a small
 * concurrency queue, from the encrypted server-stored thumbnail. If none exists yet (older photos) the device makes one from
 * the original and uploads it, so the next visit — on any device — is fast.
 */
import { useEffect, useRef, useState } from 'react'
import { dosyaBlob, kucukGetir, kucukYaz } from './api'
import { kucukResimUret } from './istemciGorsel'

const AZAMI_ESZAMANLI = 4
const URL_AZAMI = 500
const urller = new Map<string, string>()
const kuyruk: (() => void)[] = []
let aktif = 0

function sirayla<T>(is: () => Promise<T>): Promise<T> {
  return new Promise((coz, red) => {
    const calistir = () => {
      aktif++
      is().then(coz, red).finally(() => { aktif--; kuyruk.shift()?.() })
    }
    if (aktif < AZAMI_ESZAMANLI) calistir()
    else kuyruk.push(calistir)
  })
}

function urlKoy(anahtar: string, blob: Blob): string {
  const u = URL.createObjectURL(blob)
  urller.set(anahtar, u)
  if (urller.size > URL_AZAMI) {
    const eski = urller.keys().next().value
    if (eski !== undefined) { URL.revokeObjectURL(urller.get(eski)!); urller.delete(eski) }
  }
  return u
}

/** Forget a cached thumbnail (after the photo changed). */
export function kucukUnut(patientId: string, belgeId: string): void {
  const k = `${patientId}/${belgeId}`
  const u = urller.get(k)
  if (u) { URL.revokeObjectURL(u); urller.delete(k) }
}

async function kucukHazirla(patientId: string, belgeId: string, kucukVar: boolean): Promise<Blob> {
  if (kucukVar) {
    const b = await kucukGetir(patientId, belgeId)
    if (b) return b
  }
  // none stored: derive on the device, upload for next time (best effort — a read-only role simply cannot store it)
  const blob = await dosyaBlob(patientId, belgeId)
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  try {
    const k = await kucukResimUret(bmp)
    void kucukYaz(patientId, belgeId, k.blob, k.w, k.h).catch(() => undefined)
    return k.blob
  } finally { bmp.close() }
}

export default function FotoKucukResim({ patientId, belgeId, kucukVar, alt }: { patientId: string; belgeId: string; kucukVar: boolean; alt: string }) {
  const kapRef = useRef<HTMLDivElement>(null)
  const anahtar = `${patientId}/${belgeId}`
  const [url, setUrl] = useState<string | null>(() => urller.get(anahtar) ?? null)
  const [hata, setHata] = useState(false)

  useEffect(() => {
    const onbellekte = urller.get(anahtar)
    if (onbellekte) { setUrl(onbellekte); return }
    setUrl(null); setHata(false)
    const el = kapRef.current
    if (!el) return
    let iptal = false
    const yukle = () => {
      sirayla(() => kucukHazirla(patientId, belgeId, kucukVar))
        .then((b) => { if (!iptal) setUrl(urller.get(anahtar) ?? urlKoy(anahtar, b)) })
        .catch(() => { if (!iptal) setHata(true) })
    }
    if (typeof IntersectionObserver === 'undefined') { yukle(); return () => { iptal = true } }
    const io = new IntersectionObserver((girdiler) => {
      if (girdiler.some((g) => g.isIntersecting)) { io.disconnect(); yukle() }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => { iptal = true; io.disconnect() }
  }, [patientId, belgeId, kucukVar, anahtar])

  return (
    <div ref={kapRef} style={{ position: 'absolute', inset: 0, background: '#e7dfd0' }}>
      {url && <img src={url} alt={alt} decoding="async" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      {!url && hata && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 11, color: '#8b7d70', padding: 6, textAlign: 'center' }}>Önizleme yok</div>}
    </div>
  )
}
