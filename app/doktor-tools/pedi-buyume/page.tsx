'use client'
/** PEDI-ARACLAR-01 — Araçlar › Büyüme & persentil stüdyosu. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import BuyumeStudyosu from '@/specialties/pediatri/ui/araclar/BuyumeStudyosu'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-buyume" baslik="Büyüme & persentil" aciklama="Doğum tarihi, cinsiyet ve ölçümü girin — persentil ve z-skor anında. Önceki ölçümlerle eğri, persentil kayması ve büyüme hızı; Neyzi ↔ WHO tek dokunuşla.">
      <BuyumeStudyosu />
    </PediAracKabugu>
  )
}
