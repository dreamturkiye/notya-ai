import { demoVisitById } from '@/lib/portal/demoData'
import { VisitDetailView } from '../../../_components/VisitsView'

export default function DemoVisitDetailPage({ params }: { params: { id: string } }) {
  return <VisitDetailView basePath="/portal/demo" visit={demoVisitById(params.id)} />
}
