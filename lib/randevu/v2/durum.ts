/**
 * NOTYA-RANDEVU-V2 — appointment states of the new flow, mapped onto what already exists. Pure, client-safe.
 *
 *   V2 state       stored as
 *   talep          durum = 'talep'                          (new value, migration 116)
 *   onaylandi      durum = 'onaylandi', hasta_teyit_at NULL (existing value)
 *   teyit_edildi   durum = 'onaylandi', hasta_teyit_at set  (column, not a durum: existing queue / reminder
 *                                                            code only knows planlandi + onaylandi)
 *   geldi          durum = 'tamamlandi'                     (existing value)
 *   gelmedi        durum = 'gelmedi'                        (existing value)
 *   iptal          durum = 'iptal'                          (existing value)
 * A legacy 'planlandi' row (booked by the practice, not yet confirmed) is shown as such.
 */
import type { PortalRandevuAyari } from './ayar'

export type V2Durum = 'talep' | 'planlandi' | 'onaylandi' | 'teyit_edildi' | 'geldi' | 'gelmedi' | 'iptal'

export const V2_ETIKET: Record<V2Durum, string> = {
  talep: 'Onay bekliyor',
  planlandi: 'Planlandı',
  onaylandi: 'Onaylandı',
  teyit_edildi: 'Geleceğini bildirdi',
  geldi: 'Geldi',
  gelmedi: 'Gelmedi',
  iptal: 'İptal',
}

export type RandevuDurumSatiri = {
  durum: string
  baslangic: string
  hasta_teyit_at?: string | null
  oneri_at?: string | null
}

export function v2Durum(r: RandevuDurumSatiri): V2Durum {
  switch (r.durum) {
    case 'talep':
      return 'talep'
    case 'onaylandi':
      return r.hasta_teyit_at ? 'teyit_edildi' : 'onaylandi'
    case 'tamamlandi':
      return 'geldi'
    case 'gelmedi':
      return 'gelmedi'
    case 'iptal':
      return 'iptal'
    default:
      return 'planlandi'
  }
}

/** Active = holds its slot and may still happen. */
export function aktifMi(r: RandevuDurumSatiri): boolean {
  return ['talep', 'planlandi', 'onaylandi'].includes(r.durum)
}

/** A doctor's alternative-time proposal is waiting for the patient. */
export function oneriBekliyorMu(r: RandevuDurumSatiri): boolean {
  return r.durum === 'talep' && !!r.oneri_at
}

export type HastaIzinleri = { iptal: boolean; ertele: boolean; teyit: boolean; neden: string | null }

/**
 * What the patient may do on their own appointment right now, under the doctor's cutoff (iptal_sinir_saat).
 * A pending request (talep) can always be withdrawn — it is not a confirmed slot yet.
 */
export function hastaIzinleri(r: RandevuDurumSatiri, ayar: Pick<PortalRandevuAyari, 'iptalSinirSaat'>, simdi: number): HastaIzinleri {
  const bas = Date.parse(r.baslangic)
  if (!aktifMi(r) || !Number.isFinite(bas) || bas <= simdi) {
    return { iptal: false, ertele: false, teyit: false, neden: 'Bu randevu artık değiştirilemez.' }
  }
  const teyit = r.durum === 'onaylandi' && !r.hasta_teyit_at
  if (r.durum === 'talep') return { iptal: true, ertele: true, teyit: false, neden: null }
  const sinirIcinde = bas - simdi >= ayar.iptalSinirSaat * 3_600_000
  if (!sinirIcinde) {
    return {
      iptal: false,
      ertele: false,
      teyit,
      neden: `Randevuya ${ayar.iptalSinirSaat} saatten az kaldığı için değişiklik muayenehaneyi arayarak yapılabilir.`,
    }
  }
  return { iptal: true, ertele: true, teyit, neden: null }
}

/** A request the practice has not answered within eskalasyon_saat — shown in red, never dropped. */
export function eskalasyonGerekliMi(r: { durum: string; talep_at?: string | null; oneri_at?: string | null }, ayar: Pick<PortalRandevuAyari, 'eskalasyonSaat'>, simdi: number): boolean {
  if (r.durum !== 'talep' || r.oneri_at) return false
  const t = Date.parse(String(r.talep_at || ''))
  return Number.isFinite(t) && simdi - t >= ayar.eskalasyonSaat * 3_600_000
}

/** Does a new request from this patient need a person's approval? */
export function onayGerekirMi(ayar: Pick<PortalRandevuAyari, 'onayModu'>, mevcutHasta: boolean): boolean {
  return !(ayar.onayModu === 'mevcut_hasta_otomatik' && mevcutHasta)
}
