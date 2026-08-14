/**
 * NVI / KPS identity lookup adapter.
 * Uses the doctor's own stored credentials — Notya never holds a master gov account.
 *
 * Live SOAP activates when:
 * - doctor has nvi_kps credentials in the vault, AND
 * - NVI_KPS_SOAP_URL (or default KPS endpoint) is reachable with those creds
 *
 * Until institutional endpoints accept the doctor's credentials, lookupKimlik
 * returns { ok:false, reason:'upstream_unavailable' } after attempting the call.
 */

import type { NviSecrets } from '@/lib/doktor/integrations'

export type KimlikLookupResult =
  | {
      ok: true
      adSoyad: string
      dogumTarihi?: string
      cinsiyet?: string
      source: 'nvi_kps'
    }
  | {
      ok: false
      reason: 'no_credentials' | 'upstream_unavailable' | 'upstream_error' | 'not_found'
      message: string
    }

const DEFAULT_KPS_URL =
  process.env.NVI_KPS_SOAP_URL ||
  'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx'

function buildKpsSoap(tc: string, creds: NviSecrets): string {
  // Minimal SOAP envelope; real KPS contracts vary by institutional channel.
  // Username/password are passed as WS-Security style header placeholders.
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soap:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${escapeXml(creds.username)}</wsse:Username>
        <wsse:Password>${escapeXml(creds.password)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
      <TCKimlikNo>${escapeXml(tc)}</TCKimlikNo>
    </TCKimlikNoDogrula>
  </soap:Body>
</soap:Envelope>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseIdentityFromXml(xml: string): {
  ad?: string
  soyad?: string
  dogumTarihi?: string
  cinsiyet?: string
} {
  const pick = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
    return m?.[1]?.trim()
  }
  return {
    ad: pick('Ad') || pick('ad') || pick('FirstName'),
    soyad: pick('Soyad') || pick('soyad') || pick('LastName'),
    dogumTarihi: pick('DogumTarihi') || pick('dogumTarihi') || pick('BirthDate'),
    cinsiyet: pick('Cinsiyet') || pick('cinsiyet') || pick('Gender'),
  }
}

function normalizeCinsiyet(raw?: string): string | undefined {
  if (!raw) return undefined
  const v = raw.toLowerCase()
  if (v.includes('e') || v === '1' || v === 'male') return 'Erkek'
  if (v.includes('k') || v === '2' || v === 'female') return 'Kadın'
  return undefined
}

/**
 * Look up kimlik using the doctor's NVI credentials.
 * Force-enable live attempts with NVI_KPS_LIVE=true (default: attempt when URL set).
 */
export async function lookupKimlikWithDoctorCreds(
  tc: string,
  creds: NviSecrets
): Promise<KimlikLookupResult> {
  const live =
    process.env.NVI_KPS_LIVE === 'true' ||
    Boolean(process.env.NVI_KPS_SOAP_URL) ||
    process.env.MERNIS_ENABLED === 'true'

  if (!live) {
    // Adapter ready but live SOAP not enabled in this environment.
    return {
      ok: false,
      reason: 'upstream_unavailable',
      message:
        'NVI/KPS bağlantınız kayıtlı. Canlı sorgu bu ortamda henüz aktif değil — alanları manuel girin veya kimlik kartı fotoğrafı kullanın.',
    }
  }

  try {
    const soap = buildKpsSoap(tc, creds)
    const resp = await fetch(DEFAULT_KPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tckimlik.nvi.gov.tr/WS/TCKimlikNoDogrula',
      },
      body: soap,
      cache: 'no-store',
    })

    const xml = await resp.text()
    if (!resp.ok) {
      return {
        ok: false,
        reason: 'upstream_error',
        message: `NVI yanıt vermedi (${resp.status}). Bilgileri manuel girin.`,
      }
    }

    const parsed = parseIdentityFromXml(xml)
    const adSoyad = [parsed.ad, parsed.soyad].filter(Boolean).join(' ').trim()
    if (!adSoyad) {
      // Public KPS "TCKimlikNoDogrula" only returns boolean — full identity needs institutional KPS.
      return {
        ok: false,
        reason: 'not_found',
        message:
          'NVI kimlik doğrulandı ancak ad/soyad bu kanalda dönmedi (kurumsal KPS gerekir). Manuel veya kimlik fotoğrafı kullanın.',
      }
    }

    return {
      ok: true,
      adSoyad,
      dogumTarihi: parsed.dogumTarihi,
      cinsiyet: normalizeCinsiyet(parsed.cinsiyet),
      source: 'nvi_kps',
    }
  } catch (e) {
    console.error('NVI KPS lookup failed', e)
    return {
      ok: false,
      reason: 'upstream_error',
      message: 'NVI bağlantı hatası. Bilgileri manuel girin.',
    }
  }
}
