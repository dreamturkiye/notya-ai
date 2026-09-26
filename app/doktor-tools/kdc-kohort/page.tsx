import KdcAracKabugu from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu'
import KdcKohortAraci from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcKohortAraci'

export default function Page() {
  return (
    <KdcAracKabugu route="/doktor-tools/kdc-kohort" baslik="Kalp damar cerrahisi kohort" aciklama="Geciken kontrol · pre-op · greft/yara · antikoag · açık acil · tek dokunuşla hatırlatma.">
      <KdcKohortAraci />
    </KdcAracKabugu>
  )
}
