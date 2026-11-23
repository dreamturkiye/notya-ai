/** ESNEK-MUAYENE-B — the Türkiye build's wiring for the shared Phase B components (routes + words; fetch = trGetir). */
import { ESNEK_TR } from '@/core/esnek/metinTr'

export { ESNEK_TR }
export const ESNEK_API = '/api/doktor/esnek'
export const GOLGE_API = '/api/doktor/el-notu/golge'
export const ESNEK_YOLLAR = {
  elNotlari: '/dashboard/doktor/el-notlari',
  inceleme: '/dashboard/doktor/inceleme',
  topluOnay: '/dashboard/doktor/toplu-onay',
  tanima: '/dashboard/doktor/ayarlar/el-notu#tanima',
}
