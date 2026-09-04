import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { ResultsListView } from '../../_components/ResultsView'

export default function DemoResultsPage() {
  return <ResultsListView basePath="/portal/demo" data={SAGLIGIM_DEMO} />
}
