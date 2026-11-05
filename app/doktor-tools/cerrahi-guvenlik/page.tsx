'use client'
/**
 * Araçlar › Cerrahi güvenlik & risk (KD-OPERATOR-01). CORE for every surgical branch: the gate is the operation-note
 * shell's own list (ameliyatNotuBransi), so it is exactly the branches that write operation notes, Özel Branşlar included.
 */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import { ameliyatNotuBransi } from '@/lib/doktor/ameliyatNotu'
import CerrahiGuvenlikAraci from '@/components/doktor/araclar/CerrahiGuvenlikAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu route="/doktor-tools/cerrahi-guvenlik" izinVer={ameliyatNotuBransi} baslik="Cerrahi güvenlik & risk" aciklama="WHO Cerrahi Güvenlik Kontrol Listesi (giriş, mola, çıkış), Caprini VTE risk skoru ve profilaksi planı, ASA fiziksel durum sınıfı. Ajan ve doz hekimindir.">
      <CerrahiGuvenlikAraci />
    </OrtakAracKabugu>
  )
}
