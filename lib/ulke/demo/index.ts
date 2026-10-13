/**
 * NOTYA-ULKE-DEMO-01 — "Book a demo": the active pack's words (countries/active/demo) and the deployment's link
 * (./baglanti). The page is components/ulke/demo/; the route app/demo/page.ulke.tsx.
 *
 * The page exists when the landing page is on, the pack lists /demo among its routes and brings words for it.
 * A button to it shows only when, in addition, the booking link is set: no link, no button anywhere.
 */
import { AKTIF_DEMO } from '@/countries/active/demo'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeYolu } from '@/lib/ulke/yol'
import type { DilKodu } from '@/lib/ulke/tipler'
import { DEMO_SAYFASI, demoBaglantisi } from './baglanti'
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

/** The "Book a demo" button of the landing page, or null: no page, no link, or no words for this form. */
export function demoDugmesi(dil: DilKodu): { href: string; etiket: string } | null {
  const m = demoMetni(dil)
  if (!m || !demoSayfasiVar() || !demoBaglantisi()) return null
  return { href: demoAdresi(dil), etiket: m.dugme }
}
