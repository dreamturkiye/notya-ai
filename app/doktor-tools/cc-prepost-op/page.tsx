'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Pre/post-op izlem. */
import CcAracKabugu from '@/specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu'
import CcPrepostAraci from '@/specialties/cocuk-cerrahisi/ui/araclar/CcPrepostAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <CcAracKabugu route="/doktor-tools/cc-prepost-op" baslik="Pre/post-op izlem checklist" aciklama="Hekim işaretleri ve tarihler. OR scheduling / HIS / tanı kilidi / doz / Neyzi bu ürünün kapsamı değildir.">
      <CcPrepostAraci />
    </CcAracKabugu>
  )
}
