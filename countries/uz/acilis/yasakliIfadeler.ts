/**
 * NOTYA-ULKE-01 — what Uzbek-facing marketing must not say (Kaan, 2026-10-08), as patterns a test can hunt.
 * Test-only: countries/uz/acilis/acilis.test.ts runs these over the rendered landing page and the copy file.
 * The marks of Türkiye (its state systems, law, currency, references, the assistant's Turkish name) are hunted
 * separately by the leak harness; this list is Uzbekistan's own.
 */
export const UZ_YASAKLI_IFADELER: readonly { neden: string; desen: RegExp }[] = [
  { neden: 'no public demo', desen: /\bdemo\b|демо/i },
  { neden: 'no integration claim', desen: /integratsiya|интеграц|\bDMED\b|davlat tizimi|государственн\S* систем/i },
  { neden: 'no mention of the voice profile', desen: /ovoz (profil|izi)|голосов\S* (профил|отпечат)|biometr|биометр/i },
  { neden: 'no mention of image evaluation', desen: /(tasvir|rasm|surat)\S* (baholash|tahlil)|rentgen|изображени|снимк|рентген/i },
  { neden: 'no price', desen: /\d[\d\s.,]*\s*(soʻm|so'm|сум|сўм|UZS|USD|\$|€)|bepul|бесплатн/i },
  { neden: 'the assistant has no name or title yet', desen: /\bProf\.|\bDr\.|профессор|professor/i },
  { neden: 'no claim about where data is kept or how it is protected', desen: /shifrlan|шифр|AES|server\S* (Oʻzbekiston|Узбекистан)/i },
]
