'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Araçlar › İzolasyon/bildirim. Enfeksiyon-only. */
import EnfAracKabugu from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAracKabugu'
import EnfIzolasyonAraci from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfIzolasyonAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EnfAracKabugu route="/doktor-tools/enfeksiyon-izolasyon" baslik="İzolasyon / bildirim hatırlatma" aciklama="İzolasyon tipi ve başlangıç/bitiş/bildirim tarihleri. Tanı yazılmaz. Hastane enfeksiyon kontrol sistemi (HBYS) bu araçta yoktur.">
      <EnfIzolasyonAraci />
    </EnfAracKabugu>
  )
}
