'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Araçlar › Tetkik kuyruğu. Radyoloji-only. */
import RadyoAracKabugu from '@/specialties/radyoloji/ui/araclar/RadyoAracKabugu'
import RadyoKuyrukAraci from '@/specialties/radyoloji/ui/araclar/RadyoKuyrukAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RadyoAracKabugu route="/doktor-tools/radyo-kuyruk" baslik="Tetkik kuyruğu / öncelik" aciklama="Modalite, öncelik ve durum kaydı. PACS/RIS/HIS ve AI tanı yazılmaz.">
      <RadyoKuyrukAraci />
    </RadyoAracKabugu>
  )
}
