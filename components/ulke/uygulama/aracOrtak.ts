/**
 * NOTYA-ULKE-ARACLAR-01 — what the tools screen, the patient's file and the follow-up list share: the addresses of
 * the tools area, the pack's units, how this country writes a number and a day, and a tool's two halves by its key.
 * A leaf: it imports no screen, so every screen can import it.
 */
import { tarihYaz } from '@/lib/ulke/arayuz/bicim'
import { sayiYaz } from '@/lib/ulke/arayuz/sayi'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeYolu } from '@/lib/ulke/yol'
import type { BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { bicimli, type GorunurArac, type Yazici } from '@/lib/ulke/araclar/paket'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { UYGULAMA_EKRANLARI } from '@/lib/ulke/tipler'

const ARACLAR = ulkeYolu(UYGULAMA_EKRANLARI.araclar)

/** The grid — for one patient when the tools were opened from that patient's file. */
export const araclarYolu = (hastaId?: string | null): string => (hastaId ? `${ARACLAR}?hasta=${encodeURIComponent(hastaId)}` : ARACLAR)
/** The address of one tool — for one patient when the tools were opened from that patient's file. */
export const aracYolu = (anahtar: string, hastaId?: string | null): string => `${ARACLAR}?arac=${encodeURIComponent(anahtar)}${hastaId ? `&hasta=${encodeURIComponent(hastaId)}` : ''}`

/** The pack's units, as the tools need them. */
export function birimOrtami(icerik: UlkeAraclari): BirimOrtami {
  const u = ulkePaketi().uygulama
  if (!u) throw new Error('[ulke/araclar] the pack has no application settings')
  return { birimler: u.birimler, lab: icerik.labBirimleri }
}

/** How this country writes a number, a day and a unit, in the form `dil`. */
export function yazici(icerik: UlkeAraclari, dil: string): Yazici {
  return { sayi: (d, o) => sayiYaz(d, o), tarih: (iso) => tarihYaz(iso), birim: (kod) => bicimli(icerik.birimler[kod], dil) }
}

/**
 * A tool by its key, WITHOUT the role gate: for reading what was kept (a result stays in the patient's file when the
 * account's role changes). null = the pack or the kit no longer has the tool. Never used to open a tool.
 */
export function paketAraci(icerik: UlkeAraclari, anahtar: string): GorunurArac | null {
  const paket = icerik.araclar.find((p) => p.anahtar === anahtar)
  const tanim = kitAraci(anahtar)
  return paket && tanim ? { tanim, paket } : null
}
