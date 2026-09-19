'use client'
/** KARDIO-EXCEPTIONAL-01 — Araçlar › HT/KKY izlem. specialty-only kardiyoloji. */
import KardioAracKabugu from '@/specialties/kardiyoloji/ui/araclar/KardioAracKabugu'
import KardioHtKkyAraci from '@/specialties/kardiyoloji/ui/araclar/KardioHtKkyAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KardioAracKabugu route="/doktor-tools/kardio-ht-kky" baslik="HT / KKY izlem" aciklama="Hipertansiyon ve kalp yetersizliği izlem özeti, sınıf düzeyi görev taslağı ve isteğe bağlı EKG/belge köprüsü. NYHA hekim seçimidir; doz yazılmaz.">
      <KardioHtKkyAraci />
    </KardioAracKabugu>
  )
}
