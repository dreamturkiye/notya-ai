import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { VisitsListView } from '../../_components/VisitsView'

export default function DemoVisitsPage() {
  return <VisitsListView basePath="/portal/demo" data={SAGLIGIM_DEMO} />
}
