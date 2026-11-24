/**
 * ESNEK-A-EVAL (2026-11-24) — short-lived, single-purpose evaluation pass for a founder-only admin route, so a measurement
 * run never needs anyone to read an existing secret (CRON_SECRET, a model key). The caller sends the plaintext token in
 * `x-degerlendirme-anahtari`; only its SHA-256 lives in `degerlendirme_anahtarlari` (migration 204: RLS on, service role
 * only, ≤ 2 h, one purpose, revocable). The token is never logged or echoed.
 *
 *   'yok'      no header → the route's other admin paths decide (founder session / cron secret, unchanged)
 *   'tamam'    hash matches a row for this purpose that is not revoked and not expired
 *   'gecersiz' header present but unknown, revoked, expired, wrong purpose or malformed → refused (403)
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const DEGERLENDIRME_BASLIGI = 'x-degerlendirme-anahtari'
export type DegerlendirmeAmaci = 'el-notu-degerlendir'
export type AnahtarSonucu = 'yok' | 'tamam' | 'gecersiz'
type Satir = { amac?: unknown; son_kullanma?: unknown; iptal?: unknown }

export const anahtarOzeti = (anahtar: string) => createHash('sha256').update(anahtar, 'utf8').digest('hex')

/** Pure decision on the stored row (null = no row for this hash). */
export function anahtarKarari(satir: Satir | null, amac: DegerlendirmeAmaci, simdi: number = Date.now()): Exclude<AnahtarSonucu, 'yok'> {
  if (!satir || satir.iptal !== false || satir.amac !== amac) return 'gecersiz'
  const son = Date.parse(String(satir.son_kullanma ?? ''))
  return Number.isFinite(son) && son > simdi ? 'tamam' : 'gecersiz'
}

export async function degerlendirmeAnahtari(req: Request, supabase: SupabaseClient, amac: DegerlendirmeAmaci, simdi: number = Date.now()): Promise<AnahtarSonucu> {
  const ham = req.headers.get(DEGERLENDIRME_BASLIGI)
  if (ham == null) return 'yok'
  const anahtar = ham.trim()
  // a crypto-random token: 32–128 url-safe chars; anything else is refused without a lookup
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(anahtar)) return 'gecersiz'
  const { data, error } = await supabase.from('degerlendirme_anahtarlari').select('amac, son_kullanma, iptal').eq('anahtar_ozeti', anahtarOzeti(anahtar)).limit(1)
  if (error || !Array.isArray(data)) return 'gecersiz'
  return anahtarKarari((data[0] as Satir | undefined) ?? null, amac, simdi)
}
