/**
 * NOTYA-HASTA-ILETISIMI-01 — SSRF guard for the doctor-supplied SMS gateway base URL.
 *
 * The backend POSTs to `{tabanUrl}/message` with the doctor's gateway credentials, so an
 * unchecked URL would let any doctor/personel point the server at loopback, the cloud metadata
 * service (169.254.169.254) or the private network. A real android-sms-gateway deployment that
 * this server can reach is either the public cloud endpoint or a self-hosted instance behind a
 * public HTTPS hostname, so the rule is deliberately narrow:
 *
 *   - https only, no embedded credentials, no query/fragment;
 *   - the host must not be localhost / *.local / *.internal / a single-label name;
 *   - an IP-literal host must be a public address (loopback, private, link-local, CGNAT,
 *     unspecified, multicast, reserved and IPv6 ULA/link-local/mapped-private are all rejected).
 *
 * Documented exception: env SMS_GATEWAY_IZINLI_HOSTLAR (comma-separated exact hostnames, set by
 * the operator, never by a doctor) bypasses the host/scheme rules for those hostnames only
 * (e.g. a self-hosted gateway on a private network reachable from the server).
 *
 * Known limit: this validates the URL text, not DNS resolution — a public hostname that later
 * resolves to a private address (DNS rebinding) is not caught here (see docs/OPEN-COMMITMENTS.md).
 * The gateway client also refuses redirects so a public host cannot bounce the request inward.
 */

export type GatewayUrlSonucu = { ok: true; url: string } | { ok: false; hata: string }

const HATA_GENEL = 'Geçerli bir adres girin (https:// ile başlayan, herkese açık bir adres olmalı).'

function izinliHostlar(): string[] {
  return String(process.env.SMS_GATEWAY_IZINLI_HOSTLAR || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function ipv4Parcalari(host: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return null
  const p = m.slice(1).map(Number)
  return p.every((n) => n >= 0 && n <= 255) ? p : null
}

function ipv4HerkeseAcikMi([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 100 && b >= 64 && b <= 127) return false // CGNAT
  if (a === 169 && b === 254) return false // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 192 && b === 0 && c === 0) return false // IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return false // TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return false // benchmarking
  if (a === 198 && b === 51 && c === 100) return false // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return false // TEST-NET-3
  if (a >= 224) return false // multicast + reserved + broadcast
  return true
}

function ipv6HerkeseAcikMi(host: string): boolean {
  const h = host.toLowerCase()
  if (h === '::' || h === '::1') return false
  const eslenmis = /^::ffff:(.+)$/.exec(h) // ::ffff:7f00:1 / ::ffff:127.0.0.1 — judge the embedded v4
  if (eslenmis) {
    const v4 = ipv4Parcalari(eslenmis[1])
    if (v4) return ipv4HerkeseAcikMi(v4)
    const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(eslenmis[1])
    if (!hex) return false
    const x = parseInt(hex[1], 16), y = parseInt(hex[2], 16)
    return ipv4HerkeseAcikMi([x >> 8, x & 255, y >> 8, y & 255])
  }
  const ilk = parseInt(h.split(':')[0] || '0', 16)
  if ((ilk & 0xfe00) === 0xfc00) return false // fc00::/7 unique-local
  if ((ilk & 0xffc0) === 0xfe80) return false // fe80::/10 link-local
  if ((ilk & 0xff00) === 0xff00) return false // multicast
  return true
}

export function gatewayUrlDogrula(ham: string): GatewayUrlSonucu {
  const metin = String(ham || '').trim()
  let u: URL
  try { u = new URL(metin) } catch { return { ok: false, hata: HATA_GENEL } }
  if (u.username || u.password) return { ok: false, hata: 'Adres kullanıcı adı/şifre içeremez.' }
  if (u.search || u.hash) return { ok: false, hata: 'Adres sorgu veya parça içeremez.' }

  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const istisna = izinliHostlar().includes(host)
  if (u.protocol !== 'https:' && !(istisna && u.protocol === 'http:')) return { ok: false, hata: HATA_GENEL }
  if (!istisna) {
    if (!host) return { ok: false, hata: HATA_GENEL }
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.home.arpa')) {
      return { ok: false, hata: HATA_GENEL }
    }
    const v4 = ipv4Parcalari(host)
    if (v4) { if (!ipv4HerkeseAcikMi(v4)) return { ok: false, hata: HATA_GENEL } }
    else if (host.includes(':')) { if (!ipv6HerkeseAcikMi(host)) return { ok: false, hata: HATA_GENEL } }
    else if (!host.includes('.')) return { ok: false, hata: HATA_GENEL } // single-label intranet name
  }
  return { ok: true, url: `${u.origin}${u.pathname}`.replace(/\/+$/, '') }
}
