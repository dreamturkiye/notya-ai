import { demoResultById } from '@/lib/portal/demoData'
import { ResultDetailView } from '../../../_components/ResultsView'

export default function DemoResultDetailPage({ params }: { params: { id: string } }) {
  return <ResultDetailView basePath="/portal/demo" result={demoResultById(params.id)} />
}
