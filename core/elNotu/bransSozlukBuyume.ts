/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — branş lexicon growth (pure). When the same abbreviation -> meaning pair is confirmed
 * independently by at least ESIK_DOKTOR different doctors of the same branş (each in his OWN lexicon: Doğrula answer, his
 * own entry, or an overnight-learned entry), it becomes a PROPOSED entry for that branş' seed lexicon. Only the
 * abbreviation and its meaning travel — never a doctor, a patient or any text around it. The founder approves / rejects;
 * an approved pair joins that branş' seed for every doctor of the branş, below the doctor's own lexicon (his entry always
 * wins: core/elNotu/sozluk.ts `coz`).
 *
 * Never proposed (core/esnek/koruma.ts, the never-learned classes): right/left, doses, numbers, allergies, negation and
 * identity-shaped text. A key the branş' curated seed already knows (with any meaning) is not proposed — the curated seed
 * stays authoritative; a pair the general seed already resolves the same way adds nothing and is not proposed either.
 */
import { anahtar } from './sozluk'
import type { SozlukGirdisi } from './tipler'
import { ogrenilemezMi } from '@/core/esnek/koruma'
import { katla } from '@/core/esnek/metinAraclari'

/** Independent doctors needed before a pair is proposed for the branş (Kaan, 2026-11-24). */
export const ESIK_DOKTOR = 3

/** One confirmed entry of one doctor's own lexicon (server reads hekim_el_sozlugu; the doctor id never leaves the server). */
export type HekimGirdisi = { doktorId: string; brans: string | null; kisaltma: string; anlam: string }

export type BransOnerisi = { brans: string; kisaltma: string; kisaltmaAnahtar: string; anlam: string; anlamAnahtar: string; doktorSayisi: number }

/** Meaning key: case / diacritic folded, single spaces, no trailing punctuation. */
export const anlamAnahtari = (s: string) => katla(String(s || '')).replace(/[.:,;]+$/g, '').replace(/\s+/g, ' ').trim()

/** Identity-shaped or never-learned text (koruma.ts) — refused as a proposal, and re-checked when the founder approves. */
export function oneriKorumaliMi(kisaltma: string, anlam: string): boolean {
  const k = String(kisaltma || '').trim(), a = String(anlam || '').trim()
  if (!k || !a || k.length > 24 || a.length > 80) return true
  return ogrenilemezMi(k) || ogrenilemezMi(a)
}

/** The most frequent spelling (ties → alphabetical, so the result is deterministic). */
function enSik(xs: string[]): string {
  const say = new Map<string, number>()
  for (const x of xs) say.set(x, (say.get(x) || 0) + 1)
  return [...say.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))[0][0]
}

export function bransOnerileri(
  girdiler: HekimGirdisi[],
  tohum: (brans: string) => { brans: SozlukGirdisi[]; genel: SozlukGirdisi[] },
  esik = ESIK_DOKTOR,
): BransOnerisi[] {
  const gruplar = new Map<string, { brans: string; kAnah: string; aAnah: string; doktorlar: Set<string>; kisaltmalar: string[]; anlamlar: string[] }>()
  for (const g of girdiler) {
    const brans = String(g.brans || '').trim()
    if (!brans || !g.doktorId) continue
    const kisaltma = String(g.kisaltma || '').trim(), anlam = String(g.anlam || '').trim().replace(/\s+/g, ' ')
    if (oneriKorumaliMi(kisaltma, anlam)) continue
    const kAnah = anahtar(kisaltma).slice(0, 24), aAnah = anlamAnahtari(anlam).slice(0, 80)
    if (!kAnah || !aAnah || kAnah === anlamAnahtari(aAnah)) continue
    const id = `${brans}\u0000${kAnah}\u0000${aAnah}`
    const v = gruplar.get(id) || { brans, kAnah, aAnah, doktorlar: new Set<string>(), kisaltmalar: [], anlamlar: [] }
    v.doktorlar.add(g.doktorId); v.kisaltmalar.push(kisaltma); v.anlamlar.push(anlam)
    gruplar.set(id, v)
  }
  const out: BransOnerisi[] = []
  const tohumOnbellek = new Map<string, { brans: Set<string>; genel: Map<string, Set<string>> }>()
  for (const v of gruplar.values()) {
    if (v.doktorlar.size < esik) continue
    let t = tohumOnbellek.get(v.brans)
    if (!t) {
      const s = tohum(v.brans)
      const genel = new Map<string, Set<string>>()
      for (const x of s.genel) { const k = anahtar(x.kisaltma); genel.set(k, (genel.get(k) || new Set()).add(anlamAnahtari(x.anlam))) }
      t = { brans: new Set(s.brans.map((x) => anahtar(x.kisaltma))), genel }
      tohumOnbellek.set(v.brans, t)
    }
    if (t.brans.has(v.kAnah)) continue
    if (t.genel.get(v.kAnah)?.has(v.aAnah)) continue
    out.push({ brans: v.brans, kisaltma: enSik(v.kisaltmalar).slice(0, 24), kisaltmaAnahtar: v.kAnah, anlam: enSik(v.anlamlar).slice(0, 80), anlamAnahtar: v.aAnah, doktorSayisi: v.doktorlar.size })
  }
  return out.sort((a, b) => a.brans.localeCompare(b.brans) || b.doktorSayisi - a.doktorSayisi || a.kisaltmaAnahtar.localeCompare(b.kisaltmaAnahtar))
}

/**
 * The branş seed a reader uses: the curated seed first, then the founder-approved pairs. An approved pair whose key the
 * curated seed already carries is ignored (curated wins), so approving can never make a curated key ambiguous.
 */
export function bransTohumuBirlestir(statik: SozlukGirdisi[], onayli: { kisaltma: string; anlam: string }[]): SozlukGirdisi[] {
  const bilinen = new Set(statik.map((x) => anahtar(x.kisaltma)))
  const ek: SozlukGirdisi[] = []
  for (const o of onayli) {
    const k = anahtar(o.kisaltma)
    if (!k || bilinen.has(k) || oneriKorumaliMi(o.kisaltma, o.anlam)) continue
    bilinen.add(k)
    ek.push({ kisaltma: o.kisaltma, anlam: o.anlam, kaynak: 'brans', baglam: 'kelime' })
  }
  return ek.length ? [...statik, ...ek] : statik
}
