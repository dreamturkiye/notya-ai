'use client'
/** ESNEK-MUAYENE-B4 — the Türkiye wiring of the fark notu card for the patient file (lazy chunk). */
import { useRouter } from 'next/navigation'
import FarkNotuKarti from './FarkNotuKarti'
import { ESNEK_API, ESNEK_TR } from './trEsnek'
import { trGetir, trNotFormu } from '@/components/elNotu/trBaglam'

export default function FarkNotuKapsayici(p: { patientId: string; kapat: () => void }) {
  const router = useRouter()
  return <FarkNotuKarti metin={ESNEK_TR} getir={trGetir} api={ESNEK_API} patientId={p.patientId} notFormu={trNotFormu} git={(y) => router.push(y)} kapat={p.kapat} />
}
