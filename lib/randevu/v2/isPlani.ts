/**
 * NOTYA-RANDEVU-V2 — when notifications are due and whether a due job still applies. Pure.
 * Reminders: the day before at 10:00 and the morning of at 08:00, Istanbul time (brief); stored as UTC.
 */
import { DAKIKA_MS, gunEkle, istanbulAn, istanbulYerelUtc } from './zaman'
import type { RandevuEpostaTuru } from './eposta'

export const GUN_ONCE_DK = 10 * 60
export const SABAH_DK = 8 * 60
/** A morning reminder later than one hour before the appointment is noise — skipped. */
export const SABAH_EN_GEC_ONCE_DK = 60

export type IsPlani = { tur: RandevuEpostaTuru; zaman: string }

/** Both reminder instants for an appointment start, unfiltered. */
export function hatirlatmaAnlari(baslangicIso: string): { gun_once: number; sabah: number } {
  const gun = istanbulAn(baslangicIso).gun
  return { gun_once: istanbulYerelUtc(gunEkle(gun, -1), GUN_ONCE_DK), sabah: istanbulYerelUtc(gun, SABAH_DK) }
}

/** Reminders still worth scheduling at `simdi`. */
export function hatirlatmaZamanlari(baslangicIso: string, simdi: number): IsPlani[] {
  const bas = Date.parse(baslangicIso)
  if (!Number.isFinite(bas) || bas <= simdi) return []
  const a = hatirlatmaAnlari(baslangicIso)
  const out: IsPlani[] = []
  if (a.gun_once > simdi && a.gun_once < bas) out.push({ tur: 'gun_once', zaman: new Date(a.gun_once).toISOString() })
  if (a.sabah > simdi && a.sabah <= bas - SABAH_EN_GEC_ONCE_DK * DAKIKA_MS) out.push({ tur: 'sabah', zaman: new Date(a.sabah).toISOString() })
  return out
}

/** Jobs to create when an appointment becomes (or stays) confirmed. */
export function onayIsleri(baslangicIso: string, simdi: number): IsPlani[] {
  return [{ tur: 'onay_eposta', zaman: new Date(simdi).toISOString() }, ...hatirlatmaZamanlari(baslangicIso, simdi)]
}

export type IsRandevusu = { durum: string; baslangic: string; oneri_at?: string | null }

/**
 * Re-checked when a job comes due: the appointment may have been cancelled, moved or answered since. A
 * reminder only fires for the time it was scheduled for (a moved appointment got fresh jobs).
 */
export function isGecerliMi(tur: RandevuEpostaTuru, zamanIso: string, r: IsRandevusu, simdi: number): boolean {
  const bas = Date.parse(r.baslangic)
  switch (tur) {
    case 'gun_once':
    case 'sabah': {
      if (r.durum !== 'onaylandi' || !(bas > simdi)) return false
      return hatirlatmaAnlari(r.baslangic)[tur] === Date.parse(zamanIso)
    }
    case 'onay_eposta':
      return r.durum === 'onaylandi' && bas > simdi
    case 'oneri_eposta':
      return r.durum === 'talep' && !!r.oneri_at && bas > simdi
    case 'red_eposta':
    case 'iptal_eposta':
      return r.durum === 'iptal'
    case 'bekleme_teklif':
      // Offers are sent directly by lib/randevu/v2/bekleme.ts, never queued as jobs.
      return false
  }
}
