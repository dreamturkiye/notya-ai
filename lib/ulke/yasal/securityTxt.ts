/**
 * NOTYA-ULKE-YASAL-01 — RFC 9116 security.txt for a country build.
 * Served by middleware.ulke.ts at /.well-known/security.txt (Next strips a basePath first).
 */
import { YASAL_EPOSTA } from './eposta'

export function securityTxt(): string {
  return [
    `Contact: mailto:${YASAL_EPOSTA.security}`,
    'Expires: 2027-10-13T00:00:00.000Z',
    'Preferred-Languages: en, uz, ru',
    '',
  ].join('\n')
}
