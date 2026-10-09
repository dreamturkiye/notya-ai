/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding 3. adım, gerçek react-dom/server çıktısıyla (sentetik veri):
 *   • yeni doktora sorulanlar ve sırası: Ad, Soyad, E-posta (salt okunur), Cep telefonu, Cinsiyet, Hitap Tercihi
 *   • KVKK kutusu yalnız sunucu "gerekli" dediğinde; /kayit ile aynı metin, aynı bağlantı; asla önceden işaretli değil
 *   • alan altı ve form geneli Türkçe uyarılar
 *   • evrensel çerçeve: branşa özgü hiçbir alan / sözcük taşımaz
 *   • sayfa: ölü /api/asistan/set-specialty çağrısı yok; profil → deneme sırası yerinde
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

describe('Onboarding 3. adım (SSR)', () => {
  it('sorulanlar ve sırası: Ad, Soyad, E-posta, Cep telefonu, Cinsiyet, Hitap Tercihi', () => {
    const h = ciz()
    const etiketler = [...h.matchAll(/<label[^>]*for="([^"]+)"[^>]*>([^<]+)<\/label>/g)].map((m) => `${m[1]}:${m[2]}`)
    assert.deepEqual(etiketler, ['onb-ad:Ad', 'onb-soyad:Soyad', 'onb-eposta:E-posta', 'onb-cep:Cep telefonu', 'onb-cinsiyet:Cinsiyet', 'onb-hitap:Hitap Tercihi'])
  })

  it('e-posta salt okunur gösterilir; hangi adres olduğu ve yanlışsa kime söyleneceği yazar', () => {
    const h = ciz()
    const girdi = h.match(/<input[^>]*id="onb-eposta"[^>]*>/)![0]
    assert.match(girdi, /value="qa-hekim@ornek\.test"/)
    assert.match(girdi, /readonly=""/i)
    assert.match(duz(h), /Notya'ya bu e-posta adresiyle giriş yaparsınız\. Adres yanlışsa Notya ekibinizle iletişime geçin\./)
    assert.ok(!/e-postayı değiştir|adresi değiştir/i.test(duz(h)), 'e-posta değiştirme akışı yok')
  })

  it('cep telefonu alanı: tel girdisi, örnek biçim', () => {
    const girdi = ciz({ cepTelefonu: '0532 123 45 67' }).match(/<input[^>]*id="onb-cep"[^>]*>/)![0]
    assert.match(girdi, /type="tel"/)
    assert.match(girdi, /placeholder="0532 123 45 67"/)
    assert.match(girdi, /value="0532 123 45 67"/)
  })

  it('KVKK kutusu: rıza kayıtlıysa hiç görünmez', () => {
    const h = ciz({ kvkkGerekli: false })
    assert.ok(!h.includes('data-kvkk-onay') && !/KVKK/.test(h))
    assert.ok(!h.includes('type="checkbox"'))
  })

  it('KVKK kutusu: gerekliyse görünür, işaretsiz gelir, /kvkk metnine yeni sekmede bağlanır', () => {
    const h = ciz({ kvkkGerekli: true })
    assert.ok(h.includes('data-kvkk-onay'))
    const kutu = h.match(/<input[^>]*type="checkbox"[^>]*>/)![0]
    assert.ok(!/checked/.test(kutu), 'asla önceden işaretli değil')
    assert.match(h, /<a href="\/kvkk" target="_blank" rel="noopener noreferrer"[^>]*>KVKK Aydınlatma Metni<\/a>/)
    assert.match(ciz({ kvkkGerekli: true, kvkkOnay: true }).match(/<input[^>]*type="checkbox"[^>]*>/)![0], /checked/)
  })

  it('KVKK metni ve bağlantısı /kayit sayfasındakiyle birebir aynı (yeni hukuki metin yok)', () => {
    const kayit = oku('app/kayit/page.tsx')
    const bas = kayit.indexOf('<label style={{')
    const son = kayit.indexOf('</label>', bas)
    assert.ok(bas > 0 && son > bas, '/kayit içindeki onay kutusu bulunamadı')
    const jsxDuz = (jsx: string) => jsx
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/style=\{\{[\s\S]*?\}\}/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
    // Metin kutunun <span> öğesindedir (girdi öğesindeki ok işlevi etiket ayıklamayı şaşırtmasın).
    const spanBas = kayit.indexOf('<span>', bas)
    assert.ok(spanBas > bas && spanBas < son)
    const kayitMetni = jsxDuz(kayit.slice(spanBas, son))
    assert.match(kayitMetni, /^KVKK Aydınlatma Metni 'ni okudum\./)
    const bizimMetin = duz(renderToStaticMarkup(createElement(KvkkOnayKutusu, { isaretli: false, onDegis: () => {} })))
    assert.equal(bizimMetin, kayitMetni)
    assert.match(kayit.slice(bas, son), /<a href="\/kvkk" target="_blank" rel="noopener noreferrer"/)
  })

  it('alan altı uyarılar ve form geneli hata Türkçe ve ilgili alanın altında', () => {
    const h = ciz({ hatalar: { firstName: 'Adınız en az iki harf olmalı.', cepTelefonu: 'Cep telefonu anlaşılamadı. Örnek: 0532 123 45 67' }, genelHata: 'Profil kaydedilemedi. Lütfen tekrar deneyin.' })
    assert.match(h, /data-hata="firstName"[^>]*>Adınız en az iki harf olmalı\.</)
    assert.match(h, /data-hata="cepTelefonu"[^>]*>Cep telefonu anlaşılamadı/)
    assert.ok(!h.includes('data-hata="lastName"'))
    assert.match(h, /data-hata="genel" role="alert"[^>]*>Profil kaydedilemedi/)
    assert.ok(h.indexOf('id="onb-ad"') < h.indexOf('data-hata="firstName"') && h.indexOf('data-hata="firstName"') < h.indexOf('id="onb-eposta"'))
    assert.match(h.match(/<input[^>]*id="onb-ad"[^>]*>/)![0], /aria-invalid="true"/)
  })

  it('evrensel çerçeve: branşa ya da mesleğe özgü hiçbir alan / sözcük taşımaz', () => {
    const h = duz(ciz({ kvkkGerekli: true }))
    for (const yasak of ['Baş Çevresi', 'veli', 'Neyzi', 'gebelik', 'Pediatri', 'Kardiyoloji', 'diploma', 'T.C.', 'muayenehane']) {
      assert.ok(!h.toLocaleLowerCase('tr').includes(yasak.toLocaleLowerCase('tr')), yasak)
    }
    const kaynak = oku('components/onboarding/KisiselBilgilerAdimi.tsx')
    assert.ok(!/specialty|brans|profession/i.test(kaynak.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'bileşen branşa / mesleğe göre dallanmaz')
  })
})

describe('Onboarding sayfası — kaynak denetimi', () => {
  const sayfa = oku('app/onboarding/page.tsx')
  it('ölü çağrı kaldırıldı: /api/asistan/set-specialty ne çağrılıyor ne de var', () => {
    assert.ok(!sayfa.includes('set-specialty'))
    assert.ok(!existsSync(join(KOK, 'app/api/asistan/set-specialty')), 'böyle bir rota hiç olmadı')
  })
  it('gönderim sırası: önce profil (POST), sonra deneme (PUT); başka çağrı yok', () => {
    const govde = sayfa.slice(sayfa.indexOf('const handleSubmit'), sayfa.indexOf('const renderStep2'))
    const cagri = [...govde.matchAll(/fetch\('([^']+)'/g)].map((m) => m[1])
    assert.deepEqual(cagri, ['/api/users/profile', '/api/users/trial'])
  })
  it('3. adım ortak bileşeni kullanır; kutu yalnız sunucu yanıtıyla açılır; rıza yalnız işaretlendiyse gönderilir', () => {
    assert.match(sayfa, /<KisiselBilgilerAdimi/)
    assert.match(sayfa, /setKvkkGerekli\(hesap\.data\?\.kvkk_onay_gerekli === true\)/)
    assert.match(sayfa, /kvkkGerekli && kvkkOnay \? \{ kvkk_onay: true \} : \{\}/)
    assert.match(sayfa, /const \[kvkkOnay, setKvkkOnay\] = useState\(false\)/, 'kutu işaretsiz başlar')
  })
  it('belirteç ortak yardımcıdan okunur (NOTYA-AUTH-01) — sayfa localStorage\'ı kendisi okumaz', () => {
    assert.ok(!sayfa.includes('localStorage'))
    assert.match(sayfa, /await ensureDoctorAccessToken\(\)/)
  })
})
