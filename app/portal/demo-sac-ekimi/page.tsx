import { SAGLIGIM_DEMO_SAC_EKIMI } from '@/lib/portal/bransPaketiDemo'
import { HomeHero } from '../_components/HomeHero'

export default function Page() {
  return <HomeHero basePath="/portal/demo-sac-ekimi" data={SAGLIGIM_DEMO_SAC_EKIMI} />
}
