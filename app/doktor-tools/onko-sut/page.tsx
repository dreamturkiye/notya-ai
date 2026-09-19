'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Araçlar › SUT rapor taslağı. Onkoloji-only. */
import OnkoAracKabugu from '@/specialties/onkoloji/ui/araclar/OnkoAracKabugu'
import OnkoSutAraci from '@/specialties/onkoloji/ui/araclar/OnkoSutAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OnkoAracKabugu route="/doktor-tools/onko-sut" baslik="SUT rapor taslağı" aciklama="SGK/SUT endikasyon taslağı. Canlı Medula e-imza yoktur; güncel madde hekim doğrular.">
      <OnkoSutAraci />
    </OnkoAracKabugu>
  )
}
