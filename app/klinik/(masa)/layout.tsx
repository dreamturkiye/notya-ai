import type { Metadata } from 'next'
import KlinikKabuk from '@/components/klinik/katman/KlinikKabuk'
import { CHROME_FONT_HREF, doktorViewport } from '@/lib/doktor/chromeTheme'

export const viewport = doktorViewport

export const metadata: Metadata = {
  title: 'Notya Klinik',
  description: 'Klinik kurulumu, ortak takvim ve klinik hafızası. Hekim muayene ekranı aynı kalır.',
}

export default function KlinikMasaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <KlinikKabuk>{children}</KlinikKabuk>
    </>
  )
}
