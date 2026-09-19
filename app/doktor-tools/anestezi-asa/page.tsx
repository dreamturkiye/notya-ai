'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Araçlar › ASA/pre-op checklist. Anestezi-only. */
import AnesteziAracKabugu from '@/specialties/anestezi/ui/araclar/AnesteziAracKabugu'
import AnesteziAsaAraci from '@/specialties/anestezi/ui/araclar/AnesteziAsaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AnesteziAracKabugu route="/doktor-tools/anestezi-asa" baslik="ASA / pre-op değerlendirme" aciklama="Pre-op checklist maddeleri ve ASA sınıfı. Tanı, OR anestezi makinesi HIS ve ilaç dozu yazılmaz.">
      <AnesteziAsaAraci />
    </AnesteziAracKabugu>
  )
}
