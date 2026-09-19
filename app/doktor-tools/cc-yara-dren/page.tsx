'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Yara/dren. */
import CcAracKabugu from '@/specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu'
import CcYaraDrenAraci from '@/specialties/cocuk-cerrahisi/ui/araclar/CcYaraDrenAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <CcAracKabugu route="/doktor-tools/cc-yara-dren" baslik="Yara / dren izlem" aciklama="Pediatrik cerrahi ofis izlemi. Enfeksiyon tanısı ve antibiyotik dozu hekimdedir.">
      <CcYaraDrenAraci />
    </CcAracKabugu>
  )
}
