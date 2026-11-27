'use client'
/** BRANS-PAKETI Phase 2 demo home — the live Bugün (example mode) with the branş package's "today" card. */
import { BugunSayfasi } from '../../_components/saglikEvi/Sayfalar'
import { DemoPaketSaglayici } from './DemoPaketSaglayici'

export default function Page() {
  return <DemoPaketSaglayici>{() => <BugunSayfasi />}</DemoPaketSaglayici>
}
