'use client'
/** PSIK-EXCEPTIONAL-01 — Araçlar › Psikotrop izlem takvimi. Psikiyatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PsikAracKabugu. */
import PsikAracKabugu from '@/specialties/psikiyatri/ui/araclar/PsikAracKabugu'
import IlacIzlemAraci from '@/specialties/psikiyatri/ui/araclar/IlacIzlemAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PsikAracKabugu route="/doktor-tools/psik-ilac-izlem" baslik="Psikotrop izlem takvimi" aciklama="Lityum düzeyi, valproat karaciğer/hemogram, atipik antipsikotik metabolik panel, klozapin nötrofil ve SSRI kontrolü — sınıf düzeyi görevler ve vadeleri. Doz, titrasyon ve kesme kararı hekimin.">
      <IlacIzlemAraci />
    </PsikAracKabugu>
  )
}
