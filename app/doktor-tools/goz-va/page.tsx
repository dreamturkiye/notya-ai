'use client'
/** GOZ-EXCEPTIONAL-01 — Araçlar › VA / logMAR. Göz-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GozAracKabugu. */
import GozAracKabugu from '@/specialties/goz-hastaliklari/ui/araclar/GozAracKabugu'
import VaAraci from '@/specialties/goz-hastaliklari/ui/araclar/VaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GozAracKabugu route="/doktor-tools/goz-va" baslik="VA / logMAR" aciklama="Görme keskinliğini kliniğin yazdığı gibi girin (0,8 · 6/12 · 20/40 · PS · EH · IH); ondalık, logMAR ve iki vizit arası ETDRS harf farkı OD/OS ayrı hesaplanır.">
      <VaAraci />
    </GozAracKabugu>
  )
}
