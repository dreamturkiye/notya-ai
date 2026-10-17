/**
 * NOTYA-HASTA-ILETISIMI-01 Phase 2 — localized intake consent wording for the 6 non-Turkey
 * country modules, one `IletisimIzinUlkePaketi` per country. See
 * `docs/HASTA-ILETISIMI-INTL-01-research.md` for the full sourced research behind every field
 * here, and `docs/OPEN-COMMITMENTS.md` (`HASTA-ILETISIMI-INTL-*`) for what remains open.
 *
 * This is DATA, not engine logic — same shape as `lib/asi/stok/intl/ulkePaketleri.ts` /
 * `lib/asi/onam/intl/ulkePaketleri.ts`. The bulk-send engine itself
 * (`lib/iletisim/toplu/kampanya.ts`, `lib/iletisim/izin.ts`, `lib/iletisim/vazgecJetonu.ts`) is
 * UNCHANGED for every country — it already requires real per-channel consent, respects
 * revocation, and enforces opt-out at the send layer, which is the one design decision the
 * research doc's per-country section concludes is correct for all six. What genuinely differs
 * per country, and is what this file localizes, is the WORDING the patient reads at intake — not
 * a straight translation of the Turkish line (coordinator's explicit instruction, 2026-10-16),
 * composed instead to match each country's actual legal disclosure norm:
 *   • US:  TCPA-style texting disclosure convention (clinic name, purpose, STOP to opt out,
 *          "message frequency varies, msg & data rates may apply" — the standard US SMS program
 *          disclosure industry convention, not specific to healthcare).
 *   • GB:  PECR soft-opt-in style wording — names the clinic, states the message types, states
 *          the unsubscribe mechanism, since PECR's soft opt-in explicitly requires that same
 *          opt-out be offered "when their details were first collected."
 *   • CA:  CASL requires accurate sender identification + an unsubscribe mechanism on every
 *          commercial electronic message (s. 6–7, 11) — wording names the clinic and the opt-out.
 *   • AU:  Spam Act factual-disclosure convention — plain statement of purpose + opt-out.
 *   • NZ:  same shape as AU (UEMA 2007 mirrors the Spam Act's structure).
 *   • UZ:  Uzbekistan's new rule (from 1 Nov 2026) requires "written or electronic consent" for
 *          promotional SMS — wording is explicit that ticking the box IS that electronic consent,
 *          composed in Uzbek (Lotin), the locale this product's other UZ-facing copy uses
 *          elsewhere; confirm against release/uz's own locale convention before shipping (flagged
 *          in docs/OPEN-COMMITMENTS.md, this was not cross-checked against that branch directly).
 *
 * NOT YET WIRED into any release/<cc> branch's actual intake form — see
 * docs/OPEN-COMMITMENTS.md HASTA-ILETISIMI-INTL-02. This file is the reusable, cited data layer;
 * porting `lib/intake/coreAlanlar.ts`'s Onay section to read from it on each release branch is
 * separate follow-on work, same precedent as ASI-STOK-INTL-01 / ASI-ONAM-INTL-01's own Phase 2.
 */

export type IletisimIzinGuvenDuzeyi = 'VERIFIED' | 'BEST-EFFORT' | 'MODERATE' | 'UNCONFIRMED'

export type IletisimIzinMetinleri = {
  /** Per-channel consent line, same three channels as the Turkish intake form (lib/iletisim/izinMetni.ts IZIN_METNI). */
  whatsapp: string
  eposta: string
  sms: string
  /** Small print under the checkboxes — purpose + how to withdraw consent (opt-out link / STOP). */
  aciklama: string
}

export type IletisimIzinUlkePaketi = {
  ulkeKodu: string
  dil: string
  metin: IletisimIzinMetinleri
  guven: IletisimIzinGuvenDuzeyi
  not: string
  kaynaklar: readonly string[]
}

