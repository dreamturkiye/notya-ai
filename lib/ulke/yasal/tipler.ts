/**
 * NOTYA-ULKE-YASAL-01 — policy pages of a country build. Text is the country's; this file is the shape.
 * Every document is a draft for a lawyer. Nothing here is a statement that the service meets a statute.
 */
export const YASAL_ANAHTARLARI = ['privacy', 'terms', 'cookies', 'data-request', 'accessibility', 'medical', 'security', 'refund', 'copyright'] as const
export type YasalAnahtar = (typeof YASAL_ANAHTARLARI)[number]

/** Routes. The same path in every country build; the middleware lists each one. */
export const YASAL_YOLLAR: Readonly<Record<YasalAnahtar, string>> = {
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  'data-request': '/data-request',
  accessibility: '/accessibility',
  medical: '/medical-disclaimer',
  security: '/security',
  // HUKUK-01 (2026-10-17): refund/cancellation and copyright, added to match the Türkiye suite's document set.
  refund: '/refund',
  copyright: '/copyright',
}

export type YasalBelge = {
  anahtar: YasalAnahtar
  baslik: string
  /** First block on the page. Must say a lawyer has not read the text. */
  inceleme: string
  bolumler: readonly { baslik: string; paragraflar: readonly string[] }[]
}

export type YasalDilPaketi = {
  kod: string
  /** Name of this language, in itself, for the switch. */
  ad: string
  /** Link back to the landing page. */
  geri: string
  belgeler: readonly YasalBelge[]
}

export type YasalKapisi = {
  diller: readonly YasalDilPaketi[]
}
