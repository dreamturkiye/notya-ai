'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Araçlar › Kohort. Enfeksiyon-only. */
import EnfAracKabugu from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAracKabugu'
import EnfKohortAraci from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EnfAracKabugu route="/doktor-tools/enfeksiyon-kohort" baslik="Enfeksiyon kohort paneli" aciklama="Geciken kontrol, ATB süre, viral izlem, izolasyon ve açık acil bayrak. Tek dokunuşla hasta-güvenli hatırlatma — tanı/doz yok.">
      <EnfKohortAraci />
    </EnfAracKabugu>
  )
}
