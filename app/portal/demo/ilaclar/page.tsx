import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { MedicationsView } from '../../_components/MedicationsView'

export default function DemoMedsPage() {
  return <MedicationsView data={SAGLIGIM_DEMO} />
}
