/**
 * AYSE-OGRENME-V3 / 1 — Öğrenme ivmesi. Saf: ölçülmüş, dürüst bir metrik.
 * Veri: onay anında yazılan gerçek düzeltme sayısı (duzeltmeAnaliz çıktısı). Uydurma sayı yok:
 * 3'ten az onaylı not → boş durum; yön yalnız yeterli veri varken söylenir.
 */
import type { OgrenmeMetni } from './metinler'

export interface OnayMetrigi {
  note_id: string
  duzeltme_sayisi: number
  onay_at: string
}

export const IVME_MIN_NOT = 3
/** Yön için her uçtan en az bu kadar not (ilk 3 vs son 3). */
export const IVME_YON_MIN_NOT = 6
const ESIK_ORAN = 0.15

export type IvmeYon = 'azaliyor' | 'sabit' | 'artiyor' | 'erken'

export interface IvmeSonucu {
  yeterli: boolean
  n: number
  seri: { tarih: string; duzeltme: number }[]
  ilkOrtalama: number | null
  sonOrtalama: number | null
  yon: IvmeYon
}

const yuvarla = (x: number) => Math.round(x * 10) / 10
const ort = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length

function temiz(m: OnayMetrigi[]): OnayMetrigi[] {
  const son = new Map<string, OnayMetrigi>()
  for (const x of m) {
    if (!x || !x.note_id || !Number.isFinite(x.duzeltme_sayisi) || x.duzeltme_sayisi < 0 || !Number.isFinite(Date.parse(x.onay_at))) continue
    son.set(x.note_id, x)
  }
  return [...son.values()].sort((a, b) => Date.parse(a.onay_at) - Date.parse(b.onay_at))
}

export function ivmeHesapla(metrikler: OnayMetrigi[]): IvmeSonucu {
  const m = temiz(metrikler)
  const seri = m.map((x) => ({ tarih: x.onay_at.slice(0, 10), duzeltme: x.duzeltme_sayisi }))
  if (m.length < IVME_MIN_NOT) {
    return { yeterli: false, n: m.length, seri: [], ilkOrtalama: null, sonOrtalama: null, yon: 'erken' }
  }
  if (m.length < IVME_YON_MIN_NOT) {
    return { yeterli: true, n: m.length, seri, ilkOrtalama: yuvarla(m[0].duzeltme_sayisi), sonOrtalama: yuvarla(m[m.length - 1].duzeltme_sayisi), yon: 'erken' }
  }
  const ilk = ort(m.slice(0, 3).map((x) => x.duzeltme_sayisi))
  const son = ort(m.slice(-3).map((x) => x.duzeltme_sayisi))
  const taban = Math.max(ilk, 1)
  const fark = (son - ilk) / taban
  const yon: IvmeYon = fark <= -ESIK_ORAN ? 'azaliyor' : fark >= ESIK_ORAN ? 'artiyor' : 'sabit'
  return { yeterli: true, n: m.length, seri, ilkOrtalama: yuvarla(ilk), sonOrtalama: yuvarla(son), yon }
}

export interface HaftalikOzet {
  buHaftaOrtalama: number
  buHaftaNot: number
  oncekiHaftaOrtalama: number | null
}

const GUN = 86_400_000

/** Son 7 gün; önceki 7 günle karşılaştırma yalnız orada ≥2 not varsa. Toplam <3 not → null. */
export function haftalikHesapla(metrikler: OnayMetrigi[], simdi: number = Date.now()): HaftalikOzet | null {
  const m = temiz(metrikler)
  if (m.length < IVME_MIN_NOT) return null
  const bu = m.filter((x) => { const t = Date.parse(x.onay_at); return t <= simdi && t > simdi - 7 * GUN })
  if (!bu.length) return null
  const once = m.filter((x) => { const t = Date.parse(x.onay_at); return t <= simdi - 7 * GUN && t > simdi - 14 * GUN })
  return {
    buHaftaOrtalama: yuvarla(ort(bu.map((x) => x.duzeltme_sayisi))),
    buHaftaNot: bu.length,
    oncekiHaftaOrtalama: once.length >= 2 ? yuvarla(ort(once.map((x) => x.duzeltme_sayisi))) : null,
  }
}

export function haftalikSatiri(o: HaftalikOzet | null, t: OgrenmeMetni): string | null {
  if (!o) return null
  return t.haftalik(String(o.buHaftaOrtalama), o.buHaftaNot, o.oncekiHaftaOrtalama == null ? null : String(o.oncekiHaftaOrtalama))
}

export function ivmeYonMetni(s: IvmeSonucu, t: OgrenmeMetni): string {
  if (s.yon === 'azaliyor') return t.ivmeAzaliyor
  if (s.yon === 'artiyor') return t.ivmeArtiyor
  if (s.yon === 'sabit') return t.ivmeSabit
  return t.ivmeErken
}
