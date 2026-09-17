import { demoGozVisitById } from '@/lib/portal/demoData'
import { VisitDetailView } from '../../../_components/VisitsView'

export default function DemoGozVisitDetailPage({ params }: { params: { id: string } }) {
  return <VisitDetailView basePath="/portal/demo-goz" visit={demoGozVisitById(params.id)} />
}
