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
import { DEMO_SAYFASI } from './baglanti'
import type { DemoMetni } from './tipler'

export { demoBaglantisi, demoBaglantisiCoz, DEMO_SAYFASI } from './baglanti'
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
