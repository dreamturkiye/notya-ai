/**
 * Public legal and medical pages of a country build.
 *
 * The signed-in application stays out of search engines. These paths are the pages a reviewer
 * can open without an account: the landing pages, the policy drafts, and the medical catalogue.
 * The patient's page is not in this list.
 */
import type { Metadata } from 'next'
import type { DilKodu } from './tipler'
import { YASAL_YOLLAR } from './yasal/tipler'

export const ACIK_ICERIK_YOLLARI = [
  '/',
  '/for-clinics',
  '/medical',
  ...Object.values(YASAL_YOLLAR),
] as const

export function icerikHerkezeAcikMi(pathname: string): boolean {
  const y = pathname.split('?')[0].split('#')[0]
  const yol = y.length > 1 && y.endsWith('/') ? y.slice(0, -1) : y || '/'
  return (ACIK_ICERIK_YOLLARI as readonly string[]).includes(yol)
}

/**
 * robots.txt while the rest of the build stays closed: the public pages are allowed,
 * and every other path is disallowed.
 */
export function robotsAcikMetni(): string {
  const satirlar = ['User-agent: *']
  for (const yol of ACIK_ICERIK_YOLLARI) satirlar.push(yol === '/' ? 'Allow: /$' : `Allow: ${yol}`)
  satirlar.push('Disallow: /')
  return `${satirlar.join('\n')}\n`
}

/** Replaces the layout's noindex on a public page. A shallow metadata merge keeps a parent googleBot unless it is set here. */
export const ACIK_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  nocache: false,
  googleBot: { index: true, follow: true },
}

const BETA: Partial<Record<DilKodu, string>> = {
  'en-GB': 'Beta, under review',
  'en-US': 'Beta, under review',
  'en-CA': 'Beta, under review',
  'en-AU': 'Beta, under review',
  'en-NZ': 'Beta, under review',
  'uz-Latn': 'Beta, koʻrib chiqilmoqda',
  'uz-Cyrl': 'Бета, кўриб чиқилмоқда',
  ru: 'Бета, на проверке',
}

/** The short status line the owner asked to show in place of hiding a draft. */
export function betaNotu(dil: string): string {
  return BETA[dil as DilKodu] ?? 'Beta, under review'
}
