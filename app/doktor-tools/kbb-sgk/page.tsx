'use client'
/** KBB-EXCEPTIONAL-01 — Araçlar › SGK işitme raporu taslağı. KBB-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KbbAracKabugu. */
import KbbAracKabugu from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu'
import KbbSgkAraci from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbSgkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KbbAracKabugu route="/doktor-tools/kbb-sgk" baslik="SGK işitme raporu taslağı" aciklama="İşitme cihazı ve odyolojik rapor için SUT kontrol listesini yürütür, taslak metni üretir. T.C. kimlik numarası, cihaz markası ve bedel yazmaz; tanıyı ve son kararı siz verirsiniz.">
      <KbbSgkAraci />
    </KbbAracKabugu>
  )
}
