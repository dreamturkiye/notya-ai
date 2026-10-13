/**
 * NOTYA-UZ-MUAYENE-01 — answers of the signed-in application's API (app/api/ulke/*).
 * Machine codes only, never a sentence: the caller shows text in the account's own language, from its pack.
 * Never cached: every answer is about one account.
 */
import { NextResponse } from 'next/server'

export const cevap = (govde: Record<string, unknown>, status = 200) =>
  NextResponse.json(govde, { status, headers: { 'Cache-Control': 'no-store' } })

export const KOD = {
  /** Feature off in this country, or an id that is not the caller's: indistinguishable from "does not exist". */
  yok: () => cevap({ code: 'NOT_FOUND' }, 404),
  oturumYok: () => cevap({ code: 'OTURUM_YOK' }, 401),
  gecersiz: (alan?: string) => cevap({ code: 'GECERSIZ', ...(alan ? { alan } : {}) }, 400),
  basarisiz: () => cevap({ code: 'BASARISIZ' }, 500),
} as const

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const uuidMi = (ham: unknown): ham is string => typeof ham === 'string' && UUID.test(ham)

export async function govdeOku(req: Request): Promise<Record<string, unknown>> {
  const g = (await req.json().catch(() => null)) as unknown
  return g && typeof g === 'object' && !Array.isArray(g) ? (g as Record<string, unknown>) : {}
}

/** Trimmed text of a body field, or '' — and never longer than `azami`. */
export const metinAlani = (ham: unknown, azami: number): string => (typeof ham === 'string' ? ham.trim().slice(0, azami) : '')
