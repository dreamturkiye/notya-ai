/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — active doctor notification for Sağlığım home-data alerts. Until now an alert only
 * waited in Fısıltı and on the Ev verisi card; this sends a Web Push to the doctor's own phone / browser.
 *
 * Routing (per doctor, in the doctor's own time zone; defaults: working hours 08:00–20:00, everything on):
 *  - acil           → immediately, any time of day (quiet hours do not apply). The doctor can mute acil only explicitly.
 *  - hekime_bildir  → immediately inside working hours (and outside the doctor's optional quiet hours); otherwise HELD for
 *                     the morning summary.
 *  - morning summary → once a day, at the start of working hours: ONE push ("3 hastadan 5 yeni ev uyarısı") for the alerts
 *                     that were held; the existing Fısıltı item carries the detail.
 *  - rate limit     → at most HEKIM_SAATLIK_SINIR pushes per doctor per hour per level; over it, the alert is held for the
 *                     summary (it is never lost: Fısıltı and the Ev verisi card always show it).
 *  - de-dup         → the rule engine's cool-off already decides which alerts exist; every alert is pushed at most once
 *                     (idempotency key `hekim:uyari:<id>` in ev_bildirim_gunlugu, also used by the summary). Every send is
 *                     logged there; the rate limit counts those rows.
 *
 * This file is the PURE half (types, defaults, routing, payloads — client-safe); the server half is hekimBildirim.ts.
 *
 * Privacy (KVKK): the lock-screen text never carries a patient name, a value, a diagnosis or a drug — only "Acil ev
 * ölçümü · dokunarak açın" / "Yeni ev uyarısı · dokunarak açın" / counts. The tap opens that patient's file at the Ev
 * verisi alerts tab, behind the doctor's normal sign-in. Only alerts of patients who gave the KVKK sharing consent are
 * pushed (the doctor sees nothing of the others either).
 *
 * performans-butcesi-koruma: never on the patient's request path — the portal route hands this to waitUntil
 * (lib/kurucu/denemeBildirimi.ts arkaPlanda) and the cron runs the summary; each step is a constant number of batched
 * queries; every push has the 10 s timeout of lib/saglikEvi/push/webPush.ts. Pure: no I/O.
 */
import type { PushIcerigi } from './push/webPush'
import { saatDakika, saatGecerliMi, GUN_MS } from './zaman'

export interface HekimBildirimAyari {
  acilAcik: boolean
  bildirAcik: boolean
  ozetAcik: boolean
  calismaBas: string
  calismaBit: string
  sessizBas: string | null
  sessizBit: string | null
  saatDilimi: string
}

export const VARSAYILAN_HEKIM_AYARI: HekimBildirimAyari = { acilAcik: true, bildirAcik: true, ozetAcik: true, calismaBas: '08:00', calismaBit: '20:00', sessizBas: null, sessizBit: null, saatDilimi: 'Europe/Istanbul' }

/** Per doctor, per level, per hour. */
export const HEKIM_SAATLIK_SINIR = { acil: 20, hekime_bildir: 8 } as const
/** Alerts older than this are not pushed / summarised any more (they stay in Fısıltı). */
export const BEKLEYEN_PENCERE_MS = 3 * GUN_MS

export function saatDilimiGecerliMi(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length < 3 || tz.length > 64) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

export function hekimAyarSatiri(r: Record<string, any> | null | undefined): HekimBildirimAyari {
  if (!r) return { ...VARSAYILAN_HEKIM_AYARI }
  return {
    acilAcik: r.acil_acik !== false, bildirAcik: r.bildir_acik !== false, ozetAcik: r.ozet_acik !== false,
    calismaBas: saatGecerliMi(r.calisma_bas) ? r.calisma_bas : '08:00', calismaBit: saatGecerliMi(r.calisma_bit) ? r.calisma_bit : '20:00',
    sessizBas: saatGecerliMi(r.sessiz_bas) ? r.sessiz_bas : null, sessizBit: saatGecerliMi(r.sessiz_bit) ? r.sessiz_bit : null,
    saatDilimi: saatDilimiGecerliMi(r.saat_dilimi) ? r.saat_dilimi : 'Europe/Istanbul',
  }
}

/** Clean a settings payload from the doctor's Ayarlar → Bildirimler page into DB columns. */
export function hekimAyarGuncellemesi(ham: unknown): { ok: true; g: Record<string, unknown> } | { ok: false; hata: string } {
  const h = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const g: Record<string, unknown> = {}
  for (const [k, kolon] of [['acilAcik', 'acil_acik'], ['bildirAcik', 'bildir_acik'], ['ozetAcik', 'ozet_acik']] as const) if (typeof h[k] === 'boolean') g[kolon] = h[k]
  for (const [k, kolon] of [['calismaBas', 'calisma_bas'], ['calismaBit', 'calisma_bit']] as const) {
    if (h[k] === undefined) continue
    if (!saatGecerliMi(h[k])) return { ok: false, hata: 'Saat geçersiz.' }
    g[kolon] = h[k]
  }
  for (const [k, kolon] of [['sessizBas', 'sessiz_bas'], ['sessizBit', 'sessiz_bit']] as const) {
    if (h[k] === undefined) continue
    if (h[k] === null || h[k] === '') { g[kolon] = null; continue }
    if (!saatGecerliMi(h[k])) return { ok: false, hata: 'Saat geçersiz.' }
    g[kolon] = h[k]
  }
  if (h.saatDilimi !== undefined) {
    if (!saatDilimiGecerliMi(h.saatDilimi)) return { ok: false, hata: 'Saat dilimi tanınmadı.' }
    g.saat_dilimi = h.saatDilimi
  }
  if (g.calisma_bas && g.calisma_bit && g.calisma_bas === g.calisma_bit) return { ok: false, hata: 'Çalışma saatinin başlangıcı ve bitişi aynı olamaz.' }
  return { ok: true, g }
}

/** Minute of day and calendar day in the doctor's own time zone. */
export function hekimYerelZaman(simdiMs: number, tz: string): { dakika: number; gun: string } {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(simdiMs))
  const v = (t: string) => p.find((x) => x.type === t)?.value || '00'
  return { dakika: (Number(v('hour')) % 24) * 60 + Number(v('minute')), gun: `${v('year')}-${v('month')}-${v('day')}` }
}

/** Is the minute inside [bas, bit)? The window may wrap midnight (e.g. a night clinic 18:00–02:00). */
export function pencerede(dakika: number, bas: string, bit: string): boolean {
  const b = saatDakika(bas), e = saatDakika(bit)
  if (b === e) return false
  return b < e ? dakika >= b && dakika < e : dakika >= b || dakika < e
}

export type PushKarari = 'hemen' | 'sabah' | 'yok'

/**
 * The routing decision for one alert (pure). `sonSaat` = pushes already sent to this doctor in the last hour for that
 * level (rate limit).
 */
export function pushKarari(duzey: string, ayar: HekimBildirimAyari, simdiMs: number, sonSaat = 0): PushKarari {
  if (duzey === 'acil') {
    if (!ayar.acilAcik) return 'yok'
    return sonSaat < HEKIM_SAATLIK_SINIR.acil ? 'hemen' : ayar.ozetAcik ? 'sabah' : 'yok'
  }
  if (duzey !== 'hekime_bildir' || !ayar.bildirAcik) return 'yok'
  const { dakika } = hekimYerelZaman(simdiMs, ayar.saatDilimi)
  const mesai = pencerede(dakika, ayar.calismaBas, ayar.calismaBit)
  const sessiz = ayar.sessizBas && ayar.sessizBit ? pencerede(dakika, ayar.sessizBas, ayar.sessizBit) : false
  if (mesai && !sessiz && sonSaat < HEKIM_SAATLIK_SINIR.hekime_bildir) return 'hemen'
  return ayar.ozetAcik ? 'sabah' : 'yok'
}

/** The morning summary may go now: working hours have started today and it has not gone today. */
export function ozetZamaniMi(ayar: HekimBildirimAyari, simdiMs: number): boolean {
  if (!ayar.ozetAcik) return false
  const { dakika } = hekimYerelZaman(simdiMs, ayar.saatDilimi)
  return pencerede(dakika, ayar.calismaBas, ayar.calismaBit)
}

export const hekimHastaYolu = (patientId: string) => `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?ev=1&evAyrinti=uyarilar`

/**
 * Lock-screen safe payloads. Never a name, a value, a diagnosis or a drug. `yol` is an in-app path (the doctor's sign-in
 * guards it); `etiket` groups notifications per alert / per day without saying anything about the patient.
 */
export function hekimPushIcerigi(o: { tur: 'acil' | 'bildir'; patientId: string; anahtar: string; sayi?: number } | { tur: 'ozet'; hastaSayisi: number; uyariSayisi: number; gun: string } | { tur: 'deneme' }): PushIcerigi {
  if (o.tur === 'ozet') return { baslik: 'Notya · ev verisi', govde: `${o.hastaSayisi} hastadan ${o.uyariSayisi} yeni ev uyarısı · dokunarak açın`, yol: '/dashboard/doktor', etiket: `ev-ozet-${o.gun}` }
  if (o.tur === 'deneme') return { baslik: 'Notya', govde: 'Deneme bildirimi · bildirimler açık', yol: '/dashboard/doktor/ayarlar/bildirimler', etiket: 'ev-deneme' }
  const cok = (o.sayi ?? 1) > 1
  return {
    baslik: 'Notya · ev verisi',
    govde: o.tur === 'acil' ? (cok ? `${o.sayi} acil ev ölçümü · dokunarak açın` : 'Acil ev ölçümü · dokunarak açın') : (cok ? `${o.sayi} yeni ev uyarısı · dokunarak açın` : 'Yeni ev uyarısı · dokunarak açın'),
    yol: hekimHastaYolu(o.patientId),
    etiket: `ev-${o.tur}-${o.anahtar}`,
  }
}

