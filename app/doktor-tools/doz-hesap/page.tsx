'use client'
/**
 * Araçlar › Doz hesaplayıcı (TR-PARITE-01). Reçete yazan 29 tıp branşı (Pediatri hariç — kendi pedi-doz motoru) ve
 * Özel Branş hekim dalları; kapı dozAraciBransi (lib/doktor/dozHesap.ts). Hekim her sayıyı girer; araç ilaç ve doz bilmez.
 */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import { dozAraciBransi } from '@/lib/doktor/dozHesap'
import DozHesapAraci from '@/components/doktor/araclar/DozHesapAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu route="/doktor-tools/doz-hesap" izinVer={dozAraciBransi} baslik="Doz hesaplayıcı" aciklama="Kilo, vücut yüzey alanı (Mosteller) veya sabit doz. Miktarı, konsantrasyonu ve tavanı siz girersiniz; doz başına mg ve mL, günlük toplam ve tavan aşımı anında hesaplanır. Araç ilaç veya doz önermez.">
      <DozHesapAraci />
    </OrtakAracKabugu>
  )
}
