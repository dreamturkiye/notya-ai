'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Araçlar › Kırık / alçı-ortez takip. */
import OrtoAracKabugu from '@/specialties/ortopedi/ui/araclar/OrtoAracKabugu'
import OrtoKirikAlciAraci from '@/specialties/ortopedi/ui/araclar/OrtoKirikAlciAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtoAracKabugu route="/doktor-tools/orto-kirik-alci" baslik="Kırık / alçı-ortez takip" aciklama="Bölge, NV durumu, alçı alma ve yük verme tarihlerini düzenli izlem notuna çevirir. Kaynama tanısı yazılmaz; ameliyathane takvimi yoktur.">
      <OrtoKirikAlciAraci />
    </OrtoAracKabugu>
  )
}
