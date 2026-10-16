/**
 * NOTYA-HASTA-ILETISIMI-01 — client for android-sms-gateway (github.com/capcom6/android-sms-gateway,
 * MIT). See lib/iletisim/sms/README.md for what this is, what it costs (nothing) and its honest
 * limits (not Twilio; requires the doctor to install and configure the app once).
 *
 * Contract: POST {tabanUrl}/message, HTTP Basic Auth (kullaniciAdi/sifre), JSON body
 * { message, phoneNumbers: [E.164] } → 200/201 { id, state } on accept. Never throws.
 */
import type { AndroidSmsAyar } from './tipler'
import { gatewayUrlDogrula } from './gatewayUrl'

const ISTEK_ZAMAN_ASIMI_MS = 15_000

export async function androidGatewayGonder(ayar: AndroidSmsAyar, aliciE164: string, metin: string): Promise<{ ok: true; saglayiciMesajId?: string } | { ok: false; hata: string }> {
  // Re-checked at send time: a URL saved before the SSRF guard existed must not be called.
  const adres = gatewayUrlDogrula(ayar.tabanUrl)
  if (!adres.ok) return { ok: false, hata: 'Gateway adresi güvenli değil (herkese açık https adresi gerekir).' }
  const kontrolcu = new AbortController()
  const zamanlayici = setTimeout(() => kontrolcu.abort(), ISTEK_ZAMAN_ASIMI_MS)
  try {
    const yanit = await fetch(`${adres.url}/message`, {
      method: 'POST',
      redirect: 'error', // a public host must not be able to bounce the request to an internal address
      signal: kontrolcu.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${ayar.kullaniciAdi}:${ayar.sifre}`).toString('base64')}`,
      },
      body: JSON.stringify({ message: metin, phoneNumbers: [aliciE164] }),
    })
    if (!yanit.ok) {
      const govde = await yanit.text().catch(() => '')
      return { ok: false, hata: `Gateway ${yanit.status}: ${govde.slice(0, 200) || 'bilinmeyen hata'}` }
    }
    const veri = await yanit.json().catch(() => null as any)
    return { ok: true, saglayiciMesajId: veri?.id ? String(veri.id) : undefined }
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : 'bilinmeyen hata'
    return { ok: false, hata: e instanceof Error && e.name === 'AbortError' ? 'Gateway zaman aşımına uğradı.' : `Gateway'e bağlanılamadı: ${mesaj}` }
  } finally {
    clearTimeout(zamanlayici)
  }
}

/** Ayarlar "Bağlantıyı test et" — same call, a 1-recipient no-op is not possible on every build, so this just checks the base URL answers auth, not that an SMS left. */
export async function androidGatewayBaglantiTest(ayar: AndroidSmsAyar): Promise<{ ok: true } | { ok: false; hata: string }> {
  const adres = gatewayUrlDogrula(ayar.tabanUrl)
  if (!adres.ok) return { ok: false, hata: adres.hata }
  const kontrolcu = new AbortController()
  const zamanlayici = setTimeout(() => kontrolcu.abort(), ISTEK_ZAMAN_ASIMI_MS)
  try {
    const yanit = await fetch(`${adres.url}/health`, {
      redirect: 'error',
      signal: kontrolcu.signal,
      headers: { Authorization: `Basic ${Buffer.from(`${ayar.kullaniciAdi}:${ayar.sifre}`).toString('base64')}` },
    })
    if (yanit.status === 401 || yanit.status === 403) return { ok: false, hata: 'Kullanıcı adı/şifre reddedildi.' }
    if (!yanit.ok) return { ok: false, hata: `Gateway ${yanit.status} döndürdü.` }
    return { ok: true }
  } catch (e) {
    return { ok: false, hata: `Bağlanılamadı: ${e instanceof Error ? e.message : 'bilinmeyen hata'}` }
  } finally {
    clearTimeout(zamanlayici)
  }
}
