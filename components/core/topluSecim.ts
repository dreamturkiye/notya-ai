/**
 * Selection / gating logic for the batch confirm card (EylemToplu). Pure, no React, no I/O.
 *
 * Bug this fixes (Kaan, 2026-10-16, "Selin" on Dermatoloji, İlaç ekle batch): the row checkbox was
 * `disabled` whenever a required field (Doz, Kullanım) was empty, and the card offered no input to
 * fill it ("tek tek açıp doldurmanız gerekiyor" — but nothing to open). The whole batch was stuck.
 *
 * Rules now:
 *   • Ticking a row is only an intent. It is ALWAYS possible (while the card is open).
 *   • A row is READY (will be written) only when it is ticked, every required field has a value
 *     (proposed by the server OR typed by the doctor), and a `ciddi` warning is acknowledged.
 *   • Nothing is ever invented: a missing field stays missing until the doctor types it.
 *   • Only values the doctor typed are sent as `duzeltmeler`; the server re-validates everything.
 */

export interface TopluAlan {
  anahtar: string
  etiket: string
  tip?: string
  sunucu?: boolean
}

export interface TopluOneri {
  id: string
  veri?: Record<string, unknown>
  alanlar: TopluAlan[]
  zorunlu?: string[]
  uyari_detay?: { siddet: string }[]
}

export type TopluDuzeltme = Record<string, Record<string, string>>

const dolu = (v: unknown) => v != null && String(v).trim() !== ''

/** Required fields still empty, counting what the doctor has typed into the card. */
export function eksikAlanlar(o: TopluOneri, duzeltme: TopluDuzeltme = {}): string[] {
  return (o.zorunlu || []).filter((k) => !dolu(duzeltme[o.id]?.[k]) && !dolu(o.veri?.[k]))
}

export function ciddiVarMi(o: TopluOneri): boolean {
  return (o.uyari_detay || []).some((u) => u.siddet === 'ciddi')
}

/** Initial ticks: rows that are complete and carry no serious warning. Ticking others is the doctor's call. */
export function baslangicSecimi(oneriler: TopluOneri[]): Record<string, boolean> {
  return Object.fromEntries(oneriler.map((o) => [o.id, eksikAlanlar(o).length === 0 && !ciddiVarMi(o)]))
}

export function hazirMi(o: TopluOneri, secili: Record<string, boolean>, duzeltme: TopluDuzeltme, gorulen: Record<string, boolean>): boolean {
  return Boolean(secili[o.id]) && eksikAlanlar(o, duzeltme).length === 0 && (!ciddiVarMi(o) || Boolean(gorulen[o.id]))
}

export interface TopluSayim {
  /** ticked rows */
  secilen: number
  /** ticked rows that will be written now */
  hazir: number
  /** ticked rows still lacking a required field */
  eksikli: number
  /** ticked rows complete but waiting on a serious-warning acknowledgement */
  uyariBekleyen: number
}

export function sayim(oneriler: TopluOneri[], secili: Record<string, boolean>, duzeltme: TopluDuzeltme, gorulen: Record<string, boolean>): TopluSayim {
  const s: TopluSayim = { secilen: 0, hazir: 0, eksikli: 0, uyariBekleyen: 0 }
  for (const o of oneriler) {
    if (!secili[o.id]) continue
    s.secilen++
    if (eksikAlanlar(o, duzeltme).length) s.eksikli++
    else if (ciddiVarMi(o) && !gorulen[o.id]) s.uyariBekleyen++
    else s.hazir++
  }
  return s
}

/** Request payload: ids of READY rows, plus only the doctor-typed values for those rows. */
export function topluGovde(oneriler: TopluOneri[], secili: Record<string, boolean>, duzeltme: TopluDuzeltme, gorulen: Record<string, boolean>) {
  const hazirlar = oneriler.filter((o) => hazirMi(o, secili, duzeltme, gorulen))
  const duzeltmeler: Record<string, Record<string, string>> = {}
  for (const o of hazirlar) {
    const yazilan: Record<string, string> = {}
    for (const a of o.alanlar) {
      if (a.sunucu) continue
      const v = duzeltme[o.id]?.[a.anahtar]
      if (dolu(v)) yazilan[a.anahtar] = String(v).trim()
    }
    if (Object.keys(yazilan).length) duzeltmeler[o.id] = yazilan
  }
  return {
    adim: 'toplu_onayla' as const,
    oneriIdler: hazirlar.map((o) => o.id),
    duzeltmeler,
    uyariGoruldu: Object.fromEntries(hazirlar.map((o) => [o.id, Boolean(gorulen[o.id])])),
  }
}

/**
 * Copy shown by the batch card's gating UI. Turkish is the default (the Türkiye product is untouched);
 * a country build passes its own object (see docs/OPEN-COMMITMENTS.md TOPLU-ULKE-01). Never hardcode
 * these strings back into the component, and never translate field labels here — field labels (`etiket`)
 * and required-field keys (`zorunlu`) come from each build's own action definitions.
 */
export interface TopluMetin {
  hazir: (n: number) => string
  eksikli: (n: number) => string
  uyariBekleyen: (n: number) => string
  dugme: (parcalar: string[]) => string
  eksikAciklama: string
  seciliEksik: (alanlar: string[]) => string
}

export const TOPLU_METIN_TR: TopluMetin = {
  hazir: (n) => `${n} hazır`,
  eksikli: (n) => `${n} kayıtta eksik alan var`,
  uyariBekleyen: (n) => `${n} kayıtta uyarı onayı bekliyor`,
  dugme: (parcalar) => `Seçilenleri kaydet (${parcalar.join(', ')})`,
  eksikAciklama: 'Eksik alan var — aşağıya siz girin; doldurulmadan bu kayıt eklenmez. Ayşe bu alanları tahmin etmedi.',
  seciliEksik: (alanlar) => `Seçili — ${alanlar.join(', ')} girilince eklenecek.`,
}

/** Button label: says how many are ready and how many still need fields. */
export function dugmeMetni(s: TopluSayim, m: TopluMetin = TOPLU_METIN_TR): string {
  const parca = [m.hazir(s.hazir)]
  if (s.eksikli) parca.push(m.eksikli(s.eksikli))
  if (s.uyariBekleyen) parca.push(m.uyariBekleyen(s.uyariBekleyen))
  return m.dugme(parca)
}
