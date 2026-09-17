import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { HomeHero } from '../_components/HomeHero'

export default function DemoGozHomePage() {
  return <HomeHero basePath="/portal/demo-goz" data={SAGLIGIM_DEMO_GOZ} />
}
