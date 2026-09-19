'use client'
/** FIZIK-TEDAVI-EXCEPTIONAL-01 — Araçlar › FTR seans planı. Fizik-tedavi-only (BRANS_DOKTOR_ARACLARI). */
import FtrAracKabugu from '@/specialties/fizik-tedavi/ui/araclar/FtrAracKabugu'
import FtrSeansAraci from '@/specialties/fizik-tedavi/ui/araclar/FtrSeansAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <FtrAracKabugu route="/doktor-tools/ftr-seans" baslik="FTR seans planı" aciklama="Bölge, modalite, seans sayısı ve haftalık sıklık taslağı. İlaç/doz yazılmaz; SGK/SUT koşullarını hekim doğrular.">
      <FtrSeansAraci />
    </FtrAracKabugu>
  )
}
