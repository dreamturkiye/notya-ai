/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08: "build the Uzbek ones as high as you can get them") — Uzbekistan's depth wave:
 * the SOAP lock of every role in the three note forms, each role's dose engine and order presets, each role's patient
 * chapter and the preview words, and the live assistant's settings with each role's verified sources (not switched on:
 * the voice route is founder-locked — ./klinik/canli.ts).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_ROL_ANAHTARLARI, UZ_ROL_SATIRLARI } from './klinik/rolListesi'
import { uzNotTalimati } from './klinik/talimatlar'
import { uzSoapKilidi, UZ_SOAP_ROL_GRUBU } from './klinik/soapKilitleri'
import { UZ_DOZ_SIPARIS_SATIRLARI, uzDozAnahtari, uzDozSiparisAraclari, uzSiparisAnahtari } from './uygulama/araclar/kendi/uzmanlik/dozSiparis'
import { UZ_PORTAL_BOLUMLERI } from './uygulama/portalBolumleri'
import { UZ_CANLI_ASISTAN } from './klinik/canli'
import { UZ_ROL_KAYNAKLARI, uzKaynakBlogu } from './klinik/kaynaklar'
import { UZ_KLINIK } from './klinik'
import { canliIstem } from '@/lib/ulke/asistan/istem'

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
const ROLLER = [...UZ_ROL_ANAHTARLARI].sort()

describe('Uzbekistan depth wave of 2026-11-08', () => {
  it('K1: every role\'s note instruction carries its own SOAP lock, in each of the three forms, and only that role\'s', () => {
    assert.deepEqual(Object.keys(UZ_SOAP_ROL_GRUBU).sort(), ROLLER)
    for (const rol of ROLLER) for (const f of FORMLAR) {
      const kilit = uzSoapKilidi(f, rol)!
      assert.ok(kilit && uzNotTalimati(f, rol)!.includes(kilit), `${rol}/${f}`)
    }
    // allied professions are told no medical diagnosis; the lock of a doctor role does not say so
    const muttefik = UZ_ROL_SATIRLARI.filter((x) => x.taraf === 'klinik-muttefik').map((x) => x.anahtar)
    for (const rol of ROLLER) assert.equal(/Tibbiy tashxis qoʻyilmaydi/.test(uzSoapKilidi('uz-Latn', rol)!), muttefik.includes(rol), rol)
    assert.equal(uzSoapKilidi('uz-Latn', 'longevity'), null)
  })

  it('K9: every role has its own order presets; every prescribing role its own dose engine; the allied roles have no dose engine', () => {
    assert.deepEqual(UZ_DOZ_SIPARIS_SATIRLARI.map((x) => x.rol).sort(), ROLLER)
    const pk = new Map(uzDozSiparisAraclari().map((p) => [p.anahtar, p]))
    const muttefik = new Set(UZ_ROL_SATIRLARI.filter((x) => x.taraf === 'klinik-muttefik').map((x) => x.anahtar))
    for (const x of UZ_DOZ_SIPARIS_SATIRLARI) {
      assert.deepEqual(pk.get(uzSiparisAnahtari(x.rol))?.roller, [x.rol])
      assert.ok(x.kalemler.length >= 5, x.rol)
      assert.equal(pk.has(uzDozAnahtari(x.rol)), !muttefik.has(x.rol), x.rol)
      if (pk.has(uzDozAnahtari(x.rol))) assert.deepEqual(pk.get(uzDozAnahtari(x.rol))?.roller, [x.rol])
    }
    // the oncology engine works per square metre; the paediatric one per kilogram only
    assert.ok(UZ_DOZ_SIPARIS_SATIRLARI.find((x) => x.rol === 'onkoloji')!.temeller.includes('m2'))
    assert.deepEqual(UZ_DOZ_SIPARIS_SATIRLARI.find((x) => x.rol === 'pediatri')!.temeller, ['kg'])
  })

  it('K6: every role has its own patient chapter in each form, with no number in it; the preview words exist in each form', () => {
    for (const f of FORMLAR) {
      const b = UZ_PORTAL_BOLUMLERI.bolumlerDil![f]!
      assert.deepEqual(Object.keys(b).sort(), ROLLER, f)
      for (const [rol, x] of Object.entries(b)) { assert.ok(x.baslik.trim() && x.satirlar.length === 3, `${rol}/${f}`); assert.doesNotMatch([x.baslik, ...x.satirlar].join(' '), /\d/, `${rol}/${f}`) }
      if (f === 'uz-Cyrl') for (const x of Object.values(b)) assert.doesNotMatch(x.baslik + x.satirlar.join(''), /[A-Za-z]/)
      const d = UZ_PORTAL_BOLUMLERI.demo![f]!
      assert.ok(d.onizle && d.kapat && d.uyari && d.hastaAdi && d.ozet, f)
    }
  })

  it('K4 (ready, not switched on): the assistant\'s sources name every role, national protocols first, books labelled as Russian-language depth texts; "draft, clinician approves" is said', () => {
    assert.deepEqual(Object.keys(UZ_ROL_KAYNAKLARI).sort(), ROLLER)
    for (const rol of ROLLER) {
      const b = uzKaynakBlogu(rol)!
      assert.match(b, /UZBEKISTAN PRACTICE SOURCES \(BINDING\)/)
      assert.match(b, /national clinical protocols/)
      if (UZ_ROL_KAYNAKLARI[rol].kitoblar.length) { assert.match(b, /=== BOOKS \(Russian-language reference texts, depth only/); assert.ok(b.indexOf('BINDING') < b.indexOf('BOOKS')) }
    }
    assert.ok(ROLLER.filter((r) => UZ_ROL_KAYNAKLARI[r].kitoblar.length).length >= 38)
    assert.match(UZ_CANLI_ASISTAN.acilis({ tamAd: 'Dr X', kisaAd: 'X', rolAdi: 'Kardiologiya', doktorAdi: null }), /qoralama.*shifokor qabul qiladi/)
    const istem = canliIstem({ canli: UZ_CANLI_ASISTAN, tamAd: 'Dr X', kisaAd: 'X', rolAdi: 'Kardiologiya', rol: 'kardiyoloji', acilNumara: '103' })
    assert.match(istem, /DRAFT for the clinician/); assert.match(istem, /Uzbek in the Latin script/); assert.match(istem, /Кардиология: национальное руководство/)
    assert.ok(UZ_CANLI_ASISTAN.ekranSozleri.liste(3).includes('3'))
    // NOT switched on until Kaan's written go on the founder-locked voice route (docs/OPEN-COMMITMENTS.md ULKE-UZ-CANLI-01)
    assert.equal(UZ_KLINIK.canliAsistan, undefined)
  })
})
