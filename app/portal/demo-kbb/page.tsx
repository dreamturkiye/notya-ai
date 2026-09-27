import { SAGLIGIM_DEMO_KBB } from '@/lib/portal/demoData'
import { HomeHero } from '../_components/HomeHero'

export default function DemoKbbHomePage() {
  return <HomeHero basePath="/portal/demo-kbb" data={SAGLIGIM_DEMO_KBB} />
}
