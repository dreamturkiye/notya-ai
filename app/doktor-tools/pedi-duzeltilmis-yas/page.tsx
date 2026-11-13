'use client'
/** PREMATURE-MODUL — Araçlar › Düzeltilmiş yaş ve büyüme. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import DuzeltilmisYasAraci from '@/specialties/pediatri/ui/araclar/DuzeltilmisYasAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-duzeltilmis-yas" baslik="Düzeltilmiş yaş ve büyüme" aciklama="Kronolojik, düzeltilmiş ve postmenstrüel yaş — persentil her ikisiyle yan yana">
      <DuzeltilmisYasAraci />
    </PediAracKabugu>
  )
}
