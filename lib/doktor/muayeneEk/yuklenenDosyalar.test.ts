/**
 * MUAYENE-EKLERI-07 — "Yüklenen dosyalar" list builder (pure half). The access route is covered by the cross-doctor suite
 * (lib/security/hasta-izolasyon.test.ts, "MUAYENE-EKLERI-07").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  GORUNEN_AD_AZAMI, YUKLENEN_DOSYALAR_BASLIGI, boyutMetni, gorunenAdKisalt, gorunumTuru, siniflandirmaEtiketi,
  yazdirSatirlari, yuklenenListesiKur, type YuklenenHam,
} from './yuklenenDosyalar'

const KOK = resolve(__dirname, '../../..')
const ham = (id: string, fileName: string, createdAt: string, ek: Partial<YuklenenHam> = {}): YuklenenHam => ({ id, fileName, fileType: 'image/jpeg', fileSize: 2048, createdAt, ...ek })

describe('yuklenenListesiKur', () => {
  it('boş ziyaret → boş liste (bölüm gösterilmez)', () => {
    assert.deepEqual(yuklenenListesiKur([]), [])
    assert.deepEqual(yuklenenListesiKur(undefined as unknown as YuklenenHam[]), [])
  })

  it('yükleme sırasına göre dizer; aynı anda yüklenenler Türkçe sırayla, sonra kimlikle', () => {
    const t = '2026-10-16T09:00:00.000Z'
    const l = yuklenenListesiKur([
      ham('3', 'son.pdf', '2026-10-16T09:05:00.000Z'),
      ham('2', 'Şeker.pdf', t),
      ham('1', 'Çorba.pdf', t),
      ham('4', 'Zeynep.pdf', t),
      ham('5', 'Zeynep.pdf', t),
    ])
    assert.deepEqual(l.map((d) => d.id), ['1', '2', '4', '5', '3'])
  })

  it('aynı kimlik iki kez gelirse bir kez listelenir', () => {
    assert.equal(yuklenenListesiKur([ham('1', 'a.jpg', '2026-10-16T09:00:00Z'), ham('1', 'a.jpg', '2026-10-16T09:00:00Z')]).length, 1)
  })

  it('özgün dosya adı korunur; IMG_2034.jpg gibi adlar sınıflandırmayla anlamlanır', () => {
    const [d] = yuklenenListesiKur([ham('1', 'IMG_2034.jpg', '2026-10-16T09:00:00Z')], new Map([['1', 'lab' as const]]))
    assert.equal(d.ad, 'IMG_2034.jpg')
    assert.equal(d.sinif, 'Laboratuvar')
    assert.equal(d.gorunum, 'gorsel')
    assert.equal(d.mime, 'image/jpeg')
  })

  it('sınıflandırma: Ayşe türü > kasa kategorisi > hiçbiri; "diğer" etiket taşımaz', () => {
    const t = '2026-10-16T09:00:00Z'
    const l = yuklenenListesiKur([
      ham('a', 'a.jpg', t, { category: 'Röntgen' }),
      ham('b', 'b.jpg', t, { category: 'Diğer' }),
      ham('c', 'c.jpg', t),
      ham('d', 'd.jpg', t, { category: 'Lab Sonucu' }),
    ], { a: 'ekg', c: 'diger', d: 'diger' })
    const e = Object.fromEntries(l.map((d) => [d.id, d.sinif]))
    assert.deepEqual(e, { a: 'EKG', b: null, c: null, d: 'Lab Sonucu' })
    assert.equal(siniflandirmaEtiketi('diger', 'diğer'), null)
    assert.equal(siniflandirmaEtiketi(undefined, undefined), null)
  })

  it('Türkçe harfli ve NFD (macOS) adlar NFC olarak aynen döner', () => {
    const nfd = 'Hasta İki sonuçları ğüşıö.pdf'.normalize('NFD')
    const [d] = yuklenenListesiKur([ham('1', nfd, '2026-10-16T09:00:00Z', { fileType: 'application/pdf' })])
    assert.equal(d.ad, 'Hasta İki sonuçları ğüşıö.pdf')
    assert.equal(d.gorunum, 'pdf')
    assert.equal(yazdirSatirlari([d])[0], '1. Hasta İki sonuçları ğüşıö.pdf')
  })

  it('özel karakterler (tırnak, &, <, boşluk, emoji) olduğu gibi veri olarak kalır — kaçış arayüzde (React)', () => {
    const ad = `x "y" & <b>z</b> 'q' 📷.png`
    const [d] = yuklenenListesiKur([ham('1', ad, '2026-10-16T09:00:00Z', { fileType: 'image/png' })])
    assert.equal(d.ad, ad)
  })

  it('geçersiz tarih sıralamayı bozmaz (sona değil başa düşer, çökmez)', () => {
    const l = yuklenenListesiKur([ham('1', 'a.jpg', 'bozuk'), ham('2', 'b.jpg', '2026-10-16T09:00:00Z')])
    assert.deepEqual(l.map((d) => d.id), ['1', '2'])
  })
})

describe('gorunenAdKisalt: çok uzun adlar görsel olarak kısalır, tam ad `ad` alanında kalır', () => {
  it('kısa ad değişmez', () => assert.equal(gorunenAdKisalt('rapor.pdf'), 'rapor.pdf'))

  it('uzun ad en fazla GORUNEN_AD_AZAMI karakter; uzantı sonda kalır', () => {
    const ad = `${'çok-uzun-dosya-adı-'.repeat(8)}sonuc.pdf`
    const k = gorunenAdKisalt(ad)
    assert.ok(Array.from(k).length <= GORUNEN_AD_AZAMI, `${Array.from(k).length}`)
    assert.ok(k.endsWith('sonuc.pdf'))
    assert.ok(k.includes('…'))
    const [d] = yuklenenListesiKur([ham('1', ad, '2026-10-16T09:00:00Z')])
    assert.equal(d.ad, ad, 'tam ad title/yazdır için eksiksiz kalmalı')
    assert.equal(d.gorunenAd, k)
  })

  it('Türkçe harfi ve vekil çifti (emoji) ortadan bölmez', () => {
    const ad = `${'İğüşçö😀'.repeat(20)}.jpg`
    const k = gorunenAdKisalt(ad)
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(k), 'yarım vekil çifti kaldı')
    assert.ok(Array.from(k).length <= GORUNEN_AD_AZAMI)
  })
})

describe('yazdirSatirlari: yazdır/PDF düz metin, tam ad + sınıflandırma, bağlantısız', () => {
  it('numaralı, tam adlı, sınıflandırmalı', () => {
    const uzun = `${'a'.repeat(80)}.pdf`
    const l = yuklenenListesiKur([ham('1', 'IMG_2034.jpg', '2026-10-16T09:00:00Z'), ham('2', uzun, '2026-10-16T09:01:00Z', { fileType: 'application/pdf' })], { '1': 'lab' })
    assert.deepEqual(yazdirSatirlari(l), ['1. IMG_2034.jpg — Laboratuvar', `2. ${uzun}`])
    assert.ok(!yazdirSatirlari(l).join('\n').includes('http'))
  })
  it('başlık Gökhan Bey’in istediği ifade', () => assert.equal(YUKLENEN_DOSYALAR_BASLIGI, 'Yüklenen dosyalar'))
})

describe('gorunumTuru / boyutMetni', () => {
  it('görsel ve PDF satır içi, diğerleri indirme', () => {
    assert.equal(gorunumTuru('image/png'), 'gorsel')
    assert.equal(gorunumTuru('IMAGE/JPEG; charset=x'), 'gorsel')
    assert.equal(gorunumTuru('application/pdf'), 'pdf')
    for (const m of ['image/heic', 'image/tiff', 'application/dicom', 'text/csv', 'audio/mp4', 'video/mp4', '', null, undefined]) assert.equal(gorunumTuru(m), 'diger', String(m))
  })
  it('boyut', () => {
    assert.equal(boyutMetni(0), '')
    assert.equal(boyutMetni(900), '900 B')
    assert.equal(boyutMetni(2048), '2 KB')
    assert.match(boyutMetni(3 * 1024 * 1024), /^3 MB$/)
  })
})

describe('arayüz sözleşmesi (kaynak denetimi)', () => {
  const bilesen = readFileSync(join(KOK, 'components/doktor/YuklenenDosyalar.tsx'), 'utf8')
  it('uzun ad: tam ad title özniteliğinde, görsel kısaltma CSS ellipsis ile', () => {
    assert.match(bilesen, /className="yd-baglanti" title=\{d\.ad\}/)
    assert.match(bilesen, /text-overflow:ellipsis/)
  })
  it('yazdırmada bağlantılı liste gizlenir, düz liste basılır', () => {
    assert.match(bilesen, /@media print\{\.yd-ekran,\.yd-panel\{display:none!important\}\.yd-yazdir\{display:block!important\}\}/)
    assert.match(bilesen, /yazdirSatirlari\(dosyalar\)/)
  })
  it('evrensel: branşa özel ifade yok', () => {
    assert.ok(!/pediatri|veli|baş çevresi|neyzi/i.test(bilesen))
  })
  it('hiçbir URL’de jeton/imza yok: dosya blob: URL ile gösterilir', () => {
    assert.match(bilesen, /URL\.createObjectURL/)
    assert.ok(!/access_token|\?token=|signedUrl/i.test(bilesen))
  })
  it('bölüm iki not ekranında da bağlı (düzenleme + kesinleşmiş/yazdır)', () => {
    assert.match(readFileSync(join(KOK, 'app/dashboard/doktor/notlar/[id]/page.tsx'), 'utf8'), /<YuklenenDosyalar sessionId=\{not\.sessionId\} \/>/)
    assert.match(readFileSync(join(KOK, 'app/dashboard/doktor/notlar/[id]/yazdir/page.tsx'), 'utf8'), /<YuklenenDosyalar sessionId=\{not\.sessionId\} onListe=\{setEkDosyalar\} yazdirSayfasi \/>/)
  })
})
