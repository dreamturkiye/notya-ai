/**
 * NOTYA-MESLEKTAS-V2 Faz 1 — deltalardan kural.
 * 2 bağımsız not → UYGULANIR (ilaç değişimi 3). Doz DEĞERİ asla kural olmaz.
 */

import { anahtarSlug } from '@/lib/doktor/hafiza'
import type { DeltaTur, DuzeltmeDelta } from './duzeltmeAnaliz'

export type KuralKategori = 'uslup' | 'klinik' | 'uygulama'
export type KuralDurum = 'aday' | 'uygulanir' | 'kapali'

export interface KuralAday {
  anahtarSlug: string
  kategori: KuralKategori
  deger: string
  tur: DeltaTur
  ornek: string
  noteId?: string
}

const ESİK: Record<string, number> = {
  ilac_degisimi: 3,
  doz_bicimi: 2,
  terim: 2,
  silme: 2,
  ekleme: 2,
  yeniden_yazma: 2,
  uzunluk: 2,
  sira: 2,
}

export function kuralEsigi(tur: DeltaTur): number {
  if (tur === 'doz_degeri') return Infinity
  return ESİK[tur] ?? 2
}

export function kuralDurumHesapla(kanit: number, tur: DeltaTur): KuralDurum | 'atlanir' {
  if (tur === 'doz_degeri') return 'atlanir'
  if (kanit <= 0) return 'atlanir'
  const esik = kuralEsigi(tur)
  if (kanit >= esik) return 'uygulanir'
  return 'aday'
}

function kategori(tur: DeltaTur): KuralKategori {
  if (tur === 'ilac_degisimi') return 'klinik'
  if (tur === 'doz_bicimi') return 'uygulama'
  return 'uslup'
}

/** Deterministik Türkçe emir — model yok. */
export function kuralCumlesi(d: DuzeltmeDelta): string {
  switch (d.tur) {
    case 'terim':
      return `"${d.terimOnceki || d.onceki}" yerine "${d.terimSonraki || d.sonraki}" yaz`
    case 'silme':
      return `Şu kalıbı nottan çıkar: ${d.onceki.slice(0, 80)}`
    case 'ekleme':
      return `Şu satırı ekle: ${d.sonraki.slice(0, 80)}`
    case 'yeniden_yazma':
      return `Bu bölümü doktorun cümlesiyle yaz: ${d.sonraki.slice(0, 80)}`
    case 'uzunluk':
      return (d.oran || 1) < 1 ? 'Bu bölümü daha kısa tut' : 'Bu bölümü daha ayrıntılı yaz'
    case 'sira':
      return `Bölüm sırası: ${d.sonraki}`
    case 'ilac_degisimi':
      return `${d.ilacOnceki || d.onceki} yerine ${d.ilacSonraki || d.sonraki} yaz (aynı endikasyon)`
    case 'doz_bicimi':
      return 'mg/kg/gün yazma, günlük toplam yaz'
    case 'doz_degeri':
      return ''
  }
}

function slugKaynak(d: DuzeltmeDelta): string {
  if (d.tur === 'terim') return `terim-${d.terimOnceki}-${d.terimSonraki}`
  if (d.tur === 'ilac_degisimi') return `ilac-${d.ilacOnceki}-${d.ilacSonraki}`
  if (d.tur === 'doz_bicimi') return 'doz-bicimi-gunluk-toplam'
  if (d.tur === 'sira') return `sira-${d.alan}`
  if (d.tur === 'uzunluk') return `uzunluk-${d.alan}`
  if (d.tur === 'silme') return `silme-${d.alan}-${d.onceki.slice(0, 24)}`
  if (d.tur === 'ekleme') return `ekleme-${d.alan}-${d.sonraki.slice(0, 24)}`
  if (d.tur === 'yeniden_yazma') return `yeniden-${d.alan}`
  return `${d.tur}-${d.alan}`
}

export function deltalardanAdaylar(deltolar: DuzeltmeDelta[], noteId?: string): KuralAday[] {
  const gorulen = new Set<string>()
  const out: KuralAday[] = []
  for (const d of deltolar) {
    if (d.tur === 'doz_degeri') continue
    const deger = kuralCumlesi(d)
    if (!deger) continue
    const slug = anahtarSlug(slugKaynak(d))
    if (!slug || gorulen.has(slug)) continue
    gorulen.add(slug)
    out.push({
      anahtarSlug: slug,
      kategori: kategori(d.tur),
      deger,
      tur: d.tur,
      ornek: (d.sonraki || d.onceki).slice(0, 120),
      noteId,
    })
  }
  return out
}

export interface HafizaKuralSatiri {
  anahtar: string
  kategori: KuralKategori
  deger: string
  kaynak: 'duzeltme'
  kanit_sayisi: number
  durum: KuralDurum
  ornekler: string[]
  kanit_not_idler: string[]
  aktif: boolean
}

/** Aynı nota ikinci kez bakılmaz. Doz değeri satırı üretilmez. */
export function kuraliBirlesitir(
  mevcut: HafizaKuralSatiri | null,
  aday: KuralAday,
): HafizaKuralSatiri | null {
  if (mevcut?.durum === 'kapali' || mevcut?.aktif === false) return mevcut
  const notlar = mevcut?.kanit_not_idler || []
  if (aday.noteId && notlar.includes(aday.noteId)) return mevcut
  const kanit = (mevcut?.kanit_sayisi || 0) + 1
  const durum = kuralDurumHesapla(kanit, aday.tur)
  if (durum === 'atlanir') return mevcut
  const ornekler = [...(mevcut?.ornekler || []), aday.ornek].filter(Boolean).slice(-3)
  return {
    anahtar: aday.anahtarSlug,
    kategori: aday.kategori,
    deger: aday.deger.slice(0, 300),
    kaynak: 'duzeltme',
    kanit_sayisi: kanit,
    durum,
    ornekler,
    kanit_not_idler: aday.noteId ? [...notlar, aday.noteId].slice(-12) : notlar,
    aktif: true,
  }
}
