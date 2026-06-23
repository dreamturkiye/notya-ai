import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const SECRET = process.env.PORTAL_TOKEN_SECRET || 'notya-portal-secret-2026-change-in-prod'

export interface PortalTokenPayload {
  musteriId: string
  müşavirId: string
  expiresAt: number
  jti: string
}

export interface MüşteriPortalSession {
  musteriId: string
  müşteriAdi: string
  müşavirAdi: string
  vergiNo?: string
  faaliyetAlani?: string
  aktifBeyanlar: { beyanTuru: string; sonGun: string; daysLeft: number }[]
  sonOdemeler: { tur: string; tutar: number; tarih: string }[]
}

export function generateSecureToken(
  musteriId: string,
  müşavirId: string,
  daysValid = 30
): { token: string; tokenHash: string; expiresAt: Date } {
  const jti = randomBytes(16).toString('hex')
  const payload: PortalTokenPayload = {
    musteriId,
    müşavirId,
    expiresAt: Date.now() + daysValid * 86400000,
    jti,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest('base64url')
  const token = payloadB64 + '.' + sig
  const tokenHash = createHmac('sha256', SECRET).update(token).digest('hex')
  return { token, tokenHash, expiresAt: new Date(payload.expiresAt) }
}

export function verifyToken(token: string): PortalTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payloadB64, sig] = parts
    const expected = createHmac('sha256', SECRET).update(payloadB64).digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    const payload: PortalTokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    )
    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function buildMusteriSystemPrompt(session: MüşteriPortalSession): string {
  const beyanList =
    session.aktifBeyanlar
      .map((b) => `${b.beyanTuru} (${b.sonGun} - ${b.daysLeft} gun)`)
      .join(', ') || 'Yok'
  const odemeList =
    session.sonOdemeler
      .map((o) => `${o.tur}: ${o.tutar} TL (${o.tarih})`)
      .join(', ') || 'Yok'
  return `Sen Derya Yılmaz, ${session.müşavirAdi} bunyesinin guvenilir mali asistanisin.
Su an ${session.müşteriAdi}${session.vergiNo ? ` (${session.vergiNo})` : ''} ile konusuyorsun.
Faaliyet alani: ${session.faaliyetAlani || 'Belirtilmemis'}
Aktif beyan tarihleri: ${beyanList}
KURALLAR:
- Sadece bu müşterinin mali durumu hakkinda konus
- Kesin rakam vermek yerine müşavire danismayi oner
- Her zaman Türkçe konus, kısa ve net cevaplar ver (max 3 cumle)
- Diğer müşteri bilgilerini, gizli vergi stratejilerini asla paylaşma
- Emin degilsen: "Müşavirinize danismanizi oneririm" de
JSON YANIT FORMATI: { "speech": "..." }`
}
