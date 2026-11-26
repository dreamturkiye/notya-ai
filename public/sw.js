const CACHE = 'notya-v6'
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

// HEKIM-PUSH (2026-11-25) — the doctor's own notifications use the same worker. Their `yol` is an in-app doctor path
// (/dashboard/doktor/…, opened as is — the doctor's sign-in guards it); an acil one stays on screen until tapped.
const hekimYoluMu = y => typeof y === 'string' && y.startsWith('/dashboard/doktor')

self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { d = {} }
  const hekim = hekimYoluMu(d.yol)
  e.waitUntil((async () => {
    // HASTA-ALANI-MARKA (2026-11-25): a patient's reminder shows HIS DOCTOR's icon (logo → photo → monogram), drawn by
    // /api/portal/hasta/<token>/marka/ikon for the portal link this browser opened last; the doctor's own alerts keep Notya's.
    let ikon = '/icon-192.png'
    if (!hekim) {
      try {
        const r = await (await caches.open(AYAR)).match('/__sg_portal_yol')
        const m = r ? (await r.text()).match(/^\/portal\/hasta\/([^/?#]+)/) : null
        if (m) ikon = `/api/portal/hasta/${m[1]}/marka/ikon?b=192`
      } catch (_) { /* Notya icon */ }
    }
    return self.registration.showNotification(d.baslik || (hekim ? 'Notya' : 'Sağlığım'), {
    body: d.govde || '',
    tag: d.etiket || 'saglikim',
    icon: ikon,
    badge: '/icon-192.png',
    renotify: hekim,
    requireInteraction: hekim && typeof d.etiket === 'string' && d.etiket.startsWith('ev-acil'),
    data: { yol: typeof d.yol === 'string' ? d.yol : '', eylemler: Array.isArray(d.eylemler) ? d.eylemler.slice(0, 2) : [] },
    // DOZ-KAYDI-ISTEGE-BAGLI (2026-11-26): a dose reminder carries "Hatırlatmaları kapat" until the patient chose.
    actions: Array.isArray(d.eylemler) ? d.eylemler.slice(0, 2).filter(a => a && typeof a.eylem === 'string' && typeof a.baslik === 'string').map(a => ({ action: a.eylem, title: a.baslik })) : [],
    })
  })())
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
    const veri = e.notification.data || {}
    const eylem = e.action && Array.isArray(veri.eylemler) ? veri.eylemler.find(a => a && a.eylem === e.action) : null
    // An action path is portal-relative ("/tercihler?hatirlatma=kapat"); never a doctor path or an outside URL.
    const ek = (eylem && typeof eylem.yol === 'string' && eylem.yol.startsWith('/') && !eylem.yol.startsWith('//') && !hekimYoluMu(eylem.yol) ? eylem.yol : veri.yol) || ''
    const pencereler = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (hekimYoluMu(ek)) {
      for (const p of pencereler) {
        if (p.url.includes('/dashboard/doktor') && 'focus' in p) {
          try { await p.navigate(ek) } catch (_) { /* yok */ }
          return p.focus()
        }
      }
      return self.clients.openWindow(ek)
    }
    const hedef = taban === '/' ? '/' : taban + ek
    for (const p of pencereler) {
      if (taban !== '/' && p.url.includes(taban) && 'focus' in p) {
        try { await p.navigate(hedef) } catch (_) { /* yok */ }
        return p.focus()
      }
    }
    return self.clients.openWindow(hedef)
  })())
})
