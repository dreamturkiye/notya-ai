'use client'
/** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Spor kohort. */
import SporAracKabugu from '@/specialties/spor-hekimligi/ui/araclar/SporAracKabugu'
import SporKohortAraci from '@/specialties/spor-hekimligi/ui/araclar/SporKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <SporAracKabugu route="/doktor-tools/spor-kohort" baslik="Spor kohort paneli" aciklama="Geciken kontrol · RTP · aktif sakatlık · yüklenme uyarısı · açık kırmızı bayrak. Tek dokunuşla hasta-güvenli hatırlatma.">
      <SporKohortAraci />
    </SporAracKabugu>
  )
}
