'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Araçlar › Osteoporoz / DXA. Endokrinoloji-only. */
import EndoAracKabugu from '@/specialties/endokrinoloji/ui/araclar/EndoAracKabugu'
import EndoDxaAraci from '@/specialties/endokrinoloji/ui/araclar/EndoDxaAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EndoAracKabugu route="/doktor-tools/endo-dxa" baslik="Osteoporoz / DXA hatırlatma" aciklama="Son DXA tarihi ve hekim risk bandı ile tekrar aralığı önerisi. T-skor yorumu, tanı ve ilaç dozu yazılmaz.">
      <EndoDxaAraci />
    </EndoAracKabugu>
  )
}
