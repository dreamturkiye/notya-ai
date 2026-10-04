/**
 * PORTAL-HEKIM-01 — Özet hekim kartı ayrıştırıcıları.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  hekimKartindanSatirlar,
  satirTelefonMu,
  telefonGorunum,
  telefonHref,
} from './hekimKarti'
import { emptyPortalBundle } from './emptyBundle'
import { SAGLIGIM_DEMO } from './demoData'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('PORTAL-HEKIM-01 hekim kartı', () => {
  it('telefon satırını adres / branştan ayırır', () => {
    assert.ok(satirTelefonMu('0216 000 00 00'))
    assert.ok(satirTelefonMu('0532 123 45 67'))
    assert.ok(!satirTelefonMu('Bağdat Cad. No:12 Kadıköy/İstanbul'))
    assert.ok(!satirTelefonMu('İç Hastalıkları Uzmanı'))
  })

  it('TR telefon görünümü ve tel: href', () => {
    assert.equal(telefonGorunum('02160000000'), '0216 000 00 00')
    assert.equal(telefonHref('0216 000 00 00'), 'tel:+902160000000')
    assert.equal(telefonGorunum(''), null)
    assert.equal(telefonHref(null), null)
  })

  it('reçete başlığı satırlarından adres + telefon + unvanlı ad', () => {
    const k = hekimKartindanSatirlar({
      fullName: 'Gökhan Mamur',
      specialty: 'dahiliye',
      clinicName: 'Notya Muayenehanesi',
      satirlar: [
        'İç Hastalıkları Uzmanı',
        'Bağdat Cad. No:12 Kadıköy/İstanbul',
        '0216 000 00 00',
      ],
    })
    assert.equal(k.ad, 'Dr. Gökhan Mamur')
    assert.equal(k.adres, 'Bağdat Cad. No:12 Kadıköy/İstanbul')
    assert.equal(k.telefon, '0216 000 00 00')
    assert.equal(k.telefonHref, 'tel:+902160000000')
    assert.equal(k.klinik, 'Notya Muayenehanesi')
    assert.ok(k.brans)
  })

  it('muayenehane hattı reçete satırından öncelikli', () => {
    const k = hekimKartindanSatirlar({
      fullName: 'Dr. Ayşe Yılmaz',
      satirlar: ['Bağdat Cad. No:1', '0216 111 11 11'],
      muayenehaneTelefon: '0532 999 88 77',
    })
    assert.equal(k.ad, 'Dr. Ayşe Yılmaz')
    assert.equal(k.telefon, '0532 999 88 77')
    assert.equal(k.adres, 'Bağdat Cad. No:1')
  })

  it('ofis telefonu varsayılan; özel varsayılan ofisi ezer', () => {
    const ofis = hekimKartindanSatirlar({
      fullName: 'Dr. Gökhan Mamur',
      satirlar: ['0216 111 11 11'],
      muayenehaneTelefon: '0216 000 00 00',
      whatsappMuayenehane: '0532 999 88 77',
    })
    assert.equal(ofis.telefon, '0216 000 00 00')
    const ozel = hekimKartindanSatirlar({
      fullName: 'Dr. Gökhan Mamur',
      muayenehaneTelefon: '0216 000 00 00',
      varsayilanTelefon: '0533 111 22 33',
    })
    assert.equal(ozel.telefon, '0533 111 22 33')
  })

  it('bundle ve demo hekim taşır; Özet hero hekim kartını bağlar', () => {
    assert.equal(emptyPortalBundle().hekim.ad, 'Doktorunuz')
    assert.equal(SAGLIGIM_DEMO.hekim.ad, 'Dr. Gökhan Mamur')
    assert.ok(SAGLIGIM_DEMO.hekim.adres)
    assert.ok(SAGLIGIM_DEMO.hekim.telefon)
    const hero = oku('app/portal/_components/HomeHero.tsx')
    assert.match(hero, /PORTAL-HEKIM-01/)
    assert.match(hero, /sg-hekim-kart/)
    assert.match(hero, /data\.hekim/)
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /portalHekimKarti/)
    assert.match(rota, /bundle\.hekim = await portalHekimKarti/)
  })
})
