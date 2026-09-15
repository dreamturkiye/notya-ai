const CACHE = 'notya-v4'
const PAYLAS_CACHE = 'notya-cihaz-paylas' // NOTYA-BLE-02: Android Web Share Target geçici dosya
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
      Promise.all(keys.filter(k => k !== CACHE && k !== PAYLAS_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // NOTYA-BLE-02 (Kaan 2026-09-15): cihaz uygulamasından (Eko, Kardia, Butterfly…) Paylaş → Notya.
  // Paylaşım POST'u sunucuya gitmez (oturum Bearer token tarayıcıda) — dosya burada tutulur, sayfa token ile yükler.
  const url = new URL(e.request.url)
  if (e.request.method === 'POST' && url.pathname === '/cihaz/paylas') {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData()
        const dosya = fd.getAll('dosya').find(f => f && typeof f === 'object' && 'name' in f) || null
        if (dosya) {
          const cache = await caches.open(PAYLAS_CACHE)
          await cache.put('/cihaz/paylas/dosya', new Response(dosya, {
            headers: {
              'content-type': dosya.type || 'application/octet-stream',
              'x-dosya-adi': encodeURIComponent(dosya.name || 'paylasilan'),
              'x-baslik': encodeURIComponent(String(fd.get('title') || '')),
              'x-metin': encodeURIComponent(String(fd.get('text') || '')),
            },
          }))
        }
        return Response.redirect('/cihaz/paylas?geldi=' + (dosya ? '1' : '0'), 303)
      } catch {
        return Response.redirect('/cihaz/paylas?geldi=0', 303)
      }
    })())
    return
  }
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
