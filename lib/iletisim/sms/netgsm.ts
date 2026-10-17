/**
 * NETGSM-01 (Kaan, 2026-10-16) — SMS adapter for NetGSM, the doctor's OWN account with a Turkish SMS
 * provider. For doctors who use an iPhone: an iPhone cannot be an SMS gateway (androidGateway.ts is
 * Android-only), so these doctors open a NetGSM account, pay NetGSM per message, and paste the API
 * credentials into Ayarlar › İletişim. Notya pays nothing, runs no SMS service and holds no Notya-owned
 * SMS account (standing rule: no Twilio, no per-message SMS API paid by Notya).
 *
 * Contract (source: NetGSM's official Node client @netgsm/sms 1.1.11 — see docs/NETGSM-SMS-research.md;
 * NOT yet exercised against the live API, see docs/OPEN-COMMITMENTS.md NETGSM-01):
 *   POST https://api.netgsm.com.tr/sms/rest/v2/send       Basic auth (usercode:password), JSON
 *     { msgheader, encoding: 'TR', iysfilter: '0', messages: [{ msg, no: '5XXXXXXXXX' }] }
 *     → { code: '00', description, jobid }   (error: HTTP 200 or 406 with a non-'00' code)
 *   GET  https://api.netgsm.com.tr/sms/rest/v2/msgheader  → approved sender names (non-sending check)
 *   POST https://api.netgsm.com.tr/balance { usercode, password, stip: 2 } → credit
 *
 * Safety: FIXED official host only (no doctor-supplied URL → no SSRF surface); redirects refused;
 * 15 s timeout; credentials are never logged and never put in an error message or a URL.
 * Never throws — the bulk engine records { ok:false } per recipient like any other failure.
 */
import type { NetgsmSmsAyar } from './tipler'

export const NETGSM_TABAN_URL = 'https://api.netgsm.com.tr'
const ISTEK_ZAMAN_ASIMI_MS = 15_000
/**
 * `iysfilter: '0'` = "bilgilendirme amaçlı gönderim (İYS kontrolsüz)" per NetGSM's own client example.
 * Bulk messages from this product are patient information messages (randevu/aşı hatırlatması).
 * Whether that classification is right for a given message is the doctor's responsibility and is an OPEN
 * regulatory question (docs/NETGSM-SMS-research.md, NETGSM-03). Promotional text must NOT go through here.
 */
export const NETGSM_IYS_FILTRE = '0'

type Sonuc<T = object> = ({ ok: true } & T) | { ok: false; hata: string }

/** NetGSM response code → what a non-technical doctor can act on. Send endpoint codes. */
export const NETGSM_HATA_MESAJLARI: Record<string, string> = {
  '20': 'NetGSM mesajı kabul etmedi: mesaj metninde bir sorun var ya da metin izin verilen en fazla uzunluğu aştı. Mesajı kısaltıp tekrar deneyin.',
  '30': 'NetGSM kullanıcı kodu veya şifresi kabul edilmedi ya da hesabınızda API erişimi kapalı. Ayarlar’daki bilgileri kontrol edin; NetGSM hesabınızda IP kısıtlaması tanımlıysa kaldırmanız gerekebilir.',
  '40': 'Mesaj başlığı (gönderici adı) NetGSM hesabınızda tanımlı değil ya da henüz onaylanmamış. Başlığı NetGSM’de onaylatın ve Ayarlar’da aynen yazın.',
  '50': 'NetGSM hesabınız bu türde (İYS kontrollü) gönderime izin vermiyor. NetGSM müşteri hizmetleriyle görüşün.',
  '51': 'NetGSM hesabınızda İYS marka bilgisi bulunamadı. NetGSM müşteri hizmetleriyle görüşün.',
  '70': 'NetGSM isteği reddetti: bir bilgi eksik ya da hatalı (örneğin başlık veya telefon numarası). Ayarları ve hasta telefon numarasını kontrol edin.',
  '80': 'NetGSM gönderim hız sınırına ulaşıldı. Birkaç dakika bekleyip gönderimi “Devam et” ile sürdürün.',
  '85': 'Aynı numaraya kısa sürede çok fazla mesaj gönderildi (NetGSM 1 dakikada en fazla 20 görev kabul eder). Biraz bekleyip tekrar deneyin.',
  '100': 'NetGSM tarafında geçici bir sistem hatası oluştu. Biraz sonra tekrar deneyin.',
  '101': 'NetGSM tarafında geçici bir sistem hatası oluştu. Biraz sonra tekrar deneyin.',
}
const HATA_BILINMEYEN = 'NetGSM beklenmeyen bir yanıt verdi. Birkaç dakika sonra tekrar deneyin; sürerse NetGSM hesabınızı kontrol edin.'
const HATA_KREDI_YOK = 'NetGSM hesabınızda yeterli kredi/paket yok gibi görünüyor. NetGSM’den kredi veya paket yükleyin.'

