'use client'
/** AILE-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Sevk/acil triyaj. Aile hekimliği-only. */
import AileAracKabugu from '@/specialties/aile-hekimligi/ui/araclar/AileAracKabugu'
import AileSevkAraci from '@/specialties/aile-hekimligi/ui/araclar/AileSevkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AileAracKabugu route="/doktor-tools/aile-sevk" baslik="Sevk / acil triyaj" aciklama="Göğüs ağrısı, ani nefes darlığı, bilinç değişikliği ve diğer kırmızı bayrakları işaretleyin. “Hemen” bandında hekim onayı olmadan kayıt yok; tanı yazılmaz.">
      <AileSevkAraci />
    </AileAracKabugu>
  )
}
