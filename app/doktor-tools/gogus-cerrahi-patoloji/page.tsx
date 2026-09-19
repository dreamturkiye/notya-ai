'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Patoloji köprü. Göğüs cerrahisi-only. */
import GcAracKabugu from '@/specialties/gogus-cerrahisi/ui/araclar/GcAracKabugu'
import GcPatolojiAraci from '@/specialties/gogus-cerrahisi/ui/araclar/GcPatolojiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gogus-cerrahi-patoloji" baslik="Patoloji köprü" aciklama="Örnek ve rapor tarihleri · hazır bayrağı. Tanı, ICD ve doz yazılmaz.">
      <GcPatolojiAraci />
    </GcAracKabugu>
  )
}
