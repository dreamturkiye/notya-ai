/**
 * MBYS-YARDIMCI-01 — the browser helper's fill engine (extensions/mbys-yardimci/motor.js) against two mock MBYS
 * screens built from the 2017 guide's field lists (fikstur/*.html). Synthetic data only.
 *
 * Hard rules checked here: fields only — no button click, no submit, no Enter, no navigation; a field the doctor
 * already typed into is not overwritten without asking; an unknown screen gets nothing; the map capture carries
 * structure and never a value.
 *   npx tsx --test lib/enabiz/mbys/motor.test.ts
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseHTML } from 'linkedom'
import type { MbysKayit } from './kontrol'

const motor = require('../../../extensions/mbys-yardimci/motor.js')
const KOK = resolve(__dirname, '../../..')
const EK = join(KOK, 'extensions/mbys-yardimci')
const harita = JSON.parse(readFileSync(join(EK, 'harita.json'), 'utf8'))
const fikstur = (ad: string) => readFileSync(join(__dirname, 'fikstur', ad), 'utf8')
const hemen = { bekle: async () => {}, kalkanMs: 0 }

type Izci = { tiklama: number; gonderim: number; enter: number; olaylar: Record<string, string[]> }

/** Loads a fixture and records every click, submit, Enter and per-field event the engine causes. */
function sayfa(ad: string) {
  const { document, window } = parseHTML(fikstur(ad))
  const iz: Izci = { tiklama: 0, gonderim: 0, enter: 0, olaylar: {} }
  document.addEventListener('click', () => { iz.tiklama++ }, true)
  document.addEventListener('submit', () => { iz.gonderim++ }, true)
  for (const tip of ['keydown', 'keypress', 'keyup']) {
    document.addEventListener(tip, (e: Event) => { if ((e as KeyboardEvent).key === 'Enter') iz.enter++ }, true)
  }
  for (const tip of ['input', 'change', 'keydown']) {
    document.addEventListener(tip, (e: Event) => {
      const id = (e.target as Element).getAttribute('id') || '?'
      ;(iz.olaylar[id] ||= []).push(tip)
    }, true)
  }
  const deger = (id: string) => (document.getElementById(id) as HTMLInputElement).value
  const secili = (id: string) => {
    const s = document.getElementById(id) as HTMLSelectElement
    const ops = Array.from(s.querySelectorAll('option')) as HTMLOptionElement[]
    return (ops[s.selectedIndex] || ops.find((o) => o.selected))?.textContent?.trim() || ''
  }
  return { document, window, iz, deger, secili }
}

const TC = '10000000146'
function kayit(): MbysKayit {
  return {
    surum: 1,
    kayitTuru: 'vatandas',
    kimlik: { tcKimlikNo: TC, pasaportNo: '', sahisNo: '', ad: 'QA Ayşe', soyad: 'Örnek', cinsiyet: 'K', dogumTarihi: '1990-05-17', uyruk: 'TR' },
    muayene: { sikayet: 'Boğaz ağrısı', hikaye: 'İki gündür boğaz ağrısı', bulgu: 'Farenks hiperemik', aciklama: 'Semptomatik tedavi', boy: '165', kilo: '58.5', muayeneTuru: 'Normal Muayene', vakaTuru: 'Normal Vaka', ozellikliHizmet: '' },
    tanilar: [{ kod: 'J02.9', ad: 'Akut farenjit' }, { kod: 'R50.9', ad: 'Ateş' }],
    hazirlandi: '2026-10-07T09:00:00.000Z',
  }
}

function hicBirMbysEylemiYok(iz: Izci) {
  assert.equal(iz.tiklama, 0, 'bir düğmeye tıklandı')
  assert.equal(iz.gonderim, 0, 'form gönderildi')
  assert.equal(iz.enter, 0, 'Enter basıldı')
}

describe('screen detection', () => {
  it('recognizes Hasta Kayıt and Muayene from the fields present', () => {
    assert.equal(motor.ekranTani([sayfa('hasta-kayit.html').document], harita).ekran, 'hastaKayit')
    assert.equal(motor.ekranTani([sayfa('muayene.html').document], harita).ekran, 'muayene')
  })
  it('an unknown screen: says so and fills nothing', async () => {
    const { document, iz } = sayfa('hasta-kayit.html')
    document.body.innerHTML = '<form><label>Arama</label><input id="q"><button>Ara</button></form>'
    const s = await motor.doldur(document, harita, kayit(), hemen)
    assert.equal(s.ekran, null)
    assert.match(s.mesaj, /tanıyamadım/)
    assert.equal(s.dolduruldu.length, 0)
    assert.equal((document.getElementById('q') as HTMLInputElement).value, '')
    hicBirMbysEylemiYok(iz)
  })
})

