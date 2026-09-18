'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › Yama D2/D4. Dermatoloji-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DermAracKabugu. */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import YamaAraci from '@/specialties/dermatoloji/ui/araclar/YamaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-yama" baslik="Yama D2 / D4" aciklama="Uygulama tarihinden D2 ve D4 okuma günlerini hesaplayın, okuma durumunu görün ve Avrupa baz serisinden uygulanan ile pozitif antijenleri işaretleyin.">
      <YamaAraci />
    </DermAracKabugu>
  )
}
