'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Araçlar › Anestezi kohort. Anestezi-only. */
import AnesteziAracKabugu from '@/specialties/anestezi/ui/araclar/AnesteziAracKabugu'
import AnesteziKohortAraci from '@/specialties/anestezi/ui/araclar/AnesteziKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AnesteziAracKabugu route="/doktor-tools/anestezi-kohort" baslik="Anestezi kohort" aciklama="Geciken kontrol, ASA/pre-op, hava yolu, ağrı, alerji/ilaç ve açık acil bayrakları. Hasta-güvenli 1-tap hatırlatma.">
      <AnesteziKohortAraci />
    </AnesteziAracKabugu>
  )
}
