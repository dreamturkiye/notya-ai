'use client'
/** Araçlar › Gebelik Takvimi & Tarama Pencereleri. Kadın doğum-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import GebelikTakvimAraci from '@/specialties/kadin-dogum/ui/araclar/GebelikTakvimAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-gebelik-takvim" baslik="Gebelik Takvimi & Tarama Pencereleri" aciklama="SAT, ultrason haftası, CRL veya TDT'den tek adımda: bugünkü gebelik haftası, DÖBYR izlemleri ve her taramanın penceresi — açık, kapanmak üzere, kaçırıldı.">
      <GebelikTakvimAraci />
    </KdAracKabugu>
  )
}
