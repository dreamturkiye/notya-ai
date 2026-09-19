'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Araçlar › Tedavi döngü / kür sayacı. Onkoloji-only. */
import OnkoAracKabugu from '@/specialties/onkoloji/ui/araclar/OnkoAracKabugu'
import OnkoKurAraci from '@/specialties/onkoloji/ui/araclar/OnkoKurAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OnkoAracKabugu route="/doktor-tools/onko-kur" baslik="Tedavi döngü / kür sayacı" aciklama="Kür numarası ve tarihler. mg/m², AUC, BSA ve eczane doz şeması yazılmaz.">
      <OnkoKurAraci />
    </OnkoAracKabugu>
  )
}
