/**
 * Notya MBYS Yardımcısı — content script on https://mbys2.saglik.gov.tr (MBYS-YARDIMCI-01).
 *
 * Shows one small floating panel. Nothing is filled on page load: the doctor presses "Notya'dan doldur" and the
 * engine (motor.js) fills the fields of the screen in front of them, then stops. Every Ministry button stays the
 * doctor's. "Form haritasını kopyala" copies the screen's STRUCTURE (never a value) while the map is unverified.
 */
;(function () {
  'use strict'
  if (window.top !== window || window.__notyaMbys) return
  window.__notyaMbys = true
  const motor = window.NotyaMbysMotor
  if (!motor) return

  const RENK = { krem: '#FAF8F4', cam: '#2F4334', murekkep: '#2E251D', soluk: '#6D6055', cizgi: '#E6DED0', uyari: '#7A5B1E', uyariZemin: '#FFF6E5', hata: '#8C2F2F' }
  let harita = null
  let durum = null
  /** Kept in this page's memory only while the result panel is open (overwrite prompts, next diagnosis). */
  let aktifKayit = null
  let aktifZaman = 0

  const kap = document.createElement('div')
  kap.setAttribute('data-notya-mbys', '')
  kap.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;'
  const golge = kap.attachShadow({ mode: 'closed' })
  const stil = document.createElement('style')
  stil.textContent = `
    :host { all: initial; }
    .panel { font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: ${RENK.murekkep}; background: ${RENK.krem};
      border: 1px solid ${RENK.cizgi}; border-radius: 14px; box-shadow: 0 6px 24px rgba(46,37,29,.18); padding: 10px; max-width: 340px; }
    .satir { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    button { font: inherit; font-weight: 700; border-radius: 999px; padding: 7px 12px; cursor: pointer; border: 1px solid ${RENK.cam}; }
    .ana { background: ${RENK.cam}; color: ${RENK.krem}; }
    .ikincil { background: #fff; color: ${RENK.cam}; }
    .kucuk { padding: 3px 9px; font-size: 12px; }
    .mesaj { margin-top: 8px; font-weight: 700; color: ${RENK.cam}; }
    .mesaj.hata { color: ${RENK.hata}; }
    .liste { margin: 6px 0 0; padding: 0; list-style: none; max-height: 180px; overflow: auto; }
    .liste li { padding: 3px 0; border-top: 1px solid ${RENK.cizgi}; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .baslik { margin-top: 8px; font-size: 12px; font-weight: 700; color: ${RENK.soluk}; }
    .uyari { background: ${RENK.uyariZemin}; color: ${RENK.uyari}; border-radius: 8px; padding: 6px 8px; margin-top: 6px; }
    .kapat { background: none; border: none; color: ${RENK.soluk}; padding: 2px 6px; margin-left: auto; }
  `
  const panel = document.createElement('div')
  panel.className = 'panel'
  golge.append(stil, panel)

  function el(tag, ozellik, ...cocuk) {
    const e = document.createElement(tag)
    Object.assign(e, ozellik || {})
    for (const c of cocuk) if (c != null) e.append(c)
    return e
  }

  function gonder(mesaj) {
    return new Promise((coz) => {
      try {
        chrome.runtime.sendMessage(mesaj, (y) => coz(chrome.runtime.lastError ? null : y))
      } catch (e) { coz(null) }
    })
  }

  function aktifKayitGecerli() {
    if (aktifKayit && Date.now() - aktifZaman > 10 * 60 * 1000) aktifKayit = null
    return aktifKayit
  }

  function dugmeler() {
    const s = el('div', { className: 'satir' })
    if (durum && durum.kayitVar) {
      s.append(el('button', { className: 'ana', textContent: "Notya'dan doldur", onclick: () => void doldurTikla() }))
    }
    if (harita && motor.dogrulanmamisVar(harita)) {
      s.append(el('button', { className: 'ikincil', textContent: 'Form haritasını kopyala', onclick: () => void haritaKopyala() }))
    }
    return s
  }

  function ciz(govde) {
    panel.replaceChildren()
    const ust = dugmeler()
    if (govde) ust.append(el('button', { className: 'kapat', textContent: '✕', title: 'Kapat', onclick: () => { aktifKayit = null; ciz(null) } }))
    panel.append(ust)
    if (govde) panel.append(govde)
    kap.style.display = ust.childElementCount || govde ? '' : 'none'
  }

  async function yenile() {
    const y = await gonder({ tip: 'durum' })
    if (!y || !y.ok) return
    harita = y.harita
    durum = y
    if (!motor.adresIzinliMi(location.href, harita)) { kap.style.display = 'none'; return }
    // A result on screen stays until the doctor closes it.
    if (!panel.querySelector('.mesaj')) ciz(null)
  }

  function sonucGoster(sonuc) {
    const g = el('div')
    const basarili = !!sonuc.ekran && sonuc.dolduruldu.length > 0
    g.append(el('div', { className: basarili ? 'mesaj' : 'mesaj hata', textContent: sonuc.mesaj || 'Hiçbir alan doldurulmadı.' }))
    if (sonuc.dolduruldu.length) {
      g.append(el('div', { className: 'baslik', textContent: `Doldurulan (${sonuc.dolduruldu.length}) — yeşil çerçeveli` }))
      g.append(el('ul', { className: 'liste' }, ...sonuc.dolduruldu.map((a) => el('li', {}, el('span', { textContent: a.etiket + (a.detay ? ` · ${a.detay}` : '') })))))
    }
    if (sonuc.dolu.length) {
      g.append(el('div', { className: 'uyari', textContent: 'Bu alanlara siz yazmışsınız; dokunmadım. Üzerine yazayım mı?' }))
      g.append(el('ul', { className: 'liste' }, ...sonuc.dolu.map((a) => el('li', {},
        el('span', { textContent: a.etiket }),
        el('button', { className: 'ikincil kucuk', textContent: 'Üzerine yaz', onclick: () => void uzerineYaz(a.anahtar) }),
      ))))
    }
    if (sonuc.doldurulamadi.length) {
      g.append(el('div', { className: 'baslik', textContent: 'Doldurulamayan — elle girin' }))
      g.append(el('ul', { className: 'liste' }, ...sonuc.doldurulamadi.map((a) => el('li', {}, el('span', { textContent: `${a.etiket}: ${a.neden}` })))))
    }
    if (sonuc.bos.length && sonuc.ekran) {
      g.append(el('div', { className: 'baslik', textContent: `Notya'da boş: ${sonuc.bos.map((a) => a.etiket).join(', ')}` }))
    }
    if (sonuc.bekleyenTanilar.length) {
      g.append(el('div', { className: 'baslik', textContent: 'İlk tanıyı seçtikten sonra sıradaki kodu yazdırın:' }))
      g.append(el('ul', { className: 'liste' }, ...sonuc.bekleyenTanilar.map((kod) => {
        const b = el('button', { className: 'ikincil kucuk', textContent: 'Yaz' })
        b.onclick = () => {
          const ok = motor.taniYaz(document, harita, kod)
          b.textContent = ok ? 'Yazıldı — sonucu seçin' : 'Arama alanı bulunamadı'
          b.disabled = true
        }
        return el('li', {}, el('span', { textContent: kod }), b)
      })))
    }
    if (sonuc.engellenenGonderim) {
      g.append(el('div', { className: 'uyari', textContent: 'Sayfa doldurma sırasında form göndermeye çalıştı; durdurdum. Hiçbir şey gönderilmedi.' }))
    }
    ciz(g)
  }

  async function doldurTikla() {
    const y = await gonder({ tip: 'kayitAl' })
    if (!y || !y.ok) {
      aktifKayit = null
      ciz(el('div', { className: 'mesaj hata', textContent: "Notya'dan kayıt yok ya da süresi doldu (10 dk). Notya'da “MBYS'ye aktar”a yeniden basın." }))
      return
    }
    aktifKayit = y.kayit
    aktifZaman = Date.now()
    const sonuc = await motor.doldur(document, harita, aktifKayit, {})
    if (sonuc.ekran && sonuc.dolduruldu.length) await gonder({ tip: 'ekranDolduruldu', ekran: sonuc.ekran })
    sonucGoster(sonuc)
    void yenile()
  }

  async function uzerineYaz(anahtar) {
    const k = aktifKayitGecerli()
    if (!k) { ciz(el('div', { className: 'mesaj hata', textContent: "Süre doldu. Notya'da “MBYS'ye aktar”a yeniden basın." })); return }
    const sonuc = await motor.doldur(document, harita, k, { yalniz: [anahtar], uzerineYaz: [anahtar] })
    sonucGoster(sonuc)
  }

  async function haritaKopyala() {
    const metin = motor.haritaYakala(document, harita)
    let ok = false
    try { await navigator.clipboard.writeText(metin); ok = true } catch (e) {
      const t = el('textarea', { value: metin })
      golge.append(t)
      t.select()
      try { ok = document.execCommand('copy') } catch (e2) { ok = false }
      t.remove()
    }
    ciz(el('div', { className: ok ? 'mesaj' : 'mesaj hata', textContent: ok
      ? "Form haritası panoya kopyalandı (yalnız alan adları ve etiketler; hiçbir değer yok). Notya'ya gönderin."
      : 'Kopyalanamadı. Sayfaya bir kez tıklayıp yeniden deneyin.' }))
  }

  document.documentElement.append(kap)
  kap.style.display = 'none'
  void yenile()
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void yenile() })
  window.addEventListener('focus', () => void yenile())
})()
