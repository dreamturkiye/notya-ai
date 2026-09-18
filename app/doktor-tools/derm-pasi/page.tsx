'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › PASI / EASI hesap. Dermatoloji-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DermAracKabugu. */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import PasiEasiAraci from '@/specialties/dermatoloji/ui/araclar/PasiEasiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-pasi" baslik="PASI / EASI hesap" aciklama="Bölge bölge eritem, infiltrasyon / ödem, deskuamasyon ve alan derecesini girin; PASI ve EASI toplamı ile şiddet bandı anında hesaplanır. SCORAD alanları isteğe bağlıdır.">
      <PasiEasiAraci />
    </DermAracKabugu>
  )
}
