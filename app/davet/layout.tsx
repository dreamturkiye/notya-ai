/**
 * NOTYA-DAVET-GORUNUM-01 — sekreter davet sayfası Safari / status bar açık krem.
 * Kök layout koyu (#0A1628); burada cream theme-color ile üst çubuk açık kalır.
 */
import type { ReactNode } from 'react'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const viewport = doktorViewport

export default function DavetLayout({ children }: { children: ReactNode }) {
  return children
}
