'use client'
/** BEYIN-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Nöbet/bilinç izlem. Beyin-cerrahisi-only. */
import BcAracKabugu from '@/specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu'
import BcBilincAraci from '@/specialties/beyin-cerrahisi/ui/araclar/BcBilincAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <BcAracKabugu route="/doktor-tools/bc-bilinc" baslik="Nöbet / bilinç izlem" aciklama="Bayraklar ve tarihler. Tanı ve AED dozu yazılmaz — nöroloji Migren/İnme aracı değildir.">
      <BcBilincAraci />
    </BcAracKabugu>
  )
}
