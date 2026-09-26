/**
 * NEFROLOJI-EXCEPTIONAL-01 — Diyaliz seans / takip. SAF fonksiyon.
 * Modalite etiketi + seans tarihleri. Makine parametresi / UF / reçete / HIS YOK.
 */
import { ISO_GUN } from './nefroloji'
import type { Dipnot } from './nefroloji'

export type DiyalizModalite = 'hd' | 'pd' | 'hdf' | 'diger'

export const MODALITE_AD: Record<DiyalizModalite, string> = {
  hd: 'Hemodiyaliz (HD)',
  pd: 'Periton diyalizi (PD)',
  hdf: 'Hemodiafiltrasyon (HDF)',
  diger: 'Diğer / hekim etiketi',
}

export interface DiyalizKayit {
  modalite: DiyalizModalite
  tarih: string
  sonrakiSeans: string | null
  not: string | null
}

export interface DiyalizSonuc {
  tamamMi: boolean
  kayit: DiyalizKayit | null
  ozet: string
  dipnot: Dipnot
}

export function diyalizNormalize(ham: unknown): DiyalizKayit | null {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const mod = String(o.modalite || o.modality || '')
  if (!['hd', 'pd', 'hdf', 'diger'].includes(mod)) return null
  const tarih = String(o.tarih || '').slice(0, 10)
  if (!ISO_GUN.test(tarih)) return null
  const sonraki = o.sonrakiSeans ?? o.sonraki_seans
  const sonrakiSeans = sonraki == null ? null : String(sonraki).slice(0, 10)
  return {
    modalite: mod as DiyalizModalite,
    tarih,
    sonrakiSeans: sonrakiSeans && ISO_GUN.test(sonrakiSeans) ? sonrakiSeans : null,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function diyalizSkorla(ham: unknown): DiyalizSonuc {
  const dipnot: Dipnot = { ref: 'TND_DIYALIZ', not: 'Seans tarihi karar desteği; diyaliz makinesi HIS’i ve reçete ürünün parçası değil' }
  const kayit = diyalizNormalize(ham)
  if (!kayit) {
    return { tamamMi: false, kayit: null, ozet: 'Modalite ve seans tarihi gerekli — makine parametresi yazılmaz', dipnot }
  }
  return {
    tamamMi: true,
    kayit,
    ozet: `${MODALITE_AD[kayit.modalite]} · seans ${kayit.tarih}${kayit.sonrakiSeans ? ` · sonraki ${kayit.sonrakiSeans}` : ''}. UF / reçete / cihaz HIS Notya kapsamı dışıdır.`,
    dipnot,
  }
}

export function diyalizGorevleri(k: DiyalizKayit): Array<{ kod: string; ad: string; due: string }> {
  if (!k.sonrakiSeans) return []
  return [{ kod: 'diyaliz_seans', ad: 'Diyaliz seans / kontrol', due: k.sonrakiSeans }]
}

/** Makine HIS / UF / reçete sızıntısı yakala. */
export function diyalizHisIceriyorMu(metin: string): boolean {
  return /\bUF\b|Kt\/V|kan ak[ıi]m[ıi]|dialysate|makine re[çc]ete|HIS diyaliz|üretim reçetesi/i.test(metin)
}

export const DIYALIZ_KONTROL_LISTESI: readonly string[] = [
  'Modalite (HD / PD / HDF) hekim tarafından belirlendi',
  'Sonraki seans / kontrol tarihi hasta ile paylaşıldı',
  'Vasküler erişim / kateter durumu hekim notunda (cihaz HIS yok)',
  'Acil belirtiler (nefes darlığı, göğüs ağrısı) anlatıldı → 112',
  'Makine parametresi / UF / reçete bu üründe yazılmaz',
]