describe('step 1 — Hasta Kayıt', () => {
  it('sets Kayıt türü, fills identity, fires the events, then stops', async () => {
    const { document, iz, deger, secili } = sayfa('hasta-kayit.html')
    const s = await motor.doldur(document, harita, kayit(), hemen)
    assert.equal(s.ekran, 'hastaKayit')
    assert.equal(s.mesaj, 'Kimlik alanları dolduruldu. Sorgulayıp listeye eklemek size ait.')
    assert.equal(secili('ddlKayit'), 'Vatandaş')
    assert.equal(deger('txtTc'), TC)
    assert.equal(deger('txtAd'), 'QA Ayşe')
    assert.equal(deger('txtSoyad'), 'Örnek')
    assert.equal(secili('ddlCins'), 'Kadın')
    assert.equal(deger('txtDogum'), '17.05.1990')
    assert.equal(secili('ddlUyruk'), 'TÜRKİYE CUMHURİYETİ')
    assert.equal(deger('txtPasaport'), '', 'other Kayıt türü fields untouched')
    assert.equal(deger('txtSahis'), '')
    for (const id of ['ddlKayit', 'txtTc', 'txtAd', 'ddlCins', 'txtDogum']) {
      assert.ok(iz.olaylar[id]?.includes('input') && iz.olaylar[id]?.includes('change'), `${id}: input/change yok`)
      assert.equal(document.getElementById(id)!.getAttribute('data-notya-dolduruldu'), '1', `${id} vurgulanmadı`)
    }
    assert.deepEqual(s.doldurulamadi, [])
    hicBirMbysEylemiYok(iz)
  })

  it('yabancı: passport + uyruk by country name, T.C. left alone', async () => {
    const { document, iz, deger, secili } = sayfa('hasta-kayit.html')
    const k = kayit()
    k.kayitTuru = 'yabanci'
    k.kimlik = { ...k.kimlik, tcKimlikNo: '', pasaportNo: 'U1234567', uyruk: 'Almanya' }
    const s = await motor.doldur(document, harita, k, hemen)
    assert.equal(secili('ddlKayit'), 'Yabancı')
    assert.equal(deger('txtPasaport'), 'U1234567')
    assert.equal(deger('txtTc'), '')
    assert.equal(secili('ddlUyruk'), 'ALMANYA')
    assert.equal(s.doldurulamadi.length, 0)
    hicBirMbysEylemiYok(iz)
  })

  it('never overwrites what the doctor typed without asking; overwrites only that field when asked', async () => {
    const { document, deger } = sayfa('hasta-kayit.html')
    ;(document.getElementById('txtAd') as HTMLInputElement).value = 'Doktorun yazdığı'
    const s = await motor.doldur(document, harita, kayit(), hemen)
    assert.deepEqual(s.dolu.map((x: { anahtar: string }) => x.anahtar), ['ad'])
    assert.equal(deger('txtAd'), 'Doktorun yazdığı')
    assert.equal(deger('txtSoyad'), 'Örnek')
    const s2 = await motor.doldur(document, harita, kayit(), { ...hemen, yalniz: ['ad'], uzerineYaz: ['ad'] })
    assert.equal(deger('txtAd'), 'QA Ayşe')
    assert.deepEqual(s2.dolduruldu.map((x: { anahtar: string }) => x.anahtar), ['ad'])
  })

  it('a field that would post the page back is left for the doctor', async () => {
    const { document, secili, deger } = sayfa('hasta-kayit.html')
    document.getElementById('ddlKayit')!.setAttribute('onchange', "javascript:setTimeout('__doPostBack(\\'ddlKayit\\',\\'\\')', 0)")
    const s = await motor.doldur(document, harita, kayit(), hemen)
    assert.notEqual(secili('ddlKayit'), 'Vatandaş')
    assert.equal(document.getElementById('ddlKayit')!.getAttribute('data-notya-dolduruldu'), null)
    assert.match(s.doldurulamadi.find((x: { anahtar: string }) => x.anahtar === 'kayitTuru').neden, /seçimi siz yapın/)
    assert.equal(deger('txtTc'), TC, 'the rest is still filled')
  })

  it('a submit the page starts while filling is stopped', async () => {
    const { document } = sayfa('hasta-kayit.html')
    const f = document.getElementById('hastaKayitForm')!
    let sayfaGordu = 0
    let varsayilanEngellendi = false
    f.addEventListener('submit', (e: Event) => { sayfaGordu++; varsayilanEngellendi = e.defaultPrevented })
    // A page script that submits on change (the kind of thing MBYS might do).
    document.getElementById('ddlCins')!.addEventListener('change', () => {
      const e = new (document.defaultView as unknown as typeof globalThis).Event('submit', { bubbles: true, cancelable: true })
      f.dispatchEvent(e)
      varsayilanEngellendi = varsayilanEngellendi || e.defaultPrevented
    })
    const s = await motor.doldur(document, harita, kayit(), hemen)
    assert.equal(s.engellenenGonderim, 1)
    assert.equal(varsayilanEngellendi, true, 'the submit was not cancelled')
    // linkedom has no capture phase, so the page's own listener still sees the event here; in Chrome the
    // window-capture listener stops it first. What matters in both: the submission is cancelled.
    assert.ok(sayfaGordu <= 1)
  })
})

