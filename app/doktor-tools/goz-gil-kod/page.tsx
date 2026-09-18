'use client'
/** GOZ-EXCEPTIONAL-01 — Araçlar › GİL EK-3/G kodları. Göz-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GozAracKabugu. */
import GozAracKabugu from '@/specialties/goz-hastaliklari/ui/araclar/GozAracKabugu'
import GilKodAraci from '@/specialties/goz-hastaliklari/ui/araclar/GilKodAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GozAracKabugu route="/doktor-tools/goz-gil-kod" baslik="GİL EK-3/G kodları" aciklama="SGK EK-3/G göz içi lens kalemlerini arayın ve kodu kopyalayın. Bedel gösterilmez.">
      <GilKodAraci />
    </GozAracKabugu>
  )
}
