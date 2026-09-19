'use client'
/** UROLOJI-EXCEPTIONAL-01 — Araçlar › Üroloji kohort. */
import UroAracKabugu from '@/specialties/uroloji/ui/araclar/UroAracKabugu'
import UroKohortAraci from '@/specialties/uroloji/ui/araclar/UroKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <UroAracKabugu route="/doktor-tools/uro-kohort" baslik="Üroloji kohort paneli" aciklama="Geciken kontrol · PSA izlem · yüksek IPSS · açık kırmızı bayrak. 1-tap hasta-güvenli hatırlatma (tanı/PSA sayı/IPSS skor yok).">
      <UroKohortAraci />
    </UroAracKabugu>
  )
}