export const ILETISIM_IZIN_ULKE_PAKETLERI: Record<string, IletisimIzinUlkePaketi> = {
  US: {
    ulkeKodu: 'US',
    dil: 'en-US',
    metin: {
      whatsapp: 'I agree to receive appointment and clinic information messages from this practice by WhatsApp.',
      eposta: 'I agree to receive appointment and clinic information messages from this practice by email.',
      sms: 'I agree to receive appointment and clinic information text messages from this practice. Message frequency varies; message and data rates may apply. Reply STOP to opt out at any time.',
      aciklama: 'These messages are for appointments and clinic information only — never diagnosis, test results or medication details. You can withdraw consent anytime: reply STOP to a text, or use the unsubscribe link in an email.',
    },
    guven: 'VERIFIED',
    not: 'TCPA (47 U.S.C. § 227; 47 C.F.R. § 64.1200) requires prior express consent for autodialed/texted messages to a wireless number; this feature relies on consent rather than the narrow 2015 healthcare treatment-purpose exemption (47 C.F.R. § 64.1200(a)(2)), whose content/length/frequency conditions this free-text engine does not enforce. Wording follows the standard US SMS-program disclosure convention (frequency + rates + STOP).',
    kaynaklar: [
      'https://www.bassberry.com/news/tcpa-exemptions-for-healthcare-companies/',
      'https://www.bassberry.com/news/tcpa-healthcare-basics/',
      'https://natlawreview.com/node/133991/printable/print',
    ],
  },
  GB: {
    ulkeKodu: 'GB',
    dil: 'en-GB',
    metin: {
      whatsapp: 'I agree to receive appointment reminders and clinic information from this practice by WhatsApp. You can withdraw this at any time.',
      eposta: 'I agree to receive appointment reminders and clinic information from this practice by email. You can withdraw this at any time.',
      sms: 'I agree to receive appointment reminders and clinic information from this practice by text message. Reply STOP at any time to stop these messages.',
      aciklama: 'These messages are for appointments and clinic information only — never diagnosis, test results or medication details. You can withdraw consent at any time using the unsubscribe link in an email, or by replying STOP to a text.',
    },
    guven: 'VERIFIED',
    not: "PECR requires opt-in consent for direct-marketing electronic mail (defined broadly enough to include SMS); its soft opt-in for existing customers requires the opt-out to have been offered \"when their details were first collected\" — this wording satisfies that regardless of whether a given message is later judged service or marketing content under the ICO's purpose-and-tone test, which has no de-minimis carve-out.",
    kaynaklar: [
      'https://ico.org.uk/for-organisations/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing',
      'https://lewissilkin.com/en/insights/blurred-lines-in-the-thicke-of-the-difference',
    ],
  },
  CA: {
    ulkeKodu: 'CA',
    dil: 'en-CA',
    metin: {
      whatsapp: 'I consent to receive appointment and clinic information messages from this practice by WhatsApp. You may withdraw consent at any time.',
      eposta: 'I consent to receive appointment and clinic information messages from this practice by email. You may withdraw consent at any time.',
      sms: 'I consent to receive appointment and clinic information text messages from this practice. You may withdraw consent at any time by replying STOP.',
      aciklama: 'These messages are for appointments and clinic information only — never diagnosis, test results or medication details. Every message identifies this practice and offers a way to unsubscribe, as required by Canada\'s anti-spam law (CASL). You can withdraw consent at any time.',
    },
    guven: 'VERIFIED',
    not: 'CASL (s. 6–7, 11) requires consent, accurate sender identification and a working unsubscribe mechanism on a commercial electronic message; its existing-business-relationship implied-consent window (s. 10(9)–10(10), 2 years) is real but time- and content-limited, so this feature captures express consent at intake instead rather than tracking that clock.',
    kaynaklar: ['https://www.fightspam.gc.ca/eic/site/030.nsf/eng/00008.html'],
  },
  AU: {
    ulkeKodu: 'AU',
    dil: 'en-AU',
    metin: {
      whatsapp: 'I consent to receive appointment and clinic information messages from this practice by WhatsApp. I can withdraw this consent at any time.',
      eposta: 'I consent to receive appointment and clinic information messages from this practice by email. I can withdraw this consent at any time.',
      sms: 'I consent to receive appointment and clinic information text messages from this practice. I can withdraw this consent at any time by replying STOP.',
      aciklama: 'These messages are for appointments and clinic information only — never diagnosis, test results or medication details. You can withdraw consent at any time using the unsubscribe link in an email, or by replying STOP to a text.',
    },
    guven: 'BEST-EFFORT',
    not: "Spam Act 2003 (Cth) s. 16 requires consent (express or inferred) for a commercial electronic message; an existing patient relationship is a textbook inferred-consent case but the exact scope/duration was not confirmed to the same precision as CASL's explicit 2-year window, so this is BEST-EFFORT rather than VERIFIED on that specific point — express consent at intake is captured regardless.",
    kaynaklar: ['https://pointonpartners.com.au/spam-act/'],
  },
  NZ: {
    ulkeKodu: 'NZ',
    dil: 'en-NZ',
    metin: {
      whatsapp: 'I agree that this practice may send me appointment and clinic information by WhatsApp. I may withdraw this agreement at any time.',
      eposta: 'I agree that this practice may send me appointment and clinic information by email. I may withdraw this agreement at any time.',
      sms: 'I agree that this practice may text me appointment and clinic information. I may withdraw this agreement at any time by texting back STOP.',
      aciklama: 'These messages cover appointments and clinic information only — never diagnosis, test results or medication details. You may withdraw your agreement at any time: use the unsubscribe link in an email, or text STOP in reply to a text.',
    },
    guven: 'BEST-EFFORT',
    not: 'Unsolicited Electronic Messages Act 2007 requires consent (express, inferred or deemed) for a commercial electronic message; its inferred-consent-from-existing-relationship path is confirmed to exist but no fixed time window was found (unlike CASL\'s explicit 2 years), so BEST-EFFORT on exact scope — express consent at intake is captured regardless.',
    kaynaklar: ['https://sprintlaw.co.nz/articles/unsolicited-electronic-messages-act-nz-marketing-email-and-text-rules'],
  },
  UZ: {
    ulkeKodu: 'UZ',
    dil: 'uz-Latn',
    metin: {
      whatsapp: "Shifokorlik amaliyotidan uchrashuv va klinika ma'lumotlari xabarlarini WhatsApp orqali olishga roziman. Bu rozilikni istalgan vaqtda qaytarib olishim mumkin.",
      eposta: "Shifokorlik amaliyotidan uchrashuv va klinika ma'lumotlari xabarlarini elektron pochta orqali olishga roziman. Bu rozilikni istalgan vaqtda qaytarib olishim mumkin.",
      sms: "Shifokorlik amaliyotidan uchrashuv va klinika ma'lumotlari xabarlarini SMS orqali olishga roziman — ushbu belgi mening elektron rozilik beruvchim hisoblanadi. Bu rozilikni istalgan vaqtda \"STOP\" deb javob yuborish orqali qaytarib olishim mumkin.",
      aciklama: "Bu xabarlar faqat uchrashuv va klinika ma'lumotlari uchun — tashxis, tahlil natijalari yoki dori ma'lumotlarini hech qachon o'z ichiga olmaydi. Rozilikni istalgan vaqtda elektron pochtadagi obunani bekor qilish havolasi orqali yoki SMS-ga \"STOP\" deb javob yuborish orqali qaytarib olishingiz mumkin.",
    },
    guven: 'MODERATE',
    not: "From 1 Nov 2026, Uzbekistan requires \"written or electronic consent\" before sending promotional SMS offering goods/services/works (government announcement, 2026-07-16, citing a presidential resolution per the Ministry of Justice — the resolution's own number was not available from the fetched source). Wording explicitly frames the checkbox itself as that electronic consent. Whether a plain appointment reminder would even fall inside this rule's scope, and whether an existing-customer exemption exists, are both UNCONFIRMED — so this country gets the same consent-required, no-exemption-claimed treatment as every other country regardless. Locale (uz-Latn) was not cross-checked against release/uz's own convention — flagged in docs/OPEN-COMMITMENTS.md.",
    kaynaklar: [
      'https://kun.uz/en/news/2026/07/16/government-sets-new-limits-on-mobile-advertising-and-strengthens-consumer-protections-21572b',
    ],
  },
}

export function iletisimIzinPaketi(ulkeKodu: string): IletisimIzinUlkePaketi | null {
  return ILETISIM_IZIN_ULKE_PAKETLERI[ulkeKodu.toUpperCase()] ?? null
}
