/**
 * ANESTEZI-EXCEPTIONAL-01 — ASA / pre-op değerlendirme checklist. SAF fonksiyon.
 * Madde kodları + isteğe bağlı ASA sınıfı + tarih. Tanı, OR HIS, ilaç doz YOK.
 */
import { dozIceriyorMu, type Dipnot } from './anestezi'

export type AsaKod =
  | 'anamnez_tamam'
  | 'asa_siniflandirma'
  | 'acil_lab_goruntu'
  | 'aclik_onam'
  | 'alerji_ilac_listesi'
  | 'hava_yolu_degerlendirme'
  | 'kardiyopulmoner_risk'
  | 'kontrol_randevu'

export const ASA_MADDELER: Array<{ kod: AsaKod; ad: string }> = [
  { kod: 'anamnez_tamam', ad: 'Anestezi anamnezi tamamlandı' },
  { kod: 'asa_siniflandirma', ad: 'ASA fiziksel durum sınıflaması kaydı (karar desteği)' },
  { kod: 'acil_lab_goruntu', ad: 'Gerekli lab / görüntü kontrol tarihi belirlendi' },
  { kod: 'aclik_onam', ad: 'Açlık ve bilgilendirilmiş onam maddeleri gözden geçirildi' },
  { kod: 'alerji_ilac_listesi', ad: 'Alerji + ilaç listesi hasta ile doğrulandı (doz yazılmaz)' },
  { kod: 'hava_yolu_degerlendirme', ad: 'Hava yolu değerlendirme notu alındı' },
  { kod: 'kardiyopulmoner_risk', ad: 'Kardiyopulmoner risk bayrakları gözden geçirildi' },
  { kod: 'kontrol_randevu', ad: 'Pre-op / kontrol randevusu belirlendi' },
]

export type AsaSinif = 'I' | 'II' | 'III' | 'IV' | 'V' | 'E'

export interface AsaSonuc {
  tamamMi: boolean
  secilen: AsaKod[]
  asaSinif: AsaSinif | null
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function asaSkorla(secilenHam: unknown, asaSinifHam?: unknown, not?: string | null): AsaSonuc {
  const dipnot: Dipnot = { ref: 'ASA_TR', not: 'ASA/pre-op checklist karar desteğidir; tanı ve doz hekimin' }
  const izinli = new Set(ASA_MADDELER.map((m) => m.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : []).filter((k): k is AsaKod => izinli.has(k as AsaKod))
  const sinifHam = asaSinifHam != null ? String(asaSinifHam).toUpperCase() : ''
  const asaSinif = (['I', 'II', 'III', 'IV', 'V', 'E'].includes(sinifHam) ? sinifHam : null) as AsaSinif | null
  if (not && dozIceriyorMu(not)) {
    return { tamamMi: false, secilen, asaSinif, ozet: 'Pre-op notunda mg / anestezik doz yazılamaz.', gorevOnerileri: [], dipnot }
  }
  if (!secilen.length) {
    return { tamamMi: false, secilen, asaSinif, ozet: 'En az bir checklist maddesi seçin.', gorevOnerileri: [], dipnot }
  }
  const adlar = ASA_MADDELER.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const gorevOnerileri = secilen
    .filter((k) => k === 'kontrol_randevu' || k === 'acil_lab_goruntu' || k === 'hava_yolu_degerlendirme' || k === 'alerji_ilac_listesi')
    .map((k) => {
      const m = ASA_MADDELER.find((x) => x.kod === k)!
      return { kod: `asa_${k}`, ad: m.ad }
    })
  const sinifMetin = asaSinif ? ` · ASA ${asaSinif}` : ''
  return {
    tamamMi: true,
    secilen,
    asaSinif,
    ozet: `ASA/pre-op checklist: ${adlar.join('; ')}${sinifMetin}. Karar desteğidir; tanı/doz hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}
