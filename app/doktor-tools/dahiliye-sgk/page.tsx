'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › SGK ilaç raporu. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import SgkRaporAraci from '@/specialties/dahiliye/ui/araclar/SgkRaporAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-sgk" baslik="SGK ilaç raporu" aciklama="Hipertansiyon, diyabet, dislipidemi, antikoagülan ve D vitamini / B12 şablonlarında ICD-10 + etken madde + süre taslağı; eksikler ve SUT kontrol listesiyle birlikte.">
      <SgkRaporAraci />
    </DahiliyeAracKabugu>
  )
}
