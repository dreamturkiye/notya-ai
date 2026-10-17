/**
 * FOTO-ARSIV-01 — shared response helpers of app/api/doktor/hasta-foto/**. Every answer is `private, no-store`; an id that is
 * not a UUID is answered exactly like a missing one (404), so a guessed or malformed id leaks nothing.
 */
import { NextResponse } from 'next/server'
import { TabloYokHatasi } from './sunucu'
import { uuidMi } from './meta'

export const NO_STORE = { 'Cache-Control': 'private, no-store' } as const

export const yanit = (govde: unknown, status = 200): NextResponse => NextResponse.json(govde, { status, headers: NO_STORE })
export const bulunamadi = (): NextResponse => yanit({ error: 'Bulunamadı.' }, 404)
export const kapaliYaniti = (): NextResponse => yanit({ error: 'Kapalı.' }, 404)
export const gecersiz = (mesaj: string): NextResponse => yanit({ error: mesaj }, 400)

export const idlerGecerli = (...ids: unknown[]): boolean => ids.every((x) => uuidMi(x))

/** TabloYokHatasi (migration 174 not applied yet) -> 503 with a plain message; anything else -> 500 without detail. */
export function hataYaniti(e: unknown): NextResponse {
  if (e instanceof TabloYokHatasi) return yanit({ error: e.message, durum: 'etkin-degil' }, 503)
  return yanit({ error: 'İşlem tamamlanamadı.' }, 500)
}

export async function jsonGovde(req: Request, azamiBayt = 4_000_000): Promise<unknown | null> {
  const uzunluk = Number(req.headers.get('content-length') || 0)
  if (uzunluk > azamiBayt) return null
  try { return await req.json() } catch { return null }
}
