/**
 * Klinik yüzü — clinic_members yokken de açılabilir (aynı hesap, Doktor girişi).
 * Kapı: NOTYA-SUPERUSER-BRANS-01 listesi (Kaan + Dr. Gökhan). Genel ürün özelliği değil.
 */
import { bransDegistirebilir } from '@/lib/auth/superuserBranslar'

export function klinikYuzuAcikMi(userId: string | null | undefined): boolean {
  return bransDegistirebilir(userId)
}
