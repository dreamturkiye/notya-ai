'use client'
/** Araçlar › Adneksiyal kitle (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { AdneksAraci } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-adneks" baslik="Adneksiyal kitle" aciklama="IOTA Basit Kurallar, O-RADS US v2022 kategorisi ve RMI I; ADNEX için girdiler. Tanı hekimindir.">
      <AdneksAraci />
    </KdAracKabugu>
  )
}
