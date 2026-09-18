'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › Fototerapi defteri. Dermatoloji-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DermAracKabugu. */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import FototerapiDefteriAraci from '@/specialties/dermatoloji/ui/araclar/FototerapiDefteriAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-fototerapi" baslik="Fototerapi defteri" aciklama="Cihazı seçin, seansları J/cm² ile girin; kümülatif doz, MED notu ve yanık bayrağı anında toplanır. Solaryum cihaz listesinde yoktur.">
      <FototerapiDefteriAraci />
    </DermAracKabugu>
  )
}
