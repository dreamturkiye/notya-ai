'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Araçlar › Biyolojik SUT. */
import RomaAracKabugu from '@/specialties/romatoloji/ui/araclar/RomaAracKabugu'
import RomaBiyolojikSutAraci from '@/specialties/romatoloji/ui/araclar/RomaBiyolojikSutAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RomaAracKabugu route="/doktor-tools/roma-biyolojik-sut" baslik="Biyolojik SUT kontrol listesi" aciklama="TB/HBV/HCV ve basamak kontrol listesi. Doz, yükleme şeması ve infüzyon takibi (HBYS) yazılmaz.">
      <RomaBiyolojikSutAraci />
    </RomaAracKabugu>
  )
}
