'use client'
/** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Sakatlık günlüğü. */
import SporAracKabugu from '@/specialties/spor-hekimligi/ui/araclar/SporAracKabugu'
import SporSakatlikAraci from '@/specialties/spor-hekimligi/ui/araclar/SporSakatlikAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <SporAracKabugu route="/doktor-tools/spor-sakatlik" baslik="Sakatlık günlüğü" aciklama="Bölge · mekanizma · şiddet bandı (karar desteği) · isteğe bağlı yüklenme uyarısı. Tanı ve doz yazılmaz.">
      <SporSakatlikAraci />
    </SporAracKabugu>
  )
}
