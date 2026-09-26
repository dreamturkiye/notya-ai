'use client'
/** BEYIN-CERRAHISI-EXCEPTIONAL-01 — Araçlar › Nöro post-op checklist. Beyin-cerrahisi-only. */
import BcAracKabugu from '@/specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu'
import BcPostopAraci from '@/specialties/beyin-cerrahisi/ui/araclar/BcPostopAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <BcAracKabugu route="/doktor-tools/bc-postop" baslik="Nöro post-op kontrol listesi" aciklama="Ameliyat sonrası kontrol maddeleri ve tarihler. Tanı, ameliyathane / HBYS kaydı ve AED dozu yazılmaz.">
      <BcPostopAraci />
    </BcAracKabugu>
  )
}
