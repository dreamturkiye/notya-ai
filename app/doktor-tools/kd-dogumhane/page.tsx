'use client'
/** Araçlar › Doğumhane hesapları (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { DogumhaneAraci } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-dogumhane" baslik="Doğumhane hesapları" aciklama="Bishop skoru, Robson grubu, sezaryen aciliyet kategorisi ve hedef süre, ölçülen kan kaybı, şok indeksi ve doğum sonu kanama paketi, SSVD girdileri.">
      <DogumhaneAraci />
    </KdAracKabugu>
  )
}
