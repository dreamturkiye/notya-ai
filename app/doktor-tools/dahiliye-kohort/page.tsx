'use client'
/** NOTYA-DAH-WOW W4.1 — Araçlar › Dahiliye kohort paneli. */
import DoktorNav from '@/components/doktor/DoktorNav'
import { toolsShell } from '@/lib/doktor/toolsUi'
import { KohortPanel } from '@/specialties/dahiliye/ui/DahiliyeWow4'

export default function DahiliyeKohortPage() {
  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EDF1F7', margin: '0 0 12px' }}>Dahiliye kohort paneli</h1>
        <KohortPanel />
      </div>
    </div>
  )
}
