/**
 * ESNEK-MUAYENE-B6 — "Notya sizi böyle tanıyor": how the doctor works, derived only from his own measured use (pure).
 *   - working style: paper (hand-note sources), voice (recorded visits) or mixed — over his last 30 days;
 *   - approval habit: right after each visit, or an end-of-day approver (with his usual time);
 *   - what the home screen and notifications do with that: a paper doctor sees "El notu ekle" first and no microphone push;
 *     an end-of-day approver gets ONE notification at his usual time, nothing during the day.
 * Every derived line is shown on the card and can be corrected by the doctor (his correction is stored and wins).
 */
import { medyan } from './metinAraclari'

export type CalismaSekli = 'kagit' | 'ses' | 'karma'
export type Ziyaret = { elNotu: boolean; transkript: boolean }
export const SEKIL_ASGARI = 5
export const SEKIL_ORAN = 0.6

export function calismaSekli(ziyaretler: Ziyaret[]): CalismaSekli | null {
  const n = ziyaretler.length
  if (n < SEKIL_ASGARI) return null
  const kagit = ziyaretler.filter((z) => z.elNotu && !z.transkript).length
  const ses = ziyaretler.filter((z) => z.transkript && !z.elNotu).length
  if (kagit / n >= SEKIL_ORAN) return 'kagit'
  if (ses / n >= SEKIL_ORAN) return 'ses'
  return 'karma'
}

export type OnayAliskanligi = { tur: 'gun_sonu' | 'anlik'; saatDk: number | null }
/** Approval moments as minutes after local midnight + the delay from draft to approval (minutes) + the local day. */
export type OnayAni = { gun: string; dakika: number; gecikmeDk: number }

export const ONAY_ASGARI = 10
export const AKSAM_DK = 16 * 60 + 30

export function onayAliskanligi(onaylar: OnayAni[]): OnayAliskanligi | null {
  if (onaylar.length < ONAY_ASGARI) return null
  const aksam = onaylar.filter((o) => o.dakika >= AKSAM_DK)
  const gecikme = medyan(onaylar.map((o) => o.gecikmeDk)) ?? 0
  if (aksam.length / onaylar.length >= 0.6 && gecikme >= 90) {
    // his usual time = median of each day's FIRST evening approval, floored to the quarter hour
    const ilk = new Map<string, number>()
    for (const o of aksam) ilk.set(o.gun, Math.min(ilk.get(o.gun) ?? Infinity, o.dakika))
    const m = medyan([...ilk.values()])
    return { tur: 'gun_sonu', saatDk: m === null ? null : Math.floor(m / 15) * 15 }
  }
  return { tur: 'anlik', saatDk: null }
}

export type AnaSayfaKarari = {
  /** "El notu ekle" is the first action on the home screen. */
  elNotuOnce: boolean
  /** The microphone / recording prompt is offered on the home screen. */
  mikrofonOner: boolean
  /** The one daily notification (end-of-day approver, at or after his usual time, with notes waiting, not shown yet today). */
  bildirim: { goster: boolean; saatDk: number | null; bekleyen: number }
}

export function anaSayfaKarari(g: { sekil: CalismaSekli | null; onay: OnayAliskanligi | null; simdiDk: number; bekleyen: number; bugunGosterildi: boolean }): AnaSayfaKarari {
  const kagit = g.sekil === 'kagit'
  const gunSonu = g.onay?.tur === 'gun_sonu' && g.onay.saatDk !== null
  const goster = Boolean(gunSonu && g.bekleyen > 0 && !g.bugunGosterildi && g.simdiDk >= (g.onay!.saatDk as number))
  return { elNotuOnce: kagit, mikrofonOner: !kagit, bildirim: { goster, saatDk: gunSonu ? (g.onay!.saatDk as number) : null, bekleyen: g.bekleyen } }
}
