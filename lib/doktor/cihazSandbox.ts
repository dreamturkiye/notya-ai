/**
 * NOTYA-BLE-SANDBOX-01 — Ayarlar › Cihazlar (Bluetooth kurulum) yalnız Kaan + Dr. Gökhan Mamur.
 *
 * Ürün herkese açılana kadar bu kapı kapalı kalır. Sunucu yetkisiz çağrıya 403 döner;
 * arayüz gizleme kozmetiktir. Kimlik listesi SUPERUSER_BRANS_IDS ile aynı (doğrulanmış UUID'ler).
 */
import { SUPERUSER_BRANS_IDS } from '@/lib/auth/superuserBranslar'

export function cihazSandboxAcikMi(userId: string | null | undefined): boolean {
  if (!userId || typeof userId !== 'string') return false
  return SUPERUSER_BRANS_IDS.includes(userId.trim())
}
