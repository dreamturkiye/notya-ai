/**
 * NOTYA-ASISTAN-SABLON — the English language set: one professor for every role, on the shared chart core.
 *
 * MACHINE-WRITTEN. A clinician of the country has not read the three titles. The screen shows a title, not a
 * personal name: the owner names her. The chart rules are not written here (lib/asistan/cekirdekEgitim.ts).
 * The two international books are not written here (lib/ulke/asistan/kitaplar.ts, from the shared secondary list).
 * The country states only its national source, one line per role.
 */
import type { RolTanimi } from '@/lib/ulke/arayuz/tipler'
import { ikiUluslararasi } from '@/lib/ulke/asistan/kitaplar'
import { asistanKimligiKur, asistanTalimatiKur, ucKaynak, type AsistanCumleleri } from '@/lib/ulke/asistan/sablon'
import { enYaz, type EnBicim } from './varyant'

/** Written in en-GB. enYaz makes the other forms. The three titles are inserted afterwards, as published. */
const CUMLE: AsistanCumleleri = {
  profesor: 'You are a professor of %s with more than twenty years of clinical practice in %c.',
  kidemli: 'You are a senior %s with more than twenty years of practice in %c. You are not a doctor. Make no medical diagnosis and prescribe nothing.',
  kaynak: 'Your three references, and no others, are: (1) %1 (2) %2 (3) %3. A clinician of this country has not read these titles. Name only these. Where a reference and the record disagree, the record is what happened.',
}

export type EnAsistanGirdisi = {
  bicim: EnBicim
  ulkeAdi: string
  /** National source, one per role key of THIS country, including roles only this country has. */
  ulusal: Readonly<Record<string, string>>
  /** Titles for a role the shared catalogue does not know. */
  ekKitap?: Readonly<Record<string, readonly [string, string]>>
  roller: readonly RolTanimi[]
}

function rolGirdisi(g: EnAsistanGirdisi, anahtar: string) {
  const r = g.roller.find((x) => x.anahtar === anahtar)
  if (!r) return null
  const ulusal = g.ulusal[anahtar]
  if (!ulusal?.trim()) throw new Error(`enAsistan: ${anahtar} has no national reference`)
  const [a, b] = g.ekKitap?.[anahtar] ?? ikiUluslararasi(anahtar, r.gibi)
  const uzmanlik = r.ad[g.bicim] ?? anahtar
  return { uzmanlik, taraf: r.taraf, kaynaklar: ucKaynak([ulusal, a, b]) }
}

export function enAsistan(g: EnAsistanGirdisi) {
  const cumle: AsistanCumleleri = {
    profesor: enYaz(CUMLE.profesor, g.bicim),
    kidemli: enYaz(CUMLE.kidemli, g.bicim),
    kaynak: enYaz(CUMLE.kaynak, g.bicim),
  }
  return {
    kimlik: (rol: string) => {
      const x = rolGirdisi(g, rol)
      return x ? asistanKimligiKur(x) : null
    },
    talimat: (rol: string) => {
      const x = rolGirdisi(g, rol)
      return x ? asistanTalimatiKur(g.ulkeAdi, x, 'en', cumle) : null
    },
  }
}
