'use client'
import MbysKuyrugu from '@/components/doktor/MbysKuyrugu'
import { toolsShell } from '@/lib/doktor/toolsUi'

export const dynamic = 'force-dynamic'

/** MBYS-YARDIMCI-01 — Gün sonu MBYS kuyruğu, inside the e-Nabız tool. */
export default function MbysKuyruguSayfa() {
  return (
    <div style={toolsShell}>
      <MbysKuyrugu />
    </div>
  )
}
