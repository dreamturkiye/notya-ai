'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Araçlar › eGFR/KDIGO. Nefroloji-only. */
import NefAracKabugu from '@/specialties/nefroloji/ui/araclar/NefAracKabugu'
import NefEgfrAraci from '@/specialties/nefroloji/ui/araclar/NefEgfrAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NefAracKabugu route="/doktor-tools/nef-egfr-kdigo" baslik="eGFR / KDIGO şerit" aciklama="eGFR ve isteğe bağlı UACR ile KDIGO G×A hücresi ve izlem aralığı (karar desteği). Tanı yazılmaz. ESA / ilaç dozu yazılmaz. Dahiliye CKD aracı değildir.">
      <NefEgfrAraci />
    </NefAracKabugu>
  )
}
