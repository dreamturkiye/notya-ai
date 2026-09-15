/**
 * Standard Bluetooth SIG medical GATT profiles → NotyaOlcum.
 * Kaynak: Bluetooth SIG GATT Specification Supplement / profile specs:
 *  - Health Thermometer Service 0x1809, Temperature Measurement 0x2A1C (indicate)
 *  - Blood Pressure Service 0x1810, Blood Pressure Measurement 0x2A35 (indicate)
 *  - Pulse Oximeter Service 0x1822, PLX Spot-Check Measurement 0x2A5E (indicate)
 *  - Weight Scale Service 0x181D, Weight Measurement 0x2A9D (indicate)
 *  - Heart Rate Service 0x180D, Heart Rate Measurement 0x2A37 (notify)
 *  - Glucose Service 0x1808, Glucose Measurement 0x2A18 (notify)
 *  - Device Information Service 0x180A (manufacturer/model/serial — provenance)
 * Bayt düzenleri her spec'in "Flags" alanına göre çözülür; test edildi (profiles.test.ts).
 */
import type { NotyaOlcum, CihazBilgisi, OlcumTuru } from './types'
import { sfloatOku, floatOku, tarihZamanOku, hex, yuvarla } from './parsers'

export interface GattProfil {
  id: string
  ad: string
  serviceUuid: number
  characteristicUuid: number
  /** notify vs indicate — Web Bluetooth'ta ikisi de startNotifications ile alınır */
  turler: OlcumTuru[]
  parse: (dv: DataView, cihaz: CihazBilgisi) => NotyaOlcum[]
}

const ortak = (profil: string, dv: DataView, cihaz: CihazBilgisi) => ({ cihaz, hamHex: hex(dv), profil, kaynak: 'ble' as const })

/** 0x2A1C Temperature Measurement: flags u8 [bit0: 0=°C 1=°F, bit1: timestamp, bit2: type], FLOAT, [DateTime], [type u8] */
function atesParse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  const fahrenheit = (flags & 0x01) !== 0
  let v = floatOku(dv, 1)
  if (v === null) return []
  if (fahrenheit) v = (v - 32) * 5 / 9
  const zaman = (flags & 0x02) ? tarihZamanOku(dv, 5) : null
  const deger = yuvarla(v, 1)
  return [{ tur: 'ates', deger: deger.toFixed(1), birim: '°C', ayrinti: { santigrat: deger, kaynakBirim: fahrenheit ? 'F' : 'C' }, olcumZamani: zaman, ...ortak('Health Thermometer', dv, cihaz) }]
}

/** 0x2A35 Blood Pressure Measurement: flags u8 [bit0: 0=mmHg 1=kPa, bit1: timestamp, bit2: pulse rate, bit3: user id, bit4: status], SFLOAT×3 (sys, dia, MAP), [DateTime], [SFLOAT pulse] */
function tansiyonParse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  const kPa = (flags & 0x01) !== 0
  let sis = sfloatOku(dv, 1), dia = sfloatOku(dv, 3)
  if (sis === null || dia === null) return []
  if (kPa) { sis = sis * 7.50062; dia = dia * 7.50062 }
  let off = 7
  let zaman: string | null = null
  if (flags & 0x02) { zaman = tarihZamanOku(dv, off); off += 7 }
  let nabiz: number | null = null
  if (flags & 0x04) { nabiz = sfloatOku(dv, off); off += 2 }
  const s = Math.round(sis), d = Math.round(dia)
  const cikti: NotyaOlcum[] = [{ tur: 'tansiyon', deger: `${s}/${d}`, birim: 'mmHg', ayrinti: { sistolik: s, diastolik: d, kaynakBirim: kPa ? 'kPa' : 'mmHg' }, olcumZamani: zaman, ...ortak('Blood Pressure', dv, cihaz) }]
  if (nabiz !== null) cikti.push({ tur: 'nabiz', deger: String(Math.round(nabiz)), birim: '/dk', ayrinti: { nabiz: Math.round(nabiz) }, olcumZamani: zaman, ...ortak('Blood Pressure', dv, cihaz) })
  return cikti
}

/** 0x2A5E PLX Spot-Check: flags u8 [bit0: timestamp, bit1: measurement status, bit2: sensor status, bit3: pulse amplitude], SFLOAT SpO2, SFLOAT PR, [DateTime]... */
function spo2Parse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  const spo2 = sfloatOku(dv, 1), pr = sfloatOku(dv, 3)
  if (spo2 === null) return []
  const zaman = (flags & 0x01) ? tarihZamanOku(dv, 5) : null
  const cikti: NotyaOlcum[] = [{ tur: 'spo2', deger: String(Math.round(spo2)), birim: '%', ayrinti: { spo2: Math.round(spo2) }, olcumZamani: zaman, ...ortak('Pulse Oximeter', dv, cihaz) }]
  if (pr !== null) cikti.push({ tur: 'nabiz', deger: String(Math.round(pr)), birim: '/dk', ayrinti: { nabiz: Math.round(pr) }, olcumZamani: zaman, ...ortak('Pulse Oximeter', dv, cihaz) })
  return cikti
}

