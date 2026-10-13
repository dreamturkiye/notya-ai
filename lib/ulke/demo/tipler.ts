/**
 * NOTYA-ULKE-DEMO-01 — what a country pack brings for the "Book a demo" page (/demo): its words, once per form of
 * the landing page. The page itself is the kit's (components/ulke/demo/); the link is a setting of the deployment
 * (NEXT_PUBLIC_DEMO_BOOKING_URL), never a value in a pack.
 */
import type { DilKodu } from '@/lib/ulke/tipler'

export type DemoMetni = {
  /** Browser title and description of /demo. */
  meta: { baslik: string; aciklama: string }
  /** The label of the button in the landing page's bar and hero. */
  dugme: string
  /** The heading of /demo. */
  baslik: string
  /** One sentence: a 60-minute video call with Dr. Gökhan Mamur; times in the visitor's own time zone. */
  giris: string
  /** No link set: a short "booking opens soon" line and one sentence. No address, no e-mail. */
  yakinda: string
  yakindaGovde: string
  /** One line under the calendar: booking is handled by Cal.com. */
  saglayici: string
  /** Accessible name of the calendar. */
  takvimEtiketi: string
}

/** One entry per form of the landing page (UlkeAcilisi.diller). A form without words gets no demo page and no button. */
export type UlkeDemosu = Readonly<Partial<Record<DilKodu, DemoMetni>>>
