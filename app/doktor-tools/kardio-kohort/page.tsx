'use client'
/** KARDIO-EXCEPTIONAL-01 — Araçlar › Kohort. specialty-only kardiyoloji. */
import KardioAracKabugu from '@/specialties/kardiyoloji/ui/araclar/KardioAracKabugu'
import KardioKohortAraci from '@/specialties/kardiyoloji/ui/araclar/KardioKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KardioAracKabugu route="/doktor-tools/kardio-kohort" baslik="Kardiyoloji kohort paneli" aciklama="Geciken kontrol, lab/EKG, açık kırmızı bayrak ve yüksek risk izlem gecikmesi. 1-tap hatırlatma — tanı, SCORE2 değeri ve ilaç adı yazılmaz.">
      <KardioKohortAraci />
    </KardioAracKabugu>
  )
}
