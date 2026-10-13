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
 *
 * NOTYA-UZ-FIYAT-UNVAN-01 (Kaan, 2026-10-09). Two rules changed:
 *   - PRICES are shown now, in soʻm, from the pack's price list. What is forbidden instead: anything of the Turkish
 *     currency (its sign, its code, its name, an amount of the Turkish page) and any other foreign currency; and an
 *     amount of soʻm written INTO THE COPY (amounts are data: countries/uz/acilis/fiyatlar.ts). That every amount on
 *     the rendered page is one of the price list's is checked by the test itself.
 *   - THE ASSISTANT IS NAMED, the way the Turkish page names its own: short title and given name of one persona.
 *     What stays forbidden: a biography. No title spelled out as a rank, no years of practice, no place of work or
 *     study. Which name the page may carry is checked by the test itself (the featured persona's and no other).
 */
export const UZ_YASAKLI_IFADELER: readonly { neden: string; desen: RegExp; /** true = a rule for the copy only, not for the rendered page */ yalnizMetin?: true }[] = [
  { neden: 'no public demo', desen: /\bdemo\b|демо/i },
  { neden: 'no integration claim', desen: /integratsiya|интеграц|\bDMED\b|davlat tizimi|давлат тизими|государственн\S* систем/i },
  { neden: 'no mention of the voice profile', desen: /ovoz (profil|izi)|овоз (профил|изи)|голосов\S* (профил|отпечат)|biometr|биометр/i },
  { neden: 'no mention of image evaluation', desen: /(tasvir|rasm|surat)\S* (baholash|tahlil)|(тасвир|расм|сурат)\S* (баҳолаш|таҳлил)|rentgen|изображени|снимк|рентген/i },
  { neden: 'nothing of the Turkish currency, and no other foreign currency', desen: /₺|(?<![\p{L}\p{N}])(TL|TRY|USD|EUR)(?![\p{L}\p{N}])|(?<!\p{L})(lira\p{L}*|лир(а|ы|у|е|ой|ами|ах)?|доллар\p{L}*|евро)(?!\p{L})|\$|€|(?<![\p{N}\p{L}])(1[\s.,]?490|3[\s.,]?490|5[\s.,]?990)(?![\p{N}\p{L}])/iu },
  // The rendered page DOES show amounts of soʻm (from the price list); the copy itself never carries one.
  { neden: 'no amount of money is written into the copy: amounts are data (fiyatlar.ts)', desen: /\d[\d\s.,]*\s*(soʻm|so'm|сум|сўм|UZS)/i, yalnizMetin: true },
  { neden: 'no free trial', desen: /bepul|бепул|бесплатн|sinov muddati|синов муддати|пробн/i },
  { neden: 'no biography of the assistant: no rank spelled out, no years of practice, no place of work or study', desen: /профессор|professor|dotsent|доцент|akademi|академи|universitet|университет|institut|институт|\d+\s*(yil|йил|лет|года?)\b[^.]*(tajriba|тажриба|стаж|опыт)|(tajriba|тажриба|стаж|опыт)\S*\s+\d/i },
  { neden: 'no named law or regulator, no claim of compliance', desen: /qonun|қонун|закон|\bZRU\b|ЗРУ|OʻRQ|ЎРҚ|GDPR|HIPAA|talablariga (mos|muvofiq)|талабларига (мос|мувофиқ)|соответств\S* (закон|требовани)|vazirlig|вазирлиг|министерств/i },
  { neden: 'no claim about where data is kept', desen: /server\S* (Oʻzbekiston|Ўзбекистон|Узбекистан)|(Oʻzbekistonda|Ўзбекистонда|в Узбекистане) (saqlan|сақлан|хран)/i },
]
