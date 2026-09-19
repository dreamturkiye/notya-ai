'use client'
/** PSIK-EXCEPTIONAL-01 — Araçlar › Psikotrop rapor & reçete. Psikiyatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PsikAracKabugu. */
import PsikAracKabugu from '@/specialties/psikiyatri/ui/araclar/PsikAracKabugu'
import PsikSgkAraci from '@/specialties/psikiyatri/ui/araclar/PsikSgkAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PsikAracKabugu route="/doktor-tools/psik-sgk" baslik="Psikotrop rapor & reçete" aciklama="İlaç raporu taslağı, SUT kontrol listesi ve kontrole tabi ilaçlarda Renkli Reçete Sistemi uyarısı. T.C. kimlik numarası ve doz yazılmaz; Medula girişi ve e-imza hekimindedir.">
      <PsikSgkAraci />
    </PsikAracKabugu>
  )
}
