'use client'
/** UROLOJI-EXCEPTIONAL-01 — Araçlar › IPSS. */
import UroAracKabugu from '@/specialties/uroloji/ui/araclar/UroAracKabugu'
import UroIpssAraci from '@/specialties/uroloji/ui/araclar/UroIpssAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <UroAracKabugu route="/doktor-tools/uro-ipss" baslik="IPSS semptom skoru" aciklama="7 madde 0–5 toplamı ve şiddet bandını hesaplar. Bant karar desteğidir; BPH veya başka tanı yazılmaz.">
      <UroIpssAraci />
    </UroAracKabugu>
  )
}
