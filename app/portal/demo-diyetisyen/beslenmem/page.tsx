'use client'
import { PAKET_DEMO_DIYETISYEN, SAGLIGIM_DEMO_DIYETISYEN } from '@/lib/portal/bransPaketiDemo'
import { KlinikHatirlatmaView } from '../../_components/KlinikHatirlatmaView'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

/** BRANS-PAKETI demo — the same views as the live page, fed by the synthetic package (all templates accepted). */
export default function Page() {
  const plan = SAGLIGIM_DEMO_DIYETISYEN.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Beslenmem" subtitle="Kontrol tarihi. Kalori yorumu ve tanı yoktur." acil="Ağır alerji veya bilinç değişikliği: 112." basePath="/portal/demo-diyetisyen">
      <BransPaketiView basePath="/portal/demo-diyetisyen" demo={PAKET_DEMO_DIYETISYEN} />
    </KlinikHatirlatmaView>
  )
}
