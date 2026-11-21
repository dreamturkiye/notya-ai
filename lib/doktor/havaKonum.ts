/**
 * HAVA-KONUM-01 (beta feedback, KBB doctor on iPhone Safari, 2026-11-21): "Düzeltme yapmak için her yere gidişte konumu
 * kullanmak istiyor." The weather chip asked navigator.geolocation on EVERY mount of the frame, so Safari put up the
 * location prompt page after page (country builds navigate with full page loads, so every screen asked).
 *
 * The rule now, shared by the Türkiye chrome (components/doktor/DoktorChrome.tsx) and every country frame
 * (components/ulke/uygulama/Kabuk.tsx):
 *   - The browser is NEVER asked on mount. Location is asked only when the doctor taps the weather chip.
 *   - The answer is remembered on this device (localStorage, every access in try/catch): granted → the rounded
 *     coordinates are kept and reused, so later screens show the weather without asking again; declined → never asked
 *     again automatically, and the chip is not offered again.
 *   - The weather itself is cached for 30 minutes, so moving between screens does not refetch it either.
 *   - No guessed place: without a remembered location the chip offers itself ("tap to show"); a number is only ever
 *     drawn from a real reading (Open-Meteo, free and keyless).
 *
 * No word is written here: the chip's label is the caller's (Türkiye's words / the country pack's).
 */
import { useCallback, useEffect, useState } from 'react'

export const HAVA_DEPO_ANAHTARI = 'notya-hava-konum-v1'
/** How long a weather reading is shown before it is fetched again. */
export const HAVA_TAZELIK_MS = 30 * 60 * 1000

export type Hava = { sicaklik: number; kod: number }
export type HavaKarari = 'izin' | 'red'
export type HavaKaydi = {
  karar?: HavaKarari
  enlem?: number
  boylam?: number
  hava?: Hava & { zaman: number }
}

type Depo = Pick<Storage, 'getItem' | 'setItem'>

function varsayilanDepo(): Depo | null {
  try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null } catch { return null }
}

const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** The remembered decision / place / reading. A broken, blocked or missing store reads as "nothing remembered". */
export function havaKaydiOku(depo: Depo | null = varsayilanDepo()): HavaKaydi {
  if (!depo) return {}
  try {
    const ham = depo.getItem(HAVA_DEPO_ANAHTARI)
    if (!ham) return {}
    const o = JSON.parse(ham) as Record<string, unknown>
    if (!o || typeof o !== 'object') return {}
    const k: HavaKaydi = {}
    if (o.karar === 'izin' || o.karar === 'red') k.karar = o.karar
    if (sayiMi(o.enlem) && sayiMi(o.boylam) && Math.abs(o.enlem) <= 90 && Math.abs(o.boylam) <= 180) { k.enlem = o.enlem; k.boylam = o.boylam }
    const h = o.hava as Record<string, unknown> | undefined
    if (h && sayiMi(h.sicaklik) && sayiMi(h.kod) && sayiMi(h.zaman)) k.hava = { sicaklik: h.sicaklik, kod: h.kod, zaman: h.zaman }
    return k
  } catch { return {} }
}

export function havaKaydiYaz(k: HavaKaydi, depo: Depo | null = varsayilanDepo()): void {
  if (!depo) return
  try { depo.setItem(HAVA_DEPO_ANAHTARI, JSON.stringify(k)) } catch { /* private window / storage full: nothing remembered */ }
}

/** Two decimals (~1 km): enough for the weather, no exact address kept on the device. */
export function konumYuvarla(x: number): number { return Math.round(x * 100) / 100 }

export function havaTazeMi(k: HavaKaydi, simdi: number): boolean {
  return Boolean(k.hava && simdi - k.hava.zaman >= 0 && simdi - k.hava.zaman < HAVA_TAZELIK_MS)
}

