'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Araçlar › ATB süre. Enfeksiyon-only. */
import EnfAracKabugu from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAracKabugu'
import EnfAtbSureAraci from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAtbSureAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EnfAracKabugu route="/doktor-tools/enfeksiyon-atb-sure" baslik="Antibiyotik süre sayacı" aciklama="Başlangıç ve süre günlerinden bitiş/kontrol tarihi. Doz, mg ve etken madde invent edilmez — süre karar desteğidir.">
      <EnfAtbSureAraci />
    </EnfAracKabugu>
  )
}
