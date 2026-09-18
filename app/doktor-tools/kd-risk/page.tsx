'use client'
/** Araçlar › Obstetrik Risk & Sezaryen Endikasyon Notu. Kadın doğum-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import RiskAraci from '@/specialties/kadin-dogum/ui/araclar/RiskAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-risk" baslik="Obstetrik Risk & Sezaryen Endikasyon Notu" aciklama="Preeklampsi risk faktörleri ve aspirin başlama penceresi, GDM riski, önceki sezaryen için SSVD tartışma alanları ve sizin seçip kilitlediğiniz sezaryen endikasyon notu.">
      <RiskAraci />
    </KdAracKabugu>
  )
}
