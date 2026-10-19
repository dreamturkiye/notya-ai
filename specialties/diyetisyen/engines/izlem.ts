import { isoMu } from '@/lib/klinik/isoGun'

export function gecKontrol(basIso: string): { hafta: number; ad: string } | { hata: string } {
  if (!isoMu(basIso)) return { hata: 'Başlangıç gününü girin.' }
  return { hafta: 12, ad: 'Geç kontrol' }
}