/** 0x2A9D Weight Measurement: flags u8 [bit0: 0=SI(kg, res 0.005) 1=imperial(lb, res 0.01), bit1: timestamp, bit2: user id, bit3: BMI+height], u16 weight */
function kiloParse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  const imperial = (flags & 0x01) !== 0
  const ham = dv.getUint16(1, true)
  if (ham === 0xffff) return []
  const kg = imperial ? ham * 0.01 * 0.45359237 : ham * 0.005
  const zaman = (flags & 0x02) ? tarihZamanOku(dv, 3) : null
  const deger = yuvarla(kg, 1)
  return [{ tur: 'kilo', deger: deger.toFixed(1), birim: 'kg', ayrinti: { kg: deger, kaynakBirim: imperial ? 'lb' : 'kg' }, olcumZamani: zaman, ...ortak('Weight Scale', dv, cihaz) }]
}

/** 0x2A37 Heart Rate Measurement: flags u8 [bit0: 0=u8 1=u16 value], u8|u16 bpm */
function nabizParse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  const bpm = (flags & 0x01) ? dv.getUint16(1, true) : dv.getUint8(1)
  if (!bpm) return []
  return [{ tur: 'nabiz', deger: String(bpm), birim: '/dk', ayrinti: { nabiz: bpm }, olcumZamani: null, ...ortak('Heart Rate', dv, cihaz) }]
}

/** 0x2A18 Glucose Measurement: flags u8 [bit0: time offset, bit1: conc+type+location, bit2: 0=kg/L 1=mol/L, bit3: status], u16 seq, DateTime(7), [i16 offset], [SFLOAT conc], [u8 type/location] */
function glukozParse(dv: DataView, cihaz: CihazBilgisi): NotyaOlcum[] {
  const flags = dv.getUint8(0)
  let off = 3
  const zaman = tarihZamanOku(dv, off); off += 7
  if (flags & 0x01) off += 2
  if (!(flags & 0x02)) return []
  const conc = sfloatOku(dv, off)
  if (conc === null) return []
  // kg/L → mg/dL: ×100000; mol/L → mg/dL: ×18016 (glukoz MW 180.16)
  const mgdl = (flags & 0x04) ? conc * 18016 : conc * 100000
  const deger = Math.round(mgdl)
  return [{ tur: 'glukoz', deger: String(deger), birim: 'mg/dL', ayrinti: { mgdl: deger, kaynakBirim: (flags & 0x04) ? 'mol/L' : 'kg/L' }, olcumZamani: zaman, ...ortak('Glucose', dv, cihaz) }]
}

export const GATT_PROFILLER: GattProfil[] = [
  { id: 'hts', ad: 'Ateş ölçer (Health Thermometer)', serviceUuid: 0x1809, characteristicUuid: 0x2a1c, turler: ['ates'], parse: atesParse },
  { id: 'bls', ad: 'Tansiyon aleti (Blood Pressure)', serviceUuid: 0x1810, characteristicUuid: 0x2a35, turler: ['tansiyon', 'nabiz'], parse: tansiyonParse },
  { id: 'plx', ad: 'Pulse oksimetre (Pulse Oximeter)', serviceUuid: 0x1822, characteristicUuid: 0x2a5e, turler: ['spo2', 'nabiz'], parse: spo2Parse },
  { id: 'wss', ad: 'Tartı (Weight Scale)', serviceUuid: 0x181d, characteristicUuid: 0x2a9d, turler: ['kilo'], parse: kiloParse },
  { id: 'hrs', ad: 'Nabız (Heart Rate)', serviceUuid: 0x180d, characteristicUuid: 0x2a37, turler: ['nabiz'], parse: nabizParse },
  { id: 'gls', ad: 'Glukometre (Glucose)', serviceUuid: 0x1808, characteristicUuid: 0x2a18, turler: ['glukoz'], parse: glukozParse },
]

export const DEVICE_INFORMATION_SERVICE = 0x180a
export const DIS_CHARS = { manufacturer: 0x2a29, model: 0x2a24, serial: 0x2a25, firmware: 0x2a26 } as const

export function profilBul(serviceUuid: number): GattProfil | undefined {
  return GATT_PROFILLER.find((p) => p.serviceUuid === serviceUuid)
}
