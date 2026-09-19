'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Araçlar › Kritik bulgu bildirimi. Radyoloji-only. */
import RadyoAracKabugu from '@/specialties/radyoloji/ui/araclar/RadyoAracKabugu'
import RadyoKritikAraci from '@/specialties/radyoloji/ui/araclar/RadyoKritikAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RadyoAracKabugu route="/doktor-tools/radyo-kritik" baslik="Kritik bulgu bildirimi" aciklama="Bayrak + klinisyen checklist. AI tanı / uydurma bulgu yok. Acilde 112.">
      <RadyoKritikAraci />
    </RadyoAracKabugu>
  )
}
