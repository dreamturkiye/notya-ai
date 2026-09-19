'use client'
/** PSIK-EXCEPTIONAL-01 — Araçlar › Psikiyatri kohort paneli. Psikiyatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PsikAracKabugu. */
import PsikAracKabugu from '@/specialties/psikiyatri/ui/araclar/PsikAracKabugu'
import PsikKohortAraci from '@/specialties/psikiyatri/ui/araclar/PsikKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PsikAracKabugu route="/doktor-tools/psik-kohort" baslik="Psikiyatri kohort paneli" aciklama="PHQ-9 yüksek, açık güvenlik bayrağı, geciken kontrol ve geciken lityum/valproat düzeyi olan hastalar tek listede; seçtiklerinize klinik bilgi taşımayan hatırlatma gönderin.">
      <PsikKohortAraci />
    </PsikAracKabugu>
  )
}
