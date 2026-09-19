'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Araçlar › Op-sonrası protokol. */
import OrtoAracKabugu from '@/specialties/ortopedi/ui/araclar/OrtoAracKabugu'
import OrtoOpProtokolAraci from '@/specialties/ortopedi/ui/araclar/OrtoOpProtokolAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtoAracKabugu route="/doktor-tools/orto-op-protokol" baslik="Op-sonrası protokol" aciklama="Hekimin belirlediği dikiş, yük verme ve görüntü kilometre taşları. Ameliyathane planı / HIS / OR scheduling bu ürünün kapsamı değildir.">
      <OrtoOpProtokolAraci />
    </OrtoAracKabugu>
  )
}
