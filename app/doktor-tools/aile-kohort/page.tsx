'use client'
/** AILE-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Kohort. Aile hekimliği-only. */
import AileAracKabugu from '@/specialties/aile-hekimligi/ui/araclar/AileAracKabugu'
import AileKohortAraci from '@/specialties/aile-hekimligi/ui/araclar/AileKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AileAracKabugu route="/doktor-tools/aile-kohort" baslik="Aile hekimliği kohort paneli" aciklama="Geciken kontrol, aşı/tarama, kronik izlem ve açık sevk/acil bayraklarını görün. 1-tap hatırlatma klinik bilgi taşımaz.">
      <AileKohortAraci />
    </AileAracKabugu>
  )
}
