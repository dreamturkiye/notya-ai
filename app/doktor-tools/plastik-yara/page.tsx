'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Araçlar › Yara/greft izlem. Plastik-only. */
import PlastikAracKabugu from '@/specialties/plastik-cerrahi/ui/araclar/PlastikAracKabugu'
import PlastikYaraAraci from '@/specialties/plastik-cerrahi/ui/araclar/PlastikYaraAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PlastikAracKabugu route="/doktor-tools/plastik-yara" baslik="Yara / greft izlem" aciklama="Bölge · pansuman · dikiş alma tarihleri. Tanı ve doz yazılmaz; OR/HIS yok.">
      <PlastikYaraAraci />
    </PlastikAracKabugu>
  )
}
