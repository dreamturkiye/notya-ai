import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { AsiKarnesiView } from '../../_components/AsiKarnesiView'

/** ASI-KARNESI-01 — demo Aşı Karnesi (sentetik; PDF kapalı). */
export default function DemoAsiKarnesiPage() {
  return <AsiKarnesiView karne={SAGLIGIM_DEMO.asiKarnesi} basePath="/portal/demo" pdfUrl={null} />
}
