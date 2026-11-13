'use client'
/** PREMATURE-MODUL — Araçlar › Prematüre takip planı. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import PrematurTakipAraci from '@/specialties/pediatri/ui/araclar/PrematurTakipAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-prematur-takip" baslik="Prematüre takip planı" aciklama="Doğumdaki gestasyon ve doğum ağırlığından ROP, kraniyal USG, işitme, demir ve RSV takip kalemleri — kaynaklı, hekim onaylı kontrol listesi">
      <PrematurTakipAraci />
    </PediAracKabugu>
  )
}
