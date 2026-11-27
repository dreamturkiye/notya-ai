'use client'
import { PAKET_DEMO_SAC_EKIMI, SAGLIGIM_DEMO_SAC_EKIMI } from '@/lib/portal/bransPaketiDemo'
import { KlinikHatirlatmaView } from '../../_components/KlinikHatirlatmaView'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

/** BRANS-PAKETI demo — the same views as the live page, fed by the synthetic package (all templates accepted). */
export default function Page() {
  const plan = SAGLIGIM_DEMO_SAC_EKIMI.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Saçım" subtitle="Yıkama ve kontrol tarihleri. Greft, tanı ve ilaç yoktur." acil="Kızarıklık+ateş veya nefes darlığında 112." basePath="/portal/demo-sac-ekimi">
      <BransPaketiView basePath="/portal/demo-sac-ekimi" demo={PAKET_DEMO_SAC_EKIMI} />
    </KlinikHatirlatmaView>
  )
}
