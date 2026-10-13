/**
 * NOTYA-ULKE-EN-01 — United Kingdom: the few plain values BOTH the pack's light file (./index.ts, loaded by the
 * middleware and the browser) and the country's statement file (./ayarlar.ts) read. No import but a type: nothing
 * here may pull the tools or the language set into the light file.
 *
 * MACHINE-WRITTEN AND UNVERIFIED, like everything this country states (./ayarlar.ts says what each waits on).
 */
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: in the United Kingdom a young person of 16 or
 * over is generally treated as able to consent for themselves, and a younger child may be in some circumstances;
 * what that means for this product's wording and for the form a parent fills in is a legal question.
 */
export const GB_VELI_YASI = 16

/**
 * Units a clinic in the United Kingdom records in: metric (kg, cm, °C). Unverified with a local clinical lead
 * (checklist C8, E3). Read on an official page by the localisation audit of 2026-10-09 (branch audit/gb,
 * docs/COUNTRY-AUDIT-UNITED-KINGDOM.md): "We generally use metric", Celsius for temperature
 * (https://service-manual.nhs.uk/content/numbers-measurements-dates-time).
 * PATIENTS often know their own weight in stones and pounds and their height in feet and inches: the intake form asks
 * in kg and cm only (for a local clinical lead; the kit has no such entry).
 */
export const GB_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

/**
 * The label of the optional patient identifier: one wording for the form (`sozler.kimlikEtiketi`) and the pack
 * (`ulusalKimlik.ad`). LOCALISATION AUDIT 2026-10-09: the NHS number identifies a patient "within the NHS in England
 * and Wales"; Scotland uses the Community Health Index (CHI) number and Northern Ireland the Health and Care (H&C)
 * number (https://www.datadictionary.nhs.uk/attributes/nhs_number.html). The label therefore names all three. Whether
 * a clinic outside the health service may record any of them is FOR A LAWYER.
 */
export const GB_KIMLIK_ETIKETI = 'NHS number (CHI or H&C number)'
