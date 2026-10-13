/**
 * The calendar asks the active pack for its public days. No country code is compared here.
 */
import { ulkePaketi } from '../ulke'
import type { ResmiGun, ResmiGunKaynagi } from './tipler'

export function resmiGunKaynagi(): ResmiGunKaynagi | null {
  return ulkePaketi().resmiGunler ?? null
}

/** A region code the pack lists, or the pack's own default. null = this pack lists no public days. */
export function bolgeSec(ham: string | null | undefined): string | null {
  const k = resmiGunKaynagi()
  if (!k) return null
  const istenen = String(ham ?? '').trim()
  return k.bolgeler.some((b) => b.kod === istenen) ? istenen : k.varsayilan
}

const onbellek = new Map<string, Map<string, ResmiGun>>()

/** The public day on `gun` (YYYY-MM-DD) for the region, or null. Two names on one date are joined. */
export function gununTatili(gun: string, bolge?: string | null): ResmiGun | null {
  const k = resmiGunKaynagi()
  if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return null
  const b = bolgeSec(bolge)
  if (!b) return null
  const yil = gun.slice(0, 4)
  const anahtar = `${b}|${yil}`
  let harita = onbellek.get(anahtar)
  if (!harita) {
    harita = new Map()
    for (const g of k.gunler(b, `${yil}-01-01`, `${yil}-12-31`)) {
      const once = harita.get(g.tarih)
      if (!once) harita.set(g.tarih, g)
      else harita.set(g.tarih, { tarih: g.tarih, ad: `${once.ad} · ${g.ad}`, yarim: Boolean(once.yarim && g.yarim), inceleme: Boolean(once.inceleme || g.inceleme) })
    }
    onbellek.set(anahtar, harita)
  }
  return harita.get(gun) ?? null
}
