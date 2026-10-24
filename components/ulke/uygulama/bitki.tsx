'use client'

/**
 * The plant photograph, handed in by the page that the bundler builds (UlkeUygulamaSayfasi).
 * A plain address under public/ is not served in a country build — the same reason the landing
 * photographs are imported rather than linked. Tests render the frame without this provider.
 */
import React, { createContext, useContext, type ReactNode } from 'react'

const BitkiBaglami = createContext('')

export function BitkiSaglayici({ src, children }: { src: string; children: ReactNode }) {
  return <BitkiBaglami.Provider value={src}>{children}</BitkiBaglami.Provider>
}

export function useBitki(): string {
  return useContext(BitkiBaglami)
}

/**
 * The four characters of the target-height studio (Türkiye: public/hedef-boy/*.png), imported by the page the same way as
 * the plant, because a plain public/ address is not served in a country build. Tests render without this provider.
 */
export type HedefBoyGorselleri = { baba: string; anne: string; erkek: string; kiz: string }
const HedefBoyBaglami = createContext<HedefBoyGorselleri | null>(null)
export function HedefBoyGorselSaglayici({ gorseller, children }: { gorseller: HedefBoyGorselleri; children: ReactNode }) {
  return <HedefBoyBaglami.Provider value={gorseller}>{children}</HedefBoyBaglami.Provider>
}
export function useHedefBoyGorselleri(): HedefBoyGorselleri | null {
  return useContext(HedefBoyBaglami)
}
