/**
 * RADYOLOJI-EXCEPTIONAL-01 — Kritik bulgu bayrak + klinisyen bildirimi checklist.
 * SAF fonksiyon. Tanı / AI bulgu UYDURMAZ; hekim işaretler ve bildirimi kilitler.
 */
import { uydurmaBulguIceriyorMu, type Dipnot } from './radyoloji'

export type KritikBayrak =
  | 'pnomotoraks'
  | 'intrakranial_kanama'
  | 'aort_disseksiyon'
  | 'pulmoner_embolizm'
  | 'obstruktif_uropati'
  | 'apandisit_suphe'
  | 'kirik_acil'
  | 'diger_kritik'

export const KRITIK_BAYRAKLAR: Array<{ kod: KritikBayrak; ad: string }> = [
  { kod: 'pnomotoraks', ad: 'Pnömotoraks şüphesi (hekim)' },
  { kod: 'intrakranial_kanama', ad: 'İntrakranial kanama şüphesi (hekim)' },
  { kod: 'aort_disseksiyon', ad: 'Aort disseksiyonu şüphesi (hekim)' },
  { kod: 'pulmoner_embolizm', ad: 'Pulmoner emboli şüphesi (hekim)' },
  { kod: 'obstruktif_uropati', ad: 'Obstrüktif üropati şüphesi (hekim)' },
  { kod: 'apandisit_suphe', ad: 'Apandisit / akut karın görüntü şüphesi (hekim)' },
  { kod: 'kirik_acil', ad: 'Acil kırık / çıkık (hekim)' },
  { kod: 'diger_kritik', ad: 'Diğer kritik bulgu (hekim notu)' },
]

export type BildirimMadde =
  | 'klinisyen_arandi'
  | 'klinisyen_mesaj'
  | 'rapor_kritik_isaret'
  | 'hasta_yonlendirildi'
  | 'zaman_kaydi'
  | 'hekim_imza'

export const BILDIRIM_MADDELER: Array<{ kod: BildirimMadde; ad: string }> = [
  { kod: 'klinisyen_arandi', ad: 'İsteyen klinisyen telefon ile bilgilendirildi' },
  { kod: 'klinisyen_mesaj', ad: 'Klinik mesaj / konsültasyon kaydı açıldı' },
  { kod: 'rapor_kritik_isaret', ad: 'Raporda kritik bulgu işareti kondu' },
  { kod: 'hasta_yonlendirildi', ad: 'Hasta acil / klinik değerlendirmeye yönlendirildi' },
  { kod: 'zaman_kaydi', ad: 'Bildirim zamanı kaydedildi' },
  { kod: 'hekim_imza', ad: 'Radyoloji hekimi bildirimi kilitledi' },
]

export interface KritikSonuc {
  tamamMi: boolean
  bayraklar: KritikBayrak[]
  bildirim: BildirimMadde[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function kritikSkorla(bayrakHam: unknown, bildirimHam: unknown, not?: string | null): KritikSonuc {
  const dipnot: Dipnot = { ref: 'TRD', not: 'Kritik bulgu bildirimi kontrol listesi; tanıyı yapay zekâ üretmez' }
  const izinB = new Set(KRITIK_BAYRAKLAR.map((b) => b.kod))
  const izinM = new Set(BILDIRIM_MADDELER.map((m) => m.kod))
  const bayraklar = (Array.isArray(bayrakHam) ? bayrakHam.map(String) : []).filter((k): k is KritikBayrak => izinB.has(k as KritikBayrak))
  const bildirim = (Array.isArray(bildirimHam) ? bildirimHam.map(String) : []).filter((k): k is BildirimMadde => izinM.has(k as BildirimMadde))

  if (not && uydurmaBulguIceriyorMu(not)) {
    return { tamamMi: false, bayraklar, bildirim, ozet: 'Kritik notta AI / otomatik tanı dili yazılamaz.', gorevOnerileri: [], dipnot }
  }
  if (!bayraklar.length) {
    return { tamamMi: false, bayraklar, bildirim, ozet: 'En az bir kritik bulgu bayrağı seçin (hekim işaretler).', gorevOnerileri: [], dipnot }
  }
  if (!bildirim.length) {
    return { tamamMi: false, bayraklar, bildirim, ozet: 'En az bir klinisyen bildirimi maddesi işaretleyin.', gorevOnerileri: [], dipnot }
  }

  const bAd = KRITIK_BAYRAKLAR.filter((b) => bayraklar.includes(b.kod)).map((b) => b.ad)
  const mAd = BILDIRIM_MADDELER.filter((m) => bildirim.includes(m.kod)).map((m) => m.ad)
  return {
    tamamMi: true,
    bayraklar,
    bildirim,
    ozet: `Kritik bulgu bayrak: ${bAd.join('; ')}. Bildirim: ${mAd.join('; ')}. AI tanı değildir; hekim kilidi.`,
    gorevOnerileri: [{ kod: 'kritik_bildirim_takip', ad: 'Kritik bulgu klinisyen bildirimi takibi' }],
    dipnot,
  }
}
