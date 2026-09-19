'use client'
/** AILE-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Kronik paket. Aile hekimliği-only. */
import AileAracKabugu from '@/specialties/aile-hekimligi/ui/araclar/AileAracKabugu'
import AileKronikAraci from '@/specialties/aile-hekimligi/ui/araclar/AileKronikAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AileAracKabugu route="/doktor-tools/aile-kronik" baslik="Kronik paket (DM / HT izlem)" aciklama="Diyabet, hipertansiyon ve diğer kronik izlem paketlerini seçin. İzlem vadesi açılır; doz, hedef sayı ve tanı yazılmaz.">
      <AileKronikAraci />
    </AileAracKabugu>
  )
}
