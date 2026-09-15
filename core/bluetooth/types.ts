/**
 * NOTYA-BLE-01 (Kaan 2026-09-15) — core/bluetooth: universal BLE medical-device layer.
 * Specialty-agnostic (core/, not specialties/). A device is "universal" if it speaks a standard
 * Bluetooth SIG GATT medical profile; each profile has ONE generic parser here. Proprietary
 * devices (Eko/Littmann stethoscopes, KardiaMobile) are NOT reachable from a browser — they get
 * a vendor-adapter slot (`kaynak: 'vendor'`) but no fake implementation.
 *
 * Binary encodings follow IEEE 11073-20601 (SFLOAT/FLOAT) exactly — tested in parsers.test.ts.
 */

export type OlcumTuru = 'ates' | 'tansiyon' | 'nabiz' | 'spo2' | 'kilo' | 'glukoz'

export interface CihazBilgisi {
  ad: string | null
  uretici?: string | null
  model?: string | null
  seriNo?: string | null
  yazilim?: string | null
}

export interface NotyaOlcum {
  tur: OlcumTuru
  /** vitaller alanına yazılacak, ekranda gösterilecek değer ("37.2", "120/80", "98") */
  deger: string
  birim: string
  /** yapılandırılmış ham değerler (tansiyon için sistolik/diastolik/nabız gibi) */
  ayrinti: Record<string, number | string | null>
  olcumZamani: string | null           // cihaz zaman damgası varsa (ISO), yoksa null
  cihaz: CihazBilgisi
  hamHex: string                        // audit: karakteristik değerinin ham baytları
  profil: string                        // GATT service adı
  kaynak: 'ble' | 'vendor' | 'manuel'
}

/** Tarayıcı/platform yetenek durumu — iOS Safari'de dürüst mesaj için. */
export interface BleYetenek {
  destekli: boolean
  sebep: 'ok' | 'ios-safari' | 'firefox' | 'guvensiz-baglam' | 'tarayici-desteklemiyor'
  mesaj: string
}
