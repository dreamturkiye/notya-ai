import KdcAracKabugu from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu'
import KdcAntikoagAraci from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcAntikoagAraci'

export default function Page() {
  return (
    <KdcAracKabugu route="/doktor-tools/kdc-antikoag" baslik="Antikoagülan izlem vadeleri" aciklama="Kontrol ve lab vadeleri — mg / INR hedef / doz şeması yazılmaz.">
      <KdcAntikoagAraci />
    </KdcAracKabugu>
  )
}
