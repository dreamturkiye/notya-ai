/**
 * GERI-CAGIRMA-01 — ATTRIBUTION. Pure; the same file and the same tests in every build.
 *
 * THE RULE, exactly as implemented (the tooltip and docs/OPEN-COMMITMENTS.md quote this):
 *
 *   1. Only a recall that LEFT counts (durum 'gonderildi': a message the provider accepted, or a phone call the
 *      practice marked). Its instant is T.
 *   2. BOOKED ("randevu aldı"): the SAME patient of the SAME doctor has an appointment that was CREATED after T and
 *      not later than T + ATIF_PENCERESI_GUN days, and is not cancelled. A booking made through the recall's own
 *      tagged link is stamped at booking time (yol 'baglanti'); any other route is found here (yol 'diger').
 *      An appointment created BEFORE the recall never counts. One created after the window never counts.
 *      When several recalls of a patient could claim one appointment, the LATEST recall before it gets it, and an
 *      appointment is credited to one recall only.
 *   3. ATTENDED ("geldi"): the credited appointment is marked completed, OR a visit record (muayene / seans) of the
 *      same patient exists on the appointment's calendar day. A booked-but-not-yet-attended appointment stays
 *      "booked". A walk-in with no appointment is not counted at all (conservative on purpose).
 *   4. RECORDED PAYMENT: the sum of payments actually recorded as received for that patient from the visit day up to
 *      TAHSILAT_PENCERESI_GUN days after it. Nothing recorded = no amount (never an estimate).
 *   5. MONTH: a patient is counted in the month the appointment was MADE; "attended" and the amount are of those
 *      same patients. ONE PATIENT COUNTS ONCE PER MONTH, however many reasons, messages or appointments.
 */
import { ATIF_PENCERESI_GUN, TAHSILAT_PENCERESI_GUN, ayAnahtari, bosSayac, gunAnahtari, type AylikSayac } from './tipler'

const GUN_MS = 86_400_000

export type AtifKaydi = {
  id: string
  patientId: string
  durum: string
  gonderildiAt: string | null
  randevuId: string | null
  randevuAt: string | null
  randevuYolu: 'baglanti' | 'diger' | null
  geldiAt: string | null
  tahsilatKurus: number | null
}

export type AtifRandevusu = {
  id: string
  patientId: string
  /** When the appointment was MADE. */
  olusturuldu: string
  /** When it takes place. */
  baslangic: string
  /** true = cancelled (never counts). */
  iptal: boolean
  /** true = marked completed / attended. */
  tamamlandi: boolean
}

export type AtifViziti = { patientId: string; an: string }
export type AtifTahsilati = { patientId: string; an: string; kurus: number }

export type AtifGuncellemesi = {
  id: string
  randevuId: string | null
  randevuAt: string | null
  randevuYolu: 'baglanti' | 'diger' | null
  geldiAt: string | null
  tahsilatKurus: number | null
}

const ms = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : NaN)

/** Is an appointment made at `olusturuldu` inside the window of a recall that left at `gonderildi`? */
export function pencereIcinde(gonderildi: string, olusturuldu: string, pencereGun: number = ATIF_PENCERESI_GUN): boolean {
  const t = ms(gonderildi)
  const o = ms(olusturuldu)
  if (!Number.isFinite(t) || !Number.isFinite(o)) return false
  return o > t && o <= t + pencereGun * GUN_MS
}

/**
 * Recomputes the attribution columns of a doctor's recalls from the appointments, visits and recorded payments of
 * the same patients. Returns ONLY the rows whose stored values change. `saatDilimi` decides "the same calendar day".
 */
