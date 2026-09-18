'use client'
/** Araçlar › Kadın Hastalıkları ve Doğum Kohort Paneli. KHD-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import KdKohortPaneli from '@/specialties/kadin-dogum/ui/araclar/KdKohortPaneli'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-kohort" baslik={`${KADIN_HASTALIKLARI_DOGUM_ETIKETI} Kohort Paneli`} aciklama="Lohusa 1. ve 6. hafta kontrolü, kapanmak üzere tarama pencereleri, geciken izlemler, OGTT / anti-D / GBS zamanı ve smear / HPV gecikmesi — tek dokunuşla hatırlatma.">
      <KdKohortPaneli />
    </KdAracKabugu>
  )
}
