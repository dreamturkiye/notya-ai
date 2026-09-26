'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Araçlar › Radyoloji kohort. Radyoloji-only. */
import RadyoAracKabugu from '@/specialties/radyoloji/ui/araclar/RadyoAracKabugu'
import RadyoKohortAraci from '@/specialties/radyoloji/ui/araclar/RadyoKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RadyoAracKabugu route="/doktor-tools/radyo-kohort" baslik="Radyoloji kohort" aciklama="Geciken kontrol · kuyruk · rapor · kritik · belge · tek dokunuşla hasta-güvenli hatırlatma.">
      <RadyoKohortAraci />
    </RadyoAracKabugu>
  )
}
