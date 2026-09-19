'use client'
/** KBB-EXCEPTIONAL-01 — Araçlar › Odyometri özeti. KBB-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KbbAracKabugu. */
import KbbAracKabugu from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu'
import KbbOdyometriAraci from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbOdyometriAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KbbAracKabugu route="/doktor-tools/kbb-odyometri" baslik="Odyometri özeti" aciklama="Saf ses eşiklerinden ortalama (PTA) ve şiddet bandını hesaplar, önceki ölçümle karşılaştırır, iki kulak arası farkı işaretler. Bant karar desteğidir; kayıp tipini ve tanıyı siz belirlersiniz.">
      <KbbOdyometriAraci />
    </KbbAracKabugu>
  )
}
