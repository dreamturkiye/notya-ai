/**
 * MUAYENE-EKLERI-01 — kill switch (NOTYA_MUAYENE_EKLERI=off) bağlantı sözleşmesi.
 * Bayrak kapalıyken: rotalar 404, end rotası ek hazırlığını hiç çağırmaz, istemci eski akışa düşer.
 * Bayrağın değer çözümlemesi bayrak.test.ts'te; burada bağlantının YERİNDE olduğu doğrulanır.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'
import { ekRotaOnKosul } from './rotaOn'

const KOK = resolve(__dirname, '../../..')
const oku = (g: string) => readFileSync(resolve(KOK, g), 'utf8')

describe('kill switch — davranış', () => {
  const onceki = process.env.NOTYA_MUAYENE_EKLERI
  beforeEach(() => { process.env.NOTYA_MUAYENE_EKLERI = 'off' })
  afterEach(() => { if (onceki === undefined) delete process.env.NOTYA_MUAYENE_EKLERI; else process.env.NOTYA_MUAYENE_EKLERI = onceki })

  it('kapalıyken ek rotaları oturuma bile bakmadan 404 döner', async () => {
    const req = new NextRequest('http://localhost/api/doktor/muayene-ekleri/degerlendir', { method: 'POST' })
    const r = await ekRotaOnKosul(req, randomId(), randomId())
    assert.ok('hata' in r)
    assert.equal((r as { hata: Response }).hata.status, 404)
  })
})
const randomId = () => '00000000-0000-4000-8000-000000000001'

describe('kill switch — bağlantı sözleşmesi (kaynak)', () => {
  it('end rotası: ek hazırlığı yalnız bayrak açıkken ve try/catch içinde çalışır; hata durumunda ekBlogu boş kalır', () => {
    const s = oku('app/api/sessions/[id]/end/route.ts')
    const i = s.indexOf('muayeneEkleriAcikMi()')
    const j = s.indexOf('seansEkleriniHazirla(')
    assert.ok(i > 0 && j > i, 'seansEkleriniHazirla bayrak kontrolünden SONRA çağrılmalı')
    assert.match(s.slice(i - 400, j), /try\s*\{/)
    assert.match(s, /ek hazirlama atlandi/)
    assert.match(s, /\.\.\.\(ekBlogu \? \{ ekBlogu \} : \{\}\)/, 'ekBlogu boşsa soapNotuUret girdisi değişmemeli')
  })
  it('approve rotası: yönlendirme bayrakla korunur, hata onayı bozmaz', () => {
    const s = oku('app/api/notes/[id]/approve/route.ts')
    const i = s.indexOf('muayeneEkleriAcikMi()')
    assert.ok(i > 0 && s.indexOf('onayliEkleriYonlendir', i) > i)
    assert.match(s.slice(i, i + 700), /catch/)
  })
  it('istemci: durum alınamazsa/kapalıysa eski yol; ek adımı kurulamazsa eski yol', () => {
    const s = oku('app/session/new/page.tsx')
    assert.match(s, /useState\(false\)/) // ekAcik varsayılanı KAPALI (fail open → eski akış)
    assert.match(s, /if \(!ekAcik\) return processSession\(\)/)
    assert.match(s, /return processSession\(\) \/\/ ek adımı kurulamadı/)
    assert.match(s, /d\?\.acik === true/)
  })
  it('ek bileşeni çökerse yedek kart "Notu Oluştur" ile eski yola döner', () => {
    const s = oku('components/doktor/MuayeneEklerAdimi.tsx')
    assert.match(s, /getDerivedStateFromError/)
    assert.match(s, /onDevam\(null\)/)
  })
  it('tüm ek rotaları aynı kapıdan (bayrak) geçer', () => {
    for (const r of ['siniflandir', 'tur', 'degerlendir']) assert.match(oku(`app/api/doktor/muayene-ekleri/${r}/route.ts`), /ekRotaOnKosul/)
    assert.match(oku('app/api/doktor/muayene-ekleri/liste/route.ts'), /muayeneEkleriAcikMi\(\)/)
    assert.match(oku('lib/doktor/muayeneEk/rotaOn.ts'), /!muayeneEkleriAcikMi\(\)/)
  })
})
