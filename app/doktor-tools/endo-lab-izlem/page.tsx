'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Araçlar › HbA1c / tiroid izlem. Endokrinoloji-only. */
import EndoAracKabugu from '@/specialties/endokrinoloji/ui/araclar/EndoAracKabugu'
import EndoLabIzlemAraci from '@/specialties/endokrinoloji/ui/araclar/EndoLabIzlemAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EndoAracKabugu route="/doktor-tools/endo-lab-izlem" baslik="HbA1c / tiroid izlem döngüsü" aciklama="HbA1c veya TSH değerini girin; önerilen sonraki izlem aralığı karar desteğidir. Tanı yazılmaz, doz yazılmaz. CGM cihaz entegrasyonu yoktur.">
      <EndoLabIzlemAraci />
    </EndoAracKabugu>
  )
}
