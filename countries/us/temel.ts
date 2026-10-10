/**
 * NOTYA-ULKE-EN-01 — United States: the two settings BOTH halves of the pack read, the light file (./index.ts) and
 * what the country states to the language set (./ayarlar.ts). Plain data, type-only imports: the middleware and the
 * browser bundle load this through ./index.ts, and nothing of the tools' arithmetic comes with it.
 *
 * MACHINE-WRITTEN AND UNVERIFIED: nobody in the United States has confirmed either value (see ./ayarlar.ts).
 */
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 18 is a starting value: the age of majority and the rules on a minor's own consent differ by state;
 * what that means for this product's wording and for the form a parent fills in is a legal question.
 */
export const US_VELI_YASI = 18

/** Units a clinic in the United States records in: pounds, inches, degrees Fahrenheit. A CLINICAL-SAFETY SETTING, unverified
 * with a local clinical lead (checklist C8, E3): the kit converts with exact factors, and a wrong unit here is a wrong result. */
export const US_BIRIMLER: Birimler = { agirlik: 'lb', boy: 'in', sicaklik: 'F' }
