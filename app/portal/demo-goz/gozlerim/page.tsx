import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { GozlerimView } from '../../_components/GozlerimView'

export default function DemoGozlerimPage() {
  return <GozlerimView goz={SAGLIGIM_DEMO_GOZ.goz} basePath="/portal/demo-goz" token="demo-goz" />
}
