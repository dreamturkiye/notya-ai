'use client'
/** Araçlar › Kontrasepsiyon MEC Danışmanı. Kadın doğum-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import MecAraci from '@/specialties/kadin-dogum/ui/araclar/MecAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-mec" baslik="Kontrasepsiyon MEC Danışmanı" aciklama="Hasta faktörlerinden yöntem başına WHO MEC kategorisi ve gerekçesi; acil kontrasepsiyon zamanlaması ve doğum sonrası başlama. Reçeteyi siz yazarsınız.">
      <MecAraci />
    </KdAracKabugu>
  )
}
