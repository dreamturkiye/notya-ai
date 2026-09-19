'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Araçlar › Nöroloji kohort paneli. Nöroloji-only (BRANS_DOKTOR_ARACLARI). */
import NoroAracKabugu from '@/specialties/noroloji/ui/araclar/NoroAracKabugu'
import NoroKohortAraci from '@/specialties/noroloji/ui/araclar/NoroKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NoroAracKabugu route="/doktor-tools/noro-kohort" baslik="Nöroloji kohort paneli" aciklama="Geciken kontrol, geciken ilaç izlem, açık inme/TIA bayrağı ve yüksek MIDAS bandı. 1-tap hatırlatma klinik bilgi taşımaz.">
      <NoroKohortAraci />
    </NoroAracKabugu>
  )
}
