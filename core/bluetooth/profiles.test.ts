import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sfloatOku, floatOku, tarihZamanOku } from './parsers'
import { GATT_PROFILLER, profilBul } from './profiles'

const dv = (bytes: number[]) => new DataView(new Uint8Array(bytes).buffer)
const cihaz = { ad: 'Test' }

describe('IEEE 11073-20601 decoders', () => {
  it('SFLOAT: exp -1, mantissa 372 → 37.2', () => {
    // 0xF174: exponent nibble 0xF = -1, mantissa 0x174 = 372 → little-endian 74 F1
    assert.equal(sfloatOku(dv([0x74, 0xf1]), 0), 37.2)
  })
  it('SFLOAT: negative mantissa (0xFFB = -5)', () => {
    assert.equal(sfloatOku(dv([0xfb, 0x0f]), 0), -5)
  })
  it('SFLOAT: NaN / NRes / ±INF codes → null', () => {
    assert.equal(sfloatOku(dv([0xff, 0x07]), 0), null)
    assert.equal(sfloatOku(dv([0x00, 0x08]), 0), null)
    assert.equal(sfloatOku(dv([0xfe, 0x07]), 0), null)
    assert.equal(sfloatOku(dv([0x02, 0x08]), 0), null)
  })
  it('FLOAT: exp -1, mantissa 372 → 37.2', () => {
    // exponent byte 0xFF = -1, mantissa 0x000174 → little-endian 74 01 00 FF
    assert.equal(floatOku(dv([0x74, 0x01, 0x00, 0xff]), 0), 37.2)
  })
  it('FLOAT: NaN code → null', () => {
    assert.equal(floatOku(dv([0xff, 0xff, 0x7f, 0x00]), 0), null)
  })
  it('DateTime (7 bytes) decodes', () => {
    const iso = tarihZamanOku(dv([0xea, 0x07, 9, 15, 10, 30, 0]), 0) // 2026-09-15 10:30:00
    assert.ok(iso && iso.startsWith('2026-09-15'))
    assert.equal(tarihZamanOku(dv([0, 0, 0, 0, 0, 0, 0]), 0), null)
    assert.equal(tarihZamanOku(dv([0xea, 0x07, 9]), 0), null) // short buffer
  })
})

