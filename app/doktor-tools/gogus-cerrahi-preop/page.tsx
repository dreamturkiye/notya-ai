'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Pre-op solunum checklist. Göğüs cerrahisi-only. */
import GcAracKabugu from '@/specialties/gogus-cerrahisi/ui/araclar/GcAracKabugu'
import GcPreopAraci from '@/specialties/gogus-cerrahisi/ui/araclar/GcPreopAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gogus-cerrahi-preop" baslik="Pre-op solunum kontrol listesi" aciklama="SFT, görüntü, anestezi ve onam hazırlık maddeleri. CAT/mMRC, doz ve ameliyathane planı yazılmaz.">
      <GcPreopAraci />
    </GcAracKabugu>
  )
}
