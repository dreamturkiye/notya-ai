/** NOTYA-UZ-MUAYENE-01 — HTTP status of each code the note API answers with (app/api/ulke/not/*). */
import type { NotRetKodu } from './notlar'

export const NOT_DURUMU: Record<NotRetKodu, number> = {
  NOT_FOUND: 404,
  // An approved note is never changed: the request conflicts with the state of the note.
  ONAYLI: 409,
  GECERSIZ: 400,
  BOS: 400,
  NOT_YAZILAMADI: 502,
  YENIDEN_YAZILAMADI: 502,
  HAZIR_DEGIL: 503,
  BASARISIZ: 500,
}
