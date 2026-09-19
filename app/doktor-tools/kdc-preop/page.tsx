import KdcAracKabugu from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu'
import KdcPreopAraci from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcPreopAraci'

export default function Page() {
  return (
    <KdcAracKabugu route="/doktor-tools/kdc-preop" baslik="Pre-op risk checklist" aciklama="Ameliyat öncesi hazırlık maddeleri — tanı, doz ve SCORE2 yazılmaz.">
      <KdcPreopAraci />
    </KdcAracKabugu>
  )
}