export function atifHesapla(
  kayitlar: readonly AtifKaydi[],
  randevular: readonly AtifRandevusu[],
  vizitler: readonly AtifViziti[],
  tahsilatlar: readonly AtifTahsilati[],
  saatDilimi: string,
): AtifGuncellemesi[] {
  const gonderilen = kayitlar.filter((k) => k.durum === 'gonderildi' && Number.isFinite(ms(k.gonderildiAt)))
  const rMap = new Map(randevular.map((r) => [r.id, r]))
  // Appointments already credited (a tagged-link booking stamped at booking time, or an earlier run) stay with their recall.
  const sahipli = new Map<string, string>()
  for (const k of gonderilen) if (k.randevuId) sahipli.set(k.randevuId, k.id)

  const hastaRandevulari = new Map<string, AtifRandevusu[]>()
  for (const r of randevular) {
    if (r.iptal) continue
    const l = hastaRandevulari.get(r.patientId) || []
    l.push(r)
    hastaRandevulari.set(r.patientId, l)
  }
  for (const l of hastaRandevulari.values()) l.sort((a, b) => ms(a.olusturuldu) - ms(b.olusturuldu))

  const yeni = new Map<string, { randevuId: string | null; randevuAt: string | null; randevuYolu: 'baglanti' | 'diger' | null }>()
  for (const k of gonderilen) yeni.set(k.id, { randevuId: k.randevuId, randevuAt: k.randevuAt, randevuYolu: k.randevuYolu })

  // A credited appointment that has since been cancelled (or no longer exists in the read window as a live row) is released.
  for (const k of gonderilen) {
    if (!k.randevuId) continue
    const r = rMap.get(k.randevuId)
    if (r && r.iptal) {
      yeni.set(k.id, { randevuId: null, randevuAt: null, randevuYolu: null })
      sahipli.delete(k.randevuId)
    }
  }

  // Latest recall first: when two recalls precede one appointment, the later one gets it.
  const sirali = [...gonderilen].sort((a, b) => ms(b.gonderildiAt) - ms(a.gonderildiAt))
  for (const k of sirali) {
    if (yeni.get(k.id)!.randevuId) continue
    const aday = (hastaRandevulari.get(k.patientId) || []).find((r) => !sahipli.has(r.id) && pencereIcinde(k.gonderildiAt!, r.olusturuldu))
    if (!aday) continue
    sahipli.set(aday.id, k.id)
    yeni.set(k.id, { randevuId: aday.id, randevuAt: aday.olusturuldu, randevuYolu: 'diger' })
  }

  const vizitGunleri = new Map<string, Set<string>>()
  for (const v of vizitler) {
    if (!Number.isFinite(ms(v.an))) continue
    const s = vizitGunleri.get(v.patientId) || new Set<string>()
    s.add(gunAnahtari(v.an, saatDilimi))
    vizitGunleri.set(v.patientId, s)
  }

  const out: AtifGuncellemesi[] = []
  for (const k of gonderilen) {
    const y = yeni.get(k.id)!
    let geldiAt: string | null = null
    let tahsilat: number | null = null
    const r = y.randevuId ? rMap.get(y.randevuId) : undefined
    if (r && !r.iptal) {
      const gun = gunAnahtari(r.baslangic, saatDilimi)
      if (r.tamamlandi || vizitGunleri.get(k.patientId)?.has(gun)) geldiAt = r.baslangic
    } else if (y.randevuId && !r) {
      // The appointment is outside what was read this time: keep what is stored rather than un-count it.
      geldiAt = k.geldiAt
      tahsilat = k.tahsilatKurus
    }
    if (geldiAt && r) {
      const bas = Date.parse(`${gunAnahtari(geldiAt, saatDilimi)}T00:00:00Z`) - 14 * 3_600_000 // the visit's local day, any zone
      const bit = ms(geldiAt) + TAHSILAT_PENCERESI_GUN * GUN_MS
      let toplam = 0
      let var_ = false
      for (const t of tahsilatlar) {
        if (t.patientId !== k.patientId || !(t.kurus > 0)) continue
        const a = ms(t.an)
        if (a >= bas && a <= bit) { toplam += Math.round(t.kurus); var_ = true }
      }
      tahsilat = var_ ? toplam : null
    }
    if (y.randevuId !== k.randevuId || y.randevuAt !== k.randevuAt || y.randevuYolu !== k.randevuYolu || geldiAt !== k.geldiAt || tahsilat !== k.tahsilatKurus) {
      out.push({ id: k.id, randevuId: y.randevuId, randevuAt: y.randevuAt, randevuYolu: y.randevuYolu, geldiAt, tahsilatKurus: tahsilat })
    }
  }
  return out
}

/**
 * Monthly counters from recall rows (attribution columns already up to date). One patient once per month:
 * `gonderilen` = distinct patients a recall left for in the month; `randevuAlan` = distinct patients whose credited
 * appointment was MADE in the month; `gelen` and the amount are of those same patients (a payment is not counted
 * twice when two recalls of one patient were credited in one month: the first one's amount is used).
 */
export function aylikHesapla(kayitlar: readonly AtifKaydi[], aylar: readonly string[], saatDilimi: string): AylikSayac[] {
  const gonderilen = new Map<string, Set<string>>()
  const alan = new Map<string, Map<string, { geldi: boolean; kurus: number; an: number }>>()
  for (const k of kayitlar) {
    if (k.durum !== 'gonderildi' || !k.gonderildiAt) continue
    const ga = ayAnahtari(k.gonderildiAt, saatDilimi)
    if (!gonderilen.has(ga)) gonderilen.set(ga, new Set())
    gonderilen.get(ga)!.add(k.patientId)
    if (!k.randevuId || !k.randevuAt) continue
    const ra = ayAnahtari(k.randevuAt, saatDilimi)
    if (!alan.has(ra)) alan.set(ra, new Map())
    const m = alan.get(ra)!
    const onceki = m.get(k.patientId)
    const an = Date.parse(k.randevuAt)
    if (!onceki) m.set(k.patientId, { geldi: !!k.geldiAt, kurus: k.geldiAt ? Math.max(0, k.tahsilatKurus || 0) : 0, an })
    else {
      // Same patient again in the same month: still ONE patient. Attended if any was; the amount of the earliest attended one.
      const geldi = onceki.geldi || !!k.geldiAt
      const kurus = onceki.geldi ? (an < onceki.an && k.geldiAt ? Math.max(0, k.tahsilatKurus || 0) : onceki.kurus) : k.geldiAt ? Math.max(0, k.tahsilatKurus || 0) : 0
      m.set(k.patientId, { geldi, kurus, an: Math.min(an, onceki.an) })
    }
  }
  return aylar.map((ay) => {
    const s = bosSayac(ay)
    s.gonderilen = gonderilen.get(ay)?.size || 0
    const m = alan.get(ay)
    if (m) {
      s.randevuAlan = m.size
      for (const v of m.values()) { if (v.geldi) { s.gelen++; s.tahsilatKurus += v.kurus } }
    }
    return s
  })
}

/** The home card is hidden until there is something true to show: a patient who can be recalled now, or a recall that left. */
export function kartGosterilsinMi(cagrilabilir: number, egilim: readonly AylikSayac[]): boolean {
  return cagrilabilir > 0 || egilim.some((a) => a.gonderilen > 0)
}
