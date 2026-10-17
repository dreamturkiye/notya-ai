'use client'
import { useEffect, useState } from 'react'
import { TELEFON_ESIK_PX } from './telefonStil'

/** True on phone-width viewports (same breakpoint as DoktorChrome). False on the server and first paint. */
export function useTelefon(): boolean {
  const [telefon, setTelefon] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${TELEFON_ESIK_PX}px)`)
    const guncelle = () => setTelefon(mq.matches)
    guncelle()
    mq.addEventListener('change', guncelle)
    return () => mq.removeEventListener('change', guncelle)
  }, [])
  return telefon
}
