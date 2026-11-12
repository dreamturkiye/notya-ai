/**
 * WHATSAPP-ONBURO-01 — which free times to offer. Pure: the slot engine's output comes in, up to three options go out.
 * The slots themselves always come from lib/randevu/v2/slot.ts (working plan, holidays, external busy, buffers, notice
 * and max-days-ahead) — this file only chooses among them according to what the patient asked for.
 */
import type { Slot } from '@/lib/randevu/v2/slot'
import type { SlotTercihi } from './dil/tipler'

export interface Oneri { bas: string; son: string; etiket: string }

/** Morning = a start before 12:00 local; afternoon = 12:00 or later. `Slot.saat` is the local "HH:MM". */
const dilimUyar = (s: Slot, dilim: SlotTercihi['dilim']): boolean => !dilim || (dilim === 'sabah' ? s.saat < '12:00' : s.saat >= '12:00')

export interface SecimGirdisi {
  slotlar: Slot[]
  tercih?: SlotTercihi | null
  /** Times already proposed in this conversation (their ISO starts). */
  onceki?: string[]
  /** Local days (YYYY-MM-DD) already proposed — "another day" avoids them. */
  oncekiGunler?: string[]
  adet?: number
}

/** `tercihKarsilandi`: false when the asked day / part of day had nothing and the nearest free times are offered instead. */
export function slotSec(g: SecimGirdisi): { secilen: Slot[]; tercihKarsilandi: boolean } {
  const adet = g.adet ?? 3
  const t = g.tercih || {}
  const onceki = new Set(g.onceki || [])
  const oncekiGunler = new Set(g.oncekiGunler || [])
  const sonOnceki = (g.onceki || []).reduce((m, x) => (x > m ? x : m), '')
  let aday = g.slotlar.filter((s) => !onceki.has(s.bas))
  if (t.dahaGec && sonOnceki) aday = aday.filter((s) => s.bas > sonOnceki)
  if (t.baskaGun) aday = aday.filter((s) => !oncekiGunler.has(s.gun))

  const birGundenBir = (liste: Slot[]): Slot[] => {
    const gunler = new Set<string>()
    const out: Slot[] = []
    for (const s of liste) {
      if (gunler.has(s.gun)) continue
      gunler.add(s.gun)
      out.push(s)
      if (out.length >= adet) break
    }
    return out
  }
  /** Up to `adet` times of ONE day, spread over the day rather than three neighbours. */
  const gunIci = (liste: Slot[]): Slot[] => {
    if (liste.length <= adet) return liste
    const adim = (liste.length - 1) / (adet - 1)
    return Array.from({ length: adet }, (_, i) => liste[Math.round(i * adim)])
  }

  if (t.gun) {
    const oGun = aday.filter((s) => s.gun === t.gun && dilimUyar(s, t.dilim))
    if (oGun.length) return { secilen: gunIci(oGun), tercihKarsilandi: true }
    const sonrasi = aday.filter((s) => s.gun >= t.gun! && dilimUyar(s, t.dilim))
    if (sonrasi.length) return { secilen: birGundenBir(sonrasi), tercihKarsilandi: false }
    return { secilen: birGundenBir(aday.filter((s) => s.gun >= t.gun!)), tercihKarsilandi: false }
  }
  if (t.dilim) {
    const uyan = aday.filter((s) => dilimUyar(s, t.dilim))
    if (uyan.length) return { secilen: birGundenBir(uyan), tercihKarsilandi: true }
    return { secilen: birGundenBir(aday), tercihKarsilandi: false }
  }
  return { secilen: birGundenBir(aday), tercihKarsilandi: true }
}
