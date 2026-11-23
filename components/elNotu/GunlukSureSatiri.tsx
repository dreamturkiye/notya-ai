'use client'
/** ESNEK-MUAYENE-A — "Bugün N hasta · dokümantasyon X dk · kazanç Y dk": measured time only, gain only against the doctor's own baseline. */
import { useEffect, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import { gunlukSatir, type GunlukOzet } from '@/core/elNotu/zaman'
import { EL_RENK as R } from './renk'
import type { Getirici } from './ElNotuYakala'

export default function GunlukSureSatiri(p: { metin: ElNotuMetinleri; getir: Getirici; api: string }) {
  const [ozet, setOzet] = useState<GunlukOzet | null>(null)
  useEffect(() => { void p.getir(`${p.api}/sure`).then((r) => (r.ok ? r.json() : null)).then((j) => setOzet(j?.ozet || null)).catch(() => setOzet(null)) }, [p])
  if (!ozet || !ozet.hasta) return null
  const satir = gunlukSatir(ozet, { ...p.metin.zaman, ondalik: p.metin.ondalik })
  if (!satir) return null
  return (
    <div style={{ background: R.camAcik, color: R.cam, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      {satir}
      {ozet.kazancDk === null && <div style={{ fontSize: 12, fontWeight: 400, color: R.soluk, marginTop: 2 }}>{p.metin.zaman.tabanIste}</div>}
    </div>
  )
}
