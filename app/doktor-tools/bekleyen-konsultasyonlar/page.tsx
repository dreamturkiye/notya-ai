'use client'
/** KONSULTASYON-02 — Araçlar › Bekleyen Konsültasyonlar. Evrensel (ORTAK_DOKTOR_ARACLARI); kapı OrtakAracKabugu içinde. */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import BekleyenKonsultasyonlar from '@/components/doktor/araclar/BekleyenKonsultasyonlar'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu
      route="/doktor-tools/bekleyen-konsultasyonlar"
      baslik="Bekleyen Konsültasyonlar"
      aciklama="Yanıtı henüz gelmemiş konsültasyon istemleriniz tek listede, en uzun bekleyen üstte. Buradan hasta dosyasına geçip yanıtı ekleyebilir, hastaya hatırlatma gönderebilir ya da istemi yanıtsız kapatabilirsiniz."
    >
      <BekleyenKonsultasyonlar />
    </OrtakAracKabugu>
  )
}
