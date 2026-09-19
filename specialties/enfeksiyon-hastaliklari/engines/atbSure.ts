/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Antibiyotik süre sayacı. SAF fonksiyon.
 * Başlangıç + süre gün → bitiş / kontrol. Doz, mg, etken madde invent YOK.
 */
import type { Dipnot } from './enfeksiyon'
import { gunEkle, ISO_GUN } from './enfeksiyon'

export interface AtbKart {
  baslangic: string | null
  sureGun: number | null
  bitis: string | null
  kontrol: string | null
  sinifEtiket: string | null
  not: string | null
}

export interface AtbSonuc {
  tamamMi: boolean
  kart: AtbKart
  ozet: string
  dipnot: Dipnot
}

export function atbHesapla(baslangic: string | null | undefined, sureGunHam: number | null | undefined, kontrol?: string | null, sinifEtiket?: string | null, not?: string | null): AtbSonuc {
  const dipnot: Dipnot = { ref: 'SB_ATB', not: 'ATB süre karar desteğidir; doz ve rejim hekimindir' }
  if (!baslangic || !ISO_GUN.test(baslangic)) {
    return {
      tamamMi: false,
      kart: { baslangic: null, sureGun: null, bitis: null, kontrol: null, sinifEtiket: null, not: null },
      ozet: 'Başlangıç tarihi eksik — süre yorumlanmaz',
      dipnot,
    }
  }
  const sureGun = sureGunHam == null ? null : Number(sureGunHam)
  if (sureGun == null || !Number.isFinite(sureGun) || sureGun < 1 || sureGun > 365) {
    return {
      tamamMi: false,
      kart: { baslangic, sureGun: null, bitis: null, kontrol: null, sinifEtiket: null, not: null },
      ozet: 'Süre 1–365 gün olmalı — doz yazılmaz',
      dipnot,
    }
  }
  const bitis = gunEkle(baslangic, sureGun)
  const kontrolTarih = kontrol && ISO_GUN.test(kontrol) ? kontrol : bitis
  const sinif = sinifEtiket ? String(sinifEtiket).slice(0, 80) : null
  const notMetin = not ? String(not).slice(0, 500) : null
  const kart: AtbKart = { baslangic, sureGun, bitis, kontrol: kontrolTarih, sinifEtiket: sinif, not: notMetin }
  return {
    tamamMi: true,
    kart,
    ozet: `ATB süre: ${baslangic} → ${bitis} (${sureGun} gün)${sinif ? ` · sınıf: ${sinif}` : ''}. Kontrol ${kontrolTarih}. Doz ve etken madde hekimin — Notya invent etmez.`,
    dipnot,
  }
}

export function atbNormalize(ham: unknown): AtbKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const sure = o.sureGun ?? o.sure_gun
  return {
    baslangic: tarih(o.baslangic),
    sureGun: sure == null || sure === '' ? null : Number(sure),
    bitis: tarih(o.bitis),
    kontrol: tarih(o.kontrol),
    sinifEtiket: o.sinifEtiket || o.sinif_etiket ? String(o.sinifEtiket || o.sinif_etiket).slice(0, 80) : null,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function atbGorevleri(k: AtbKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.bitis) out.push({ kod: 'atb_bitis', ad: 'Antibiyotik süre bitişi kontrolü', due: k.bitis })
  if (k.kontrol && k.kontrol !== k.bitis) out.push({ kod: 'atb_kontrol', ad: 'Antibiyotik kontrol randevusu', due: k.kontrol })
  return out
}

/** Doz / mg / etken madde sızıntısı yakala. */
export function atbDozIceriyorMu(metin: string): boolean {
  // "g" birimi yok — Türkçe "7 gün" yanlış pozitif üretmesin; klinik ATB dozu mg/mcg.
  return /\d+\s*(mg|mcg|µg|ug)\b|bid\b|tid\b|qid\b|q\d+h|doz şeması|mg\/kg/i.test(metin)
}
