'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › Dahiliye kohort paneli. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import { KohortPanel } from '@/specialties/dahiliye/ui/DahiliyeWow4'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-kohort" baslik="Dahiliye kohort paneli" aciklama="HbA1c, tansiyon, lipid ve takip gecikmelerini tek bakışta görün; seçtiğiniz hastalara 1-tap hatırlatma gönderin.">
      <KohortPanel />
    </DahiliyeAracKabugu>
  )
}
