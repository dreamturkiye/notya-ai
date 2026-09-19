'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Araçlar › Nöroloji ilaç izlem (AED). Nöroloji-only (BRANS_DOKTOR_ARACLARI). */
import NoroAracKabugu from '@/specialties/noroloji/ui/araclar/NoroAracKabugu'
import NoroIlacIzlemAraci from '@/specialties/noroloji/ui/araclar/NoroIlacIzlemAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NoroAracKabugu route="/doktor-tools/noro-ilac-izlem" baslik="Nöroloji ilaç izlem (AED)" aciklama="Antiepileptik ve ilgili sınıflar için lab / klinik kontrol takvimi. SINIF düzeyi görevler; doz, titrasyon ve kesme kararı hekimindir.">
      <NoroIlacIzlemAraci />
    </NoroAracKabugu>
  )
}
