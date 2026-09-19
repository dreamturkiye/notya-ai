'use client'
/** FIZIK-TEDAVI-EXCEPTIONAL-01 — Araçlar › Ev egzersiz reçetesi. Fizik-tedavi-only (BRANS_DOKTOR_ARACLARI). */
import FtrAracKabugu from '@/specialties/fizik-tedavi/ui/araclar/FtrAracKabugu'
import FtrEgzersizAraci from '@/specialties/fizik-tedavi/ui/araclar/FtrEgzersizAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <FtrAracKabugu route="/doktor-tools/ftr-egzersiz" baslik="Ev egzersiz reçetesi" aciklama="Genel egzersiz adı ve set/tekrar (ilaç dozu değil). Ağrı artınca dur; acil durumda 112.">
      <FtrEgzersizAraci />
    </FtrAracKabugu>
  )
}
