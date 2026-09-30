/**
 * NOTYA-AYSE-100-LUNA (open item c, 2026-09-29): the model had no clock — for "kaç gün kaldı" it guessed
 * "bugün 28.09" and computed a remaining antibiotic course from that. Every model turn now carries the current
 * date and time in the DOCTOR's timezone (a US doctor's "bugün" is not TRT's). Goes in the per-turn tail of the
 * system prompt (never in a cached block — it changes every minute).
 */
const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function parcalar(tz: string, simdi: Date): { y: number; m: number; d: number; hh: string; mm: string; dow: number } {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
  const p: Record<string, string> = {}
  for (const x of f.formatToParts(simdi)) p[x.type] = x.value
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), hh: p.hour, mm: p.minute, dow }
}

/** "29 Eylül 2026 Salı, 20:14" in the given timezone. */
export function zamanMetni(tz: string, simdi: Date = new Date()): string {
  let p: ReturnType<typeof parcalar>
  try { p = parcalar(tz, simdi) } catch { p = parcalar('Europe/Istanbul', simdi) }
  return `${p.d} ${AY[p.m - 1]} ${p.y} ${GUN[p.dow]}, ${p.hh}:${p.mm}`
}

/** ISO day (YYYY-MM-DD) in the given timezone. */
export function isoGun(tz: string, simdi: Date = new Date()): string {
  let p: ReturnType<typeof parcalar>
  try { p = parcalar(tz, simdi) } catch { p = parcalar('Europe/Istanbul', simdi) }
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

/** System-prompt line: the model's only clock. Day-based arithmetic (kaç gün kaldı / geçti) uses this date. */
export function zamanBlogu(tz: string, simdi: Date = new Date()): string {
  return `\n\n[ŞU AN: ${zamanMetni(tz, simdi)} (${tz}; ISO ${isoGun(tz, simdi)}). "Bugün / dün / yarın", kalan gün ve "kaç gün önce" hesapları BU tarihe göre yapılır; başka bir "bugün" varsayma.]`
}
