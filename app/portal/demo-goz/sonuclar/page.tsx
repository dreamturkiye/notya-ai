import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { ResultsListView } from '../../_components/ResultsView'

export default function DemoGozResultsPage() {
  return <ResultsListView basePath="/portal/demo-goz" data={SAGLIGIM_DEMO_GOZ} />
}
