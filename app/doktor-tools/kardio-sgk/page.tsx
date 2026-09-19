'use client'
/** KARDIO-EXCEPTIONAL-01 — Araçlar › SGK kardiyo rapor. specialty-only kardiyoloji. */
import KardioAracKabugu from '@/specialties/kardiyoloji/ui/araclar/KardioAracKabugu'
import KardioSgkAraci from '@/specialties/kardiyoloji/ui/araclar/KardioSgkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KardioAracKabugu route="/doktor-tools/kardio-sgk" baslik="SGK kardiyo rapor" aciklama="Hipertansiyon, kalp yetersizliği, antikoagülan ve koroner izlem rapor taslağı + SUT kontrol listesi. T.C. kimlik ve doz yazılmaz; Medula e-imza hekimindir.">
      <KardioSgkAraci />
    </KardioAracKabugu>
  )
}