export function netgsmHataMesaji(kod: string | undefined | null, aciklama?: string | null): string {
  const k = String(kod ?? '').trim()
  if (NETGSM_HATA_MESAJLARI[k]) return NETGSM_HATA_MESAJLARI[k]
  // NetGSM does not document a "no credit" send code in the material available to us; if its free-text
  // description clearly says so, say so plainly. Otherwise do not guess.
  if (/kredi|bakiye|balance|credit/i.test(String(aciklama || ''))) return HATA_KREDI_YOK
  return k ? `NetGSM hata kodu ${k}. ${HATA_BILINMEYEN}` : HATA_BILINMEYEN
}

/** "+905321112233" → "5321112233" (NetGSM wants the national number without 0 or country code). Non-Turkish → null. */
export function netgsmNumara(aliciE164: string): string | null {
  const m = /^\+90(5\d{9})$/.exec(String(aliciE164 || '').trim())
  return m ? m[1] : null
}

function basicYetki(ayar: Pick<NetgsmSmsAyar, 'kullaniciKodu' | 'sifre'>): string {
  return `Basic ${Buffer.from(`${ayar.kullaniciKodu}:${ayar.sifre}`).toString('base64')}`
}

async function ayristir(yanit: Response): Promise<Record<string, any> | null> {
  const metin = await yanit.text().catch(() => '')
  try {
    const v = JSON.parse(metin)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : null
  } catch { return null }
}

/** One guarded call: fixed host, no redirects, timeout. Returns the response or a doctor-facing error. Never echoes secrets. */
async function cagri(yol: string, init: RequestInit): Promise<{ ok: true; yanit: Response } | { ok: false; hata: string }> {
  const kontrolcu = new AbortController()
  const zamanlayici = setTimeout(() => kontrolcu.abort(), ISTEK_ZAMAN_ASIMI_MS)
  try {
    const yanit = await fetch(`${NETGSM_TABAN_URL}${yol}`, { ...init, redirect: 'error', signal: kontrolcu.signal })
    return { ok: true, yanit }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { ok: false, hata: 'NetGSM zaman aşımına uğradı. Biraz sonra tekrar deneyin.' }
    return { ok: false, hata: 'NetGSM’e bağlanılamadı. İnternet bağlantısını kontrol edip tekrar deneyin.' }
  } finally {
    clearTimeout(zamanlayici)
  }
}

export async function netgsmGonder(ayar: NetgsmSmsAyar, aliciE164: string, metin: string): Promise<{ ok: true; saglayiciMesajId?: string } | { ok: false; hata: string }> {
  const no = netgsmNumara(aliciE164)
  if (!no) return { ok: false, hata: 'NetGSM yalnızca Türkiye cep telefonlarına gönderim için ayarlandı; bu numara gönderilemedi.' }
  const baslik = String(ayar.baslik || '').trim()
  if (!baslik) return { ok: false, hata: 'NetGSM mesaj başlığı (gönderici adı) Ayarlar’da yazılı değil.' }
  const c = await cagri('/sms/rest/v2/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: basicYetki(ayar) },
    body: JSON.stringify({ msgheader: baslik, encoding: 'TR', iysfilter: NETGSM_IYS_FILTRE, messages: [{ msg: metin, no }] }),
  })
  if (!c.ok) return c
  const veri = await ayristir(c.yanit)
  if (!veri) {
    if (c.yanit.status === 401 || c.yanit.status === 403) return { ok: false, hata: netgsmHataMesaji('30') }
    return { ok: false, hata: `NetGSM okunamayan bir yanıt verdi (HTTP ${c.yanit.status}). Mesajın gidip gitmediğinden emin olamıyoruz; NetGSM raporundan kontrol edin.` }
  }
  const kod = veri.code === undefined || veri.code === null ? '' : String(veri.code)
  // Only an explicit '00' is a success. A 2xx with a missing/odd code is NOT treated as sent.
  if (kod === '00') return { ok: true, saglayiciMesajId: veri.jobid ? String(veri.jobid) : undefined }
  return { ok: false, hata: netgsmHataMesaji(kod, typeof veri.description === 'string' ? veri.description : null) }
}

