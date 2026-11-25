const CACHE = 'notya-v5'
// HASTA-PORTALI-GUNLUK: Sağlığım push settings (the portal path to open on a notification tap). Never cleared on activate.
const AYAR = 'sg-ayar'
const OFFLINE_ASSETS = ['/', '/notes', '/session/new', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== AYAR).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return

  e.respondWith(
    fetch(e.request)
      .then(r => {
        const clone = r.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return r
      })
      .catch(() => caches.match(e.request))
  )
})

// HASTA-PORTALI-GUNLUK (2026-11-24) — Sağlığım web push. The payload carries generic words only (no medicine name, no
// value); the portal page tells the worker which patient link to open (postMessage 'sg-portal-yol').
self.addEventListener('message', e => {
  const d = e.data || {}
  if (d.tur === 'sg-portal-yol' && typeof d.yol === 'string' && d.yol.startsWith('/portal/')) {
    e.waitUntil(caches.open(AYAR).then(c => c.put('/__sg_portal_yol', new Response(d.yol))))
  }
})

self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { d = {} }
  e.waitUntil(self.registration.showNotification(d.baslik || 'Sağlığım', {
    body: d.govde || '',
    tag: d.etiket || 'saglikim',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { yol: typeof d.yol === 'string' ? d.yol : '' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil((async () => {
    let taban = '/'
    try {
      const c = await caches.open(AYAR)
      const r = await c.match('/__sg_portal_yol')
      if (r) taban = await r.text()
    } catch (_) { /* yok */ }
    const ek = (e.notification.data && e.notification.data.yol) || ''
    const hedef = taban === '/' ? '/' : taban + ek
    const pencereler = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const p of pencereler) {
      if (taban !== '/' && p.url.includes(taban) && 'focus' in p) {
        try { await p.navigate(hedef) } catch (_) { /* yok */ }
        return p.focus()
      }
    }
    return self.clients.openWindow(hedef)
  })())
})
