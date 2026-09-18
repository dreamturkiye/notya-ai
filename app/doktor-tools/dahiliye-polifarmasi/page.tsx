'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › Polifarmasi STOPP/START. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import PolifarmasiAraci from '@/specialties/dahiliye/ui/araclar/PolifarmasiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-polifarmasi" baslik="Polifarmasi STOPP/START" aciklama="≥65 yaş hastada ilaç listesi, böbrek fonksiyonu, elektrolitler ve tanılarla uygunsuz reçete (STOPP) ve atlanmış tedavi (START) taraması. Öneriler sınıf düzeyindedir; doz ve karar hekimindir.">
      <PolifarmasiAraci />
    </DahiliyeAracKabugu>
  )
}
