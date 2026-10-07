/**
 * Notya MBYS Yardımcısı — service worker (MBYS-YARDIMCI-01).
 *
 * Holds the ONE record the doctor handed over from the Notya tab ("MBYS'ye aktar"), in chrome.storage.session
 * only (memory, gone when the browser closes; not readable by the page or the content script directly). The record
 * is cleared after the Muayene screen is filled, or 10 minutes after it arrived, whichever comes first.
 * No network request is made from here — not to Notya, not to the Ministry.
 */
const NOTYA_KOKENLERI = ['https://notya.io', 'https://www.notya.io']
const MBYS_KOKENI = 'https://mbys2.saglik.gov.tr'
const OMUR_MS = 10 * 60 * 1000
const ANAHTAR = 'notyaMbysKayit'
const ALARM = 'notyaMbysTemizle'

let haritaOnbellek = null
async function harita() {
  if (!haritaOnbellek) haritaOnbellek = await (await fetch(chrome.runtime.getURL('harita.json'))).json()
  return haritaOnbellek
}

async function temizle() {
  await chrome.storage.session.remove(ANAHTAR)
  await chrome.alarms.clear(ALARM)
}

async function tutulan() {
  const o = await chrome.storage.session.get(ANAHTAR)
  const t = o[ANAHTAR]
  if (!t) return null
  if (Date.now() - t.alindi > OMUR_MS) {
    await temizle()
    return null
  }
  return t
}

/** Shape check — a record that does not look like Notya's is refused, not stored. */
function kayitGecerliMi(k) {
  if (!k || typeof k !== 'object' || k.surum !== 1) return false
  if (!k.kimlik || typeof k.kimlik !== 'object') return false
  if (!['vatandas', 'yabanci', 'vatansiz', ''].includes(k.kayitTuru)) return false
  if (k.muayene !== null && typeof k.muayene !== 'object') return false
  if (!Array.isArray(k.tanilar)) return false
  return JSON.stringify(k).length < 60000
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) void temizle()
})

// From the Notya tab only (externally_connectable + origin check).
chrome.runtime.onMessageExternal.addListener((mesaj, gonderen, yanitla) => {
  const koken = gonderen.origin || (gonderen.url ? new URL(gonderen.url).origin : '')
  if (!NOTYA_KOKENLERI.includes(koken)) { yanitla({ ok: false, hata: 'koken' }); return false }
  ;(async () => {
    if (mesaj && mesaj.tip === 'ping') return { ok: true, surum: chrome.runtime.getManifest().version }
    if (mesaj && mesaj.tip === 'kayit') {
      if (!kayitGecerliMi(mesaj.kayit)) return { ok: false, hata: 'kayit' }
      // One patient at a time: a new hand-over replaces the previous one.
      await chrome.storage.session.set({ [ANAHTAR]: { kayit: mesaj.kayit, alindi: Date.now(), kimlikDolduruldu: false } })
      await chrome.alarms.create(ALARM, { delayInMinutes: OMUR_MS / 60000 })
      return { ok: true }
    }
    if (mesaj && mesaj.tip === 'temizle') { await temizle(); return { ok: true } }
    return { ok: false, hata: 'tip' }
  })().then(yanitla, () => yanitla({ ok: false, hata: 'ic' }))
  return true
})

// From our own content script on the MBYS page.
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitla) => {
  if (gonderen.id !== chrome.runtime.id || !gonderen.tab) return false
  if (!gonderen.url || new URL(gonderen.url).origin !== MBYS_KOKENI) return false
  ;(async () => {
    const h = await harita()
    if (mesaj && mesaj.tip === 'durum') {
      const t = await tutulan()
      return { ok: true, harita: h, kayitVar: !!t, kimlikDolduruldu: !!(t && t.kimlikDolduruldu), muayeneVar: !!(t && t.kayit.muayene) }
    }
    if (mesaj && mesaj.tip === 'kayitAl') {
      const t = await tutulan()
      return t ? { ok: true, kayit: t.kayit } : { ok: false }
    }
    if (mesaj && mesaj.tip === 'ekranDolduruldu') {
      const t = await tutulan()
      if (!t) return { ok: true }
      if (mesaj.ekran === 'muayene') await temizle()
      else if (mesaj.ekran === 'hastaKayit') await chrome.storage.session.set({ [ANAHTAR]: Object.assign({}, t, { kimlikDolduruldu: true }) })
      return { ok: true }
    }
    if (mesaj && mesaj.tip === 'temizle') { await temizle(); return { ok: true } }
    return { ok: false }
  })().then(yanitla, () => yanitla({ ok: false }))
  return true
})

// A browser restart empties session storage anyway; drop a stale alarm too.
chrome.runtime.onStartup.addListener(() => { void temizle() })
