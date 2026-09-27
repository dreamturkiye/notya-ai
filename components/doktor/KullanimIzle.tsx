'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { kullanimSayfa } from '@/lib/telemetri/kullanim'

/** Layout'a bir kez. Hasta id'si yola girmez — yalnız sayfa tipi. */
export default function KullanimIzle() {
  const yol = usePathname() || ''
  useEffect(() => {
    if (!yol.includes('/dashboard/doktor') && !yol.includes('/doktor-tools') && !yol.includes('/asistan')) return
    kullanimSayfa(yol)
  }, [yol])
  return null
}
