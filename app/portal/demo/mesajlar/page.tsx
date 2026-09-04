import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { MessagesView } from '../../_components/MessagesView'

export default function DemoMessagesPage() {
  return <MessagesView data={SAGLIGIM_DEMO} />
}