export function havaAdresi(enlem: number, boylam: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&current=temperature_2m,weather_code`
}

/** Open-Meteo's answer → the reading, or null when it carries no real temperature (never a made-up number). */
export function havaCevabiCoz(d: unknown): Hava | null {
  const c = (d as { current?: { temperature_2m?: unknown; weather_code?: unknown } } | null)?.current
  if (!c || !sayiMi(c.temperature_2m)) return null
  return { sicaklik: Math.round(c.temperature_2m), kod: Number(c.weather_code) || 0 }
}

/** Whether the chip may offer itself: no reading on screen, the doctor has not declined, the browser can locate. */
export function havaIstenebilirMi(k: HavaKaydi, hava: Hava | null, konumVar: boolean): boolean {
  return !hava && k.karar !== 'red' && konumVar
}

/** GeolocationPositionError.PERMISSION_DENIED — the only error that is remembered as "declined". */
export const KONUM_REDDEDILDI = 1

async function havaGetir(enlem: number, boylam: number): Promise<Hava | null> {
  try {
    const kontrol = typeof AbortController !== 'undefined' ? new AbortController() : null
    const zaman = kontrol ? setTimeout(() => kontrol.abort(), 8000) : null
    try {
      const r = await fetch(havaAdresi(enlem, boylam), kontrol ? { signal: kontrol.signal } : undefined)
      return r.ok ? havaCevabiCoz(await r.json()) : null
    } finally { if (zaman) clearTimeout(zaman) }
  } catch { return null }
}

/**
 * The weather chip's state. `hava` is a real reading or null; `iste` is the tap handler (asks the browser ONCE);
 * `istenebilir` says whether the chip should offer itself.
 */
export function useHavaKonum(): { hava: Hava | null; istenebilir: boolean; iste: () => void } {
  const [hava, setHava] = useState<Hava | null>(null)
  const [kayit, setKayit] = useState<HavaKaydi>({})
  const [konumVar, setKonumVar] = useState(false)
  const [soruluyor, setSoruluyor] = useState(false)

  const yukle = useCallback(async (k: HavaKaydi, iptal: () => boolean) => {
    if (k.enlem === undefined || k.boylam === undefined) return
    const h = await havaGetir(k.enlem, k.boylam)
    if (iptal() || !h) return
    setHava(h)
    const yeni = { ...havaKaydiOku(), karar: 'izin' as const, enlem: k.enlem, boylam: k.boylam, hava: { ...h, zaman: Date.now() } }
    havaKaydiYaz(yeni)
    setKayit(yeni)
  }, [])

  useEffect(() => {
    let iptalEdildi = false
    setKonumVar(typeof navigator !== 'undefined' && Boolean(navigator.geolocation))
    const k = havaKaydiOku()
    setKayit(k)
    if (k.hava && havaTazeMi(k, Date.now())) setHava({ sicaklik: k.hava.sicaklik, kod: k.hava.kod })
    // A remembered place is reused — the browser is not asked. Nothing remembered → nothing happens until a tap.
    else if (k.karar === 'izin') void yukle(k, () => iptalEdildi)
    return () => { iptalEdildi = true }
  }, [yukle])

  const iste = useCallback(() => {
    if (soruluyor || typeof navigator === 'undefined' || !navigator.geolocation) return
    const k = havaKaydiOku()
    if (k.karar === 'red') return
    setSoruluyor(true)
    navigator.geolocation.getCurrentPosition(
      (konum) => {
        setSoruluyor(false)
        const yeni: HavaKaydi = { ...k, karar: 'izin', enlem: konumYuvarla(konum.coords.latitude), boylam: konumYuvarla(konum.coords.longitude) }
        havaKaydiYaz(yeni)
        setKayit(yeni)
        void yukle(yeni, () => false)
      },
      (hata) => {
        setSoruluyor(false)
        // Declined → remembered: never asked again automatically. A timeout / unavailable position is not a decision.
        if (hata?.code === KONUM_REDDEDILDI) {
          const yeni: HavaKaydi = { karar: 'red' }
          havaKaydiYaz(yeni)
          setKayit(yeni)
        }
      },
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    )
  }, [soruluyor, yukle])

  return { hava, istenebilir: havaIstenebilirMi(kayit, hava, konumVar) && !soruluyor, iste }
}
