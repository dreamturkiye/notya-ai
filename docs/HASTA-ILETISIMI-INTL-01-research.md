# NOTYA-HASTA-ILETISIMI-01 Phase 2 — per-country consent rules for bulk messages to a doctor's OWN existing patients

Status date: 2026-10-16. Scope: the same 6 non-Turkey country modules this codebase actually has —
confirmed independently (not assumed) by `git branch -a --list "release/*"`: `release/au`,
`release/ca`, `release/gb`, `release/nz`, `release/us`, `release/uz`, the same set
`ASI-STOK-INTL-01` / `ASI-ONAM-INTL-01` / `ACCOUNTING-INTL-01` each confirmed on their own.

**Scope correction carried through this whole document** (coordinator, 2026-10-16): the messages this
feature sends — appointment reminders, vaccine-stock-arrival notices, general clinic info — go only
to the doctor's own EXISTING patients, never to prospective or bought-in contacts. Every regime below
is read for its EXISTING-RELATIONSHIP treatment, not its cold-marketing bar.

**The single finding that matters most, found while researching GB and confirmed by re-reading the
other five with the same question in mind**: none of these six laws exempt "service" or
"informational" messages from their consent rules in a clean, bright-line way. Every one of them
instead asks *what the message is actually trying to do*, and a message that invites the patient to
book, call or take any action tied to a service purchase tends to get pulled back into the
"commercial/marketing" bucket regardless of the existing relationship — see the UK PECR section
below for the clearest statement of this test, which the other five regimes echo in slightly
different words. Notya's `asi_stok_geldi` preset ("beklediğiniz aşı stoğumuza geldi… randevu almak
için bizi arayabilir") is a direct example: it is informational AND it invites booking a paid visit.
**Conclusion applied product-wide, already built this way before this research started**: this
feature does not try to thread the needle of which message type counts as pure "service" content in
which country. It requires real per-channel opt-in consent captured at intake (and still respected,
revocable, enforced at the send layer) for every bulk message in every one of these six countries,
the same as Turkey under KVKK. A consent-based program is compliant under every regime below
regardless of how a court would ultimately classify any one message, so this is the one design
decision that makes the rest of the per-country nuance below informative rather than load-bearing —
nothing in Phase 1's engine needs to change per country; only the intake wording is localized.

Confidence scale (same as `ASI-STOK-INTL-01-research.md` / `ASI-ONAM-INTL-01-research.md`):
**VERIFIED** (primary/official or clearly authoritative secondary source, fetched directly) /
**BEST-EFFORT** (a credible secondary source found and fetched, but not the primary statute text
itself, or the country is sub-nationally fragmented) / **MODERATE** (the framework is confirmed to
exist but a specific detail could not be fetched) / **UNCONFIRMED** (no citable source found).

## US — TCPA (Telephone Consumer Protection Act)

- **Primary consent rule: VERIFIED.** Calls/texts to a wireless number made with an autodialer or
  prerecorded/artificial voice need the called party's **prior express consent** — 47 U.S.C. § 227;
  47 C.F.R. § 64.1200(a). This is the baseline this feature already builds to (intake consent
  checkbox, respected and revocable) regardless of any exemption below.
- **Healthcare "treatment-purpose" exemption: VERIFIED, and deliberately NOT relied on.** A 2015 FCC
  declaratory ruling under **47 C.F.R. § 64.1200(a)(2)** lets a HIPAA-covered provider send certain
  healthcare calls/texts to a patient's own number WITHOUT prior express consent — but only inside a
  tight box: **no marketing, solicitation, advertising, debt-collection or billing content**; calls
  ≤1 minute / texts ≤160 characters; **≤1 message/day and ≤3/week per provider**; immediate opt-out
  (e.g. "STOP") honored at once; free to the patient. Source:
  [bassberry.com/news/tcpa-exemptions-for-healthcare-companies](https://www.bassberry.com/news/tcpa-exemptions-for-healthcare-companies/).
  **This feature does not rely on this exemption** — its free-text, doctor-edited body has no
  160-character cap and no built-in once-a-day throttle, and "book an appointment to get your
  vaccine" reads close to the FCC's own "solicitation" line. Relying on consent instead (already
  built) avoids having to engineer around those formatting/frequency conditions.
