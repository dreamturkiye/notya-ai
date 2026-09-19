'use client'
/** KARDIO-EXCEPTIONAL-01 — Araçlar › SCORE2. specialty-only kardiyoloji. */
import KardioAracKabugu from '@/specialties/kardiyoloji/ui/araclar/KardioAracKabugu'
import KardioScore2Araci from '@/specialties/kardiyoloji/ui/araclar/KardioScore2Araci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KardioAracKabugu route="/doktor-tools/kardio-score2" baslik="SCORE2 / KV risk" aciklama="ESC 2021 SCORE2 ile 10 yıllık kardiyovasküler olay riski ve bant (karar desteği). Türkiye yüksek risk bölgesi kalibrasyonu. Bant tanı değildir; ilaç ve doz kararı sizindir.">
      <KardioScore2Araci />
    </KardioAracKabugu>
  )
}
