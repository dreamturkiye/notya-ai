'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar › Gastroenteroloji kohort. Gastroenteroloji-only. */
import GastroAracKabugu from '@/specialties/gastroenteroloji/ui/araclar/GastroAracKabugu'
import GastroKohortAraci from '@/specialties/gastroenteroloji/ui/araclar/GastroKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GastroAracKabugu route="/doktor-tools/gastro-kohort" baslik="Gastroenteroloji kohort paneli" aciklama="Geciken kontrol, skor/hepatit/endoskopi, PPI/biyolojik tarih ve açık acil bayraklı hastalar. 1-tap hatırlatma tanı ve doz yazmaz.">
      <GastroKohortAraci />
    </GastroAracKabugu>
  )
}
