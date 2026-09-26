/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Endoskopi belge köprüsü. SAF fonksiyon.
 * Belgeler sekmesindeki kayda köprü + işlem türü + tarih + sonraki kontrol.
 * Tam HIS / ameliyathane / canlı randevu / otomatik rapor YOK.
 */
import type { Dipnot } from './gastroenteroloji'
import { ayEkle, ISO_GUN } from './gastroenteroloji'

export type EndoskopiTur = 'egd' | 'kolonoskopi' | 'sigmoidoskopi' | 'eus' | 'ercp' | 'kapsul' | 'diger'

export const ENDOSKOPI_TUR_ETIKET: Record<EndoskopiTur, string> = {
  egd: 'Üst GI endoskopi (EGD)',
  kolonoskopi: 'Kolonoskopi',
  sigmoidoskopi: 'Sigmoidoskopi',
  eus: 'EUS',
  ercp: 'ERCP',
  kapsul: 'Kapsül endoskopi',
  diger: 'Diğer (hekim etiketi)',
}

/** Varsayılan sonraki kontrol aralığı (ay) — karar desteği; hekim değiştirir. */
export function endoskopiVarsayilanAy(tur: EndoskopiTur): number {
  if (tur === 'kolonoskopi') return 12
  if (tur === 'egd' || tur === 'sigmoidoskopi') return 6
  if (tur === 'eus' || tur === 'ercp') return 3
  return 6
}

export interface EndoskopiSonuc {
  tamamMi: boolean
  tur: EndoskopiTur
  tarih: string | null
  sonrakiKontrol: string | null
  ozet: string
  dipnot: Dipnot
}

export function endoskopiPlanla(
  tur: EndoskopiTur,
  tarih: string | null | undefined,
  sonrakiHam?: string | null,
): EndoskopiSonuc {
  const dipnot: Dipnot = { ref: 'TGD_ENDO', not: 'Endoskopi takip aralığı karar desteğidir; endoskopi ünitesi HIS’i bu ürünün parçası değildir' }
  if (!tarih || !ISO_GUN.test(tarih)) {
    return {
      tamamMi: false, tur, tarih: null, sonrakiKontrol: null,
      ozet: 'İşlem tarihi eksik — köprü kaydedilmez', dipnot,
    }
  }
  const sonraki = sonrakiHam && ISO_GUN.test(sonrakiHam)
    ? sonrakiHam
    : ayEkle(tarih, endoskopiVarsayilanAy(tur))
  return {
    tamamMi: true,
    tur,
    tarih,
    sonrakiKontrol: sonraki,
    ozet: `${ENDOSKOPI_TUR_ETIKET[tur]} ${tarih} kaydedildi · önerilen kontrol ${sonraki}. Tanı yazılmaz; tam endoskopi ünitesi / HIS bu araçta yoktur.`,
    dipnot,
  }
}

export const ENDOSKOPI_KONTROL_LISTESI: readonly string[] = [
  'İşlem tarihi ve türü kaydedildi',
  'Hasta dosyasındaki belgeye köprü (varsa) eklendi',
  'Sonraki kontrol / takip endoskopi tarihi hasta ile paylaşıldı',
  'Biyopsi / patoloji sonucu hekim tarafından değerlendirilecek (Notya tanı yazmaz)',
  'Tam HIS / ameliyathane planlaması bu ürünün kapsamı değildir',
]
