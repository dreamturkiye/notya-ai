import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { VisitsListView } from '../../_components/VisitsView'

export default function DemoGozVisitsPage() {
  return <VisitsListView basePath="/portal/demo-goz" data={SAGLIGIM_DEMO_GOZ} />
}
