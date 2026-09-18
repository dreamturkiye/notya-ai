'use client'
/** Araçlar › Doğum & Analık Rapor Asistanı. Kadın doğum-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import DogumRaporAraci from '@/specialties/kadin-dogum/ui/araclar/DogumRaporAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-dogum-rapor" baslik="Doğum & Analık Rapor Asistanı" aciklama="TDT'den analık istirahati tarihleri (tekil 24, çoğul 26 hafta), erken veya geç doğumda yeniden hesap ve istirahat raporu taslağı — Medula'da siz imzalarsınız.">
      <DogumRaporAraci />
    </KdAracKabugu>
  )
}
