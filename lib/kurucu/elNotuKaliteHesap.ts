/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the El Notu quality dashboard's numbers (pure). Input: the per doctor × week counts the
 * database aggregates (el_notu_kalite_haftalik, migration 205 — counts only, no text). Output: per doctor, per branş and
 * overall, the weekly trend of
 *   - Doğrula questions per page          (questions shown ÷ pages read),
 *   - corrections per approved note       (fields the approver changed ÷ approved El Notu notes),
 *   - auto-accept rate                    (words accepted without a question ÷ words read),
 *   - shadow-mode match rate              (comparisons with the same clinical content ÷ comparisons),
 *   - time saved                          (baseline × documented patients − measured documentation minutes; only for a
 *                                          doctor who has an honest baseline — core/esnek/zamanOlcer.ts — never invented).
 * A ratio with no denominator is null (shown as "—"), never 0.
 */
export type KaliteSatiri = {
  doctor_id: string; hafta: string; sayfa: number; dogrula: number; kelime: number; kabul: number; onayli_not: number; duzeltme: number
  golge: number; golge_ayni: number; dok_ms: number; dok_hasta: number
}

export type Metrik = {
  hafta: string
  sayfa: number
  onayliNot: number
  golge: number
  dokHasta: number
  dogrulaSayfaBasina: number | null
  duzeltmeNotBasina: number | null
  otomatikKabulYuzde: number | null
  golgeEslesmeYuzde: number | null
  kazancDk: number | null
}

const r1 = (n: number) => Math.round(n * 10) / 10
const sayi = (x: unknown) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : 0 }

export function satirTemizle(x: Record<string, unknown>): KaliteSatiri {
  return {
    doctor_id: String(x.doctor_id), hafta: String(x.hafta).slice(0, 10), sayfa: sayi(x.sayfa), dogrula: sayi(x.dogrula), kelime: sayi(x.kelime), kabul: sayi(x.kabul),
    onayli_not: sayi(x.onayli_not), duzeltme: sayi(x.duzeltme), golge: sayi(x.golge), golge_ayni: sayi(x.golge_ayni), dok_ms: sayi(x.dok_ms), dok_hasta: sayi(x.dok_hasta),
  }
}

/** One week of a group of doctors (sums, then ratios). `tabanDk` = the doctor's baseline minutes per note, or null. */
export function metrikHesapla(hafta: string, satirlar: KaliteSatiri[], tabanDk: (doktorId: string) => number | null): Metrik {
  const t = (f: (s: KaliteSatiri) => number) => satirlar.reduce((a, s) => a + f(s), 0)
  const sayfa = t((s) => s.sayfa), kelime = t((s) => s.kelime), onayli = t((s) => s.onayli_not), golge = t((s) => s.golge)
  let kazanc: number | null = null
  for (const s of satirlar) {
    const taban = tabanDk(s.doctor_id)
    if (!taban || !s.dok_hasta) continue
    kazanc = (kazanc ?? 0) + (taban * s.dok_hasta - s.dok_ms / 60000)
  }
  return {
    hafta, sayfa, onayliNot: onayli, golge, dokHasta: t((s) => s.dok_hasta),
    dogrulaSayfaBasina: sayfa ? r1(t((s) => s.dogrula) / sayfa) : null,
    duzeltmeNotBasina: onayli ? Math.round((t((s) => s.duzeltme) / onayli) * 100) / 100 : null,
    otomatikKabulYuzde: kelime ? r1((t((s) => s.kabul) / kelime) * 100) : null,
    golgeEslesmeYuzde: golge ? r1((t((s) => s.golge_ayni) / golge) * 100) : null,
    kazancDk: kazanc === null ? null : r1(kazanc),
  }
}

export type KaliteDoktoru = { anahtar: string; ad: string; brans: string | null; bransEtiketi: string; metrikler: Metrik[] }
export type KaliteBransi = { brans: string; bransEtiketi: string; doktorSayisi: number; metrikler: Metrik[] }
export type KaliteTablosu = { haftalar: string[]; toplam: Metrik[]; branslar: KaliteBransi[]; doktorlar: KaliteDoktoru[] }

export function kaliteTablosu(g: {
  satirlar: KaliteSatiri[]
  haftalar: string[]
  doktorlar: Map<string, { ad: string; brans: string | null }>
  tabanlar: Map<string, number | null>
  bransEtiketi: (brans: string | null) => string
}): KaliteTablosu {
  const taban = (id: string) => g.tabanlar.get(id) ?? null
  const hafta = new Set(g.haftalar)
  const satirlar = g.satirlar.filter((s) => hafta.has(s.hafta) && g.doktorlar.has(s.doctor_id))
  const seri = (liste: KaliteSatiri[]) => g.haftalar.map((h) => metrikHesapla(h, liste.filter((s) => s.hafta === h), taban))
  const doktorIdleri = [...new Set(satirlar.map((s) => s.doctor_id))]
  const doktorlar: KaliteDoktoru[] = doktorIdleri.map((id, i) => {
    const d = g.doktorlar.get(id)!
    return { anahtar: `d${i + 1}`, ad: d.ad, brans: d.brans, bransEtiketi: g.bransEtiketi(d.brans), metrikler: seri(satirlar.filter((s) => s.doctor_id === id)) }
  }).sort((a, b) => a.bransEtiketi.localeCompare(b.bransEtiketi, 'tr') || a.ad.localeCompare(b.ad, 'tr'))
  const bransa = new Map<string, string[]>()
  for (const id of doktorIdleri) { const b = g.doktorlar.get(id)!.brans || '—'; bransa.set(b, [...(bransa.get(b) || []), id]) }
  const branslar: KaliteBransi[] = [...bransa.entries()].map(([brans, ids]) => ({
    brans, bransEtiketi: g.bransEtiketi(brans === '—' ? null : brans), doktorSayisi: ids.length, metrikler: seri(satirlar.filter((s) => ids.includes(s.doctor_id))),
  })).sort((a, b) => a.bransEtiketi.localeCompare(b.bransEtiketi, 'tr'))
  return { haftalar: g.haftalar, toplam: seri(satirlar), branslar, doktorlar }
}
