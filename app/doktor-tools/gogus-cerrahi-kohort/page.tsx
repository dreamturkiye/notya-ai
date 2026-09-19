'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Göğüs cerrahisi kohort. Göğüs cerrahisi-only. */
import GcAracKabugu from '@/specialties/gogus-cerrahisi/ui/araclar/GcAracKabugu'
import GcKohortAraci from '@/specialties/gogus-cerrahisi/ui/araclar/GcKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gogus-cerrahi-kohort" baslik="Göğüs cerrahisi kohort paneli" aciklama="Geciken kontrol · pre-op · tüp/yara · patoloji · açık acil · 1-tap hatırlatma. Tanı/CAT taşınmaz.">
      <GcKohortAraci />
    </GcAracKabugu>
  )
}
