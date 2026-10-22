/**
 * NOTYA-ULKE-EN-01 — Australia: what the pack brings for the country kit's shared screens. CONTENT ONLY.
 * Reached only through countries/active/arayuz, read through lib/ulke/arayuz.
 *
 * Nothing is written here: the English language set (countries/_dil/en/arayuz.ts) assembles the catalogues, the role
 * names, the note templates, the tools and the landing copy in Australian spelling (en-AU) from what this country states in
 * ./ayarlar.ts.
 */
import type { AsistanKimligi, UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { enArayuz } from '../_dil/en/arayuz'
import { AU_KONSULTASYON_METNI } from './araclar/konsultasyonMetinleri'
import { AU_GIRDI } from './ayarlar'
import { auAsistanAdi } from './klinik/asistanAdlari'
import { auAsistanKaynaklari } from './asistan/kaynaklar'
import { AU_SES } from './ses'
import { AU_YASAL_NOTLARI } from './uzanti/acilis'

const temel = enArayuz(AU_GIRDI)
const sunulan = new Set(temel.roller.map((r) => r.anahtar))

/**
 * WHO the assistant is for a role this pack offers: one invented name per role (./klinik/asistanAdlari.ts),
 * the same structure the Turkish product and the Uzbek pack use — never one shared identity across every role.
 *
 * FIXED 2026-10-20 (NOTYA-AU-ASISTAN-ISIM-01): a Cursor change had this return the glued string
 * "Charlie and Clara" — both voice names — as a single "identity" for every one of the 44 roles. Charlie and
 * Clara are ../ses.ts's two VOICES, never identities. A role's persona now carries its own name; the pack still
 * speaks with only those two voices (./ses.ts), by gender, never a third.
 */
export function auAsistanKimligi(rol: unknown): AsistanKimligi | null {
  if (typeof rol !== 'string' || !sunulan.has(rol)) return null
  const ad = auAsistanAdi(rol)
  if (!ad) return null
  const kaynaklar = auAsistanKaynaklari(rol)
  return {
    tamAd: ad.tamAd,
    kisaAd: ad.kisaAd,
    makineTuretimi: false,
    ...(kaynaklar ? { kaynaklar } : {}),
  }
}

/** AU-BETA-01: the shared English landing copy plus Australia's disclaimer block, on both landing pages. */
const acilis = temel.acilis
  ? {
      ...temel.acilis,
      icerik: Object.fromEntries(Object.entries(temel.acilis.icerik).map(([k, v]) => [k, v ? { ...v, yasalNotlari: AU_YASAL_NOTLARI, klinik: { ...v.klinik, yasalNotlari: AU_YASAL_NOTLARI } } : v])),
    }
  : temel.acilis

export const AU_ARAYUZ: UlkeArayuzu = {
  ...temel,
  acilis,
  // NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — the English language set has not written consultation between doctors
  // for any of the five English-speaking countries; Australia's own words are here, not in countries/_dil/en/.
  konsultasyonMetinleri: { 'en-AU': AU_KONSULTASYON_METNI },
  asistan: (rol) => auAsistanKimligi(rol),
  sesAdlari: { erkek: AU_SES.sesler.erkek.ad, kadin: AU_SES.sesler.kadin.ad },
}
