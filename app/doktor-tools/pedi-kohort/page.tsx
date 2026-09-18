'use client'
/** PEDI-ARACLAR-02 — Araçlar › Pediatri kohort paneli. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import PediKohortPaneli from '@/specialties/pediatri/ui/araclar/PediKohortPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-kohort" baslik="Pediatri kohort paneli" aciklama="Aşısı geciken, sağlam çocuk izlemini kaçıran, persentil kayması olan, D vitamini / demiri eksik ya da taraması geciken çocuklarınız — tek dokunuşla veliye hatırlatma.">
      <PediKohortPaneli />
    </PediAracKabugu>
  )
}
