import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { asistanOturumuSuruyor, asistanSayfasiMi, mikrofonEtiketi, sayfaHastaId, sesAktifMi, yuzenPanelGorunur, type YuzenPanelGirdisi } from './yuzenPanel'

const bos: YuzenPanelGirdisi = { sesDurumu: 'idle', sesMesajiVar: false, yaziliAcik: false, yaziliDoktorMesajiVar: false, pathname: '/dashboard/doktor' }

test('sesAktifMi: yalnız bağlanıyor / dinliyor / konuşuyor', () => {
  assert.equal(sesAktifMi('connecting'), true)
  assert.equal(sesAktifMi('listening'), true)
  assert.equal(sesAktifMi('speaking'), true)
  assert.equal(sesAktifMi('idle'), false)
  assert.equal(sesAktifMi('error'), false)
})

test('asistanSayfasiMi: /asistan ve alt yolları; benzer önekler değil', () => {
  assert.equal(asistanSayfasiMi('/asistan'), true)
  assert.equal(asistanSayfasiMi('/asistan/'), true)
  assert.equal(asistanSayfasiMi('/asistan/x'), true)
  assert.equal(asistanSayfasiMi('/asistanlar'), false)
  assert.equal(asistanSayfasiMi('/dashboard/doktor'), false)
  assert.equal(asistanSayfasiMi(null), false)
})

test('oturum yokken panel görünmez', () => {
  assert.equal(yuzenPanelGorunur(bos), false)
})

test('sesli seans sürerken başka sayfada panel görünür, /asistan sayfasında görünmez', () => {
  for (const sesDurumu of ['connecting', 'listening', 'speaking'] as const) {
    assert.equal(yuzenPanelGorunur({ ...bos, sesDurumu }), true, sesDurumu)
    assert.equal(yuzenPanelGorunur({ ...bos, sesDurumu, pathname: '/asistan' }), false, sesDurumu)
    assert.equal(yuzenPanelGorunur({ ...bos, sesDurumu, pathname: '/doktor-tools/hedef-boy' }), true, sesDurumu)
  }
})

test('yol bilinmiyorsa (ilk çizim) panel görünmez', () => {
  assert.equal(yuzenPanelGorunur({ ...bos, sesDurumu: 'listening', pathname: null }), false)
})

test('yazılı sohbet: açık + doktor soru sormuş → görünür; yalnız açılış selamı ya da kapalı panel → görünmez', () => {
  assert.equal(yuzenPanelGorunur({ ...bos, yaziliAcik: true, yaziliDoktorMesajiVar: true }), true)
  assert.equal(yuzenPanelGorunur({ ...bos, yaziliAcik: true, yaziliDoktorMesajiVar: false }), false)
  assert.equal(yuzenPanelGorunur({ ...bos, yaziliAcik: false, yaziliDoktorMesajiVar: true }), false)
})

test('ses başka sayfadayken koptu: mesaj varsa panel kalır (doktor görsün, kendisi kapatsın)', () => {
  assert.equal(asistanOturumuSuruyor({ ...bos, sesDurumu: 'error', sesMesajiVar: true }), true)
  assert.equal(asistanOturumuSuruyor({ ...bos, sesDurumu: 'error', sesMesajiVar: false }), false)
  // Normal kapanış (idle) oturumu bitirir.
  assert.equal(asistanOturumuSuruyor({ ...bos, sesDurumu: 'idle', sesMesajiVar: true }), false)
})

test('mikrofonEtiketi Türkçe durumları verir', () => {
  assert.equal(mikrofonEtiketi('listening', false), 'Dinliyor')
  assert.equal(mikrofonEtiketi('speaking', false), 'Konuşuyor')
  assert.equal(mikrofonEtiketi('connecting', false), 'Bağlanıyor…')
  assert.equal(mikrofonEtiketi('error', false), 'Bağlantı koptu')
  assert.equal(mikrofonEtiketi('idle', true), 'Dinliyor')
  assert.equal(mikrofonEtiketi('idle', false), 'Yazılı sohbet')
})

test('telefon: sesle uyandır çipi ve otomatik mikrofon yok; ana sayfada Asistan Hızlı araçlar’da ilk', () => {
  const kok = path.join(import.meta.dirname, '..', '..')
  const oku = (d: string) => fs.readFileSync(path.join(kok, d), 'utf8')
  const uyandir = oku('components/asistan/SesleUyandir.tsx')
  assert.match(uyandir, /max-width:\s*899px/)
  assert.match(uyandir, /telefonEkraniMi/)
  assert.match(uyandir, /if \(!doktor \|\| telefon\) return null/)
  assert.match(uyandir, /if \(!doktor \|\| telefon\) return/)
  const ana = oku('app/dashboard/doktor/page.tsx')
  const hizli = ana.indexOf('>Hızlı araçlar</h2>')
  const asistan = ana.indexOf("router.push('/asistan')")
  const epikriz = ana.indexOf("router.push('/doktor-tools/epikriz')")
  assert.ok(hizli > 0, 'Hızlı araçlar heading kutunun üstünde olmalı')
  assert.ok(asistan > hizli && asistan < epikriz, 'Asistan, Epikriz üret’ten önce')
})

