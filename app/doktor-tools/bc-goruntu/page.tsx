'use client'
/** BEYIN-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Görüntü belge köprü. Beyin-cerrahisi-only. */
import BcAracKabugu from '@/specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu'
import BcGoruntuAraci from '@/specialties/beyin-cerrahisi/ui/araclar/BcGoruntuAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <BcAracKabugu route="/doktor-tools/bc-goruntu" baslik="Görüntü belge köprü" aciklama="BT/MR/belge kontrol tarihi ve etiket. Tanı ve AI rapor yorumu yazılmaz.">
      <BcGoruntuAraci />
    </BcAracKabugu>
  )
}
