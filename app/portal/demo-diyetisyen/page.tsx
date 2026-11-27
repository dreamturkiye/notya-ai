import { SAGLIGIM_DEMO_DIYETISYEN } from '@/lib/portal/bransPaketiDemo'
import { HomeHero } from '../_components/HomeHero'

export default function Page() {
  return <HomeHero basePath="/portal/demo-diyetisyen" data={SAGLIGIM_DEMO_DIYETISYEN} />
}
