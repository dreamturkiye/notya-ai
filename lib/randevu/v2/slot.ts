/**
 * NOTYA-RANDEVU-V2 — the slot engine. Pure: no clock, no database; everything comes in as arguments.
 *
 *   free slots = working hours (doktor_calisma_saatleri, Istanbul wall clock)
 *              − exceptions (official holidays, the doctor's izin / tatil)
 *              − active appointments (talep + onaylandi + every other non-cancelled row, the same rule as
 *                lib/randevu/cakisma.ts)
 *              − external busy blocks (Google Takvim, PR2)
 *              − buffers (tampon_dk around every busy block)
 *              − minimum notice and the max-days-ahead window
 *
 * A slot is a start time on the doctor's own grid (slot_dakika, the step the calendar already uses) whose
 * whole duration fits inside one working-hours window. Output carries times only — never who or what
 * occupies a taken slot (cross-patient isolation, brief rule 5).
 */
import { DAKIKA_MS, GUN_MS, dakikaSaat, gunEkle, istanbulAn, istanbulYerelUtc, saatDakika } from './zaman'

export type GunSaati = { acik: boolean; baslangic: string; bitis: string }
/** Keys "0".."6" = Sunday..Saturday — the existing doktor_calisma_saatleri.gunler shape. */
export type CalismaSaatleri = Record<string, GunSaati>

/** Half-open UTC interval [bas, son) in epoch ms. */
export type Aralik = { bas: number; son: number }

export type Tatil = { tarih: string; yarim?: boolean }

export type SlotGirdisi = {
  calismaSaatleri: CalismaSaatleri
  /** Grid step in minutes (doktor_calisma_saatleri.slot_dakika). */
  adimDk: number
  /** Duration of the requested appointment type. */
  sureDk: number
  tamponDk: number
  minBildirimDk: number
  maxIleriGun: number
  simdi: number
  /** Doctor's izin / tatil ranges. No buffer is added around these. */
  istisnalar: Aralik[]
  /** Active appointments + external busy blocks. Buffer applies around each. */
  mesgul: Aralik[]
  resmiTatiller?: Tatil[]
  /** Restrict output to these Istanbul days (YYYY-MM-DD). Omit for the whole window. */
  gunler?: string[]
}

export type Slot = { bas: string; son: string; gun: string; saat: string }

/** An arife (half-day holiday) closes the afternoon from 13:00. */
export const YARIM_GUN_KAPANIS_DK = 13 * 60

const kesisir = (a: Aralik, b: Aralik) => a.bas < b.son && a.son > b.bas

function gecerliSayi(n: unknown, varsayilan: number, min: number, max: number): number {
  const x = Number(n)
  if (!Number.isFinite(x)) return varsayilan
  return Math.min(max, Math.max(min, Math.round(x)))
}

export function bosSlotlar(g: SlotGirdisi): Slot[] {
  const adim = gecerliSayi(g.adimDk, 20, 5, 240)
  const sure = gecerliSayi(g.sureDk, 20, 5, 480)
  const tampon = gecerliSayi(g.tamponDk, 0, 0, 120) * DAKIKA_MS
  const enErken = g.simdi + gecerliSayi(g.minBildirimDk, 0, 0, 60 * 24 * 30) * DAKIKA_MS
  const ileriGun = gecerliSayi(g.maxIleriGun, 30, 1, 365)
  const enGec = g.simdi + ileriGun * GUN_MS

  const tatiller = new Map((g.resmiTatiller || []).map((t) => [t.tarih, t]))
  const mesgul = g.mesgul.filter((m) => m.son > m.bas).map((m) => ({ bas: m.bas - tampon, son: m.son + tampon }))
  const istisnalar = g.istisnalar.filter((m) => m.son > m.bas)
  const istenen = g.gunler ? new Set(g.gunler) : null

  const bugun = istanbulAn(g.simdi).gun
  const sonuc: Slot[] = []
  for (let i = 0; i <= ileriGun; i++) {
    const gun = gunEkle(bugun, i)
    if (istenen && !istenen.has(gun)) continue
    const haftaGunu = new Date(`${gun}T12:00:00Z`).getUTCDay()
    const saat = g.calismaSaatleri[String(haftaGunu)]
    if (!saat?.acik) continue
    const acilis = saatDakika(saat.baslangic)
    let kapanis = saatDakika(saat.bitis)
    if (acilis === null || kapanis === null || kapanis <= acilis) continue

    const tatil = tatiller.get(gun)
    if (tatil && !tatil.yarim) continue
    if (tatil?.yarim) kapanis = Math.min(kapanis, YARIM_GUN_KAPANIS_DK)

    for (let dk = acilis; dk + sure <= kapanis; dk += adim) {
      const bas = istanbulYerelUtc(gun, dk)
      const aday = { bas, son: bas + sure * DAKIKA_MS }
      if (aday.bas < enErken || aday.bas > enGec) continue
      if (istisnalar.some((x) => kesisir(aday, x))) continue
      if (mesgul.some((x) => kesisir(aday, x))) continue
      sonuc.push({ bas: new Date(aday.bas).toISOString(), son: new Date(aday.son).toISOString(), gun, saat: dakikaSaat(dk) })
    }
  }
  return sonuc
}

/** Is exactly this start (ISO) a free slot right now? The server re-checks every booking with this. */
export function slotUygunMu(g: SlotGirdisi, basIso: string): Slot | null {
  const ms = Date.parse(basIso)
  if (!Number.isFinite(ms)) return null
  const gun = istanbulAn(ms).gun
  return bosSlotlar({ ...g, gunler: [gun] }).find((s) => Date.parse(s.bas) === ms) || null
}

/** Slots grouped per Istanbul day, in order — the portal's day → time picker. */
export function gunlereAyir(slotlar: Slot[]): { gun: string; slotlar: Slot[] }[] {
  const harita = new Map<string, Slot[]>()
  for (const s of slotlar) {
    const l = harita.get(s.gun)
    if (l) l.push(s)
    else harita.set(s.gun, [s])
  }
  return Array.from(harita, ([gun, l]) => ({ gun, slotlar: l }))
}
