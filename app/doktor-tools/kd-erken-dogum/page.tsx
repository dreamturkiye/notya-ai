'use client'
/** Araçlar › Kadın Hastalıkları ve Doğum Erken Doğum Risk Paneli. KHD-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import ErkenDogumPaneli from '@/specialties/kadin-dogum/ui/araclar/ErkenDogumPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-erken-dogum" baslik="Erken Doğum Risk Paneli" aciklama="Serviks uzunluğu günlüğü ve trendi, önceki erken doğum öyküsü, PPROM, antenatal steroid kürleri ve progesteron olgusu — yayımlanmış ölçütlere göre kriter göstergeleri, her biri kaynağı ve doğrulama düzeyiyle.">
      <ErkenDogumPaneli />
    </KdAracKabugu>
  )
}
