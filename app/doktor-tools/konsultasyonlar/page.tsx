'use client'
/** KONSULTASYONLAR-01 — Araçlar › Konsültasyonlar. Defter · İstem · Bekleyen (alt sekmeler). */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import Konsultasyonlar from '@/components/doktor/araclar/Konsultasyonlar'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu
      route="/doktor-tools/konsultasyonlar"
      baslik="Konsültasyonlar"
      aciklama="Güvendiğiniz konsültanları deftere kaydedin, muayeneden istem gönderin, yanıt bekleyenleri izleyin. Konsültan hesap açmadan e-posta linkiyle rapor bırakır."
    >
      <Konsultasyonlar />
    </OrtakAracKabugu>
  )
}
