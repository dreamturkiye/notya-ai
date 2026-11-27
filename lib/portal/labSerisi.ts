/**
 * BRANS-PAKETI — physician-ordered lab results (lab_satirlar, approved rows) → one series per analyte of a panel.
 * Numbers and dates only: no interpretation, no target, no colour. Shared by the diyetisyen lab panel (professional
 * tool) and the longevity "Değerlerim" module (patient). Pure + client-safe.
 */
export interface LabPanelOgesi { anahtar: string; ad: string; desen: RegExp }
export interface LabSatiri { canonical_key?: string | null; raw_name?: string | null; value_num?: number | string | null; unit?: string | null; numune_tarihi?: string | null }
export interface LabSerisi { anahtar: string; ad: string; birim: string | null; noktalar: Array<{ tarih: string; deger: number }> }

/** First panel item (in `oncelik` order, else panel order) whose pattern matches the canonical key or the raw name. */
export function labAnahtariBul(s: Pick<LabSatiri, 'canonical_key' | 'raw_name'>, panel: readonly LabPanelOgesi[], oncelik?: readonly string[]): string | null {
  const sira = oncelik ? oncelik.map((k) => panel.find((p) => p.anahtar === k)!).filter(Boolean) : panel
  for (const ad of [s.canonical_key, s.raw_name]) {
    const t = String(ad || '').trim()
    if (!t || /homa/i.test(t)) continue
    for (const p of sira) if (p.desen.test(t)) return p.anahtar
  }
  return null
}

/** Rows → series (oldest → newest; one point per date — the last row read for that date wins). */
export function labSerileriPanel(satirlar: readonly LabSatiri[], panel: readonly LabPanelOgesi[], oncelik?: readonly string[]): LabSerisi[] {
  const harita = new Map<string, { birim: string | null; noktalar: Map<string, number> }>()
  for (const s of satirlar) {
    const k = labAnahtariBul(s, panel, oncelik)
    const deger = Number(s.value_num)
    const tarih = String(s.numune_tarihi || '').slice(0, 10)
    if (!k || s.value_num == null || s.value_num === '' || !Number.isFinite(deger) || !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) continue
    const e = harita.get(k) || { birim: s.unit ? String(s.unit) : null, noktalar: new Map<string, number>() }
    if (!e.noktalar.has(tarih)) e.noktalar.set(tarih, deger)
    if (!e.birim && s.unit) e.birim = String(s.unit)
    harita.set(k, e)
  }
  return panel.flatMap((p) => {
    const e = harita.get(p.anahtar)
    if (!e) return []
    return [{ anahtar: p.anahtar, ad: p.ad, birim: e.birim, noktalar: [...e.noktalar.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([tarih, deger]) => ({ tarih, deger })) }]
  })
}
