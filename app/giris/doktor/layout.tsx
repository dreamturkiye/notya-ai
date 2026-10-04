/**
 * NOTYA-SEKRETER-01 — giriş sayfası Safari üst çubuğu krem (kök layout koyu olmasın).
 */
import type { ReactNode } from 'react'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const viewport = doktorViewport

export default function GirisDoktorLayout({ children }: { children: ReactNode }) {
  return children
}
