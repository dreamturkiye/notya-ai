/**
 * NOTYA-RANDEVU-V2 PR2 — Notya ⇄ Google Calendar event shapes. Pure.
 *
 * Notya → Google: a confirmed appointment becomes an event whose title is the patient's initials (KVKK default;
 * the full name only when the doctor turned it on). No type, reason, note or phone ever goes to Google. The
 * event id is derived from the appointment id, so a retried insert can never create a duplicate.
 * Google → Notya: any other event becomes a busy block — start and end only. Free (transparent) and cancelled
 * events release their block. Events we created are recognised by a private extended property.
 */
import { istanbulYerelUtc } from '../zaman'

export const NOTYA_ANAHTARI = 'notyaRandevuId'

/** "Ali Veli Yılmaz" → "A. V. Y." (Turkish upper case). Empty name → "Hasta". */
export function basHarfler(ad: string | null | undefined): string {
  const parcalar = String(ad || '').trim().split(/\s+/).filter(Boolean)
  if (!parcalar.length) return 'Hasta'
  return parcalar.map((p) => `${p[0].toLocaleUpperCase('tr-TR')}.`).join(' ')
}

export function etkinlikBasligi(hastaAdi: string | null | undefined, tamAd: boolean): string {
  const ad = String(hastaAdi || '').replace(/\s+/g, ' ').trim()
  return tamAd && ad ? ad : basHarfler(ad)
}

/** Google event ids are base32hex (0-9, a-v), 5–1024 chars: "notya" is not, so the prefix is "n0" + hex uuid. */
export function etkinlikKimligi(randevuId: string): string {
  return `n0${randevuId.replace(/-/g, '').toLowerCase()}`
}

export type GoogleEtkinligi = {
  id?: string
  status?: string
  transparency?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  extendedProperties?: { private?: Record<string, string> }
}

export function googleGovdesi(r: { id: string; baslangic: string; bitis: string }, baslik: string): Record<string, unknown> {
  return {
    summary: baslik,
    description: 'Notya randevusu',
    start: { dateTime: new Date(r.baslangic).toISOString(), timeZone: 'Europe/Istanbul' },
    end: { dateTime: new Date(r.bitis).toISOString(), timeZone: 'Europe/Istanbul' },
    status: 'confirmed',
    transparency: 'opaque',
    extendedProperties: { private: { [NOTYA_ANAHTARI]: r.id } },
  }
}

function an(z: { dateTime?: string; date?: string } | undefined): number | null {
  if (!z) return null
  if (z.dateTime) {
    const t = Date.parse(z.dateTime)
    return Number.isFinite(t) ? t : null
  }
  // All-day: Istanbul midnight of that date (end date is exclusive in Google, as here).
  if (z.date && /^\d{4}-\d{2}-\d{2}$/.test(z.date)) return istanbulYerelUtc(z.date, 0)
  return null
}

export type GelenEtkinlik =
  | { tur: 'mesgul'; disId: string; bas: number; son: number }
  | { tur: 'mesgul_sil'; disId: string }
  | { tur: 'notya'; randevuId: string; bas: number | null; son: number | null; silindi: boolean }
  | { tur: 'atla' }

export function gelenEtkinlik(e: GoogleEtkinligi): GelenEtkinlik {
  if (!e.id) return { tur: 'atla' }
  const notyaId = e.extendedProperties?.private?.[NOTYA_ANAHTARI]
  const silindi = e.status === 'cancelled'
  if (notyaId) return { tur: 'notya', randevuId: notyaId, bas: an(e.start), son: an(e.end), silindi }
  if (silindi || e.transparency === 'transparent') return { tur: 'mesgul_sil', disId: e.id }
  const bas = an(e.start)
  const son = an(e.end)
  if (bas === null || son === null || son <= bas) return { tur: 'atla' }
  return { tur: 'mesgul', disId: e.id, bas, son }
}

/**
 * How a Google-side change to one of OUR events compares with what Notya last pushed. Our own push echoes back
 * with identical times → 'yok'. Anything else is the doctor (or someone) editing in Google → a proposal.
 */
export function cakismaKarari(
  eslesme: { baslangic: string; bitis: string; durum: string } | null,
  gelen: { bas: number | null; son: number | null; silindi: boolean },
): { tur: 'yok' } | { tur: 'silindi' } | { tur: 'tasindi'; bas: number; son: number } {
  if (!eslesme || eslesme.durum !== 'aktif') return { tur: 'yok' }
  if (gelen.silindi) return { tur: 'silindi' }
  if (gelen.bas === null || gelen.son === null) return { tur: 'yok' }
  if (gelen.bas === Date.parse(eslesme.baslangic) && gelen.son === Date.parse(eslesme.bitis)) return { tur: 'yok' }
  return { tur: 'tasindi', bas: gelen.bas, son: gelen.son }
}

/** Busy blocks we keep: anything overlapping [now − 1 day, now + 400 days]. */
export function saklanirMi(bas: number, son: number, simdi: number): boolean {
  return son > simdi - 86_400_000 && bas < simdi + 400 * 86_400_000
}
