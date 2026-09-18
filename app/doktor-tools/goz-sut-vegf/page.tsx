'use client'
/** GOZ-EXCEPTIONAL-01 — Araçlar › SUT anti-VEGF kapı. Göz-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GozAracKabugu. */
import GozAracKabugu from '@/specialties/goz-hastaliklari/ui/araclar/GozAracKabugu'
import SutVegfAraci from '@/specialties/goz-hastaliklari/ui/araclar/SutVegfAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GozAracKabugu route="/doktor-tools/goz-sut-vegf" baslik="SUT anti-VEGF kapı" aciklama="Ajan, göz, basamak ve enjeksiyon geçmişiyle SUT 4.2.33 ödeme kapılarını kontrol edin — hasta dosyasındaki motorun aynısı.">
      <SutVegfAraci />
    </GozAracKabugu>
  )
}
