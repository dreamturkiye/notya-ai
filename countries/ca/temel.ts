/**
 * NOTYA-ULKE-EN-01 — Canada: the two settings BOTH halves of the pack read, the light file (./index.ts) and what the
 * country states to the language set (./ayarlar.ts). Plain data, type-only imports: the middleware and the browser
 * bundle load this through ./index.ts, and nothing of the tools' arithmetic comes with it.
 *
 * MACHINE-WRITTEN AND UNVERIFIED: nobody in Canada has confirmed either value (see ./ayarlar.ts).
 */
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: consent of minors is a matter of provincial law and differs by province (Quebec
 * sets its own age); what that means for this product's wording and for the form a parent fills in is a legal question.
 */
export const CA_VELI_YASI = 16

/** Units a clinic in Canada records in: SI. Unverified with a local clinical lead (checklist C8, E3). */
export const CA_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }
