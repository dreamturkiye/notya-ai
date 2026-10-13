/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding step 3, from real react-dom/server output (synthetic data):
 *   • what a new doctor is asked, in order: Ad, Soyad, E-posta (read-only), Cep telefonu, Cinsiyet, Hitap Tercihi
 *   • the KVKK box only when the server says it is needed; same text and link as /kayit; never pre-ticked
 *   • Turkish hints under a field and a form-level error
 *   • universal chrome: no specialty-specific field or word
 *   • the page: no dead /api/asistan/set-specialty call; profile → trial order kept
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import KisiselBilgilerAdimi, { type KisiselBilgilerProps } from '../../components/onboarding/KisiselBilgilerAdimi'
import KvkkOnayKutusu from '../../components/onboarding/KvkkOnayKutusu'

const KOK = resolve(__dirname, '../..')
const oku = (yol: string) => readFileSync(join(KOK, yol), 'utf8')
const duz = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ').trim()

const temel: KisiselBilgilerProps = {
  firstName: '', lastName: '', cepTelefonu: '', gender: '', addressingPreference: '', eposta: 'qa-hekim@ornek.test',
  kvkkGerekli: false, kvkkOnay: false, onDegis: () => {}, onKvkk: () => {},
}
const ciz = (ek: Partial<KisiselBilgilerProps> = {}) => renderToStaticMarkup(createElement(KisiselBilgilerAdimi, { ...temel, ...ek }))

describe('Onboarding step 3 (SSR)', () => {
  it('fields and their order: Ad, Soyad, E-posta, Cep telefonu, Cinsiyet, Hitap Tercihi', () => {
    const h = ciz()
    const etiketler = [...h.matchAll(/<label[^>]*for="([^"]+)"[^>]*>([^<]+)<\/label>/g)].map((m) => `${m[1]}:${m[2]}`)
    assert.deepEqual(etiketler, ['onb-ad:Ad', 'onb-soyad:Soyad', 'onb-eposta:E-posta', 'onb-cep:Cep telefonu', 'onb-cinsiyet:Cinsiyet', 'onb-hitap:Hitap Tercihi'])
  })

  it('the e-mail is shown read-only, with what it is and whom to tell if it is wrong', () => {
    const h = ciz()
    const girdi = h.match(/<input[^>]*id="onb-eposta"[^>]*>/)![0]
    assert.match(girdi, /value="qa-hekim@ornek\.test"/)
    assert.match(girdi, /readonly=""/i)
    assert.match(duz(h), /Notya'ya bu e-posta adresiyle giriş yaparsınız\. Adres yanlışsa Notya ekibinizle iletişime geçin\./)
    assert.ok(!/e-postayı değiştir|adresi değiştir/i.test(duz(h)), 'there is no e-mail change flow')
  })

  it('mobile field: a tel input with an example', () => {
    const girdi = ciz({ cepTelefonu: '0532 123 45 67' }).match(/<input[^>]*id="onb-cep"[^>]*>/)![0]
    assert.match(girdi, /type="tel"/)
    assert.match(girdi, /placeholder="0532 123 45 67"/)
    assert.match(girdi, /value="0532 123 45 67"/)
  })

  it('KVKK box: not rendered at all when consent is on record', () => {
    const h = ciz({ kvkkGerekli: false })
    assert.ok(!h.includes('data-kvkk-onay') && !/KVKK/.test(h))
    assert.ok(!h.includes('type="checkbox"'))
  })

  it('KVKK box: rendered when needed, unticked, linking to /kvkk in a new tab', () => {
    const h = ciz({ kvkkGerekli: true })
    assert.ok(h.includes('data-kvkk-onay'))
    const kutu = h.match(/<input[^>]*type="checkbox"[^>]*>/)![0]
    assert.ok(!/checked/.test(kutu), 'never pre-ticked')
    assert.match(h, /<a href="\/kvkk" target="_blank" rel="noopener noreferrer"[^>]*>KVKK Aydınlatma Metni<\/a>/)
    assert.match(ciz({ kvkkGerekli: true, kvkkOnay: true }).match(/<input[^>]*type="checkbox"[^>]*>/)![0], /checked/)
  })

  it('KVKK text and link are exactly those of the /kayit page (no new legal wording)', () => {
    const kayit = oku('app/kayit/page.tsx')
    const bas = kayit.indexOf('<label style={{')
    const son = kayit.indexOf('</label>', bas)
    assert.ok(bas > 0 && son > bas, 'the consent box in /kayit was not found')
    const jsxDuz = (jsx: string) => jsx
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/style=\{\{[\s\S]*?\}\}/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
    // The text is in the box's <span> (so the arrow function on the input does not confuse the tag stripping).
    const spanBas = kayit.indexOf('<span>', bas)
    assert.ok(spanBas > bas && spanBas < son)
    const kayitMetni = jsxDuz(kayit.slice(spanBas, son))
    assert.match(kayitMetni, /^KVKK Aydınlatma Metni 'ni okudum\./)
    const bizimMetin = duz(renderToStaticMarkup(createElement(KvkkOnayKutusu, { isaretli: false, onDegis: () => {} })))
    assert.equal(bizimMetin, kayitMetni)
    assert.match(kayit.slice(bas, son), /<a href="\/kvkk" target="_blank" rel="noopener noreferrer"/)
  })

  it('field hints and the form-level error are Turkish and sit under their field', () => {
    const h = ciz({ hatalar: { firstName: 'Adınız en az iki harf olmalı.', cepTelefonu: 'Cep telefonu anlaşılamadı. Örnek: 0532 123 45 67' }, genelHata: 'Profil kaydedilemedi. Lütfen tekrar deneyin.' })
    assert.match(h, /data-hata="firstName"[^>]*>Adınız en az iki harf olmalı\.</)
    assert.match(h, /data-hata="cepTelefonu"[^>]*>Cep telefonu anlaşılamadı/)
    assert.ok(!h.includes('data-hata="lastName"'))
    assert.match(h, /data-hata="genel" role="alert"[^>]*>Profil kaydedilemedi/)
    assert.ok(h.indexOf('id="onb-ad"') < h.indexOf('data-hata="firstName"') && h.indexOf('data-hata="firstName"') < h.indexOf('id="onb-eposta"'))
    assert.match(h.match(/<input[^>]*id="onb-ad"[^>]*>/)![0], /aria-invalid="true"/)
  })

  it('universal chrome: no field or word specific to a specialty or profession', () => {
    const h = duz(ciz({ kvkkGerekli: true }))
    for (const yasak of ['Baş Çevresi', 'veli', 'Neyzi', 'gebelik', 'Pediatri', 'Kardiyoloji', 'diploma', 'T.C.', 'muayenehane']) {
      assert.ok(!h.toLocaleLowerCase('tr').includes(yasak.toLocaleLowerCase('tr')), yasak)
    }
    const kaynak = oku('components/onboarding/KisiselBilgilerAdimi.tsx')
    assert.ok(!/specialty|brans|profession/i.test(kaynak.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'the component does not branch on specialty / profession')
  })
})

describe('Onboarding page: source checks', () => {
  const sayfa = oku('app/onboarding/page.tsx')
  it('dead call removed: /api/asistan/set-specialty is neither called nor implemented', () => {
    assert.ok(!sayfa.includes('set-specialty'))
    assert.ok(!existsSync(join(KOK, 'app/api/asistan/set-specialty')), 'there never was such a route')
  })
  it('submit order: profile (POST) first, then trial (PUT); no other call', () => {
    const govde = sayfa.slice(sayfa.indexOf('const handleSubmit'), sayfa.indexOf('const renderStep2'))
    const cagri = [...govde.matchAll(/fetch\('([^']+)'/g)].map((m) => m[1])
    assert.deepEqual(cagri, ['/api/users/profile', '/api/users/trial'])
  })
  it('step 3 uses the shared component; the box opens only on the server answer; consent is sent only when ticked', () => {
    assert.match(sayfa, /<KisiselBilgilerAdimi/)
    assert.match(sayfa, /setKvkkGerekli\(hesap\.data\?\.kvkk_onay_gerekli === true\)/)
    assert.match(sayfa, /kvkkGerekli && kvkkOnay \? \{ kvkk_onay: true \} : \{\}/)
    assert.match(sayfa, /const \[kvkkOnay, setKvkkOnay\] = useState\(false\)/, 'the box starts unticked')
  })
  it('the token comes from the shared helper (NOTYA-AUTH-01); the page does not read localStorage itself', () => {
    assert.ok(!sayfa.includes('localStorage'))
    assert.match(sayfa, /await ensureDoctorAccessToken\(\)/)
  })
})
