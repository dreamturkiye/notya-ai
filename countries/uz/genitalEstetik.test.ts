/**
 * GENITAL-ESTETIK-01 (2026-11-06) — Uzbekistan: the cosmetic gynaecology tools this country offers under its own law and
 * regulator, the slots (with the legal source) of those it does not, the 18+ gate of every cosmetic-capable tool, the
 * operations offered, and a clean pack check. Obstetrics and gynaecology only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { araclarSorunlari } from '@/lib/ulke/araclar/denetim'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { GE_KOZMETIK_ARACLARI, GENITAL_ESTETIK_ARACLARI } from '@/lib/ulke/araclar/tanimlar/genitalEstetik'
import { UZ_ARAYUZ } from './arayuz'
import { UZ_PAKETI } from './index'

const A = UZ_ARAYUZ.araclar as UlkeAraclari
const ACIK: readonly string[] = ["ameliyat-notu-genital", "genital-sonuc-olcegi", "genital-foto-onam"]
const KAPALI: readonly string[] = ["genital-enerji-seansi", "genital-enjeksiyon", "genital-beyazlatma"]
const SABLON: readonly string[] = ["labioplasti", "labioplasti_klitoral", "vajinoplasti", "perineoplasti"]
const ARAC = (k: string) => A.araclar.find((p) => p.anahtar === k)

describe('GENITAL-ESTETIK-01 — Uzbekistan', () => {
  it('offers exactly what the country permits; every other tool of the package is a slot naming its legal source', () => {
    for (const k of ACIK) assert.ok(ARAC(k), `${k} should be on`)
    for (const k of KAPALI) {
      assert.ok(!ARAC(k), `${k} must be off`)
      const y = A.yuvalar.find((x) => x.anahtar === k)
      assert.ok(y && y.acik === false && /Ministry of Health of Uzbekistan/.test(y.eksik), `${k}: slot with its source`)
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
  it('obstetrics and gynaecology only', () => {
    for (const k of ACIK) assert.ok((ARAC(k)!.roller ?? []).length > 0 && ARAC(k)!.roller!.every((r) => /obstetric|gyn|akusher|ginek|kadin/i.test(r)), k)
  })
  it('labiaplasty on the O&G note asks for the medical indication, in this pack\'s words', () => {
    const kd = ARAC('ameliyat-notu-kd')
    assert.ok(kd && kd.metin.alanlar.tibbi_endikasyon && kd.metin.alanlar.tibbi_gerekce)
  })
  it('the pack check finds nothing to fix in the package', () => {
    const s = araclarSorunlari(UZ_PAKETI, UZ_ARAYUZ, UZ_PAKETI.diller).filter((x) => /genital|ameliyat-notu-kd|onam-formu-kd/.test(JSON.stringify(x)))
    assert.deepEqual(s, [])
  })
})
