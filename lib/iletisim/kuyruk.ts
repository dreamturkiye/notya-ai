/**
 * NOTYA-ILETISIM-01 — "Hazır mesajlar" queue: pure building, de-duplication and permission rules.
 *
 * The queue (table iletisim_kuyrugu) holds messages Notya has PREPARED; a human still opens each
 * one in their own WhatsApp / mail and taps send. Nothing in here sends anything.
 *
 * Sources:
 *   • randevu_hatirlatma — the daily cron enqueues tomorrow's appointments (app/api/cron/randevu-hatirlatma)
 *   • saglikim_yeni_mesaj — whenever the practice writes to a patient in Sağlığım (lib/portal/notifyPatientEmail.ts)
 *   • asi_hatirlatma      — due vaccine dates, refreshed when the doctor opens the queue (never a cron:
 *                           lib/asi/hatirlatma.test.ts locks "no cron touches asilar")
 *
 * De-duplication: every item has a `tekil_anahtar`; (doctor_id, tekil_anahtar) is unique in the DB and
 * the builders below drop keys that already exist, so re-running a trigger never doubles an item.
 */
import type { MesajTuru, KuyrukDurumu } from './tipler'
import type { PratikRol } from '@/lib/doktor/pratikOturum'

/**
 * What a secretary (personel) may prepare, see and send: appointment messages and appointment
 * preparation — never Sağlığım message notices, vaccine or recall (clinical follow-up) items.
 * Enforced on the server in every /api/doktor/iletisim route, not only hidden in the UI.
 */
export const PERSONEL_TURLERI: readonly MesajTuru[] = [
  'randevu_hatirlatma',
  'randevu_degisikligi',
  'randevu_iptali',
  'tetkik_getirin',
  'bilgi_formu',
]

export function turIzinliMi(rol: PratikRol, tur: MesajTuru): boolean {
  if (rol === 'doktor') return true
  return (PERSONEL_TURLERI as readonly string[]).includes(tur)
}

export type KuyrukAdayi = {
  doctor_id: string
  patient_id: string
  tur: MesajTuru
  randevu_id?: string | null
  asi_id?: string | null
  konu_id?: string | null
  /** YYYY-MM-DD (Turkey) the item belongs to — "Bugün N mesaj hazır" counts items up to today. */
  planlanan_gun: string
  tekil_anahtar: string
}

export const tekilAnahtar = {
  randevu: (randevuId: string, baslangicIso: string) => `randevu_hatirlatma:${randevuId}:${baslangicIso}`,
  saglikimMesaji: (konuId: string, gunIso: string) => `saglikim_yeni_mesaj:${konuId}:${gunIso}`,
  /** Without a thread id: one notice per patient per day. */
  saglikimMesajiHasta: (patientId: string, gunIso: string) => `saglikim_yeni_mesaj:hasta:${patientId}:${gunIso}`,
  asi: (asiId: string, sonrakiDozIso: string) => `asi_hatirlatma:${asiId}:${sonrakiDozIso}`,
}

/** Drops candidates whose key already exists (in the DB or earlier in the same batch). */
export function yeniAdaylar(adaylar: KuyrukAdayi[], mevcutAnahtarlar: Iterable<string>): KuyrukAdayi[] {
  const gorulen = new Set<string>(mevcutAnahtarlar)
  const out: KuyrukAdayi[] = []
  for (const a of adaylar) {
    const k = `${a.doctor_id}|${a.tekil_anahtar}`
    if (gorulen.has(k) || gorulen.has(a.tekil_anahtar)) continue
    gorulen.add(k)
    out.push(a)
  }
  return out
}

/** UTC bounds [bas, son) of a Turkish calendar day (Turkey is UTC+3 all year). */
export function trGunAraligi(gunIso: string): { bas: string; son: string } {
  const bas = Date.parse(`${gunIso}T00:00:00+03:00`)
  return { bas: new Date(bas).toISOString(), son: new Date(bas + 86400e3).toISOString() }
}

export function gunEkle(gunIso: string, n: number): string {
  return new Date(Date.parse(`${gunIso}T12:00:00Z`) + n * 86400e3).toISOString().slice(0, 10)
}

export type RandevuSatiri = {
  id: string
  doktor_id: string
  patient_id: string | null
  baslangic: string
  durum: string
}

/**
 * Tomorrow's reminders from appointment rows: active bookings (planlandi / onaylandi) that belong
 * to a registered patient. A walk-in booking without a patient record has nowhere to hold the
 * patient's consent, so it is not enqueued (see README, "Serbest randevu").
 */
export function randevuAdaylari(randevular: RandevuSatiri[], bugunIso: string): KuyrukAdayi[] {
  const yarin = gunEkle(bugunIso, 1)
  const { bas, son } = trGunAraligi(yarin)
  return randevular
    .filter((r) => r.patient_id && ['planlandi', 'onaylandi'].includes(r.durum))
    .filter((r) => { const t = Date.parse(r.baslangic); return t >= Date.parse(bas) && t < Date.parse(son) })
    .map((r) => ({
      doctor_id: r.doktor_id,
      patient_id: String(r.patient_id),
      tur: 'randevu_hatirlatma' as const,
      randevu_id: r.id,
      planlanan_gun: bugunIso,
      tekil_anahtar: tekilAnahtar.randevu(r.id, new Date(r.baslangic).toISOString()),
    }))
}

export type KuyrukSatiri = {
  id: string
  tur: MesajTuru
  durum: KuyrukDurumu
  planlanan_gun: string
  ertelendi_at?: string | null
  created_at?: string | null
}

/** Items to show today: waiting, due today or earlier, allowed for the caller's role. */
export function bugunGosterilecekler<T extends KuyrukSatiri>(satirlar: T[], rol: PratikRol, bugunIso: string): T[] {
  return satirlar
    .filter((s) => s.durum === 'bekliyor' && s.planlanan_gun <= bugunIso && turIzinliMi(rol, s.tur))
    .sort((a, b) =>
      // "Sonra" pushes an item behind everything not yet postponed; then oldest first.
      String(a.ertelendi_at || '').localeCompare(String(b.ertelendi_at || '')) ||
      String(a.created_at || '').localeCompare(String(b.created_at || '')),
    )
}

export type KuyrukIslemi = 'gonderildi' | 'atla' | 'sonra'

export function kuyrukIslemiMi(x: unknown): x is KuyrukIslemi {
  return x === 'gonderildi' || x === 'atla' || x === 'sonra'
}

/** The row update for a queue action. */
export function kuyrukGuncellemesi(islem: KuyrukIslemi, simdiIso: string, kim: { userId: string; personelId?: string | null }): Record<string, unknown> {
  const ortak = { updated_at: simdiIso, isleyen_user_id: kim.userId, isleyen_personel_id: kim.personelId ?? null }
  if (islem === 'gonderildi') return { ...ortak, durum: 'gonderildi' }
  if (islem === 'atla') return { ...ortak, durum: 'atlandi' }
  return { ...ortak, ertelendi_at: simdiIso }
}
