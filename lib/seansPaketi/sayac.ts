/** NOTYA-PAKET-01 — bugünün sayacı. Fısıltı kartının kopyası değil. */

export function paketSayaci(g: { vizit: number; onayli: number }): { vizit: number; onayli: number; acik: number; metin: string } {
  const vizit = Math.max(0, g.vizit)
  const onayli = Math.max(0, Math.min(g.onayli, vizit))
  const acik = vizit - onayli
  const metin = acik === 0 && onayli === 0
    ? 'Onaylı seans yok — SOAP’ı bitirin veya Fısıltı’da Onayla.'
    : `Bugün ${vizit} vizit · ${onayli} paket hazır · ${acik} açık`
  return { vizit, onayli, acik, metin }
}
