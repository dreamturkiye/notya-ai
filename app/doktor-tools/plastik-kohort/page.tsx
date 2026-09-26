'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Araçlar › Kohort. Plastik-only. */
import PlastikAracKabugu from '@/specialties/plastik-cerrahi/ui/araclar/PlastikAracKabugu'
import PlastikKohortAraci from '@/specialties/plastik-cerrahi/ui/araclar/PlastikKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PlastikAracKabugu route="/doktor-tools/plastik-kohort" baslik="Plastik kohort paneli" aciklama="Geciken kontrol · yara/greft · foto · açık acil · onam · tek dokunuşla hatırlatma.">
      <PlastikKohortAraci />
    </PlastikAracKabugu>
  )
}
