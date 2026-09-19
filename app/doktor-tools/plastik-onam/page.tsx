'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Araçlar › Onam taslağı checklist. Plastik-only. */
import PlastikAracKabugu from '@/specialties/plastik-cerrahi/ui/araclar/PlastikAracKabugu'
import PlastikOnamAraci from '@/specialties/plastik-cerrahi/ui/araclar/PlastikOnamAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PlastikAracKabugu route="/doktor-tools/plastik-onam" baslik="Onam taslağı checklist" aciklama="Bilgilendirilmiş onam hatırlatma maddeleri. Tanı auto-lock ve canlı e-imza yok.">
      <PlastikOnamAraci />
    </PlastikAracKabugu>
  )
}
