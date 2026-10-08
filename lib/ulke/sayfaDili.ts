/**
 * NOTYA-ULKE-01 — language of a core country page, from its address (?dil=ru), narrowed to a switched-on language of
 * the active country, and the links that keep it. The default language needs no parameter.
 */
import { dilSec, ulkePaketi } from './ulke'
import type { DilKodu } from './tipler'

export type AramaParametreleri = Record<string, string | string[] | undefined> | undefined

export function sayfaDili(searchParams: AramaParametreleri): DilKodu {
  const ham = searchParams?.dil
  return dilSec(Array.isArray(ham) ? ham[0] : ham)
}

export function dilliYol(yol: string, dil: DilKodu, capa = ''): string {
  return `${yol}${dil === ulkePaketi().varsayilanDil ? '' : `?dil=${dil}`}${capa}`
}

/** One entry per switched-on language that has a name, for a language switch on `yol`. */
export function dilSecenekleri(yol: string): { kod: DilKodu; ad: string; href: string }[] {
  const p = ulkePaketi()
  return p.acikDiller.flatMap((kod) => {
    const ad = p.dilAdlari[kod]
    return ad ? [{ kod, ad, href: dilliYol(yol, kod) }] : []
  })
}
