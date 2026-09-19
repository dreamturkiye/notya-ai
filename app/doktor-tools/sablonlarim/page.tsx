'use client'
/** ARACLAR-CILA-01 Faz 4 — Araçlar › Sık kullandıklarım. Evrensel (ORTAK_DOKTOR_ARACLARI); kapı OrtakAracKabugu içinde. */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import Sablonlarim from '@/components/doktor/araclar/Sablonlarim'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu
      route="/doktor-tools/sablonlarim"
      baslik="Sık kullandıklarım"
      aciklama="Kendi vizit şablonlarınız: alışılmış tanı, reçete taslağı ve kontrol aralığı tek dokunuşla ön doldurulur ve tamamen düzenlenebilir. Şablonlar yalnız size aittir; Notya hazır şablon, ilaç ya da doz önermez."
    >
      <Sablonlarim />
    </OrtakAracKabugu>
  )
}
