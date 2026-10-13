/**
 * NOTYA-ULKE-EN-01 — Australia: the two settings BOTH the pack's light settings file (./index.ts, loaded by the
 * middleware and the browser) and its statement file (./ayarlar.ts) read. Plain data, type-only imports: ./ayarlar.ts
 * now brings the mechanisms of Australia's own tools, which the light file must not pull in.
 *
 * MACHINE-WRITTEN AND UNVERIFIED. Nobody in Australia has confirmed either value (docs/COUNTRY-PACK-AUSTRALIA.md).
 */
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: consent of minors differs by state and territory; what that means for this
 * product's wording and for the form a parent fills in is a legal question.
 */
export const AU_VELI_YASI = 16

/** Units a clinic in Australia records in: SI. Unverified with a local clinical lead (checklist C8, E3). */
export const AU_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }
