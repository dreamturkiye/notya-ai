'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Araçlar › Biyolojik SUT. */
import RomaAracKabugu from '@/specialties/romatoloji/ui/araclar/RomaAracKabugu'
import RomaBiyolojikSutAraci from '@/specialties/romatoloji/ui/araclar/RomaBiyolojikSutAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RomaAracKabugu route="/doktor-tools/roma-biyolojik-sut" baslik="Biyolojik SUT checklist" aciklama="TB/HBV/HCV ve basamak kontrol listesi. Doz, yükleme şeması ve infüzyon HIS yazılmaz.">
      <RomaBiyolojikSutAraci />
    </RomaAracKabugu>
  )
}