/** "2,7" / "2.7" / 2.7 → 2.7 ; anything else → null. */
export function netgsmSayi(ham: unknown): number | null {
  if (typeof ham === 'number') return Number.isFinite(ham) ? ham : null
  if (typeof ham !== 'string') return null
  const t = ham.trim().replace(/\s/g, '')
  if (!/^-?\d+([.,]\d+)?$/.test(t)) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Remaining credit (stip=2). Never throws; { kredi: null } when the reply is not understood. */
export async function netgsmKrediSorgula(ayar: NetgsmSmsAyar): Promise<Sonuc<{ kredi: number | null }>> {
  const c = await cagri('/balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usercode: ayar.kullaniciKodu, password: ayar.sifre, stip: 2 }),
  })
  if (!c.ok) return c
  const veri = await ayristir(c.yanit)
  if (!veri) return { ok: true, kredi: null }
  const kod = veri.code === undefined || veri.code === null ? '' : String(veri.code)
  if (kod === '30') return { ok: false, hata: netgsmHataMesaji('30') }
  if (kod && kod !== '00') return { ok: true, kredi: null }
  const b = veri.balance
  if (Array.isArray(b)) {
    const toplam = b.map((x) => netgsmSayi(x?.amount)).filter((x): x is number => x !== null)
    return { ok: true, kredi: toplam.length ? toplam.reduce((a, x) => a + x, 0) : null }
  }
  return { ok: true, kredi: netgsmSayi(b) }
}

/** Sender names compare case-insensitively under EITHER casing rule (Turkish İ/ı or plain ASCII I/i), exact otherwise. */
const baslikAyni = (a: string, b: string) =>
  a.trim().toLocaleLowerCase('tr-TR') === b.trim().toLocaleLowerCase('tr-TR') || a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Ayarlar "Bağlantıyı test et": a NON-SENDING check. Lists the account's approved sender names (proves the
 * usercode/password and API access) and confirms the configured başlık is among them; also reads credit.
 * No SMS is sent.
 */
export async function netgsmBaglantiTest(ayar: NetgsmSmsAyar): Promise<Sonuc<{ baslikOnayli: boolean | null; kredi: number | null; uyari?: string }>> {
  const c = await cagri('/sms/rest/v2/msgheader', { method: 'GET', headers: { Authorization: basicYetki(ayar) } })
  if (!c.ok) return c
  const veri = await ayristir(c.yanit)
  if (!veri) {
    if (c.yanit.status === 401 || c.yanit.status === 403) return { ok: false, hata: netgsmHataMesaji('30') }
    return { ok: false, hata: HATA_BILINMEYEN }
  }
  const kod = veri.code === undefined || veri.code === null ? '' : String(veri.code)
  if (kod !== '00') return { ok: false, hata: netgsmHataMesaji(kod, typeof veri.description === 'string' ? veri.description : null) }

  const liste: unknown = Array.isArray(veri.msgheader) ? veri.msgheader : Array.isArray(veri.msgheaders) ? veri.msgheaders : null
  let baslikOnayli: boolean | null = null
  let uyari: string | undefined
  if (Array.isArray(liste)) {
    baslikOnayli = liste.some((b) => typeof b === 'string' && baslikAyni(b, ayar.baslik || ''))
    if (!baslikOnayli) uyari = 'Giriş bilgileriniz doğru, ancak yazdığınız mesaj başlığı NetGSM hesabınızdaki onaylı başlıklar arasında görünmüyor. Başlığı NetGSM’de onaylatın ya da onaylı olanı aynen yazın.'
  }
  const kredi = await netgsmKrediSorgula(ayar)
  return { ok: true, baslikOnayli, kredi: kredi.ok ? kredi.kredi : null, uyari }
}
