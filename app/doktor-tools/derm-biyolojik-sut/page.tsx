'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › Biyolojik SUT taslağı. Dermatoloji-only (BRANS_DOKTOR_ARACLARI). */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import BiyolojikSutAraci from '@/specialties/dermatoloji/ui/araclar/BiyolojikSutAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-biyolojik-sut" baslik="Biyolojik SUT taslağı" aciklama="Psoriasis / AD / hidradenit / ürtiker için sistemik-biyolojik rapor taslağı: skor, tarama ve önceki basamak. T.C. ve doz yazılmaz; Medula girişi hekimindir.">
      <BiyolojikSutAraci />
    </DermAracKabugu>
  )
}
