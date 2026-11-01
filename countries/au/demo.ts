/**
 * NOTYA-ULKE-DEMO-01 — Australia: the words of the "Book a demo" page (/demo) and of its button on the
 * landing page, in Australian spelling (en-AU). This country's own text, written here and not in the shared English set,
 * so it can change for this country alone. No claim about compliance, certification, integrations, prices or results.
 *
 * Duration and host name match the live Cal.com event (han-mamur-sugmbo/demo-au): 30 minutes, Dr. Han Mamur
 * (easier for Australian speakers than "Gökhan"; Kaan, 2026-11-01 launch).
 */
import type { UlkeDemosu } from '@/lib/ulke/demo/tipler'

export const AU_DEMO: UlkeDemosu = {
  'en-AU': {
    meta: { baslik: 'Book a demo — Notya', aciklama: 'Book a 30-minute video call with Dr. Han Mamur.' },
    dugme: 'Book a demo',
    baslik: 'Book a demo',
    giris: 'A 30-minute video call with Dr. Han Mamur. Times are shown in your own time zone.',
    yakinda: 'Demo booking opens soon.',
    yakindaGovde: 'Once the calendar is ready, you will be able to book directly on this page.',
    saglayici: 'Booking is handled by Cal.com.',
    takvimEtiketi: 'Demo booking calendar',
    bolum: {
      ustBaslik: 'Book a demo',
      baslik: 'See Notya',
      baslikVurgu: 'in a live call',
      govde: 'Dr. Han Mamur walks you through an example visit, start to finish, on a video call — 30 minutes, at a time that works for you.',
      kartEtiketi: 'On the call',
      satirlar: [
        { k: 'A live walkthrough', v: 'An example visit, start to finish' },
        { k: '30 minutes', v: 'Times shown in your own time zone' },
        { k: 'Your own questions', v: 'Time set aside to ask them' },
      ],
    },
  },
}
