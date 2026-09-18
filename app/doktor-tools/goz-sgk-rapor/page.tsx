'use client'
/** GOZ-EXCEPTIONAL-01 — Araçlar › SGK rapor taslağı. Göz-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GozAracKabugu. */
import GozAracKabugu from '@/specialties/goz-hastaliklari/ui/araclar/GozAracKabugu'
import SgkRaporAraci from '@/specialties/goz-hastaliklari/ui/araclar/SgkRaporAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GozAracKabugu route="/doktor-tools/goz-sgk-rapor" baslik="SGK rapor taslağı" aciklama="Anti-VEGF başlangıç / idame / implant raporu veya GİL bilgi notu taslağı: zorunlu maddeler, eksikler ve kaynaklar. T.C. ve doz yazılmaz.">
      <SgkRaporAraci />
    </GozAracKabugu>
  )
}
