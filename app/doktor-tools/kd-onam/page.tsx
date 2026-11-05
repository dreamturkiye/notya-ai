'use client'
/** Araçlar › Ameliyat onam formları (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { OnamListesi } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-onam" baslik="Ameliyat onam formları" aciklama="16 jinekolojik ve obstetrik işlem için işleme özgü bilgilendirilmiş onam formu; belge numaralı ve doğrulanabilir çıktı.">
      <OnamListesi />
    </KdAracKabugu>
  )
}
