'use client'
/** ARACLAR-CILA-01 Faz 4 — Araçlar › Muayene sonu paketi. Evrensel (ORTAK_DOKTOR_ARACLARI); kapı OrtakAracKabugu içinde. */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import MuayeneSonuPaketi from '@/components/doktor/araclar/MuayeneSonuPaketi'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <OrtakAracKabugu
      route="/doktor-tools/muayene-sonu"
      baslik="Muayene sonu paketi"
      aciklama="Vizitin kapanışı tek akışta: reçete, rapor, kontrol randevusu, portal özeti ve SGK provizyon adımı. Her adım isteğe bağlıdır; kapanış özetini isterseniz bugünkü muayene formuna eklersiniz."
    >
      <MuayeneSonuPaketi />
    </OrtakAracKabugu>
  )
}
