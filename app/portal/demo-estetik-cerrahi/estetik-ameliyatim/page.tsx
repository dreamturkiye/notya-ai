'use client'
import { PAKET_DEMO_ESTETIK_CERRAHI, SAGLIGIM_DEMO_ESTETIK_CERRAHI } from '@/lib/portal/bransPaketiDemo'
import { KlinikHatirlatmaView } from '../../_components/KlinikHatirlatmaView'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

/** BRANS-PAKETI demo — the same views as the live page, fed by the synthetic package (all templates accepted). */
export default function Page() {
  const plan = SAGLIGIM_DEMO_ESTETIK_CERRAHI.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Ameliyat bakımım" subtitle="Pansuman ve kontrol tarihleri. Tanı ve doz yoktur." acil="Nefes darlığı, göğüs ağrısı veya tek taraflı bacak şişliğinde 112." basePath="/portal/demo-estetik-cerrahi">
      <BransPaketiView basePath="/portal/demo-estetik-cerrahi" demo={PAKET_DEMO_ESTETIK_CERRAHI} />
    </KlinikHatirlatmaView>
  )
}
