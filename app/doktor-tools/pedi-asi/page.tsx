'use client'
/** PEDI-ARACLAR-02 — Araçlar › Aşı takvimi & telafi planlayıcı. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import AsiPlanlayici from '@/specialties/pediatri/ui/araclar/AsiPlanlayici'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-asi" baslik="Aşı takvimi & telafi planı" aciklama="Doğum tarihini yazın — SB ulusal takvimi, bugün yapılabilecek dozlar ve gecikmiş çocuk için seriyi baştan başlatmayan telafi planı. Özel (ücretli) aşılar ayrı grupta.">
      <AsiPlanlayici />
    </PediAracKabugu>
  )
}
