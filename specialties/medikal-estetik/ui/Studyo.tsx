'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { HEKIM_KILIT } from '../engines/estetik'
import { OZEL_ARACLAR } from '@/lib/klinik/ozelAracCalistir'

export function MedikalStudyo({ route, children }: { route: string; children: ReactNode }) {
  const hasta = useSearchParams().get('patientId') || ''
  const q = hasta ? `?patientId=${encodeURIComponent(hasta)}` : ''
  const araclar = OZEL_ARACLAR.filter((a) => a.slug === 'medikal-estetik')
  return (
    <div data-studyo="medikal-estetik" style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#6b21a8' }}>{HEKIM_KILIT}</p>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {araclar.map((a) => (
          <Link key={a.route} href={`${a.route}${q}`} data-studyo-arac={a.route} style={{ fontSize: 13, fontWeight: a.route === route ? 700 : 500, color: '#6b21a8', textDecoration: 'none' }}>{a.baslik}</Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