- **Established-business-relationship (EBR) treatment: VERIFIED, narrow.** The TCPA's EBR exemption
  historically applied mainly to the **do-not-call registry** for live/prerecorded calls, not as a
  blanket substitute for autodialer/text consent — the FCC's 2012 order tightened autodialed-text
  consent requirements industry-wide specifically because EBR was being over-read as a text-messaging
  exemption. Sources:
  [natlawreview.com — FCC Affirms Health Plans/Providers Cannot Offer Post-Call Opt-Out In Lieu Of Prior Express Consent](https://natlawreview.com/node/133991/printable/print);
  [bassberry.com/news/tcpa-healthcare-basics](https://www.bassberry.com/news/tcpa-healthcare-basics/).
  **Applied conclusion**: EBR does not, on its own, let this feature skip consent for US patients;
  consent (already required) is the correct and only conservative basis here.
- **Opt-out: VERIFIED as the universal convention.** STOP/9/toll-free-callback opt-out is the
  standard every source above describes, which is exactly what this feature's SMS webhook
  (`vazgecKelimesiMi`) recognises.

## GB — PECR (Privacy and Electronic Communications Regulations) + UK GDPR

- **Marketing consent + soft opt-in: VERIFIED.** PECR generally requires opt-in consent for
  electronic-mail marketing (the term is defined broadly enough to include SMS, MMS and voicemail —
  [ico.org.uk — electronic mail marketing](https://ico.org.uk/for-organisations/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing)).
  The **soft opt-in** lets a business message its OWN existing customers about similar
  products/services without fresh consent, but only when **all** of: (1) the customer bought or
  negotiated to buy a similar product/service before; (2) they were given a clear chance to refuse
  marketing when their details were first collected; (3) that same opt-out is offered in every
  message. It does **not** cover prospects or bought-in lists. Same source as above.
- **Service vs. marketing — the test that matters most here: VERIFIED.** PECR's consent rule only
  applies to "direct marketing" messages; a genuine service/administrative message does not need
  marketing consent at all. The ICO's own draft Direct Marketing Guidance frames the test as
  **purpose** (does the message promote/sell goods, services or ideas, or collect data toward that)
  **and tone** (does it read as sales/promotion) — and explicitly states there is **no de minimis
  carve-out**: one promotional line inside an otherwise informational message is enough to pull the
  whole thing into "marketing." Its own worked example: "we are closing our store" = service;
  "you're about to run out of data, click here to buy more" = marketing, because it invites a
  purchase. Source:
  [lewissilkin.com — Blurred lines: the difference between a service communication and a marketing communication](https://lewissilkin.com/en/insights/blurred-lines-in-the-thicke-of-the-difference).
  Fines for getting this wrong run to £500,000 under PECR, separately from UK GDPR exposure.
  **Applied conclusion**: a plain appointment reminder is a service message and likely outside PECR
  consent rules on its own; the `asi_stok_geldi` preset's "call to book" line tips it toward
  marketing by this exact test. Rather than classify each template, this feature treats every bulk
  message the same, consent-gated way — the conservative answer under this test, not an assumption.
- **Underlying lawful basis (UK GDPR, separate from PECR):** a genuine service communication (e.g.
  "your appointment is tomorrow") to an existing patient would ordinarily rest on Art. 6(1)(b)
  (performance of the care relationship) or 6(1)(f) (legitimate interest), not consent — PECR is the
  rule actually governing the CHANNEL (e-mail/SMS) and marketing CONTENT, UK GDPR governs the
  underlying processing of the patient's data either way. This feature's design (real per-channel
  consent + logged provenance + enforced opt-out) satisfies both regardless of which UK GDPR basis a
  reviewer would ultimately pick for the non-marketing subset.

## CA — CASL (Canada's Anti-Spam Legislation)

- **Core rule: VERIFIED.** Sending a "commercial electronic message" (CEM) needs consent — express or
  implied — plus accurate sender ID and a working unsubscribe mechanism (CASL s. 6–7, referenced via
  [fightspam.gc.ca — Getting consent to send email](https://www.fightspam.gc.ca/eic/site/030.nsf/eng/00008.html)).
  A CEM is defined by content: does it have a commercial/promotional purpose (marketing, sales,
  offers, solicitations)? A message that is purely service information is not a CEM at all and CASL
  does not apply to it — but per the GB finding above, any promotional line (e.g. "book now") risks
  moving it into CEM territory.
- **Existing-business-relationship implied consent: VERIFIED.** CASL s. 10(9)–10(10) recognises
  implied consent from an existing business relationship — **time-limited to 2 years** from the
  relationship's last qualifying event (6 months for a mere inquiry/application) — same source as
  above. This is real and does apply to an active patient relationship, but it is **time-limited and
  content-limited** (the CEM must relate to that relationship) — it is not indefinite permission.
- **Applied conclusion**: CASL's EBR implied-consent window could legally cover ongoing messages to
  an actively-seen patient without a fresh opt-in, but this feature does not rely on it — it captures
  real express consent at intake instead, which is strictly safer (no 2-year clock to track, no
  "which message relates to the relationship" judgment call) and is what the brief explicitly asks
  for regardless.
- **Opt-out: VERIFIED** as a hard CASL requirement on every CEM (s. 11) — same mechanism this
  feature already builds for every country.

## AU — Spam Act 2003 (Cth) + Privacy Act 1988

- **Core rule: VERIFIED.** Sending a "commercial electronic message" without consent is prohibited —
  Spam Act 2003 s. 16. Consent may be **express or inferred**; inferred consent is drawn from "the
  conduct, and the business and other relationships, of the individual and the sender," and
  explicitly **cannot** be inferred from an address merely being published. Source:
  [pointonpartners.com.au/spam-act](https://pointonpartners.com.au/spam-act/).
- **Existing-relationship inferred consent: VERIFIED to exist, BEST-EFFORT on exact scope.** An
  active patient relationship is a textbook case the Act's own guidance uses for inferred consent,
  but the fetched source did not spell out a time limit or a patients-specific example the way
  CASL's did, so the precise boundary (how recent a visit must be) is BEST-EFFORT, not VERIFIED to
  an exact figure.
- **Factual/"designated commercial message" carve-out: MODERATE.** Schedule 1 of the Act lets a
  message that consists of "no more than factual information" (plus limited sender details) skip
  some of the Act's requirements — a plain appointment reminder is a strong candidate for this, but
  the fetched source did not list the full conditions, so this is flagged MODERATE rather than relied
  on.
- **Applied conclusion**: same as CA — real, but not relied on; consent-first is simpler and already
  built.

## NZ — Unsolicited Electronic Messages Act 2007

- **Core rule: VERIFIED.** A "commercial electronic message" — one that offers, advertises or
  promotes goods/services, or promotes a business/investment opportunity — needs consent: express,
  inferred, or deemed (conspicuous publication, B2B-oriented, not relevant here). Source:
  [sprintlaw.co.nz — Unsolicited Electronic Messages Act NZ](https://sprintlaw.co.nz/articles/unsolicited-electronic-messages-act-nz-marketing-email-and-text-rules).
  Same structure as AU's Spam Act (the two laws were drafted close together and are routinely
  compared in NZ legal commentary).
- **Inferred consent from an existing relationship: VERIFIED to exist, BEST-EFFORT on scope.** The
  source explicitly ties inferred consent to "an existing business relationship... a message relevant
  to that relationship... and a reasonable expectation that they would receive it" — explicitly
  warning this is "easy to misapply" and not blanket permission. No fixed time window was stated in
  the fetched source (unlike CASL's explicit 2 years), so the exact boundary is BEST-EFFORT.
- **Service vs. marketing line: VERIFIED, same shape as every other regime above.** The source's own
  example: a booking confirmation / appointment reminder is "usually fine when it's genuinely about
  the service," but adding a promotion (e.g. "discount on your next session") moves it into marketing
  and consent applies. This is the SAME test as GB's, independently stated.
- **Applied conclusion**: identical to AU/CA — consent-first, not relied on as an exemption.

## UZ — Uzbekistan

- **Personal-data processing: MODERATE** — Uzbekistan has a general Personal Data Protection Law
  (the framework `ASI-ONAM-INTL-01`/`ACCOUNTING-INTL-01` research already flagged as real but with
  workflow specifics UNCONFIRMED); this document did not re-verify its text directly.
- **Promotional calls/SMS: VERIFIED, and NEWLY DATED — a real, current regulatory change, not an
  assumption or something read off an old page.** As of **16 July 2026**, Uzbekistan's government
  announced new restrictions taking effect: from **1 November 2026**, a promotional SMS "offering
  goods, services, or works" may be sent only after the recipient's **written or electronic consent**;
  advertising calls/SMS over mobile networks are banned 18:00–09:00; mobile operators must be able to
  block advertising messages on a subscriber's request. Source:
  [kun.uz — Government sets new limits on mobile advertising and strengthens consumer protections, 2026-07-16](https://kun.uz/en/news/2026/07/16/government-sets-new-limits-on-mobile-advertising-and-strengthens-consumer-protections-21572b),
  citing a presidential resolution per Uzbekistan's Ministry of Justice (the resolution's own number
  was not available from the fetched source — **UNCONFIRMED** at that level of detail).
- **Existing-customer exemption: UNCONFIRMED.** The fetched source does not mention one, and no
  second source was found confirming or ruling one out.
- **Informational/non-advertising-message carve-out: UNCONFIRMED.** The fetched source frames the
  new consent rule around "promotional SMS offering goods, services, or works" specifically, which
  reads as narrower than "any message from a business," but no source explicitly confirms a plain
  appointment reminder falls outside it.
- **Applied conclusion — the most conservative of the six, correctly so.** Given both the consent
  requirement (now confirmed real and dated) and the unconfirmed scope of any carve-out, UZ gets the
  SAME consent-required design as every other country here — which this feature already builds
  everywhone — with NO exemption claimed for any message type. This is flagged explicitly rather than
  assumed silently, per the standing "no invented legal claims" rule this repo uses for every country
  module (`ASI-ONAM-INTL-01-research.md`, `ASI-STOK-INTL-01-research.md`).

## What ports per country (no engine change needed)

Every one of the six conclusions above is "require real consent, respect revocation, enforce
opt-out at the sending layer" — which is exactly what `lib/iletisim/toplu/`, `lib/iletisim/izin.ts`,
`lib/iletisim/vazgecJetonu.ts` and the intake consent checkbox already do, unconditionally, for every
country today. **Nothing in the bulk-send engine itself needs to branch on country.** The one
per-country artifact this research produces is consent WORDING for the intake form — see
`lib/intake/intl/iletisimIzinMetni.ts` — because the brief explicitly asked for consent language that
reflects each country's actual disclosure norm, not a straight translation of the Turkish line.
