import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { MedicationsView } from '../../_components/MedicationsView'

export default function DemoGozMedsPage() {
  return <MedicationsView data={SAGLIGIM_DEMO_GOZ} />
}
