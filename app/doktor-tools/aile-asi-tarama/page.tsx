'use client'
/** AILE-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Aşı/tarama paketi. Aile hekimliği-only. */
import AileAracKabugu from '@/specialties/aile-hekimligi/ui/araclar/AileAracKabugu'
import AileAsiTaramaAraci from '@/specialties/aile-hekimligi/ui/araclar/AileAsiTaramaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AileAracKabugu route="/doktor-tools/aile-asi-tarama" baslik="Aşı / tarama paketi hatırlatma" aciklama="Ulusal aşı takvimi ve birinci basamak tarama vadelerini işaretleyin. Vade hatırlatmasıdır; doz, lot ve tanı yazılmaz.">
      <AileAsiTaramaAraci />
    </AileAracKabugu>
  )
}
