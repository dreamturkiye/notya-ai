/**
 * Konsültan portalı önizlemesi — canlı jeton olmadan tam görünüm.
 * Sentetik Ali Kara / KBB istemi; gönderim kaydedilmez.
 */
import KonsultanPortal from '@/components/konsultan/KonsultanPortal'
import { KONSULTAN_DEMO_DILIM, KONSULTAN_DEMO_JETON } from '@/lib/doktor/konsultanDemo'

export const dynamic = 'force-dynamic'

export default function KonsultanDemoSayfasi() {
  return (
    <KonsultanPortal
      jeton={KONSULTAN_DEMO_JETON}
      baslangicDilim={KONSULTAN_DEMO_DILIM}
      demoMu
    />
  )
}
