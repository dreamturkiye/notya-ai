'use client'
/** PREMATURE-MODUL — Araçlar › Prematüre kohort paneli. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import PrematurKohortPaneli from '@/specialties/pediatri/ui/araclar/PrematurKohortPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-prematur-kohort" baslik="Prematüre kohort paneli" aciklama="Prematüre / ≤ 1500 g bebekleriniz — geciken ve yaklaşan takip kalemleri, tek bakışta">
      <PrematurKohortPaneli />
    </PediAracKabugu>
  )
}
