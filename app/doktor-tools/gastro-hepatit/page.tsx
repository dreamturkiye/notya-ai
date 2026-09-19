'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar › HBV / HCV izlem. Gastroenteroloji-only. */
import GastroAracKabugu from '@/specialties/gastroenteroloji/ui/araclar/GastroAracKabugu'
import GastroHepatitAraci from '@/specialties/gastroenteroloji/ui/araclar/GastroHepatitAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GastroAracKabugu route="/doktor-tools/gastro-hepatit" baslik="HBV / HCV izlem vadeleri" aciklama="İzlem bandını seçin; önerilen sonraki kontrol aralığı karar desteğidir. Antiviral doz yazılmaz.">
      <GastroHepatitAraci />
    </GastroAracKabugu>
  )
}
