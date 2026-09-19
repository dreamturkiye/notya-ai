'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Araçlar › ESI triyaj. Acil-tip-only. */
import AtAracKabugu from '@/specialties/acil-tip/ui/araclar/AtAracKabugu'
import AtEsiAraci from '@/specialties/acil-tip/ui/araclar/AtEsiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AtAracKabugu route="/doktor-tools/acil-esi" baslik="ESI triyaj" aciklama="ESI 1–5 seviye ve kaynak bayrakları. Tanı, doz ve ED bed board HIS yazılmaz.">
      <AtEsiAraci />
    </AtAracKabugu>
  )
}
