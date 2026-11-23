'use client'
/**
 * ESNEK-MUAYENE-B3 — Günlük toplu onay (B3, opened by the doctor): open each note, tick every protected item, approve the
 * opened notes together. CORE: the same page for all 30 branches + 10 Özel Branşlar.
 */
import { useRouter } from 'next/navigation'
import TopluOnayMasasi from '@/components/esnek/TopluOnayMasasi'
import { ESNEK_API, ESNEK_TR } from '@/components/esnek/trEsnek'
import { trGetir, trNotFormu } from '@/components/elNotu/trBaglam'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'

export default function TopluOnaySayfasi() {
  const router = useRouter()
  return (
    <div style={{ maxWidth: 860, display: 'grid', gap: 12 }}>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0, color: '#2e251d' }}>{ESNEK_TR.ozerklik.topluBaslik}</h1>
      <TopluOnayMasasi metin={ESNEK_TR} getir={trGetir} api={ESNEK_API} notFormu={trNotFormu} git={(y) => router.push(y)} />
    </div>
  )
}
