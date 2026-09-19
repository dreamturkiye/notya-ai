'use client'
/** GOGUS-EXCEPTIONAL-01 — Araçlar › Astım-KOAH aksiyon planı. Göğüs-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GogusAracKabugu. */
import GogusAracKabugu from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu'
import GogusAksiyonPlaniAraci from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAksiyonPlaniAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GogusAracKabugu route="/doktor-tools/gogus-aksiyon-plani" baslik="Astım-KOAH aksiyon planı" aciklama="Yeşil / sarı / kırmızı yazılı plan taslağı. İnhaler sınıfı düzeyinde kalır; mcg ve puff yazılmaz.">
      <GogusAksiyonPlaniAraci />
    </GogusAracKabugu>
  )
}
