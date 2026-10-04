import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MESAJ_EK_AZAMI,
  mesajEkMimeCoz,
  mesajEkDogrula,
  VaultValidationError,
} from './mesajEk'

const kok = join(import.meta.dirname, '../..')

describe('mesajEk', () => {
  it('MIME: Word/Excel/uzantıdan çözülür', () => {
    assert.equal(mesajEkMimeCoz('rapor.docx', ''), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    assert.equal(mesajEkMimeCoz('lab.xlsx', 'application/octet-stream'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    assert.equal(mesajEkMimeCoz('akciger.jpg', 'image/jpeg'), 'image/jpeg')
    assert.equal(mesajEkMimeCoz('us.mp4', ''), 'video/mp4')
  })

  it('4 MB üstü ve yasak tür reddedilir', () => {
    assert.throws(() => mesajEkDogrula('x.exe', 'application/x-msdownload', 100), VaultValidationError)
    assert.throws(() => mesajEkDogrula('buyuk.pdf', 'application/pdf', 5 * 1024 * 1024), VaultValidationError)
    assert.doesNotThrow(() => mesajEkDogrula('ok.pdf', 'application/pdf', 1000))
  })

  it('azami ek sayısı 3', () => {
    assert.equal(MESAJ_EK_AZAMI, 3)
  })

  it('portal Sonuçlar hasta belgelere yüklemez; mesajlara yönlendirir', () => {
    const r = readFileSync(join(kok, 'app/portal/_components/ResultsView.tsx'), 'utf8')
    assert.match(r, /HastaBelgeMesajIpucu/)
    assert.doesNotMatch(r, /HastaDisFilmYukle|\/goruntu/)
    assert.match(r, /Mesajlara git/)
  })

  it('eski goruntu POST 410 + mesajlar yönü', () => {
    const r = readFileSync(join(kok, 'app/api/portal/hasta/[token]/goruntu/route.ts'), 'utf8')
    assert.match(r, /status: 410/)
    assert.match(r, /Mesajlar üzerinden/)
    assert.doesNotMatch(r, /uploadDocument/)
  })

  it('onay/mesaj ekleri migration + doctor Gözlemle / Belgeler\'e kaydet / Sil', () => {
    assert.ok(readFileSync(join(kok, 'lib/db/migrations/115_hasta_mesaj_ekleri.sql'), 'utf8').includes('hasta_mesaj_ekleri'))
    const ui = readFileSync(join(kok, 'app/dashboard/doktor/mesajlar/page.tsx'), 'utf8')
    assert.match(ui, /Gözlemle/)
    assert.match(ui, /Belgeler'e kaydet|Belgeler&apos;e kaydet/)
    assert.match(ui, /mesajSil/)
    const portal = readFileSync(join(kok, 'app/portal/_components/MessagesView.tsx'), 'utf8')
    assert.match(portal, /Dosya ekle/)
    assert.match(portal, /FormData|append\('ek'/)
  })
})
