'use client'
/** PSIK-EXCEPTIONAL-01 — Araçlar › PHQ-9 / GAD-7. Psikiyatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PsikAracKabugu. */
import PsikAracKabugu from '@/specialties/psikiyatri/ui/araclar/PsikAracKabugu'
import PhqGadAraci from '@/specialties/psikiyatri/ui/araclar/PhqGadAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PsikAracKabugu route="/doktor-tools/psik-phq-gad" baslik="PHQ-9 / GAD-7" aciklama="Maddeleri işaretleyin; toplam ve şiddet bandı anında çıkar, istersen hasta dosyasına kaydedin. Bant karar desteğidir — DSM-5-TR tanısı hekimin. PHQ-9 9. madde pozitifse güvenlik değerlendirmesi zorunludur.">
      <PhqGadAraci />
    </PsikAracKabugu>
  )
}
