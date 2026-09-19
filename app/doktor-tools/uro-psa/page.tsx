'use client'
/** UROLOJI-EXCEPTIONAL-01 — Araçlar › PSA izlem. */
import UroAracKabugu from '@/specialties/uroloji/ui/araclar/UroAracKabugu'
import UroPsaAraci from '@/specialties/uroloji/ui/araclar/UroPsaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <UroAracKabugu route="/doktor-tools/uro-psa" baslik="PSA izlem" aciklama="PSA ng/mL değeri ve (iki nokta varsa) hızı izler. Bant karar desteğidir; prostat kanseri tanısı yazılmaz.">
      <UroPsaAraci />
    </UroAracKabugu>
  )
}