describe('step 2 — Muayene', () => {
  let p: ReturnType<typeof sayfa>
  beforeEach(() => { p = sayfa('muayene.html') })

  it('fills the text fields and selections, types the first ICD-10 code, then stops', async () => {
    const s = await motor.doldur(p.document, harita, kayit(), hemen)
    assert.equal(s.ekran, 'muayene')
    assert.equal(s.mesaj, 'Notya doldurdu. Kontrol edip kaydetmek size ait.')
    assert.equal(p.deger('Hikaye'), 'İki gündür boğaz ağrısı')
    assert.equal(p.deger('txtSikayet'), 'Boğaz ağrısı')
    assert.equal(p.deger('txtBulgu'), 'Farenks hiperemik')
    assert.equal(p.deger('txtAciklama'), 'Semptomatik tedavi')
    assert.equal(p.deger('txtBoy'), '165')
    assert.equal(p.deger('txtKilo'), '58,5')
    assert.equal(p.secili('cmbMuayeneTur'), 'Normal Muayene')
    assert.equal(p.secili('cmbVaka'), 'Normal Vaka')
    assert.equal(p.deger('txtTaniAra'), 'J02.9')
    assert.equal(p.iz.olaylar.txtTaniAra.filter((t) => t === 'keydown').length, 'J02.9'.length, 'typed key by key')
    assert.deepEqual(s.bekleyenTanilar, ['R50.9'])
    assert.deepEqual(s.bos.map((x: { anahtar: string }) => x.anahtar), ['ozellikliHizmet'])
    assert.equal(s.dolduruldu.find((x: { anahtar: string }) => x.anahtar === 'hikaye').yol, 'secici')
    assert.equal(s.dolduruldu.find((x: { anahtar: string }) => x.anahtar === 'sikayet').yol, 'etiket')
    hicBirMbysEylemiYok(p.iz)
  })

  it('the next diagnosis is typed only on its own click', () => {
    assert.equal(motor.taniYaz(p.document, harita, 'R50.9'), true)
    assert.equal(p.deger('txtTaniAra'), 'R50.9')
    hicBirMbysEylemiYok(p.iz)
  })

  it('an ön büro record (no muayene part) fills nothing on the Muayene screen', async () => {
    const k = kayit()
    k.muayene = null
    k.tanilar = []
    const s = await motor.doldur(p.document, harita, k, hemen)
    assert.equal(s.dolduruldu.length, 0)
    assert.match(s.mesaj, /hiçbir alan doldurulmadı/)
    assert.equal(p.deger('Hikaye'), '')
  })

  it('reports a field it cannot find', async () => {
    p.document.getElementById('txtBulgu')!.closest('.row')!.remove()
    const s = await motor.doldur(p.document, harita, kayit(), hemen)
    assert.deepEqual(s.doldurulamadi, [{ anahtar: 'bulgu', etiket: 'Bulgu / Gözlem', neden: 'Alan bulunamadı' }])
  })
})

