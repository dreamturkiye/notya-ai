'use client'
/** PEDI-ARACLAR-01 — Araçlar › Doz hesaplayıcı (mg/kg). Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import DozAraci from '@/specialties/pediatri/ui/araclar/DozAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-doz" baslik="Doz hesaplayıcı (mg/kg)" aciklama="Kiloyu, mg/kg değerini ve şişedeki konsantrasyonu siz girin; doz başına mg ve mL, günlük toplam ve girdiğiniz tavanın aşımı anında hesaplanır. Araç ilaç veya doz önermez.">
      <DozAraci />
    </PediAracKabugu>
  )
}
