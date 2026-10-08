/**
 * NOTYA-ULKE-01 — the leak harness itself: it must catch every Türkiye-only term the brief names, in the forms they
 * really appear in, and it must not cry wolf on ordinary Uzbek and Russian.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gorunurMetin, sizintiTara, sizintiYok } from './testing/sizintiTarayici'
import { TUM_ULKELER } from '../../countries/tumu'
import { KLINIK_TURKISH_REFS } from '../klinik/klinikTurkishRefs'
import { TURKISH_REFS } from '../asistan/turkishSpecialtyRefs'

const uz = (metin: string) => sizintiTara(metin, { hedefUlke: 'uz', kaynak: 'test' })
const terimler = (metin: string) => uz(metin).map((b) => b.terim)

describe('leak harness: Türkiye-only terms in Uzbek output', () => {
  it('catches every term the standard names', () => {
    const ornekler: [string, string][] = [
      ['e-Nabız', 'Maʼlumot e-Nabız tizimiga yuboriladi'],
      ['enabız', 'enabız'],
      ['enabiz', 'https://enabiz.gov.tr'],
      ['e-Nabız', 'E-NABIZ'],
      ['MBYS', 'MBYS ga kiritish'],
      ['SGK', 'SGK hisoboti'],
      ['SUT', 'SUT qoidalari'],
      ['KVKK', 'KVKK ga mos'],
      ['TC kimlik', 'TC Kimlik raqami'],
      ['T.C.', 'T.C. 12345678901'],
      ['₺', 'oyiga ₺1.490'],
      ['TL', 'oyiga 1490 TL'],
      ['Sağlık Bakanlığı', 'Sağlık Bakanlığı protokoli'],
      ['Medula', 'Medula orqali'],
      ['lira', 'narxi 1490 lira'],
      ['Ayşe', 'Prof. Ayşe tinglaydi'],
      ['Türk', 'Türk Kardiyoloji Derneği'],
    ]
    for (const [terim, metin] of ornekler) {
      assert.ok(terimler(metin).includes(terim), `"${terim}" not caught in: ${metin} → ${JSON.stringify(terimler(metin))}`)
    }
  })

  it('catches the Turkish clinical reference names (doctor and clinic lists)', () => {
    const ornek = [KLINIK_TURKISH_REFS['sac-ekimi'][1], TURKISH_REFS.pediatri[1], TURKISH_REFS.kardiyoloji[0]]
    for (const satir of ornek) {
      const b = uz(`Manba: ${satir}`)
      assert.ok(b.some((x) => x.tur === 'terim' && satir.includes(x.terim)), satir)
    }
    assert.ok(TUM_ULKELER.tr.sizintiTerimleri.length > 200, 'reference names must be part of the list')
    // An international name is nobody's leak.
    for (const ad of ['KDIGO 2024', 'ESC 2021 SCORE2', 'WHO MEC', 'GOLD ABE', 'ICD-10']) assert.deepEqual(uz(ad), [], ad)
  })

  it('catches Turkish letters as a last line (stated proxy)', () => {
    const b = uz('Hasta odadan çıktığında')
    assert.ok(b.some((x) => x.tur === 'harf'))
  })

  it('catches a document that declares itself Turkish', () => {
    assert.ok(terimler('<html lang="tr"><body>Notya</body></html>').includes('<html lang="tr">'))
    assert.deepEqual(uz('<html lang="uz-Latn"><body>Notya</body></html>'), [])
    assert.deepEqual(uz('<html lang="ru"><body>Notya</body></html>'), [])
  })

  it('does not cry wolf on ordinary Uzbek and Russian', () => {
    const temiz = [
      'Bola sut ichadi.', // "sut" is milk; "SUT" is the Turkish rulebook
      'Qabul yozib olinadi va xulosa oʻzbek yoki rus tilida yoziladi.',
      'Narxni soʻrash',
      'Приём записывается, заключение пишется на узбекском или русском языке.',
      'Запросить цену',
      'Elektron pochta yoki parol notoʻgʻri.',
      'ATLAS, UTLT va STL fayllari', // "TL" inside another word or token is not the currency
      'Hamkasb maslahati — bitta havola orqali.',
    ]
    for (const m of temiz) assert.deepEqual(uz(m), [], m)
  })

  it('sizintiYok lists every finding with its context', () => {
    assert.doesNotThrow(() => sizintiYok('Narxni soʻrash', { hedefUlke: 'uz', kaynak: '/' }))
    assert.throws(() => sizintiYok('KVKK uyumlu · 1.490 TL', { hedefUlke: 'uz', kaynak: '/' }), /2 leak\(s\)[\s\S]*"KVKK"[\s\S]*"TL"/)
  })

  it('visible text: markup, scripts and styles are not content; attributes people read are', () => {
    const html = '<html lang="uz-Latn"><head><title>Notya</title><meta name="description" content="KVKK uyumlu"><style>.SGK{}</style><script src="/_next/static/TL-1.js"></script></head><body><img alt="Sağlık Bakanlığı"><p>Salom &amp; xush kelibsiz</p></body></html>'
    const g = gorunurMetin(html)
    assert.match(g, /Salom & xush kelibsiz/)
    assert.doesNotMatch(g, /_next|\.SGK/)
    const t = sizintiTara(g, { hedefUlke: 'uz', kaynak: 'test' }).map((b) => b.terim)
    assert.ok(t.includes('KVKK') && t.includes('Sağlık Bakanlığı'))
    assert.ok(!t.includes('TL') && !t.includes('SGK'))
  })

  it('works in the other direction too: Uzbekistan-only terms in Turkish output', () => {
    const tr = (m: string) => sizintiTara(m, { hedefUlke: 'tr', kaynak: 'test' }).map((b) => b.terim)
    assert.ok(tr('DMED tizimiga kiritish').includes('DMED'))
    assert.ok(tr('narxi 100 000 soʻm').includes('soʻm'))
    assert.deepEqual(tr('Hasta odadan çıktığında işiniz bitmiş olsun. SGK, SUT, KVKK, ₺1.490'), [])
  })
})
