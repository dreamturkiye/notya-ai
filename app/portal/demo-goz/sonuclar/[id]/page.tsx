import { demoGozResultById } from '@/lib/portal/demoData'
import { ResultDetailView } from '../../../_components/ResultsView'

export default function DemoGozResultDetailPage({ params }: { params: { id: string } }) {
  return <ResultDetailView basePath="/portal/demo-goz" result={demoGozResultById(params.id)} />
}
