'use client'
/** Özel Branşlar › Cerrahi güvenlik & risk (KD-OPERATOR-01): the same core tool for the surgical Özel Branşlar (saç ekimi, estetik cerrahi). */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import { ameliyatNotuBransi } from '@/lib/doktor/ameliyatNotu'
import CerrahiGuvenlikAraci from '@/components/doktor/araclar/CerrahiGuvenlikAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu route="/ozel-branslar/cerrahi-guvenlik" ustEtiket="Özel Branşlar" izinVer={ameliyatNotuBransi} baslik="Cerrahi güvenlik & risk" aciklama="WHO Cerrahi Güvenlik Kontrol Listesi (giriş, mola, çıkış), Caprini VTE risk skoru ve profilaksi planı, ASA fiziksel durum sınıfı. Ajan ve doz hekimindir.">
      <CerrahiGuvenlikAraci />
    </OrtakAracKabugu>
  )
}
