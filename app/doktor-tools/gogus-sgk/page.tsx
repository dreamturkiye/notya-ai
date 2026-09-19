'use client'
/** GOGUS-EXCEPTIONAL-01 — Araçlar › SGK solunum raporu. Göğüs-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GogusAracKabugu. */
import GogusAracKabugu from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu'
import GogusSgkAraci from '@/specialties/gogus-hastaliklari/ui/araclar/GogusSgkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GogusAracKabugu route="/doktor-tools/gogus-sgk" baslik="SGK solunum raporu" aciklama="USOT, nebulizatör ve solunum değerlendirme taslağı + SUT kontrol listesi. T.C. kimlik ve Medula e-imza yok.">
      <GogusSgkAraci />
    </GogusAracKabugu>
  )
}
