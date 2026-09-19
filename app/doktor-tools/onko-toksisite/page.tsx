'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Araçlar › Toksisite kontrol listesi. Onkoloji-only. */
import OnkoAracKabugu from '@/specialties/onkoloji/ui/araclar/OnkoAracKabugu'
import OnkoToksisiteAraci from '@/specialties/onkoloji/ui/araclar/OnkoToksisiteAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OnkoAracKabugu route="/doktor-tools/onko-toksisite" baslik="Toksisite kontrol listesi" aciklama="Yan etki maddelerini işaretleyin; grade tanı değildir, doz azaltma hekimdedir.">
      <OnkoToksisiteAraci />
    </OnkoAracKabugu>
  )
}
