'use client'
/** Araçlar › Histeroskopi sıvı açığı ve ERAS (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { HisteroskopiErasAraci } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-histeroskopi-eras" baslik="Histeroskopi sıvı açığı ve ERAS" aciklama="Histeroskopide giren-çıkan sıvıdan açık ve sınır uyarısı; jinekolojik cerrahi ve sezaryen için ERAS kontrol listesi.">
      <HisteroskopiErasAraci />
    </KdAracKabugu>
  )
}
