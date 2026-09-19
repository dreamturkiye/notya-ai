'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Araçlar › Post-op ağrı izlem. Anestezi-only. */
import AnesteziAracKabugu from '@/specialties/anestezi/ui/araclar/AnesteziAracKabugu'
import AnesteziAgriAraci from '@/specialties/anestezi/ui/araclar/AnesteziAgriAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AnesteziAracKabugu route="/doktor-tools/anestezi-agri" baslik="Post-op ağrı izlem" aciklama="Ağrı skoru ve izlem bayrakları. Analjezik mg dozu yazılmaz.">
      <AnesteziAgriAraci />
    </AnesteziAracKabugu>
  )
}
