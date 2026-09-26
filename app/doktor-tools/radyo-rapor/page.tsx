'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Araçlar › BI-RADS-style rapor taslağı. Radyoloji-only. */
import RadyoAracKabugu from '@/specialties/radyoloji/ui/araclar/RadyoAracKabugu'
import RadyoRaporAraci from '@/specialties/radyoloji/ui/araclar/RadyoRaporAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RadyoAracKabugu route="/doktor-tools/radyo-rapor" baslik="Yapılandırılmış rapor taslağı" aciklama="BI-RADS tarzı kategoriyi hekim seçer — otomatik tanı değildir. Uydurma bulgu yok.">
      <RadyoRaporAraci />
    </RadyoAracKabugu>
  )
}
