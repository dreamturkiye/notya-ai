'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Araçlar › Ortopedi kohort paneli. */
import OrtoAracKabugu from '@/specialties/ortopedi/ui/araclar/OrtoAracKabugu'
import OrtoKohortAraci from '@/specialties/ortopedi/ui/araclar/OrtoKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtoAracKabugu route="/doktor-tools/orto-kohort" baslik="Ortopedi kohort paneli" aciklama="Geciken kontrol, alçı/yük izlemi, yüksek VAS bandı ve açık kırmızı bayrakları listeler. Tek dokunuşla gönderilen hatırlatma tanı ve doz yazmaz.">
      <OrtoKohortAraci />
    </OrtoAracKabugu>
  )
}
