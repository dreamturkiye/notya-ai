'use client'
/**
 * GERI-CAGIRMA-01 — "Bu listeyi geri çağır" on every kohort panel (CORE mechanism, one shared component).
 *
 * Mounted once in the shared tool layouts instead of being copied into ~40 forked panel components: it renders only
 * on a route that lib/geriCagirma/nedenler.ts knows as a due/overdue panel, and links to the recall screen with that
 * panel's own source as the filter. The recall screen then shows only the reasons of the signed-in doctor's own
 * branş (the gate is on the server), so the link can never open another branş's list.
 */
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { rotaninKaynagi } from '@/lib/geriCagirma/nedenler'

export const geriCagirmaAdresi = (kaynak: string | null): string => (kaynak ? `/doktor-tools/geri-cagirma?kaynak=${encodeURIComponent(kaynak)}` : '/doktor-tools/geri-cagirma')

export function KohortBaglantisiGorunumu({ yol }: { yol: string | null }) {
  const kaynak = rotaninKaynagi(yol)
  if (!kaynak) return null
  return (
    <div data-alan="kohort-geri-cagir" style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 20px', fontFamily: CHROME_FONT.sans }}>
      <Link href={geriCagirmaAdresi(kaynak)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '10px 16px', borderRadius: 12, border: `1px solid ${CHROME_RENK.border}`, background: '#FFFFFF', color: CHROME_RENK.pine, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
        Bu listeyi geri çağır →
      </Link>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: CHROME_RENK.muted }}>Vadesi gelen hastalara tek dokunuşla genel bir kontrol hatırlatması gönderin; mesajda neden yazmaz.</p>
    </div>
  )
}

export default function KohortBaglantisi() {
  return <KohortBaglantisiGorunumu yol={usePathname()} />
}
