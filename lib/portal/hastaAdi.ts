/**
 * PORTAL-HASTA-ADI — patient display name for Sağlığım (and the aşı karnesi, same parse).
 * Input is the DECRYPTED `patients.name_encrypted` payload ({ ad, soyad } JSON). Returns the trimmed full name or null —
 * never a placeholder. Only the name: T.C., doğum tarihi and contact fields are not read here.
 */
export function hastaAdSoyad(cozulmusAd: string | null | undefined): string | null {
  if (!cozulmusAd) return null
  try {
    const j = JSON.parse(cozulmusAd) as { ad?: unknown; soyad?: unknown }
    const ad = typeof j?.ad === 'string' ? j.ad : ''
    const soyad = typeof j?.soyad === 'string' ? j.soyad : ''
    return `${ad} ${soyad}`.replace(/\s+/g, ' ').trim() || null
  } catch {
    return null
  }
}
