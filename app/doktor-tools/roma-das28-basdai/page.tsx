'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Araçlar › DAS28 / BASDAI. */
import RomaAracKabugu from '@/specialties/romatoloji/ui/araclar/RomaAracKabugu'
import RomaDas28BasdaiAraci from '@/specialties/romatoloji/ui/araclar/RomaDas28BasdaiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RomaAracKabugu route="/doktor-tools/roma-das28-basdai" baslik="DAS28 / BASDAI" aciklama="Aktivite skoru ve şiddet bandı karar desteğidir. Tanı yazılmaz, doz yazılmaz. İnfüzyon ünitesi takibi (HBYS) yoktur.">
      <RomaDas28BasdaiAraci />
    </RomaAracKabugu>
  )
}
