/**
 * GENITAL-ESTETIK-01 (2026-11-06) — United States: the cosmetic gynaecology tools this country offers under its own law and
 * regulator, the slots (with the legal source) of those it does not, the 18+ gate of every cosmetic-capable tool, the
 * operations offered, and a clean pack check. Obstetrics and gynaecology; the surgical part also plastic and aesthetic surgery.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { araclarSorunlari } from '@/lib/ulke/araclar/denetim'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { GE_KOZMETIK_ARACLARI, GENITAL_ESTETIK_ARACLARI } from '@/lib/ulke/araclar/tanimlar/genitalEstetik'
import { US_ARAYUZ } from './arayuz'
import { US_PAKETI } from './index'

const A = US_ARAYUZ.araclar as UlkeAraclari
const ACIK: readonly string[] = ["ameliyat-notu-genital", "genital-enerji-seansi", "genital-enjeksiyon", "genital-beyazlatma", "genital-sonuc-olcegi", "genital-foto-onam", "onam-formu-genital"]
const KAPALI: readonly string[] = []
const SABLON: readonly string[] = ["labioplasti", "labioplasti_klitoral", "vajinoplasti", "perineoplasti"]
const ARAC = (k: string) => A.araclar.find((p) => p.anahtar === k)

describe('GENITAL-ESTETIK-01 — United States', () => {
  it('offers exactly what the country permits; every other tool of the package is a slot naming its legal source', () => {
    for (const k of ACIK) assert.ok(ARAC(k), `${k} should be on`)
    for (const k of KAPALI) {
      assert.ok(!ARAC(k), `${k} must be off`)
      const y = A.yuvalar.find((x) => x.anahtar === k)
      assert.ok(y && y.acik === false && /x/.test(y.eksik), `${k}: slot with its source`)
    }
    assert.equal(ACIK.length + KAPALI.length, GENITAL_ESTETIK_ARACLARI.length)
  })
  it('every cosmetic-capable tool that is on is for women aged 18 and over (an unknown birth date never passes)', () => {
    for (const k of GE_KOZMETIK_ARACLARI.filter((x) => ACIK.includes(x))) {
      const p = ARAC(k)!
      assert.deepEqual(p.hasta, { enAzYas: 18, cinsiyet: 'female' }, k)
      assert.ok(Object.values(p.metin.hastaKapisi ?? {}).every((s) => /18/.test(String(s))), k)
    }
  })
  it('the operations offered on the adult genital note', () => {
    const p = ARAC('ameliyat-notu-genital')
    if (!SABLON.length) { assert.ok(!p); return }
    const offered = p!.uyarlama?.secenekler?.sablon ?? ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti', 'perineoplasti']
    assert.deepEqual([...offered].sort(), [...SABLON].sort())
    for (const o of Object.keys(p!.sablonlar?.sablon ?? {})) assert.ok(SABLON.includes(o), o)
  })
  it('the records stay with obstetrics and gynaecology; the surgical part also reaches plastic and aesthetic surgery, nobody else', () => {
    const KD = /obstetric|gyn|akusher|ginek|kadin/i, PLASTIK = /^(plastic-surgery|aesthetic-surgery|plastik-cerrahi|estetik-cerrahi)$/
    const CERRAHI = ['ameliyat-notu-genital', 'genital-foto-onam']
    for (const k of ACIK) {
      const r = ARAC(k)!.roller ?? []
      assert.ok(r.length > 0, k)
      if (k === 'onam-formu-genital') assert.ok(r.every((x) => PLASTIK.test(x)), `${k}: plastic and aesthetic surgery only (O&G has its own full form)`)
      else if (CERRAHI.includes(k)) assert.ok(r.some((x) => KD.test(x)) && r.every((x) => KD.test(x) || PLASTIK.test(x)), k)
      else assert.ok(r.every((x) => KD.test(x)), `${k}: obstetrics and gynaecology only`)
    }
    const cops = A.yuvalar.find((y) => y.anahtar === 'genital-cops-l-items')!
    assert.ok((cops.roller ?? []).every((x) => KD.test(x) || PLASTIK.test(x)))
    for (const k of ['genital-fsfi-items', 'genital-fgsis-items']) assert.ok((A.yuvalar.find((y) => y.anahtar === k)!.roller ?? []).every((x) => KD.test(x)), k)
    assert.ok(!A.yuvalar.some((y) => y.anahtar === 'genital-vlq-item'), 'the Vaginal Laxity Questionnaire is not in the package')
  })
  it('the consent form of the operations offers the same operations as the note', () => {
    const p = ARAC('onam-formu-genital')!
    const offered = p.uyarlama?.secenekler?.islem ?? ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti', 'perineoplasti']
    assert.deepEqual([...offered].sort(), [...SABLON].sort())
  })
  it('labiaplasty on the O&G note asks for the medical indication, in this pack\'s words', () => {
    const kd = ARAC('ameliyat-notu-kd')
    assert.ok(kd && kd.metin.alanlar.tibbi_endikasyon && kd.metin.alanlar.tibbi_gerekce)
  })
  it('the pack check finds nothing to fix in the package', () => {
    const s = araclarSorunlari(US_PAKETI, US_ARAYUZ, US_PAKETI.diller).filter((x) => /genital|ameliyat-notu-kd|onam-formu-kd/.test(JSON.stringify(x)))
    assert.deepEqual(s, [])
  })
})
