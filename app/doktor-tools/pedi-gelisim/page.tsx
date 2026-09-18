'use client'
/** PEDI-ARACLAR-02 — Araçlar › Gelişim taraması paneli. Pediatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PediAracKabugu. */
import PediAracKabugu from '@/specialties/pediatri/ui/araclar/PediAracKabugu'
import GelisimPaneli from '@/specialties/pediatri/ui/araclar/GelisimPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PediAracKabugu route="/doktor-tools/pedi-gelisim" baslik="Bu vizitte hangi tarama?" aciklama="Yaşa göre SB izlem vizitinin taramaları: işitme, kırmızı refle ve görme, GİDR, M-CHAT-R/F, D vitamini ve demir. Tamamlananı işaretleyin; sonucu tek dokunuşla bugünkü muayene formuna ekleyin.">
      <GelisimPaneli />
    </PediAracKabugu>
  )
}
