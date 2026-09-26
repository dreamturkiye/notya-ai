'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Kohort. */
import CcAracKabugu from '@/specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu'
import CcKohortAraci from '@/specialties/cocuk-cerrahisi/ui/araclar/CcKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <CcAracKabugu route="/doktor-tools/cc-kohort" baslik="Çocuk cerrahisi kohort paneli" aciklama="Geciken kontrol · pre-op · yara · onam/veli · açık acil · tek dokunuşla hatırlatma. Tanı/doz taşınmaz.">
      <CcKohortAraci />
    </CcAracKabugu>
  )
}
