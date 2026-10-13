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
