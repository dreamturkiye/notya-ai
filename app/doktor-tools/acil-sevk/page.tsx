'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Araçlar › Sevk/yatış paket. Acil-tip-only. */
import AtAracKabugu from '@/specialties/acil-tip/ui/araclar/AtAracKabugu'
import AtSevkAraci from '@/specialties/acil-tip/ui/araclar/AtSevkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AtAracKabugu route="/doktor-tools/acil-sevk" baslik="Sevk / yatış paket taslağı" aciklama="Yatış, sevk, taburcu veya konsültasyon paket maddeleri. Boarding HIS ve doz yazılmaz.">
      <AtSevkAraci />
    </AtAracKabugu>
  )
}
