'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Onam/veli. */
import CcAracKabugu from '@/specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu'
import CcOnamVeliAraci from '@/specialties/cocuk-cerrahisi/ui/araclar/CcOnamVeliAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <CcAracKabugu route="/doktor-tools/cc-onam-veli" baslik="Onam / veli checklist" aciklama="Yaşa göre veli maddeleri. Yazılı onam klinik süreçtedir; canlı Medula e-imza yok.">
      <CcOnamVeliAraci />
    </CcAracKabugu>
  )
}
