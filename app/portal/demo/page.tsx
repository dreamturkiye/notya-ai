import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { HomeHero } from '../_components/HomeHero'

export default function DemoHomePage() {
  return <HomeHero basePath="/portal/demo" data={SAGLIGIM_DEMO} />
}
