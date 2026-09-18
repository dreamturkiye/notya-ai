'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › CHA₂DS₂-VASc / HAS-BLED. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import AntikoagAraci from '@/specialties/dahiliye/ui/araclar/AntikoagAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-antikoag" baslik="CHA₂DS₂-VASc / HAS-BLED" aciklama="Atriyal fibrilasyonda inme riski bileşenlerini işaretleyin; HAS-BLED maddeleri kanamanın değiştirilebilir nedenleri için kontrol listesi olarak gösterilir (skor iddiası yok) ve DOAK uygunluk bayrakları çıkar.">
      <AntikoagAraci />
    </DahiliyeAracKabugu>
  )
}
