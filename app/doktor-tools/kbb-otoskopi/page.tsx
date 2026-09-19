'use client'
/** KBB-EXCEPTIONAL-01 — Araçlar › Otoskopi / kulak zarı notu. KBB-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KbbAracKabugu. */
import KbbAracKabugu from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu'
import KbbOtoskopiAraci from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbOtoskopiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KbbAracKabugu route="/doktor-tools/kbb-otoskopi" baslik="Otoskopi / kulak zarı notu" aciklama="İşaretlediğiniz dış kulak ve kulak zarı bulgularını düzenli bir muayene notuna çevirir, bu vizitte karar bekleyen başlıkları ayırır. Tanı adı üretmez — hangi bulgunun ne anlama geldiğine siz karar verirsiniz.">
      <KbbOtoskopiAraci />
    </KbbAracKabugu>
  )
}
