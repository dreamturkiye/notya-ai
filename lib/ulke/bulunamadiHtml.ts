/**
 * NOTYA-ULKE-01x — the pack's not-found page, as HTML the middleware can return for an address the pack does not
 * list. The requested path is not read and not written: a page that repeats the address would echo it.
 *
 * /api stays JSON. This page is for everything else. The security headers and noindex are set by the middleware.
 */
import { yuzeyMetinleri } from './metin'
import { ulkeYolu } from './yol'

const kac = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function bulunamadiHtml(): string {
  const m = yuzeyMetinleri('sistem')
  const baslik = kac(m.bulunamadiBaslik)
  const govde = kac(m.bulunamadiGovde)
  const ana = kac(m.anaSayfa)
  const href = kac(ulkeYolu('/'))
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>${baslik}</title></head><body><h1>${baslik}</h1><p>${govde}</p><p><a href="${href}">${ana}</a></p></body></html>`
}
