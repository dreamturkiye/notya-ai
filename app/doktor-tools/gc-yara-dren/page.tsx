'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Araçlar › Yara / dren izlem. Genel cerrahi-only. */
import GcAracKabugu from '@/specialties/genel-cerrahi/ui/araclar/GcAracKabugu'
import GcYaraDrenAraci from '@/specialties/genel-cerrahi/ui/araclar/GcYaraDrenAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gc-yara-dren" baslik="Yara / dren izlem" aciklama="Yara, dren, dikiş ve taburcu sonrası kontrol tarihleri. Enfeksiyon tanısı ve antibiyotik dozu yazılmaz.">
      <GcYaraDrenAraci />
    </GcAracKabugu>
  )
}
