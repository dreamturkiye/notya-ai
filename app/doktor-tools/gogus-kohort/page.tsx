'use client'
/** GOGUS-EXCEPTIONAL-01 — Araçlar › Göğüs kohort paneli. Göğüs-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GogusAracKabugu. */
import GogusAracKabugu from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu'
import GogusKohortAraci from '@/specialties/gogus-hastaliklari/ui/araclar/GogusKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GogusAracKabugu route="/doktor-tools/gogus-kohort" baslik="Göğüs kohort paneli" aciklama="Geciken kontrol, spirometri, açık kırmızı bayrak ve inhaler teknik. Hatırlatma klinik skor taşımaz.">
      <GogusKohortAraci />
    </GogusAracKabugu>
  )
}
