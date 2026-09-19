'use client'
/** NEFROLOJI-DEEPEN-01 — Araçlar › SGK nefro rapor. Nefroloji-only. */
import NefAracKabugu from '@/specialties/nefroloji/ui/araclar/NefAracKabugu'
import NefSgkAraci from '@/specialties/nefroloji/ui/araclar/NefSgkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NefAracKabugu route="/doktor-tools/nef-sgk" baslik="SGK nefro rapor" aciklama="KBH izlem · diyaliz · ESA/anemi · mineral-kemik · nakil izlem taslakları + SUT kontrol listesi. T.C. yazılmaz. ESA / ilaç dozu yazılmaz. Medula canlı gönderim yok.">
      <NefSgkAraci />
    </NefAracKabugu>
  )
}
