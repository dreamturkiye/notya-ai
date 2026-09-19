'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Araçlar › Kohort. */
import RomaAracKabugu from '@/specialties/romatoloji/ui/araclar/RomaAracKabugu'
import RomaKohortAraci from '@/specialties/romatoloji/ui/araclar/RomaKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <RomaAracKabugu route="/doktor-tools/roma-kohort" baslik="Romatoloji kohort paneli" aciklama="Geciken kontrol · lab · yüksek skor bandı · açık acil · SUT eksik · 1-tap hatırlatma.">
      <RomaKohortAraci />
    </RomaAracKabugu>
  )
}
