'use client'
/**
 * BRANS-PAKETI Phase 2 — "what matters today" for the branş package on the Bugün home (all 40 branşlar, one look).
 * Additive (Taban önce): it sits after the doctor bridge and the alerts, never above Randevu al / Doktoruma yaz.
 * Data: the lean `?bugun=1` read of /api/portal/hasta/[token]/brans-paketi, fetched ONCE after the home has painted
 * (never part of the Sağlığım bundle — performans-butcesi-koruma). Demo portals pass a fixture through
 * <PaketDemoSaglayici> (same resolver + payload builder as live). The doctor's preview (token 'onizleme') shows nothing.
 * Renders nothing when the patient has no package module on (templates not accepted, branş without a package).
 */
import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { portalFetch } from '@/lib/portal/portalFetch'
import type { PaketBugunOzeti } from '@/lib/portal/bransPaketiYuk'
import { BugunSatirlari, PaketStili } from './BransPaketiView'

const DemoCtx = createContext<PaketBugunOzeti | null>(null)
export function PaketDemoSaglayici({ ozet, children }: { ozet: PaketBugunOzeti | null; children: React.ReactNode }) {
  return <DemoCtx.Provider value={ozet}>{children}</DemoCtx.Provider>
}

export const BUGUN_KART_SOZLER = { ac: 'Aç', ilerleme: (etiket: string) => etiket }

export function BransPaketiBugunKarti({ token, basePath, sozler = BUGUN_KART_SOZLER }: { token: string | null | undefined; basePath: string; sozler?: typeof BUGUN_KART_SOZLER }) {
  const demo = useContext(DemoCtx)
  const canli = !demo && !!token && token !== 'onizleme' && !basePath.startsWith('/portal/demo')
  const [ozet, setOzet] = useState<PaketBugunOzeti | null>(demo)
  useEffect(() => {
    if (!canli) return
    let iptal = false
    portalFetch(`/api/portal/hasta/${encodeURIComponent(String(token))}/brans-paketi?bugun=1`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!iptal && j && Array.isArray(j.ogeler)) setOzet(j as PaketBugunOzeti) })
      .catch(() => undefined)
    return () => { iptal = true }
  }, [canli, token])
  if (!ozet || !ozet.ogeler.length || !ozet.yol) return null
  const yol = ozet.ogeler.find((x) => x.tur === 'zaman' && x.ilerleme)
  const href = `${basePath}${ozet.yol}`
  return (
    <section className="sgb-bolum" aria-labelledby="sgb-paket-b" data-bugun-paket={ozet.brans || ''}>
      <PaketStili />
      <div className="sgb-bolum-bas"><h2 id="sgb-paket-b">{ozet.ad}</h2><Link href={href}>{sozler.ac}</Link></div>
      <div className="bp" style={{ margin: 0 }}>
        <Link href={href} className="bp-yol" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
          {yol?.ilerleme ? (
            <>
              <div className="bp-yol-gun">{sozler.ilerleme(yol.ilerleme.etiket)}<small>{yol.baslik}</small></div>
              <div className="bp-yol-cubuk" role="progressbar" aria-valuemin={0} aria-valuemax={yol.ilerleme.m} aria-valuenow={yol.ilerleme.n} aria-label={yol.baslik}><i style={{ width: `${Math.round((yol.ilerleme.n / yol.ilerleme.m) * 100)}%` }} /></div>
              <p className="bp-yol-cumle">{yol.metin}</p>
            </>
          ) : null}
          <BugunSatirlari ogeler={ozet.ogeler.filter((x) => x !== yol)} />
        </Link>
      </div>
    </section>
  )
}
