/** NOTYA-UZ-RANDEVU-01 — HTTP status of each code the appointment API answers with (app/api/ulke/randevu*). */
import type { RandevuRetKodu } from './randevular'

export const RANDEVU_DURUMU: Record<RandevuRetKodu, number> = {
  NOT_FOUND: 404,
  GECERSIZ: 400,
  // The time is taken: the request conflicts with another appointment. Never overridable.
  DOLU: 409,
  // Outside the working hours: nothing was written; the same request with `yineDe: true` books it.
  MESAI_DISI: 422,
  // The status cannot be changed that way (a cancelled or finished appointment).
  GECIS_YOK: 409,
  HAZIR_DEGIL: 503,
  BASARISIZ: 500,
}
