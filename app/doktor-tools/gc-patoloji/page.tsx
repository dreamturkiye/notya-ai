'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Araçlar › Patoloji belge köprüsü. Genel cerrahi-only. */
import GcAracKabugu from '@/specialties/genel-cerrahi/ui/araclar/GcAracKabugu'
import GcPatolojiAraci from '@/specialties/genel-cerrahi/ui/araclar/GcPatolojiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gc-patoloji" baslik="Patoloji belge köprüsü" aciklama="Rapor bekleniyor / geldi / hekim gördü. Patoloji tanısı, evre ve ICD yazılmaz.">
      <GcPatolojiAraci />
    </GcAracKabugu>
  )
}
