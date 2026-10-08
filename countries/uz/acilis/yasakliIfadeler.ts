/**
 * NOTYA-ULKE-01 — what Uzbek-facing marketing must not say (Kaan, 2026-10-08), as patterns a test can hunt.
 * Test-only: countries/uz/acilis/acilis.test.ts runs these over the rendered landing page, over every string of
 * its catalogue in all three forms, and over the copy file.
 * The marks of Türkiye (its state systems, law, currency, references, the assistant's Turkish name) are hunted
 * separately by the leak harness; this list is Uzbekistan's own.
 *
 * NOTYA-UZ-ACILIS-02 (Kaan, 2026-10-08): a security section may now say what the product DOES (encryption, each
 * doctor sees only their own patients, the doctor approves every step). What stays forbidden there: naming any law
 * or regulator, claiming compliance, and saying where data is kept.
 */
export const UZ_YASAKLI_IFADELER: readonly { neden: string; desen: RegExp }[] = [
  { neden: 'no public demo', desen: /\bdemo\b|демо/i },
  { neden: 'no integration claim', desen: /integratsiya|интеграц|\bDMED\b|davlat tizimi|давлат тизими|государственн\S* систем/i },
  { neden: 'no mention of the voice profile', desen: /ovoz (profil|izi)|овоз (профил|изи)|голосов\S* (профил|отпечат)|biometr|биометр/i },
  { neden: 'no mention of image evaluation', desen: /(tasvir|rasm|surat)\S* (baholash|tahlil)|(тасвир|расм|сурат)\S* (баҳолаш|таҳлил)|rentgen|изображени|снимк|рентген/i },
  { neden: 'no price', desen: /\d[\d\s.,]*\s*(soʻm|so'm|сум|сўм|UZS|USD|\$|€)/i },
  { neden: 'no free trial', desen: /bepul|бепул|бесплатн|sinov muddati|синов муддати|пробн/i },
  { neden: 'the assistant has no name or title yet', desen: /\bProf\.|\bDr\.|профессор|professor/i },
  { neden: 'no named law or regulator, no claim of compliance', desen: /qonun|қонун|закон|\bZRU\b|ЗРУ|OʻRQ|ЎРҚ|GDPR|HIPAA|talablariga (mos|muvofiq)|талабларига (мос|мувофиқ)|соответств\S* (закон|требовани)|vazirlig|вазирлиг|министерств/i },
  { neden: 'no claim about where data is kept', desen: /server\S* (Oʻzbekiston|Ўзбекистон|Узбекистан)|(Oʻzbekistonda|Ўзбекистонда|в Узбекистане) (saqlan|сақлан|хран)/i },
]
