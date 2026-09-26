'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Araçlar › Genel cerrahi kohort. Genel cerrahi-only. */
import GcAracKabugu from '@/specialties/genel-cerrahi/ui/araclar/GcAracKabugu'
import GcKohortAraci from '@/specialties/genel-cerrahi/ui/araclar/GcKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GcAracKabugu route="/doktor-tools/gc-kohort" baslik="Genel cerrahi kohort paneli" aciklama="Geciken kontrol, pre-op, yara/dren, patoloji ve açık acil bayrakları. Tek dokunuşla gönderilen hatırlatma tanı ve doz yazmaz.">
      <GcKohortAraci />
    </GcAracKabugu>
  )
}
