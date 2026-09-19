'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Araçlar › Lab / eklem. */
import RomaAracKabugu from '@/specialties/romatoloji/ui/araclar/RomaAracKabugu'
import RomaLabIzlemAraci from '@/specialties/romatoloji/ui/araclar/RomaLabIzlemAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RomaAracKabugu route="/doktor-tools/roma-lab-izlem" baslik="Lab izlem / eklem haritası" aciklama="CRP · ESR · RF ve 28 eklem haritası. Bant ve sayım karar desteğidir; tanı ve doz yok.">
      <RomaLabIzlemAraci />
    </RomaAracKabugu>
  )
}
