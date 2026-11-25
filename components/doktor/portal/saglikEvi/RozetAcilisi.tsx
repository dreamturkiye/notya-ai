'use client'
/** HASTA-PORTALI-GUNLUK — the badge unlock moment: one orchestrated animation (medal spins in, a ring pulses out). */
import { useEffect, useRef } from 'react'
import type { GunlukRozet } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { RozetSvg } from './Rozet'

export function RozetAcilisi({ s, rozet, tamam }: { s: SaglikEviSozleri; rozet: GunlukRozet; tamam: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { btn.current?.focus() }, [])
  return (
    <div className="sge-acilis" role="dialog" aria-modal="true" aria-labelledby="sge-acilis-b">
      <div className="sge-acilis-kart">
        <RozetSvg rozet={rozet} kilitli={false} buyuk />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--sge-ilac, #0f9b8e)' }}>{s.yeniRozet}</p>
        <h2 id="sge-acilis-b">{rozet.ad}</h2>
        <p>{rozet.aciklama}</p>
        <button ref={btn} type="button" className="sge-kaydet" style={{ marginTop: 0 }} onClick={tamam}>{s.harika}</button>
      </div>
    </div>
  )
}
