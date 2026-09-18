'use client'
/** GOZ-EXCEPTIONAL-01 — Araçlar › Göz kohort paneli. Göz-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GozAracKabugu. */
import GozAracKabugu from '@/specialties/goz-hastaliklari/ui/araclar/GozAracKabugu'
import GozKohortPaneli from '@/specialties/goz-hastaliklari/ui/araclar/GozKohortPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GozAracKabugu route="/doktor-tools/goz-kohort" baslik="Göz kohort paneli" aciklama="Geciken görme alanı / OCT, planlı intravitreal enjeksiyon, retinopati taraması ve kontrol zamanı gelen hastalarınız — tek dokunuşla hatırlatma.">
      <GozKohortPaneli />
    </GozAracKabugu>
  )
}