describe('map capture — structure, never a value', () => {
  it('copies labels, names, types and option texts; no entered value, no grid names, no token', async () => {
    const { document } = sayfa('hasta-kayit.html')
    await motor.doldur(document, harita, kayit(), hemen)
    const metin = motor.haritaYakala(document, harita, '2026-10-07T00:00:00.000Z')
    const j = JSON.parse(metin)
    assert.equal(j.arac, 'notya-mbys-harita')
    const alanlar = j.cerceveler[0].alanlar
    const tc = alanlar.find((a: { id: string }) => a.id === 'txtTc')
    assert.equal(tc.etiket, 'Hasta T.C. :')
    assert.equal(tc.name, 'Kayit.Tc')
    assert.deepEqual(alanlar.find((a: { id: string }) => a.id === 'ddlCins').secenekler, ['Seçiniz', 'Erkek', 'Kadın'])
    assert.ok(j.cerceveler[0].dugmeler.includes('Sorgula'))
    assert.deepEqual(j.cerceveler[0].eslesme['hastaKayit.ad'], { yol: 'etiket', id: 'txtAd', name: 'Kayit.Ad' })
    for (const yasak of [TC, 'QA Ayşe', 'Örnek', '17.05.1990', 'gizli-token-degeri', 'GIZLI', '98765432109']) {
      assert.ok(!metin.includes(yasak), `haritada değer var: ${yasak}`)
    }
  })
  it('the capture button shows while any map entry is unverified', () => {
    assert.equal(motor.dogrulanmamisVar(harita), true)
    const hepsi = JSON.parse(JSON.stringify(harita))
    for (const e of Object.values(hepsi.ekranlar) as { alanlar: { dogrulandi: boolean }[] }[]) for (const g of e.alanlar) g.dogrulandi = true
    assert.equal(motor.dogrulanmamisVar(hepsi), false)
  })
})

describe('helper boundaries', () => {
  it('runs only on MBYS, never on its login page', () => {
    assert.equal(motor.adresIzinliMi('https://mbys2.saglik.gov.tr/Hasta/Islem?x=1', harita), true)
    assert.equal(motor.adresIzinliMi('https://mbys2.saglik.gov.tr/Account/Login', harita), false)
    assert.equal(motor.adresIzinliMi('https://mbys2.saglik.gov.tr/account/login?ReturnUrl=%2F', harita), false)
    assert.equal(motor.adresIzinliMi('https://mbys2.saglik.gov.tr.example.com/', harita), false)
    assert.equal(motor.adresIzinliMi('https://enabiz.gov.tr/', harita), false)
  })

  it('manifest: minimum permissions, MBYS + notya.io only, matches the one config file', () => {
    const m = JSON.parse(readFileSync(join(EK, 'manifest.json'), 'utf8'))
    assert.equal(m.manifest_version, 3)
    assert.deepEqual(m.permissions.sort(), ['alarms', 'storage'])
    assert.equal(m.host_permissions, undefined)
    assert.equal(m.optional_permissions, undefined)
    assert.deepEqual(m.externally_connectable.matches, ['https://notya.io/*', 'https://www.notya.io/*'])
    assert.equal(m.content_scripts.length, 1)
    assert.deepEqual(m.content_scripts[0].matches, harita.adresler.eslesme)
    assert.equal(m.web_accessible_resources, undefined)
  })

  it('no code path presses, submits, navigates or calls out', () => {
    for (const dosya of ['motor.js', 'icerik.js', 'arkaplan.js']) {
      const kod = readFileSync(join(EK, dosya), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      assert.doesNotMatch(kod, /\.click\s*\(|\.submit\s*\(|requestSubmit|['"]Enter['"]|XMLHttpRequest|sendBeacon|WebSocket|location\s*\.\s*href\s*=[^=]|location\s*\.\s*(assign|replace)\s*\(|location\s*=[^=]|window\.open/, dosya)
      const fetchler = kod.match(/fetch\s*\(/g) || []
      if (dosya === 'arkaplan.js') assert.match(kod, /fetch\(chrome\.runtime\.getURL\('harita\.json'\)\)/)
      assert.equal(fetchler.length, dosya === 'arkaplan.js' ? 1 : 0, `${dosya}: ağ isteği`)
    }
  })
})
