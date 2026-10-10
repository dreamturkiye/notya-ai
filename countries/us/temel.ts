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
 * What the audit of 2026-10-09 read: the federal privacy rule leaves a minor's consent to state law
 * (hhs.gov/hipaa/for-professionals/faq/personal-representatives-and-minors); Nebraska sets majority at 19
 * (nebraskalegislature.gov/laws/statutes.php?statute=43-2101); Oregon lets a minor of 15 consent to medical
 * treatment (ORS 109.640). One number cannot be right in every state: FOR A LAWYER.
 */
export const US_VELI_YASI = 18

/** Units a clinic in the United States records in: pounds, inches, degrees Fahrenheit. A CLINICAL-SAFETY SETTING, unverified
 * with a local clinical lead (checklist C8, E3): the kit converts with exact factors, and a wrong unit here is a wrong result.
 * FOR A LOCAL CLINICAL LEAD (audit of 2026-10-09): these are the units a PATIENT states on the intake form. For a
 * clinician's own entries the Emergency Nurses Association asks for weights "in kilograms only" and names other
 * safety bodies that ask the same (ena.org/sites/default/files/2025-08/Weighing%20All%20Patients%20in%20Kilograms%20Position%20Statement.pdf).
 * The kit has ONE unit setting for both; no live tool of this pack takes a body weight, and a test holds that. */
export const US_BIRIMLER: Birimler = { agirlik: 'lb', boy: 'in', sicaklik: 'F' }
