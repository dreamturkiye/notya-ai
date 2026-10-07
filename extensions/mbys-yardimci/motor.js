/**
 * Notya MBYS Yardımcısı — fill engine (MBYS-YARDIMCI-01).
 *
 * Fills form FIELDS only. It never clicks, submits, presses Enter, navigates or logs in: every Ministry action
 * (Sorgula, Kaydet, Ekle, işleme al …) stays a physical click by the doctor. It only runs when the doctor presses
 * the helper's own button (icerik.js); nothing here runs on page load.
 *
 * Field positions come from harita.json (selector first, Turkish label text second). Loaded as a classic content
 * script (window.NotyaMbysMotor) and as a CommonJS module by the unit tests (lib/enabiz/mbys/motor.test.ts).
 */
;(function (kok) {
  'use strict'

  const KONTROL =
    'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]):not([type=file]), select, textarea'
  const ETIKET_ADAYI = 'label, th, td, span, div, dt, dd, legend, b, strong, p, font'
  const TR_HARF = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c', â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u' }
  const YER_TUTUCU = /^(-+|seciniz|secin|lutfen seciniz|hepsi|tumu|bos)?$/

  /** Turkish-insensitive comparison key: "Hasta T.C. :" → "hasta tc", "Bulgu / Gözlem" → "bulgu/gozlem". */
  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/[ıİşŞğĞüÜöÖçÇâÂîÎûÛ]/g, (c) => TR_HARF[c])
      .toLowerCase()
      .replace(/[.*:() ]/g, ' ')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function globRegex(glob) {
    return new RegExp('^' + String(glob).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  }

  /** Is the helper allowed on this address at all? Never on the login page. */
  function adresIzinliMi(url, harita) {
    let u
    try { u = new URL(String(url)) } catch (e) { return false }
    const a = (harita && harita.adresler) || {}
    const eslesir = (a.eslesme || []).some((g) => globRegex(g).test(u.origin + u.pathname))
    if (!eslesir) return false
    const yol = u.pathname.toLowerCase()
    return !(a.dokunma || []).some((p) => yol.startsWith(String(p).toLowerCase()))
  }

  function dogrulanmamisVar(harita) {
    const ekranlar = (harita && harita.ekranlar) || {}
    return Object.keys(ekranlar).some((k) => (ekranlar[k].alanlar || []).some((g) => g.dogrulandi !== true))
  }

  /** The page and every same-origin frame inside it (MBYS may render a screen in a frame). */
  function belgeleriTopla(doc) {
    const out = []
    const gez = (d, derinlik) => {
      if (!d || out.includes(d) || derinlik > 4) return
      out.push(d)
      let cerceveler = []
      try { cerceveler = Array.from(d.querySelectorAll('iframe, frame')) } catch (e) { cerceveler = [] }
      for (const f of cerceveler) {
        let ic = null
        try { ic = f.contentDocument } catch (e) { ic = null }
        if (ic) gez(ic, derinlik + 1)
      }
    }
    gez(doc, 0)
    return out
  }

  function kontrolMu(el) {
    if (!el || !el.tagName) return false
    const t = el.tagName.toUpperCase()
    if (t === 'SELECT' || t === 'TEXTAREA') return true
    if (t !== 'INPUT') return false
    const tip = String(el.getAttribute('type') || 'text').toLowerCase()
    return !['hidden', 'button', 'submit', 'reset', 'image', 'file'].includes(tip)
  }

  /** An element's own label text: its text without the text of selects / textareas inside it. */
  function kendiMetni(e) {
    let t = String(e.textContent || '')
    for (const ic of Array.from(e.querySelectorAll('select, textarea'))) t = t.replace(String(ic.textContent || ''), ' ')
    return t
  }

  function siraHaritasi(doc) {
    const m = new Map()
    Array.from(doc.querySelectorAll('*')).forEach((n, i) => m.set(n, i))
    return m
  }

  function etikettenKontrol(doc, e, kontroller, sira) {
    if (e.tagName && e.tagName.toUpperCase() === 'LABEL') {
      const hedef = e.getAttribute('for')
      if (hedef) {
        const k = doc.getElementById(hedef)
        if (kontrolMu(k)) return k
      }
    }
    const ic = Array.from(e.querySelectorAll(KONTROL))[0]
    if (ic) return ic
    const benimSiram = sira.get(e)
    let ata = e.parentElement
    for (let seviye = 0; ata && seviye < 3; seviye++, ata = ata.parentElement) {
      const sonraki = kontroller.filter((k) => ata.contains(k) && sira.get(k) > benimSiram)
      if (sonraki.length) return sonraki.reduce((a, b) => (sira.get(a) < sira.get(b) ? a : b))
    }
    return null
  }

  /** Selector first, Turkish label second. Returns { el, yol } or null. */
  function alanBul(doc, giris, onbellek) {
    for (const s of giris.secici || []) {
      let el = null
      try { el = doc.querySelector(s) } catch (e) { el = null }
      if (kontrolMu(el)) return { el, yol: 'secici' }
    }
    const hedefler = (giris.etiketler || []).map(normalize).filter(Boolean)
    if (!hedefler.length) return null
    const c = onbellek || {}
    const kontroller = c.kontroller || (c.kontroller = Array.from(doc.querySelectorAll(KONTROL)))
    for (const h of hedefler) {
      for (const k of kontroller) {
        for (const a of ['aria-label', 'placeholder', 'title']) if (normalize(k.getAttribute(a)) === h) return { el: k, yol: 'etiket' }
      }
    }
    const sira = c.sira || (c.sira = siraHaritasi(doc))
    const adaylar = c.adaylar || (c.adaylar = Array.from(doc.querySelectorAll(ETIKET_ADAYI)).map((e) => ({ e, t: normalize(kendiMetni(e)) })))
    for (const h of hedefler) {
      for (const a of adaylar) {
        if (a.t !== h) continue
        const k = etikettenKontrol(doc, a.e, kontroller, sira)
        if (k) return { el: k, yol: 'etiket' }
      }
    }
    return null
  }

  /** Which screen is this? Counts recognisable fields; a tie or too few → null (the caller fills nothing). */
  function ekranTani(belgeler, harita) {
    let en = { ekran: null, doc: null, skor: 0, ikinci: 0 }
    const skorlar = {}
    for (const doc of belgeler) {
      const onbellek = {}
      const yerel = []
      for (const ad of Object.keys(harita.ekranlar || {})) {
        const ekran = harita.ekranlar[ad]
        const anahtarlar = new Set(ekran.tanima || [])
        const bulunan = new Set()
        for (const g of ekran.alanlar || []) {
          if (!anahtarlar.has(g.anahtar)) continue
          const b = alanBul(doc, g, onbellek)
          if (b) bulunan.add(b.el)
        }
        const skor = bulunan.size
        skorlar[ad] = Math.max(skorlar[ad] || 0, skor)
        yerel.push({ ad, skor, esik: ekran.tanimaEsik || 3 })
      }
      yerel.sort((a, b) => b.skor - a.skor)
      const ilk = yerel[0]
      const ikinci = yerel[1] ? yerel[1].skor : 0
      if (ilk && ilk.skor >= ilk.esik && ilk.skor > ikinci && ilk.skor > en.skor) en = { ekran: ilk.ad, doc, skor: ilk.skor, ikinci }
    }
    return { ekran: en.ekran, doc: en.doc, skorlar }
  }

  function yoldanAl(kayit, yol) {
    return String(yol || '').split('.').reduce((o, k) => (o == null ? undefined : o[k]), kayit)
  }

  /** The value to put in the field, in the form's own format. '' / [] = nothing to fill. */
  function degerHazirla(giris, kayit) {
    const ham = yoldanAl(kayit, giris.kaynak)
    if (giris.tur === 'arama') return Array.isArray(ham) ? ham.map((t) => String((t && t.kod) || t || '').trim()).filter(Boolean) : []
    const s = String(ham == null ? '' : ham).trim()
    if (!s) return ''
    if (giris.tur === 'tarih') {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
      if (!m) return s
      return String(giris.bicim || 'GG.AA.YYYY').replace('YYYY', m[1]).replace('AA', m[2]).replace('GG', m[3])
    }
    if (giris.tur === 'sayi') return s.replace(/[.,]/, giris.ondalik || ',')
    return s
  }

  function secimAdaylari(giris, deger) {
    const s = (giris.secenekler && giris.secenekler[deger]) || []
    return [...s, deger]
  }

  function pencere(el) {
    return (el.ownerDocument && el.ownerDocument.defaultView) || kok
  }

  function olay(el, tip, ctor, init) {
    const w = pencere(el)
    const C = (w && w[ctor]) || (w && w.Event) || kok.Event
    el.dispatchEvent(new C(tip, Object.assign({ bubbles: true, cancelable: true }, init || {})))
  }

  function yerelDeger(el, v) {
    const w = pencere(el)
    const t = el.tagName.toUpperCase()
    const proto = w && (t === 'TEXTAREA' ? w.HTMLTextAreaElement : t === 'SELECT' ? w.HTMLSelectElement : w.HTMLInputElement)
    const d = proto && proto.prototype ? Object.getOwnPropertyDescriptor(proto.prototype, 'value') : null
    // The native setter, so frameworks that track the value (React-style) see the change.
    if (d && d.set) d.set.call(el, v)
    else el.value = v
  }

  function odakla(el) {
    try { if (typeof el.focus === 'function') el.focus() } catch (e) { /* yoksay */ }
    olay(el, 'focus', 'FocusEvent', { bubbles: false })
    olay(el, 'focusin', 'FocusEvent')
  }

  function metinYaz(el, v) {
    odakla(el)
    yerelDeger(el, v)
    olay(el, 'input', 'InputEvent', { inputType: 'insertText', data: v })
    olay(el, 'change', 'Event')
    olay(el, 'blur', 'FocusEvent', { bubbles: false })
    olay(el, 'focusout', 'FocusEvent')
  }

  /** Key by key, so the page's search box reacts. Never Enter: the doctor picks the result. */
  function aramaYaz(el, metin) {
    odakla(el)
    yerelDeger(el, '')
    olay(el, 'input', 'InputEvent', { inputType: 'deleteContentBackward' })
    let simdiki = ''
    for (const c of String(metin)) {
      olay(el, 'keydown', 'KeyboardEvent', { key: c })
      olay(el, 'keypress', 'KeyboardEvent', { key: c })
      simdiki += c
      yerelDeger(el, simdiki)
      olay(el, 'input', 'InputEvent', { inputType: 'insertText', data: c })
      olay(el, 'keyup', 'KeyboardEvent', { key: c })
    }
  }

  function radyoEtiketi(r) {
    const doc = r.ownerDocument
    const id = r.getAttribute('id')
    if (id) {
      const l = Array.from(doc.querySelectorAll('label')).find((x) => x.getAttribute('for') === id)
      if (l) return l.textContent
    }
    const sar = r.closest ? r.closest('label') : null
    if (sar) return sar.textContent
    let n = r.nextSibling
    while (n && n.nodeType === 3 && !String(n.textContent).trim()) n = n.nextSibling
    return n ? n.textContent : r.getAttribute('value')
  }

  function radyoGrubu(el) {
    const ad = el.getAttribute('name')
    if (!ad) return [el]
    return Array.from(el.ownerDocument.querySelectorAll('input[type=radio]')).filter((r) => r.getAttribute('name') === ad)
  }

  function eslesirMi(metin, adaylar) {
    const t = normalize(metin)
    if (!t) return false
    return adaylar.some((a) => t === normalize(a))
  }

  function icerirMi(metin, adaylar) {
    const t = normalize(metin)
    return adaylar.some((a) => { const n = normalize(a); return n.length >= 3 && t.includes(n) })
  }

  /** The option / radio that matches, exact first then containing. null = none. */
  function secenekBul(el, adaylar, ham) {
    const t = el.tagName.toUpperCase()
    if (t === 'SELECT') {
      const ops = Array.from(el.options || el.querySelectorAll('option'))
      return ops.find((o) => eslesirMi(o.textContent, adaylar)) || ops.find((o) => String(o.getAttribute('value') || '') === ham && ham) || ops.find((o) => icerirMi(o.textContent, adaylar)) || null
    }
    if (String(el.getAttribute('type') || '').toLowerCase() === 'radio') {
      const g = radyoGrubu(el)
      return g.find((r) => eslesirMi(radyoEtiketi(r), adaylar)) || g.find((r) => icerirMi(radyoEtiketi(r), adaylar)) || null
    }
    return null
  }

  function seciliMetin(el) {
    const t = el.tagName.toUpperCase()
    if (t === 'SELECT') {
      const ops = Array.from(el.options || el.querySelectorAll('option'))
      const s = ops[el.selectedIndex] || ops.find((o) => o.selected)
      return s ? s.textContent : ''
    }
    if (String(el.getAttribute('type') || '').toLowerCase() === 'radio') {
      const s = radyoGrubu(el).find((r) => r.checked)
      return s ? radyoEtiketi(s) : ''
    }
    return el.value
  }

  /** Has someone (the doctor) already put a different value here? */
  function doluVeFarkli(el, giris, hedefMetinleri) {
    const mevcut = normalize(seciliMetin(el))
    if (!mevcut || YER_TUTUCU.test(mevcut)) return false
    return !hedefMetinleri.some((h) => normalize(h) === mevcut)
  }

  /** A field whose own handler posts the page back would navigate — the doctor sets it. */
  function sayfayiYenilerMi(el) {
    const a = ['onchange', 'onclick', 'onkeydown', 'onkeypress', 'onkeyup', 'oninput'].map((k) => el.getAttribute(k) || '').join(' ')
    return /__doPostBack|\.submit\s*\(|location\s*[.=]|navigate/i.test(a)
  }

  function vurgula(el) {
    try {
      el.style.outline = '2px solid #2F4334'
      el.style.outlineOffset = '1px'
      el.style.backgroundColor = '#EEF5EF'
    } catch (e) { /* yoksay */ }
    el.setAttribute('data-notya-dolduruldu', '1')
  }

  /** Belt and braces: while filling, a submit the page might start from our events is stopped. */
  function gonderimKalkani(belgeler) {
    const sayac = { engellenen: 0 }
    const dinle = (e) => { e.preventDefault(); e.stopImmediatePropagation(); sayac.engellenen++ }
    // On the window in the capture phase: runs before any listener the page put on the document or the form.
    const hedefler = belgeler.map((d) => d.defaultView || d)
    for (const h of hedefler) h.addEventListener('submit', dinle, true)
    sayac.kaldir = () => { for (const h of hedefler) h.removeEventListener('submit', dinle, true) }
    return sayac
  }

  const bekleVarsayilan = (ms) => new Promise((r) => setTimeout(r, ms))

  /**
   * Fill the current screen from the record. secenek: { uzerineYaz: [anahtar], yalniz: [anahtar], bekle(ms) }.
   * Returns what was filled, what could not be filled and why, what the doctor had already typed (not touched),
   * and the diagnosis codes still to type (one per click).
   */
  async function doldur(kokBelge, harita, kayit, secenek) {
    const sec = secenek || {}
    const bekle = sec.bekle || bekleVarsayilan
    const uzerineYaz = sec.uzerineYaz || []
    const belgeler = belgeleriTopla(kokBelge)
    const tani = ekranTani(belgeler, harita)
    const sonuc = { ekran: tani.ekran, mesaj: '', dolduruldu: [], doldurulamadi: [], dolu: [], bos: [], bekleyenTanilar: [], engellenenGonderim: 0 }
    if (!tani.ekran) {
      sonuc.mesaj = 'Bu ekranı tanıyamadım. Hiçbir alan doldurulmadı.'
      return sonuc
    }
    if (tani.ekran === 'muayene' && !kayit.muayene) {
      sonuc.mesaj = 'Bu kayıtta muayene bölümü yok (ön büro aktarımı). Muayene ekranını hekim doldurur; hiçbir alan doldurulmadı.'
      return sonuc
    }
    const ekran = harita.ekranlar[tani.ekran]
    const kalkan = gonderimKalkani(belgeler)
    try {
      let onbellek = {}
      for (const g of ekran.alanlar || []) {
        if (sec.yalniz && !sec.yalniz.includes(g.anahtar)) continue
        if (g.kayitTurleri && !g.kayitTurleri.includes(kayit.kayitTuru)) continue
        const etiket = g.etiket || g.anahtar
        const deger = degerHazirla(g, kayit)
        if (!deger || (Array.isArray(deger) && !deger.length)) { sonuc.bos.push({ anahtar: g.anahtar, etiket }); continue }
        const bul = alanBul(tani.doc, g, onbellek)
        if (!bul) { sonuc.doldurulamadi.push({ anahtar: g.anahtar, etiket, neden: 'Alan bulunamadı' }); continue }
        const el = bul.el
        if (el.disabled || el.readOnly) { sonuc.doldurulamadi.push({ anahtar: g.anahtar, etiket, neden: 'Alan kilitli' }); continue }
        if (sayfayiYenilerMi(el)) { sonuc.doldurulamadi.push({ anahtar: g.anahtar, etiket, neden: 'Bu alan sayfayı yeniden yükleyebilir — seçimi siz yapın' }); continue }

        if (g.tur === 'arama') {
          const ilk = deger[0]
          if (doluVeFarkli(el, g, [ilk]) && !uzerineYaz.includes(g.anahtar)) { sonuc.dolu.push({ anahtar: g.anahtar, etiket }); continue }
          aramaYaz(el, ilk)
          vurgula(el)
          sonuc.dolduruldu.push({ anahtar: g.anahtar, etiket, detay: ilk })
          sonuc.bekleyenTanilar = deger.slice(1)
          continue
        }

        if (g.tur === 'secim') {
          const adaylar = secimAdaylari(g, deger)
          const tip = String(el.getAttribute('type') || '').toLowerCase()
          const secilebilir = el.tagName.toUpperCase() === 'SELECT' || tip === 'radio'
          if (secilebilir) {
            const hedef = secenekBul(el, adaylar, deger)
            if (!hedef) { sonuc.doldurulamadi.push({ anahtar: g.anahtar, etiket, neden: `Seçenek bulunamadı: ${adaylar[0]}` }); continue }
            const hedefMetni = el.tagName.toUpperCase() === 'SELECT' ? hedef.textContent : radyoEtiketi(hedef)
            if (doluVeFarkli(el, g, [hedefMetni]) && !uzerineYaz.includes(g.anahtar)) { sonuc.dolu.push({ anahtar: g.anahtar, etiket }); continue }
            if (el.tagName.toUpperCase() === 'SELECT') {
              odakla(el)
              const ops = Array.from(el.options || el.querySelectorAll('option'))
              el.selectedIndex = ops.indexOf(hedef)
              for (const o of ops) o.selected = o === hedef
              olay(el, 'input', 'Event')
              olay(el, 'change', 'Event')
              vurgula(el)
            } else {
              hedef.checked = true
              olay(hedef, 'input', 'Event')
              olay(hedef, 'change', 'Event')
              vurgula(hedef)
            }
          } else {
            // A text box behind the label (autocomplete combo): type the first option text.
            const metin = adaylar[0]
            if (doluVeFarkli(el, g, adaylar) && !uzerineYaz.includes(g.anahtar)) { sonuc.dolu.push({ anahtar: g.anahtar, etiket }); continue }
            metinYaz(el, metin)
            vurgula(el)
          }
          sonuc.dolduruldu.push({ anahtar: g.anahtar, etiket, yol: bul.yol })
          if (g.sonraBekleMs) {
            await bekle(g.sonraBekleMs)
            onbellek = {} // the form may have re-rendered (e.g. Kayıt türü shows other fields)
          }
          continue
        }

        if (doluVeFarkli(el, g, [deger]) && !uzerineYaz.includes(g.anahtar)) { sonuc.dolu.push({ anahtar: g.anahtar, etiket }); continue }
        metinYaz(el, deger)
        vurgula(el)
        sonuc.dolduruldu.push({ anahtar: g.anahtar, etiket, yol: bul.yol })
      }
      sonuc.mesaj = ekran.bitisMesaji || ''
    } finally {
      sonuc.engellenenGonderim = kalkan.engellenen
      await bekle(sec.kalkanMs == null ? 1500 : sec.kalkanMs)
      sonuc.engellenenGonderim = kalkan.engellenen
      kalkan.kaldir()
    }
    return sonuc
  }

  /** Type one more ICD-10 code into the diagnosis search (the doctor's click per code). */
  function taniYaz(kokBelge, harita, kod) {
    const ekran = harita.ekranlar && harita.ekranlar.muayene
    const g = ekran && (ekran.alanlar || []).find((x) => x.tur === 'arama')
    if (!g) return false
    for (const d of belgeleriTopla(kokBelge)) {
      const b = alanBul(d, g)
      if (b && !sayfayiYenilerMi(b.el)) {
        aramaYaz(b.el, kod)
        vurgula(b.el)
        return true
      }
    }
    return false
  }

  // ─── Map capture: STRUCTURE only, never a value ─────────────────────────────────────────────

  /** Long digit runs (a T.C. no, a phone) are masked even in labels; texts are capped. */
  function maske(s, uzunluk) {
    return String(s == null ? '' : s).replace(/\d{6,}/g, '#').replace(/\s+/g, ' ').trim().slice(0, uzunluk || 80)
  }

  function buyukTablodaMi(el) {
    const tbody = el.closest ? el.closest('tbody') : null
    return !!tbody && tbody.querySelectorAll('tr').length > 3
  }

  function yakalamaEtiketi(el) {
    const doc = el.ownerDocument
    const id = el.getAttribute('id')
    if (id) {
      const l = Array.from(doc.querySelectorAll('label')).find((x) => x.getAttribute('for') === id)
      if (l) return maske(kendiMetni(l))
    }
    const sar = el.closest ? el.closest('label') : null
    if (sar) return maske(kendiMetni(sar))
    // Rows of a data grid (e.g. the waiting-patient list) may hold patient names: no neighbour text there.
    if (buyukTablodaMi(el)) return ''
    let n = el
    for (let seviye = 0; n && seviye < 3; seviye++, n = n.parentElement) {
      let k = n.previousElementSibling
      while (k && !String(k.textContent || '').trim()) k = k.previousElementSibling
      if (k && !k.querySelector(KONTROL)) {
        const t = maske(kendiMetni(k), 60)
        if (t) return t
      }
    }
    return ''
  }

  /**
   * The current screen's structure as JSON text: labels, ids, names, types, select option texts, headings, button
   * captions, and which harita.json entry matched where. Reads no .value / .checked / selection — never a value.
   */
  function haritaYakala(kokBelge, harita, simdi) {
    const belgeler = belgeleriTopla(kokBelge)
    const loc = kokBelge.location || (kokBelge.defaultView && kokBelge.defaultView.location) || null
    const cikti = {
      arac: 'notya-mbys-harita',
      surum: 1,
      haritaSurum: harita ? harita.surum : null,
      alindi: simdi || new Date().toISOString(),
      yol: loc ? String(loc.pathname || '') : '',
      baslik: maske(kokBelge.title, 120),
      cerceveler: [],
    }
    belgeler.forEach((doc, i) => {
      const c = { cerceve: i, basliklar: [], dugmeler: [], alanlar: [], eslesme: {} }
      for (const h of Array.from(doc.querySelectorAll('h1, h2, h3, h4, legend, .panel-title, .card-header'))) {
        const t = maske(h.textContent)
        if (t && !c.basliklar.includes(t)) c.basliklar.push(t)
      }
      for (const b of Array.from(doc.querySelectorAll('button, input[type=button], input[type=submit], a.btn'))) {
        const t = maske(b.tagName.toUpperCase() === 'INPUT' ? b.getAttribute('value') : b.textContent, 40)
        if (t && !c.dugmeler.includes(t)) c.dugmeler.push(t)
      }
      for (const el of Array.from(doc.querySelectorAll('input, select, textarea'))) {
        const tip = String(el.getAttribute('type') || '').toLowerCase()
        const alan = {
          etiket: yakalamaEtiketi(el),
          tag: el.tagName.toLowerCase(),
          type: tip || null,
          id: maske(el.getAttribute('id'), 120) || null,
          name: maske(el.getAttribute('name'), 120) || null,
          sinif: maske(el.getAttribute('class'), 120) || null,
          placeholder: maske(el.getAttribute('placeholder')) || null,
          ariaLabel: maske(el.getAttribute('aria-label')) || null,
          sayfaYeniler: sayfayiYenilerMi(el) || undefined,
        }
        if (tip === 'hidden') { alan.etiket = '' }
        if (tip === 'radio') alan.secenekMetni = maske(radyoEtiketi(el), 60)
        if (el.tagName.toUpperCase() === 'SELECT' && !buyukTablodaMi(el)) {
          alan.secenekler = Array.from(el.querySelectorAll('option')).slice(0, 80).map((o) => maske(o.textContent, 60))
        }
        c.alanlar.push(alan)
      }
      if (harita) {
        const onbellek = {}
        for (const ad of Object.keys(harita.ekranlar || {})) {
          for (const g of harita.ekranlar[ad].alanlar || []) {
            const b = alanBul(doc, g, onbellek)
            c.eslesme[`${ad}.${g.anahtar}`] = b ? { yol: b.yol, id: b.el.getAttribute('id') || null, name: b.el.getAttribute('name') || null } : null
          }
        }
      }
      cikti.cerceveler.push(c)
    })
    return JSON.stringify(cikti, null, 2)
  }

  const api = { normalize, adresIzinliMi, dogrulanmamisVar, belgeleriTopla, alanBul, ekranTani, degerHazirla, doldur, taniYaz, haritaYakala }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else kok.NotyaMbysMotor = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
