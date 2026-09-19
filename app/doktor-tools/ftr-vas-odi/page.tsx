'use client'
/** FIZIK-TEDAVI-EXCEPTIONAL-01 — Araçlar › VAS / ODI. Fizik-tedavi-only (BRANS_DOKTOR_ARACLARI). */
import FtrAracKabugu from '@/specialties/fizik-tedavi/ui/araclar/FtrAracKabugu'
import FtrVasOdiAraci from '@/specialties/fizik-tedavi/ui/araclar/FtrVasOdiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <FtrAracKabugu route="/doktor-tools/ftr-vas-odi" baslik="VAS / ODI ölçek" aciklama="VAS 0–10 ve ODI yüzde bandı (karar desteği). Eksik madde varken ODI yorumlanmaz; tanı ve ilaç dozu yazılmaz.">
      <FtrVasOdiAraci />
    </FtrAracKabugu>
  )
}
