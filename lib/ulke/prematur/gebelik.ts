/**
 * PREMATUR-ULKE-01 — the pregnancy record as the doctor enters it, CLEANED. Pure and client-safe: the screen cleans a draft with it
 * before it shows the evaluation, and the server cleans what it is sent with the same function before it keeps anything.
 */
import type { GebelikGirdisi } from './apiTipleri'
import { erkenDogumTemizle, type TemizlemeHatasi } from './erkenDogum'
import { gecerliGun } from './tarih'

export const COGUL = ['tekil', 'ikiz', 'ucuz-ve-ustu'] as const

/** The pregnancy as sent or stored, cleaned. `hata` = a code the screen words (a value that cannot be kept). */
export function gebelikTemizle(ham: unknown, bugun: string): { e: GebelikGirdisi; hata: TemizlemeHatasi | 'gebelik-tarih' | null } {
  const r = (ham && typeof ham === 'object' && !Array.isArray(ham) ? ham : {}) as Record<string, unknown>
  const gun = (v: unknown): string | null => (typeof v === 'string' && gecerliGun(v.slice(0, 10)) ? v.slice(0, 10) : null)
  const sat = gun(r.sat), tdt = gun(r.tdt)
  const { kayit, hata } = erkenDogumTemizle(r.kayit, bugun)
  // The last menstrual period cannot be later than today.
  const ileri = sat !== null && sat > bugun
  return {
    e: {
      sat, tdt, kayit,
      cogulTipi: COGUL.includes(r.cogulTipi as (typeof COGUL)[number]) ? (r.cogulTipi as GebelikGirdisi['cogulTipi']) : null,
      durum: r.durum === 'dogum_yapti' ? 'dogum_yapti' : 'aktif',
    },
    hata: ileri ? 'gebelik-tarih' : hata,
  }
}

