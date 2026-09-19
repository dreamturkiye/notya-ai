'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Toraks tüp / yara izlem. Göğüs cerrahisi-only. */
import GcAracKabugu from '@/specialties/gogus-cerrahisi/ui/araclar/GcAracKabugu'
import GcTupYaraAraci from '@/specialties/gogus-cerrahisi/ui/araclar/GcTupYaraAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gogus-cerrahi-tup-yara" baslik="Toraks tüp / yara izlem" aciklama="Tüp, dren ve yara durumu · sonraki kontrol tarihi. Tanı ve doz yazılmaz.">
      <GcTupYaraAraci />
    </GcAracKabugu>
  )
}
