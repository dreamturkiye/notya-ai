'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › GÖP izotretinoin kapı. Dermatoloji-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DermAracKabugu. */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import GopKapiAraci from '@/specialties/dermatoloji/ui/araclar/GopKapiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-gop" baslik="GÖP izotretinoin kapı" aciklama="Çift kontrasepsiyon, β-hCG tarihi ve sonucu, siklus günü ve reçete süresini girin; gebelikten korunma programının engelleri tek ekranda listelenir. Doz ve endikasyon kararı hekimindir.">
      <GopKapiAraci />
    </DermAracKabugu>
  )
}
