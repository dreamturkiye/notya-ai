/**
 * Web Bluetooth adapter. Only runs in the browser, only on a user gesture (click), only over HTTPS.
 * Platform truth (verified 2026-09-15): Chrome/Edge on Android, Windows, macOS = native support.
 * Safari iOS/iPadOS = NO native support ("no plan"); only via the third-party iOSWebBLE Safari
 * extension (polyfills navigator.bluetooth) or a native wrapper. Firefox = none. We tell the user
 * plainly instead of failing silently.
 */
import type { BleYetenek, CihazBilgisi, NotyaOlcum } from './types'
import { GATT_PROFILLER, DEVICE_INFORMATION_SERVICE, DIS_CHARS, profilBul, type GattProfil } from './profiles'

type BluetoothDeviceLike = {
  name?: string | null
  gatt?: {
    connected: boolean
    connect: () => Promise<{ getPrimaryService: (uuid: number) => Promise<GattServiceLike> }>
    disconnect: () => void
  }
  addEventListener: (ev: string, cb: () => void) => void
}
type GattServiceLike = { getCharacteristic: (uuid: number) => Promise<GattCharLike> }
type GattCharLike = {
  readValue: () => Promise<DataView>
  startNotifications: () => Promise<GattCharLike>
  stopNotifications: () => Promise<GattCharLike>
  addEventListener: (ev: 'characteristicvaluechanged', cb: (e: { target: { value?: DataView } }) => void) => void
  removeEventListener: (ev: 'characteristicvaluechanged', cb: (e: { target: { value?: DataView } }) => void) => void
}
type NavigatorBle = { bluetooth?: { requestDevice: (opts: { filters: Array<{ services: number[] }>; optionalServices: number[] }) => Promise<BluetoothDeviceLike> } }

export function bleYetenek(): BleYetenek {
  if (typeof window === 'undefined') return { destekli: false, sebep: 'tarayici-desteklemiyor', mesaj: 'Sunucu tarafı.' }
  if (!window.isSecureContext) return { destekli: false, sebep: 'guvensiz-baglam', mesaj: 'Bluetooth yalnız HTTPS bağlantıda çalışır.' }
  const nav = navigator as unknown as NavigatorBle
  if (nav.bluetooth) return { destekli: true, sebep: 'ok', mesaj: '' }
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return { destekli: false, sebep: 'ios-safari', mesaj: 'iPhone/iPad Safari, Bluetooth cihaz bağlantısını desteklemiyor (Apple bu özelliği eklemiyor). Seçenekler: Android telefon/tablet veya bilgisayarda Chrome/Edge kullanın; ya da iPhone için "iOSWebBLE" Safari eklentisini kurun.' }
  if (/Firefox/.test(ua)) return { destekli: false, sebep: 'firefox', mesaj: 'Firefox Bluetooth cihaz bağlantısını desteklemiyor — Chrome veya Edge kullanın.' }
  return { destekli: false, sebep: 'tarayici-desteklemiyor', mesaj: 'Bu tarayıcı Bluetooth cihaz bağlantısını desteklemiyor — Chrome veya Edge kullanın.' }
}

async function cihazBilgisiOku(server: { getPrimaryService: (uuid: number) => Promise<GattServiceLike> }, ad: string | null): Promise<CihazBilgisi> {
  const bilgi: CihazBilgisi = { ad }
  try {
    const dis = await server.getPrimaryService(DEVICE_INFORMATION_SERVICE)
    const oku = async (uuid: number) => { try { const c = await dis.getCharacteristic(uuid); const v = await c.readValue(); return new TextDecoder().decode(v).replace(/\0+$/, '') } catch { return null } }
    bilgi.uretici = await oku(DIS_CHARS.manufacturer)
    bilgi.model = await oku(DIS_CHARS.model)
    bilgi.seriNo = await oku(DIS_CHARS.serial)
    bilgi.yazilim = await oku(DIS_CHARS.firmware)
  } catch { /* DIS yoksa sorun değil */ }
  return bilgi
}

export interface OlcumOturumu { cihaz: CihazBilgisi; profil: GattProfil; olcumler: NotyaOlcum[] }

/**
 * Kullanıcı bir cihaz seçer (tarayıcının kendi seçici penceresi), profil otomatik tanınır,
 * ilk ölçüm(ler) gelene kadar (veya zaman aşımına kadar) beklenir. Tek atımlık; arka plan yok.
 */
export async function bluetoothOlcumAl(opts: { profilIds?: string[]; zamanAsimiMs?: number } = {}): Promise<OlcumOturumu> {
  const nav = navigator as unknown as NavigatorBle
  if (!nav.bluetooth) throw new Error(bleYetenek().mesaj || 'Bluetooth desteklenmiyor.')
  const profiller = opts.profilIds?.length ? GATT_PROFILLER.filter((p) => opts.profilIds!.includes(p.id)) : GATT_PROFILLER
  const device = await nav.bluetooth.requestDevice({
    filters: profiller.map((p) => ({ services: [p.serviceUuid] })),
    optionalServices: [DEVICE_INFORMATION_SERVICE, ...profiller.map((p) => p.serviceUuid)],
  })
  if (!device.gatt) throw new Error('Cihaz GATT desteklemiyor.')
  const server = await device.gatt.connect()
  try {
    // hangi profil? — sırayla dene, ilk bulunan
    let profil: GattProfil | null = null, servis: GattServiceLike | null = null
    for (const p of profiller) {
      try { servis = await server.getPrimaryService(p.serviceUuid); profil = p; break } catch { /* sonraki */ }
    }
    if (!profil || !servis) throw new Error('Cihazda tanınan bir tıbbi ölçüm profili bulunamadı.')
    const cihaz = await cihazBilgisiOku(server, device.name ?? null)
    const ch = await servis.getCharacteristic(profil.characteristicUuid)

    const olcumler = await new Promise<NotyaOlcum[]>((resolve, reject) => {
      const zamanAsimi = setTimeout(() => { temizle(); reject(new Error('Cihazdan ölçüm gelmedi (zaman aşımı). Ölçümü cihazda tekrar başlatın.')) }, opts.zamanAsimiMs ?? 60_000)
      const dinle = (e: { target: { value?: DataView } }) => {
        const v = e.target.value; if (!v) return
        const sonuc = profil!.parse(v, cihaz)
        if (sonuc.length) { temizle(); resolve(sonuc) }
      }
      const temizle = () => { clearTimeout(zamanAsimi); try { ch.removeEventListener('characteristicvaluechanged', dinle); ch.stopNotifications().catch(() => {}) } catch { /* yok */ } }
      ch.addEventListener('characteristicvaluechanged', dinle)
      ch.startNotifications().catch((err: unknown) => { temizle(); reject(err instanceof Error ? err : new Error('Bildirim başlatılamadı.')) })
    })
    return { cihaz, profil, olcumler }
  } finally {
    try { device.gatt.disconnect() } catch { /* zaten kapalı */ }
  }
}

export { GATT_PROFILLER, profilBul }
