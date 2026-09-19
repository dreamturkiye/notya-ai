import KdcAracKabugu from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu'
import KdcGreftYaraAraci from '@/specialties/kalp-damar-cerrahisi/ui/araclar/KdcGreftYaraAraci'

export default function Page() {
  return (
    <KdcAracKabugu route="/doktor-tools/kdc-greft-yara" baslik="Greft / yara izlem" aciklama="Greft, bypass ve yara durumu + kontrol tarihi — tanı ve doz yok.">
      <KdcGreftYaraAraci />
    </KdcAracKabugu>
  )
}
