'use client'
/** Özel Branşlar › Doz hesaplayıcı (TR-PARITE-01): Doktor Araçları'ndaki aynı ekran, reçete yazan hekim dalları için. */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import { dozAraciBransi } from '@/lib/doktor/dozHesap'
import DozHesapAraci from '@/components/doktor/araclar/DozHesapAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu route="/ozel-branslar/doz-hesap" ustEtiket="Özel Branşlar" izinVer={dozAraciBransi} baslik="Doz hesaplayıcı" aciklama="Kilo, vücut yüzey alanı (Mosteller) veya sabit doz. Miktarı, konsantrasyonu ve tavanı siz girersiniz. Araç ilaç veya doz önermez.">
      <DozHesapAraci />
    </OrtakAracKabugu>
  )
}
