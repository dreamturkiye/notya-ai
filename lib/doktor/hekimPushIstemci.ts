/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — the doctor's browser side of Web Push: is it supported here, is this browser subscribed,
 * subscribe / unsubscribe through /api/doktor/bildirimler. Client only. No new package: the standard Push API + the app's
 * existing service worker (public/sw.js). iOS / iPadOS deliver web push only to a web app added to the Home Screen
 * (Safari 16.4+), so the settings page shows that hint when the page runs in a normal Safari tab.
 */
import { doktorFetch } from '@/lib/doktor/oturumFetch'

export const BILDIRIM_API = '/api/doktor/bildirimler'

export type HekimPushDurumu = 'yukleniyor' | 'desteklenmiyor' | 'ios-ana-ekran' | 'reddedildi' | 'kapali' | 'acik' | 'yapilandirilmamis'

export function iosMu(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export function anaEkranUygulamasiMi(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
export function pushDestekleniyor(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function kayit(): Promise<ServiceWorkerRegistration | null> {
  if (!pushDestekleniyor()) return null
  return (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'))
}

export async function buTarayiciAboneligi(): Promise<PushSubscription | null> {
  try { return (await (await kayit())?.pushManager.getSubscription()) ?? null } catch { return null }
}

const b64uBayt = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}
const baytB64u = (a: ArrayBuffer | null) => (a ? btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '')

export function cihazAdi(): string {
  if (typeof navigator === 'undefined') return 'Tarayıcı'
  const ua = navigator.userAgent
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Cihaz'
  const tr = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı'
  return `${os} · ${tr}`
}

/** Ask the browser, subscribe, store the subscription on the server. */
export async function hekimPushAc(vapidAcik: string): Promise<{ ok: true } | { ok: false; hata: string }> {
  if (!pushDestekleniyor()) return { ok: false, hata: iosMu() ? 'iPhone ve iPad’de bildirim için önce Notya’yı ana ekrana ekleyin.' : 'Bu tarayıcı bildirim desteklemiyor.' }
  const izin = await Notification.requestPermission()
  if (izin !== 'granted') return { ok: false, hata: 'Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsiniz.' }
  const reg = await kayit()
  if (!reg) return { ok: false, hata: 'Bildirim açılamadı.' }
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBayt(vapidAcik) })
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return undefined } })()
  const r = await doktorFetch(BILDIRIM_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem: 'abone', abonelik: { endpoint: sub.endpoint, p256dh: baytB64u(sub.getKey('p256dh')), auth: baytB64u(sub.getKey('auth')) }, cihaz: cihazAdi(), saatDilimi: tz }) })
  if (!r.ok) { const j = await r.json().catch(() => ({})); return { ok: false, hata: (j as { error?: string }).error || 'Bildirim açılamadı.' } }
  return { ok: true }
}

export async function hekimPushKapat(): Promise<void> {
  const sub = await buTarayiciAboneligi()
  if (!sub) return
  await doktorFetch(BILDIRIM_API, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => null)
  await sub.unsubscribe().catch(() => false)
}

/** This browser's state, for the settings page and the one-time prompt. */
export async function hekimPushDurumu(vapidAcik: string | null): Promise<HekimPushDurumu> {
  if (!vapidAcik) return 'yapilandirilmamis'
  if (iosMu() && !anaEkranUygulamasiMi()) return 'ios-ana-ekran'
  if (!pushDestekleniyor()) return 'desteklenmiyor'
  if (Notification.permission === 'denied') return 'reddedildi'
  return (await buTarayiciAboneligi()) ? 'acik' : 'kapali'
}