describe('Bluetooth SIG medical GATT profiles', () => {
  it('Health Thermometer 0x2A1C: FLOAT °C, no timestamp → ates 37.2 °C', () => {
    const [o] = profilBul(0x1809)!.parse(dv([0x00, 0x74, 0x01, 0x00, 0xff]), cihaz)
    assert.equal(o.tur, 'ates'); assert.equal(o.deger, '37.2'); assert.equal(o.birim, '°C')
    assert.equal(o.olcumZamani, null); assert.equal(o.kaynak, 'ble'); assert.equal(o.hamHex, '00740100ff')
  })
  it('Health Thermometer: °F converts to °C (98.6 → 37.0)', () => {
    // 98.6°F = mantissa 986 (0x3DA), exp -1 → bytes DA 03 00 FF, flags bit0 = 1
    const [o] = profilBul(0x1809)!.parse(dv([0x01, 0xda, 0x03, 0x00, 0xff]), cihaz)
    assert.equal(o.deger, '37.0'); assert.equal(o.ayrinti.kaynakBirim, 'F')
  })
  it('Health Thermometer: timestamp flag reads DateTime after FLOAT', () => {
    const [o] = profilBul(0x1809)!.parse(dv([0x02, 0x74, 0x01, 0x00, 0xff, 0xea, 0x07, 9, 15, 10, 30, 0]), cihaz)
    assert.ok(o.olcumZamani && o.olcumZamani.startsWith('2026-09-15'))
  })
  it('Blood Pressure 0x2A35: mmHg + pulse flag → tansiyon 120/80 + nabiz 72', () => {
    // flags 0x04 (pulse present); sys 120, dia 80, MAP 93, pulse 72 — all SFLOAT exp 0
    const out = profilBul(0x1810)!.parse(dv([0x04, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, 0x48, 0x00]), cihaz)
    assert.equal(out.length, 2)
    assert.equal(out[0].tur, 'tansiyon'); assert.equal(out[0].deger, '120/80'); assert.equal(out[0].birim, 'mmHg')
    assert.equal(out[1].tur, 'nabiz'); assert.equal(out[1].deger, '72')
  })
  it('Blood Pressure: timestamp + pulse — offsets advance correctly', () => {
    const out = profilBul(0x1810)!.parse(dv([0x06, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, 0xea, 0x07, 9, 15, 10, 30, 0, 0x48, 0x00]), cihaz)
    assert.equal(out[0].deger, '120/80'); assert.ok(out[0].olcumZamani?.startsWith('2026-09-15')); assert.equal(out[1].deger, '72')
  })
  it('Blood Pressure: kPa converts to mmHg (16.0/10.7 kPa ≈ 120/80)', () => {
    // 16.0 kPa = mantissa 160 exp -1 → 0xF0A0 → A0 F0 ; 10.7 = mantissa 107 exp -1 → 0xF06B → 6B F0 ; MAP any
    const out = profilBul(0x1810)!.parse(dv([0x01, 0xa0, 0xf0, 0x6b, 0xf0, 0x00, 0x00]), cihaz)
    assert.equal(out[0].deger, '120/80'); assert.equal(out[0].ayrinti.kaynakBirim, 'kPa')
  })
  it('Pulse Oximeter 0x2A5E spot-check → spo2 98 + nabiz 70', () => {
    const out = profilBul(0x1822)!.parse(dv([0x00, 0x62, 0x00, 0x46, 0x00]), cihaz)
    assert.equal(out[0].tur, 'spo2'); assert.equal(out[0].deger, '98'); assert.equal(out[0].birim, '%')
    assert.equal(out[1].tur, 'nabiz'); assert.equal(out[1].deger, '70')
  })
  it('Weight Scale 0x2A9D: SI resolution 0.005 kg → 71.4', () => {
    // 71.4 / 0.005 = 14280 = 0x37C8 → C8 37
    const [o] = profilBul(0x181d)!.parse(dv([0x00, 0xc8, 0x37]), cihaz)
    assert.equal(o.tur, 'kilo'); assert.equal(o.deger, '71.4'); assert.equal(o.birim, 'kg')
  })
  it('Weight Scale: imperial lb converts to kg (157.4 lb → 71.4)', () => {
    // 157.4 / 0.01 = 15740 = 0x3D7C → 7C 3D, flags bit0 = 1
    const [o] = profilBul(0x181d)!.parse(dv([0x01, 0x7c, 0x3d]), cihaz)
    assert.equal(o.deger, '71.4')
  })
  it('Weight Scale: 0xFFFF (measurement unsuccessful) → no reading', () => {
    assert.equal(profilBul(0x181d)!.parse(dv([0x00, 0xff, 0xff]), cihaz).length, 0)
  })
  it('Heart Rate 0x2A37: u8 and u16 values', () => {
    assert.equal(profilBul(0x180d)!.parse(dv([0x00, 0x48]), cihaz)[0].deger, '72')
    assert.equal(profilBul(0x180d)!.parse(dv([0x01, 0x2c, 0x01]), cihaz)[0].deger, '300')
  })
  it('Glucose 0x2A18: kg/L concentration → mg/dL', () => {
    // flags 0x02 (conc present, kg/L); seq 1; DateTime 2026-09-15 10:30; conc 0.00095 kg/L = 95 mg/dL → mantissa 95 exp -5 → 0xB05F → 5F B0
    const [o] = profilBul(0x1808)!.parse(dv([0x02, 0x01, 0x00, 0xea, 0x07, 9, 15, 10, 30, 0, 0x5f, 0xb0, 0x11]), cihaz)
    assert.equal(o.tur, 'glukoz'); assert.equal(o.deger, '95'); assert.equal(o.birim, 'mg/dL')
    assert.ok(o.olcumZamani?.startsWith('2026-09-15'))
  })
  it('Glucose: mol/L → mg/dL (5.5 mmol/L ≈ 99 mg/dL)', () => {
    // flags 0x06 (conc, mol/L); 0.0055 mol/L → mantissa 55 exp -4 → 0xC037 → 37 C0
    const [o] = profilBul(0x1808)!.parse(dv([0x06, 0x01, 0x00, 0xea, 0x07, 9, 15, 10, 30, 0, 0x37, 0xc0, 0x11]), cihaz)
    assert.equal(o.deger, '99')
  })
  it('registry: 6 profiles, unique service UUIDs, each carries raw hex', () => {
    assert.equal(GATT_PROFILLER.length, 6)
    assert.equal(new Set(GATT_PROFILLER.map((p) => p.serviceUuid)).size, 6)
    for (const p of GATT_PROFILLER) assert.ok(p.serviceUuid > 0 && p.characteristicUuid > 0 && p.turler.length > 0)
  })
})
