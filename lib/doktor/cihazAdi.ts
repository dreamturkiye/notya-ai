/**
 * MOBIL-PERSONEL-01 — a short, human "browser · system" label from a User-Agent string, for the Hesabım
 * "Oturumlar" card. Approximate by design (UA strings are not reliable) and never stored.
 */
export function cihazAdi(ua: string | null | undefined): string {
  const u = String(ua || '')
  if (!u) return 'Bilinmeyen cihaz'
  const sistem =
    /iPhone/i.test(u) ? 'iPhone'
    : /iPad/i.test(u) ? 'iPad'
    : /Android/i.test(u) ? (/Mobile/i.test(u) ? 'Android telefon' : 'Android tablet')
    : /Windows/i.test(u) ? 'Windows'
    : /Mac OS X|Macintosh/i.test(u) ? 'Mac'
    : /CrOS/i.test(u) ? 'ChromeOS'
    : /Linux/i.test(u) ? 'Linux'
    : 'Bilinmeyen sistem'
  const tarayici =
    /Edg(e|A|iOS)?\//i.test(u) ? 'Edge'
    : /OPR\/|Opera/i.test(u) ? 'Opera'
    : /SamsungBrowser/i.test(u) ? 'Samsung Internet'
    : /(CriOS|Chrome)\//i.test(u) ? 'Chrome'
    : /(FxiOS|Firefox)\//i.test(u) ? 'Firefox'
    : /Safari\//i.test(u) ? 'Safari'
    : 'Tarayıcı'
  return `${tarayici} · ${sistem}`
}
