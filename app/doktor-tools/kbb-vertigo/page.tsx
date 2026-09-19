'use client'
/** KBB-EXCEPTIONAL-01 — Araçlar › Vertigo / Dix-Hallpike notu. KBB-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KbbAracKabugu. */
import KbbAracKabugu from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu'
import KbbVertigoAraci from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbVertigoAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KbbAracKabugu route="/doktor-tools/kbb-vertigo" baslik="Vertigo / Dix-Hallpike notu" aciklama="Pozisyonel test ve repozisyon manevralarının sonucunu düzenli bir nota çevirir. Santral şüphesi işareti seçiliyse manevra yerine acil değerlendirmeyi öne alır; tanı adı yazmaz.">
      <KbbVertigoAraci />
    </KbbAracKabugu>
  )
}
