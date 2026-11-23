'use client'
/**
 * ESNEK-MUAYENE-B1 — on the El Notları desk: the shadow-mode upload panel, shown only while the doctor's shadow mode is in
 * force (one GET, no polling). Country-neutral (words, routes and the patient picker injected).
 */
import { useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { Getirici } from '@/components/elNotu/ElNotuYakala'
import GolgeYukleme from './GolgeYukleme'

export default function GolgeMasaBolumu(p: { metin: EsnekMetinleri; elMetin: ElNotuMetinleri; getir: Getirici; api: string; hastaSec: (onSec: (h: { id: string; ad: string }) => void) => React.ReactNode }) {
  const [acik, setAcik] = useState(false)
  const { getir, api } = p
  useEffect(() => { void getir(`${api}/golge`).then((r) => (r.ok ? r.json() : null)).then((j) => setAcik(Boolean(j?.acik))).catch(() => setAcik(false)) }, [getir, api])
  if (!acik) return null
  return <GolgeYukleme metin={p.metin} elMetin={p.elMetin} getir={getir} api={api} hastaSec={p.hastaSec} />
}
