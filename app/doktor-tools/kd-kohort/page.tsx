'use client'
/** Araçlar › Kadın Doğum Kohort Paneli. Kadın doğum-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import KdKohortPaneli from '@/specialties/kadin-dogum/ui/araclar/KdKohortPaneli'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-kohort" baslik="Kadın Doğum Kohort Paneli" aciklama="Lohusa 1. ve 6. hafta kontrolü, kapanmak üzere tarama pencereleri, geciken izlemler, OGTT / anti-D / GBS zamanı ve smear / HPV gecikmesi — tek dokunuşla hatırlatma.">
      <KdKohortPaneli />
    </KdAracKabugu>
  )
}
