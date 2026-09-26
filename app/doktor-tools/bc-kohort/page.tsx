'use client'
/** BEYIN-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Beyin cerrahisi kohort. Beyin-cerrahisi-only. */
import BcAracKabugu from '@/specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu'
import BcKohortAraci from '@/specialties/beyin-cerrahisi/ui/araclar/BcKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <BcAracKabugu route="/doktor-tools/bc-kohort" baslik="Beyin cerrahisi kohort paneli" aciklama="Geciken kontrol · post-op · bilinç · açık acil · görüntü — tek dokunuşla hasta-güvenli hatırlatma.">
      <BcKohortAraci />
    </BcAracKabugu>
  )
}
