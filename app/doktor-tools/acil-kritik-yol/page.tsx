'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Araçlar › Kritik yol checklist. Acil-tip-only. */
import AtAracKabugu from '@/specialties/acil-tip/ui/araclar/AtAracKabugu'
import AtKritikYolAraci from '@/specialties/acil-tip/ui/araclar/AtKritikYolAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AtAracKabugu route="/doktor-tools/acil-kritik-yol" baslik="Kritik yol kontrol listesi" aciklama="STEMI / inme / travma / sepsis / hava yolu bayrakları. Tanı kilidi ve doz yazılmaz. Kardiyoloji / nöroloji aracı değildir.">
      <AtKritikYolAraci />
    </AtAracKabugu>
  )
}
