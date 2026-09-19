'use client'
/** GOGUS-EXCEPTIONAL-01 — Araçlar › İnhaler teknik & izlem. Göğüs-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GogusAracKabugu. */
import GogusAracKabugu from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu'
import GogusInhalerAraci from '@/specialties/gogus-hastaliklari/ui/araclar/GogusInhalerAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GogusAracKabugu route="/doktor-tools/gogus-inhaler" baslik="İnhaler teknik & izlem" aciklama="ÖDİ / KTİ / soft mist teknik kontrol listesi ve tekrar kontrol takvimi. Doz üretilmez.">
      <GogusInhalerAraci />
    </GogusAracKabugu>
  )
}
