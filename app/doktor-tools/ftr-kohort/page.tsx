'use client'
/** FIZIK-TEDAVI-EXCEPTIONAL-01 — Araçlar › FTR kohort. Fizik-tedavi-only (BRANS_DOKTOR_ARACLARI). */
import FtrAracKabugu from '@/specialties/fizik-tedavi/ui/araclar/FtrAracKabugu'
import FtrKohortAraci from '@/specialties/fizik-tedavi/ui/araclar/FtrKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <FtrAracKabugu route="/doktor-tools/ftr-kohort" baslik="FTR kohort paneli" aciklama="Geciken kontrol, seans/egzersiz, açık kırmızı bayrak ve yüksek VAS/ODI. Tek dokunuşla gönderilen hatırlatma tanı/skor/doz taşımaz.">
      <FtrKohortAraci />
    </FtrAracKabugu>
  )
}
