import { SAGLIGIM_DEMO_KBB } from '@/lib/portal/demoData'
import { KulaklarimView } from '../../_components/KulaklarimView'

export default function DemoKbbKulaklarimPage() {
  return <KulaklarimView kulak={SAGLIGIM_DEMO_KBB.kulak} basePath="/portal/demo-kbb" />
}
