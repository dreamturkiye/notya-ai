'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Araçlar › Anemi-CKD. Nefroloji-only. */
import NefAracKabugu from '@/specialties/nefroloji/ui/araclar/NefAracKabugu'
import NefAnemiAraci from '@/specialties/nefroloji/ui/araclar/NefAnemiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NefAracKabugu route="/doktor-tools/nef-anemi" baslik="Anemi-CKD izlem" aciklama="Hb (± ferritin) ile izlem aralığı (karar desteği). ESA / eritropoietin dozu yazılmaz.">
      <NefAnemiAraci />
    </NefAracKabugu>
  )
}
