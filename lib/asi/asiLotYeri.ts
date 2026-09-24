/**
 * NOTYA-ASI-LOT-01 (Dr. Gökhan, 2026-09-24) — lot no + uygulama yeri of a vaccine dose. Pure, client-safe.
 *
 * They live in asilar.lot_no / asilar.uygulama_yeri (migration 093). Before that the approval sync packed them into
 * asilar.notlar as "Lot: … · Uygulama yeri: …" and no view rendered notlar — `notlardanLotYeri` is the same split the
 * migration runs in SQL (tested here so both stay in step).
 *
 * Display: the doctor's Aşılar list ("Lot: X · Yer: Y", only when known) and the Aşı Karnesi "Lot / Uygulama yeri"
 * column (Sağlığım + PDF + print; empty when unknown). Never invented — empty stays empty.
 */

export const LOT_AZAMI = 60
export const YER_AZAMI = 80

/** Free text → trimmed, single-spaced, capped; empty → null. */
export function lotYerTemizle(v: unknown, azami: number): string | null {
  const t = (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, azami) : null
}

/** Doctor Aşılar list line under "Uygulandı": "Lot: X · Yer: Y" — only the known parts; nothing known → ''. */
export function lotYerSatiri(a: { lot_no?: string | null; uygulama_yeri?: string | null }): string {
  const lot = lotYerTemizle(a.lot_no, LOT_AZAMI)
  const yer = lotYerTemizle(a.uygulama_yeri, YER_AZAMI)
  return [lot ? `Lot: ${lot}` : '', yer ? `Yer: ${yer}` : ''].filter(Boolean).join(' · ')
}

/** Karne cell ("Lot / Uygulama yeri" column): "X · Y", one of them, or '' (empty cell). */
export function lotYerHucresi(a: { lotNo?: string | null; uygulamaYeri?: string | null }): string {
  return [a.lotNo, a.uygulamaYeri].map((x) => lotYerTemizle(x, YER_AZAMI)).filter(Boolean).join(' · ')
}

const SEGMENT = /^(Lot|Uygulama yeri):\s*(.*)$/

/**
 * Old packed notlar → columns. Splits on " · " and lifts the "Lot: …" / "Uygulama yeri: …" segments; every other
 * segment is kept verbatim and in order. Mirrors lib/db/migrations/093_asi_lot_yeri.sql.
 */
export function notlardanLotYeri(notlar: string | null | undefined): { lot_no: string | null; uygulama_yeri: string | null; notlar: string | null } {
  let lot: string | null = null
  let yer: string | null = null
  const kalan: string[] = []
  for (const parca of String(notlar ?? '').split(/\s*·\s*/)) {
    const m = parca.trim().match(SEGMENT)
    if (m) {
      // First non-empty value wins; every packed segment leaves notlar.
      if (m[1] === 'Lot') lot ??= lotYerTemizle(m[2], LOT_AZAMI)
      else yer ??= lotYerTemizle(m[2], YER_AZAMI)
      continue
    }
    if (parca.trim()) kalan.push(parca.trim())
  }
  return { lot_no: lot, uygulama_yeri: yer, notlar: kalan.length ? kalan.join(' · ') : null }
}
