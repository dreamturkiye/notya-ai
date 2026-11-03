/**
 * NOTYA-ULKE-DEMO-01 — "Book a demo": the active pack's words (countries/active/demo) and the deployment's link
 * (./baglanti). The page is components/ulke/demo/; the route app/demo/page.ulke.tsx.
 *
 * The page exists when the landing page is on, the pack lists /demo among its routes and brings words for it.
 * The landing button links to that page whenever the page exists. The booking link only decides what /demo shows:
 * a calendar when it is set, and "booking opens soon" when it is not.
 */
import { AKTIF_DEMO } from '@/countries/active/demo'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeYolu } from '@/lib/ulke/yol'
import type { DilKodu } from '@/lib/ulke/tipler'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { DEMO_SAYFASI, demoBaglantisi as ortamBaglantisi, demoBaglantisiCoz, type DemoBaglantisi } from './baglanti'
import type { DemoMetni } from './tipler'

export { demoBaglantisiCoz, DEMO_SAYFASI } from './baglanti'
export type { DemoBaglantisi } from './baglanti'
export type { DemoMetni, UlkeDemosu } from './tipler'

/** The pack's words for one form of the page, or null. */
export function demoMetni(dil: DilKodu): DemoMetni | null {
  return AKTIF_DEMO?.[dil] ?? null
}

/** /demo exists in this build. */
export function demoSayfasiVar(): boolean {
  const r = ulkePaketi().rotalar
  return ozellikAcik('acilisSayfasi') && AKTIF_DEMO !== null && r !== 'hepsi' && r.sayfalar.includes(DEMO_SAYFASI)
}

/** The address of /demo in one form of the page (the pack's default form needs no parameter). */
export function demoAdresi(dil: DilKodu): string {
  return ulkeYolu(`${DEMO_SAYFASI}${dil === ulkePaketi().varsayilanDil ? '' : `?dil=${dil}`}`)
}

/** The "Book a demo" button of the landing page, or null when this build has no demo page or no words for this form.
 * The button is shown whether or not the booking link is set: it always goes to /demo. */
export function demoDugmesi(dil: DilKodu): { href: string; etiket: string } | null {
  const m = demoMetni(dil)
  if (!m || !demoSayfasiVar()) return null
  return { href: demoAdresi(dil), etiket: m.dugme }
}

/**
 * AU-DEMO-02 (Kaan, 2026-11-03) - the booking link of this build: the country's own setting (lib/billing/ulkeTicari.ts
 * `demo`) when it has one, otherwise NEXT_PUBLIC_DEMO_BOOKING_URL as before. A country setting that is not a Cal.com
 * address counts as no link (never a fallback to the env var: the country's own value is the decision).
 */
export function demoBaglantisi(): DemoBaglantisi | null {
  const kendi = ulkeTicari(ulkePaketi().kod)?.demo
  return kendi ? demoBaglantisiCoz(kendi.adres) : ortamBaglantisi()
}

/** true = this country carries its own booking link (it decides, the env var does not). */
export function ulkeDemoBaglantisiVar(): boolean {
  return Boolean(ulkeTicari(ulkePaketi().kod)?.demo)
}

/**
 * AU-DEMO-02 - the "Book a 30-minute private demo" button OUTSIDE the landing page (founding page, trial upgrade
 * prompt): to /demo, and ONLY while /demo exists, holds a real calendar and the country has words for the button.
 * null = hidden (never a button to a page that says "opens soon").
 */
export function demoIstegi(dil: DilKodu = ulkePaketi().varsayilanDil as DilKodu): { href: string; etiket: string } | null {
  const etiket = ulkeTicari(ulkePaketi().kod)?.demoDugmesi
  if (!etiket || !demoSayfasiVar() || !demoBaglantisi()) return null
  return { href: demoAdresi(dil), etiket }
}
