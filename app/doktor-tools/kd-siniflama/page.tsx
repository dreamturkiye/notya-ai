'use client'
/** Araçlar › FIGO ve endometriozis sınıflaması (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { SiniflamaAraci } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-siniflama" baslik="FIGO ve endometriozis sınıflaması" aciklama="PALM-COEIN ve FIGO myom tipleri (0–8), myomektomi planlama özeti, revize ASRM evresi ve #Enzian kodu.">
      <SiniflamaAraci />
    </KdAracKabugu>
  )
}
