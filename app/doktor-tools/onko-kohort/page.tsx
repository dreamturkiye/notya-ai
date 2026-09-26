'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Araçlar › Onkoloji kohort paneli. Onkoloji-only. */
import OnkoAracKabugu from '@/specialties/onkoloji/ui/araclar/OnkoAracKabugu'
import OnkoKohortAraci from '@/specialties/onkoloji/ui/araclar/OnkoKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OnkoAracKabugu route="/doktor-tools/onko-kohort" baslik="Onkoloji kohort paneli" aciklama="Geciken kontrol · kür · toksisite · açık acil · görüntü zaman çizelgesi · tek dokunuşla hatırlatma.">
      <OnkoKohortAraci />
    </OnkoAracKabugu>
  )
}
