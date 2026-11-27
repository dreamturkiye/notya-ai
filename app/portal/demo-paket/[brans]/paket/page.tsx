'use client'
/** BRANS-PAKETI Phase 2 demo — the branş package page: the same view as the live chapter page, synthetic package. */
import { SectionHeader } from '../../../_components/ui'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'
import { DemoPaketSaglayici } from '../DemoPaketSaglayici'

export default function Page() {
  return (
    <DemoPaketSaglayici>
      {(paket, basePath) => (
        <div className="sg-fade">
          <SectionHeader title={paket.ad || ''} subtitle="Hekiminizin kabul ettiği bakım planı, günlükler ve tehlike işaretleri." />
          <BransPaketiView basePath={basePath} demo={paket} />
        </div>
      )}
    </DemoPaketSaglayici>
  )
}
