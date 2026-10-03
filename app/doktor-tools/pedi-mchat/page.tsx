'use client'
/**
 * PEDI-MCHAT-EXCEPTIONAL-01 — Araçlar › M-CHAT-R/F (exceptional pediatri stüdyosu).
 * Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu.
 */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import MchatAraci from '@/specialties/pediatri/ui/araclar/MchatAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu
      route="/doktor-tools/pedi-mchat"
      baslik="M-CHAT-R/F"
      aciklama="Otizm tarama aracı (16–30 ay): 20 soru · düşük / orta / yüksek risk · kaydet ve bugünkü muayene formuna ekle. Resmi Türkçe M-CHAT-R/F algoritması — tanı koymaz, karar desteğidir."
    >
      <MchatAraci />
    </PediAracKabugu>
  )
}
