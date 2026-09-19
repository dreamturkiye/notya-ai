'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Araçlar › Migren günlüğü / MIDAS. Nöroloji-only (BRANS_DOKTOR_ARACLARI). */
import NoroAracKabugu from '@/specialties/noroloji/ui/araclar/NoroAracKabugu'
import NoroMigrenAraci from '@/specialties/noroloji/ui/araclar/NoroMigrenAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NoroAracKabugu route="/doktor-tools/noro-migren" baslik="Migren günlüğü / MIDAS" aciklama="Son 3 ay engellilik günlerinden MIDAS toplamı ve bandı (karar desteği). Eksik madde varken skor yorumlanmaz; tanı ve doz yazılmaz.">
      <NoroMigrenAraci />
    </NoroAracKabugu>
  )
}