test('yaşam döngüsü: provider kök düzende, /asistan kendi oturumunu açmaz, gezinme istemci tarafında', () => {
  const kok = path.join(import.meta.dirname, '..', '..')
  const oku = (d: string) => fs.readFileSync(path.join(kok, d), 'utf8')
  const duzen = oku('app/layout.tsx')
  assert.ok(duzen.includes('<AsistanOturumProvider>'), 'kök düzen provider ile sarılmalı')
  assert.ok(duzen.includes('<AsistanYuzenPanel />'), 'yüzen panel kök düzende')
  const sayfa = oku('app/asistan/page.tsx')
  assert.ok(sayfa.includes('useAsistanOturum()'), '/asistan context tüketir')
  assert.ok(!sayfa.includes('Conversation.startSession'), '/asistan ikinci ses oturumu kurmaz')
  assert.ok(!/return\s*\(\)\s*=>\s*\{\s*void endConversation/.test(sayfa), 'sayfadan çıkış oturumu kapatmaz')
  assert.ok(sayfa.includes('pwaIkonundanAsistanMi()'), 'eski PWA ikonu Ana Sayfa’ya gider')
  assert.ok(sayfa.includes('function AsistanAcilis'), 'ikon kontrolü DoktorChrome’dan önce ayrı bileşen')
  assert.ok(sayfa.indexOf('if (!ac)') < sayfa.lastIndexOf('<DoktorChrome>'), 'Asistan chrome ikon kontrolünden önce çizilmez')
  assert.ok(sayfa.includes("router.replace('/dashboard/doktor')"))
  assert.ok(!sayfa.includes('window.location.replace'), 'ikon yönü tam sayfa yüklemesi değil')
  const ctx = oku('components/asistan/AsistanOturumContext.tsx')
  assert.equal(ctx.match(/Conversation\.startSession\(/g)?.length, 1, 'tek ses oturumu kurucusu')
  assert.ok(ctx.includes('tryFirstMessage: true'), 'EL first_message override denenir')
  assert.ok(ctx.includes("fishAcikRef.current ? 'Hocam.'"), 'Fish açıkken EL kısa dummy söyler, STT beklemez')
  assert.ok(ctx.includes('skipNextAgentTranscript = fishAcikRef.current'), 'dummy EL sözü Fish ağzına gitmez')
  assert.ok(ctx.includes('onConversationCreated'), 'Fish oturumunda EL sesi oluşur oluşmaz kapanır')
  assert.ok(ctx.includes('never unmute ElevenLabs') || ctx.includes('Ayşe tests are Fish-only'), 'Fish hata olunca EL ağzı açılmaz')
  assert.ok(ctx.includes('if (fishAcikRef.current)'), 'Ayşe devamı Fish Haberci yolundan gider')
  assert.ok(ctx.includes('fishIsle(metin, true)'), 'Ayşe kalanı Haberci ile okur, EL sendUserMessage yok')
  const devamFn = ctx.slice(ctx.indexOf('function sesDevamiIste'))
  const fishDon = devamFn.indexOf('fishIsle(metin, true)')
  const elDevam = devamFn.indexOf('sendUserMessage(DEVAM_ISARETI)')
  assert.ok(fishDon >= 0 && elDevam > fishDon, 'Fish kalanı EL [devam] turundan önce return eder')
  const chrome = oku('components/doktor/DoktorChrome.tsx')
  assert.ok(!/window\.location\.href\s*=\s*route/.test(chrome), 'DoktorChrome gezinmesi tam sayfa yüklemesi yapmamalı')
  assert.ok(chrome.includes('router.push(route)'))
  assert.ok(!oku('components/asistan/YaziliSohbet.tsx').includes('<a href'), 'yönlendirme bağlantısı next/link olmalı')
})

test('NOTYA-SAYFA-HASTA-01 sayfaHastaId: hasta sayfası ve alt sayfaları hastanın kimliğini verir; başka yol vermez', () => {
  const id = '3f2a9c1e-7b4d-4e8a-9c0f-1a2b3c4d5e6f'
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id}`), id)
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id}/`), id)
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id}/buyume`), id)
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id}/belgeler/abc/lab`), id)
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id.toUpperCase()}`), id)
  assert.equal(sayfaHastaId('/dashboard/doktor/hastalar'), null)
  assert.equal(sayfaHastaId('/dashboard/doktor/hastalar/yeni'), null)
  assert.equal(sayfaHastaId(`/dashboard/doktor/hastalar/${id}x`), null)
  assert.equal(sayfaHastaId(`/dashboard/doktor/notlar/${id}`), null)
  assert.equal(sayfaHastaId(`/x/dashboard/doktor/hastalar/${id}`), null)
  assert.equal(sayfaHastaId('/asistan'), null)
  assert.equal(sayfaHastaId(null), null)
  assert.equal(sayfaHastaId(undefined), null)
})
