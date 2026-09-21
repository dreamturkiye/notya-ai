/**
 * New public site + app chrome. Never on production until Boss says ship.
 * Preview / localhost only. Accidental merge to main still 404s.
 */
export const SITE_V2_KOK = '/site-v2'

const PROD_HOST = /^(www\.)?notya\.ai$|^notya-ai\.vercel\.app$/i

export function siteV2AcikMi(env: {
  VERCEL_ENV?: string
  VERCEL_URL?: string
  NODE_ENV?: string
  SITE_V2?: string
} = process.env): boolean {
  if (env.SITE_V2 === '0') return false
  if (env.VERCEL_ENV === 'production') return false
  if (env.VERCEL_URL && PROD_HOST.test(env.VERCEL_URL)) return false
  if (env.NODE_ENV === 'development') return true
  if (env.VERCEL_ENV === 'preview') return true
  if (!env.VERCEL_ENV && env.NODE_ENV !== 'production') return true
  return false
}

export function siteV2Yol(path = ''): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (p === '/') return SITE_V2_KOK
  return `${SITE_V2_KOK}${p}`
}
