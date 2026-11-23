'use client'
/**
 * ESNEK-MUAYENE-B7 — "Bugün N hasta · dokümantasyon X dk (önce Y dk) · kazanç Z dk" + the weekly summary. Measured time only;
 * "önce" from the best honest baseline and the line says which one; no baseline → no gain. Country-neutral (words injected).
 */
import { useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import { zamanSatiri, type ZamanOzeti } from '@/core/esnek/zamanOlcer'
import { EL_RENK as R } from '@/components/elNotu/renk'
import type { Getirici } from '@/components/elNotu/ElNotuYakala'

type Yanit = { gun: string; ozet: ZamanOzeti; hafta: ZamanOzeti; gunler: { gun: string; ozet: ZamanOzeti }[] }

export default function ZamanSayaci(p: { metin: EsnekMetinleri; getir: Getirici; api: string }) {
  const M = p.metin
  const [v, setV] = useState<Yanit | null>(null)
  const [hafta, setHafta] = useState(false)
  const { getir, api } = p
  useEffect(() => { void getir(`${api}/sure`).then((r) => (r.ok ? r.json() : null)).then((j) => setV(j?.ozet ? j : null)).catch(() => setV(null)) }, [getir, api])
  if (!v || (!v.ozet.hasta && !v.hafta.hasta)) return null
  const gunSatir = zamanSatiri(v.ozet, M.zaman, 'gun')
  const haftaSatir = zamanSatiri(v.hafta, M.zaman, 'hafta')
  const taban = (hafta ? v.hafta : v.ozet).taban
  return (
    <div style={{ background: R.camAcik, color: R.cam, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ flex: 1, minWidth: 0 }}>{hafta ? haftaSatir : gunSatir || haftaSatir}</span>
        {haftaSatir && gunSatir && (
          <button type="button" onClick={() => setHafta((x) => !x)} aria-pressed={hafta}
            style={{ border: `1px solid ${R.cizgi}`, background: '#fff', color: R.cam, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {hafta ? M.zaman.gunluk : M.zaman.haftalik}
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 400, color: R.soluk, marginTop: 2 }}>{taban ? M.zaman.tabanKaynagi[taban.kaynak] : M.zaman.tabanIste}</div>
      {hafta && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 8 }}>
          {v.gunler.map((g) => {
            const enCok = Math.max(1, ...v.gunler.map((x) => Math.max(x.ozet.dokumantasyonDk, x.ozet.onceDk || 0)))
            return (
              <div key={g.gun} title={zamanSatiri(g.ozet, M.zaman, 'gun') || ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ height: 40, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                  {g.ozet.onceDk !== null && <span style={{ width: 8, height: `${Math.round((g.ozet.onceDk / enCok) * 40)}px`, background: R.cizgi, borderRadius: 2 }} />}
                  <span style={{ width: 8, height: `${Math.max(g.ozet.hasta ? 2 : 0, Math.round((g.ozet.dokumantasyonDk / enCok) * 40))}px`, background: R.cam, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: R.soluk }}>{new Date(`${g.gun}T12:00:00`).toLocaleDateString(M.yerel, { weekday: 'short' })}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
