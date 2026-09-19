'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Araçlar › VAS / fonksiyon. */
import OrtoAracKabugu from '@/specialties/ortopedi/ui/araclar/OrtoAracKabugu'
import OrtoVasAraci from '@/specialties/ortopedi/ui/araclar/OrtoVasAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtoAracKabugu route="/doktor-tools/orto-vas" baslik="VAS / fonksiyon skoru" aciklama="VAS 0–10 ve 4 fonksiyon maddesi ile şiddet bandını hesaplar. Bant karar desteğidir; artroz veya başka tanı yazılmaz.">
      <OrtoVasAraci />
    </OrtoAracKabugu>
  )
}
