'use client'
/**
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25) — whether the doctor's 'Hasta Portalı Randevu' is ON for this link, read ONCE by
 * HastaShell (the same request that adds the Randevu tab) and shared with the pages, so Bugün's "Randevu al" costs no
 * extra round trip on the portal home. Preview and demo have no provider → false (booking is closed there by design).
 */
import { createContext, useContext } from 'react'

const Ctx = createContext(false)

export const RandevuAcikSaglayici = Ctx.Provider
export const useRandevuAcik = () => useContext(Ctx)
