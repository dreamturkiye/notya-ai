/**
 * BELGE-NO-01 / HASTA-DISA-AKTAR-01 — a small per-key RATE LIMIT (sliding window, in memory, per server instance).
 * Used by the public verify page (per IP), the registration route and the patient-record export (per doctor). Memory
 * only, so it costs no database round trip on a hot path (performans-butcesi); a determined caller spread across
 * instances gets at most `sinir x instances` — acceptable for these three, each of which also checks its own input.
 */
export type HizSiniri = { izinli: (anahtar: string, simdi?: number) => boolean }

export function hizSiniri(sinir: number, pencereMs: number, enCokAnahtar = 5000): HizSiniri {
  const kayit = new Map<string, number[]>()
  return {
    izinli(anahtar: string, simdi = Date.now()): boolean {
      const once = simdi - pencereMs
      const liste = (kayit.get(anahtar) || []).filter((t) => t > once)
      if (liste.length >= sinir) { kayit.set(anahtar, liste); return false }
      liste.push(simdi)
      kayit.delete(anahtar)
      kayit.set(anahtar, liste)
      if (kayit.size > enCokAnahtar) kayit.delete(kayit.keys().next().value as string)
      return true
    },
  }
}

/** The caller's IP from the proxy headers (first hop), or a fixed key. Never stored. */
export function istekIp(basliklar: { get(ad: string): string | null }): string {
  const x = basliklar.get('x-forwarded-for')
  return (x ? x.split(',')[0].trim() : basliklar.get('x-real-ip') || '') || 'bilinmiyor'
}
