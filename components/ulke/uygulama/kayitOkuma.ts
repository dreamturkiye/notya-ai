/**
 * ULKE-BRANS-DERINLIK-09 — ONE READ of a patient's kept tool results for the whole patient file. The "Tools" card and the
 * specialty tab both need the list; they share the request in flight (and its answer for a few seconds), so the file makes
 * one round trip, not two (performans-butcesi-koruma, check 2). Client-side; bound to the patient id the file shows.
 */
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import type { Api } from './Kabuk'

/** How long a finished answer is reused, in ms (a doctor who keeps a new result reloads the file). */
export const KAYIT_OKUMA_OMRU_MS = 5_000
const bellek = new Map<string, { an: number; vaat: Promise<AracKaydi[] | null> }>()

/** The patient's kept results, or null when they could not be read. */
export function hastaKayitlariniOku(api: Api, hastaId: string, simdi = Date.now()): Promise<AracKaydi[] | null> {
  const eski = bellek.get(hastaId)
  if (eski && simdi - eski.an < KAYIT_OKUMA_OMRU_MS) return eski.vaat
  const vaat = api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`)
    .then((r) => (r.ok && Array.isArray(r.j.kayitlar) ? (r.j.kayitlar as AracKaydi[]) : null))
    .catch(() => null)
  bellek.set(hastaId, { an: simdi, vaat })
  return vaat
}

/** Forget the answers (a test, or after a result was kept). */
export const kayitOkumaSifirla = (): void => { bellek.clear() }
