/**
 * NOTYA-ULKE-DEMO-01 — Australia: the words of the "Book a demo" page (/demo) and of its button on the
 * landing page, in Australian spelling (en-AU). This country's own text, written here and not in the shared English set,
 * so it can change for this country alone. No claim about compliance, certification, integrations, prices or results.
 * The name is written "Gokhan" in Latin script, without the Turkish letter ö, as text in other languages often does
 * (and as scripts/ulke-turkce-tavan.mjs requires outside countries/tr).
 */
import type { UlkeDemosu } from '@/lib/ulke/demo/tipler'

export const AU_DEMO: UlkeDemosu = {
  'en-AU': {
    meta: { baslik: 'Book a demo — Notya', aciklama: 'Book a 60-minute video call with Dr. Gokhan Mamur.' },
    dugme: 'Book a demo',
    baslik: 'Book a demo',
    giris: 'A 60-minute video call with Dr. Gokhan Mamur. Times are shown in your own time zone.',
    yakinda: 'Demo booking opens soon.',
    yakindaGovde: 'Once the calendar is ready, you will be able to book directly on this page.',
    saglayici: 'Booking is handled by Cal.com.',
    takvimEtiketi: 'Demo booking calendar',
  },
}
