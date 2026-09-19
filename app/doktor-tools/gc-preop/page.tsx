'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Araçlar › Pre-op checklist. Genel cerrahi-only. */
import GcAracKabugu from '@/specialties/genel-cerrahi/ui/araclar/GcAracKabugu'
import GcPreopAraci from '@/specialties/genel-cerrahi/ui/araclar/GcPreopAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gc-preop" baslik="Pre-op checklist" aciklama="Onam, lab, görüntü ve antikoagülan planı checkbox'ları. Doz, OR scheduling ve tanı kilidi yazılmaz.">
      <GcPreopAraci />
    </GcAracKabugu>
  )
}
