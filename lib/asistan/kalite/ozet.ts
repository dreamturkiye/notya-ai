/**
 * NOTYA-KALITE-STANDART-01 — score, baseline and gate (Q-40, Q-41). PURE: numbers in, numbers out.
 *
 *   kaliteOzetle        the verdicts of a run → pass counts per rule, per check, per category, per surface, and the score
 *   tabanKesitiKur      a run → the slice that is stored in docs/denetim/kalite-taban.json
 *   tabanlaKarsilastir  a run against the stored slice → the list of what got worse (empty = the gate is open)
 *
 * The baseline keeps the stand-in run (`kuru`) and the live run (`canli`) apart. In a stand-in run an answer the
 * stand-in wrote has no verdicts, so only the model-free handlers are measured there; the two modes are never
 * compared with each other.
 */
import { GECIKME_BUTCESI } from './kurallar'
import type { KaliteKarari } from './denetimler'

export interface KaliteSayimi { gecen: number; toplam: number }

/** What the summary needs of one graded turn. `kalite` null = not judged (a stand-in wrote the words). */
export interface KaliteSatiri {
  id: string
  yuzey: string
  kat: string
  karar: string
  acikKusur?: string | null
  modeleGitti?: boolean
  ms?: number
  kalite: KaliteKarari[] | null
}

export interface KaliteOzeti {
  /** Passed verdicts ÷ all verdicts × 100, one decimal. */
  puan: number
  toplam: KaliteSayimi
  kural: Record<string, KaliteSayimi>
  denetim: Record<string, KaliteSayimi>
  kategori: Record<string, KaliteSayimi>
  yuzey: Record<string, KaliteSayimi>
  /** Turns with verdicts / turns without (not judged). */
  yargilanan: number
  yargilanmayan: number
}

export const oran = (s: KaliteSayimi): number => (s.toplam ? s.gecen / s.toplam : 1)
const yuzde = (s: KaliteSayimi): number => Math.round(oran(s) * 1000) / 10
const ekle = (h: Record<string, KaliteSayimi>, k: string, gecti: boolean) => { const s = (h[k] ??= { gecen: 0, toplam: 0 }); s.toplam++; if (gecti) s.gecen++ }
const sirali = <T,>(h: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(h).sort((a, b) => a[0].localeCompare(b[0])))

export function kaliteOzetle(satirlar: KaliteSatiri[]): KaliteOzeti {
  const toplam: KaliteSayimi = { gecen: 0, toplam: 0 }
  const kural: Record<string, KaliteSayimi> = {}, denetim: Record<string, KaliteSayimi> = {}, kategori: Record<string, KaliteSayimi> = {}, yuzey: Record<string, KaliteSayimi> = {}
  let yargilanan = 0, yargilanmayan = 0
  for (const s of satirlar) {
    if (!s.kalite) { yargilanmayan++; continue }
    yargilanan++
    for (const k of s.kalite) {
      toplam.toplam++; if (k.gecti) toplam.gecen++
      ekle(kural, k.kural, k.gecti); ekle(denetim, k.denetim, k.gecti); ekle(kategori, s.kat, k.gecti); ekle(yuzey, s.yuzey, k.gecti)
    }
  }
  return { puan: yuzde(toplam), toplam, kural: sirali(kural), denetim: sirali(denetim), kategori: sirali(kategori), yuzey: sirali(yuzey), yargilanan, yargilanmayan }
}

/** Every failed verdict of a run, for the report. */
export function kaliteIhlalleri(satirlar: KaliteSatiri[]): { id: string; yuzey: string; kat: string; kural: string; denetim: string; hedef: string; neden: string }[] {
  return satirlar.flatMap((s) => (s.kalite || []).filter((k) => !k.gecti).map((k) => ({ id: s.id, yuzey: s.yuzey, kat: s.kat, kural: k.kural, denetim: k.denetim, hedef: k.hedef, neden: k.neden })))
}

/* ───────────────────────────── latency (Q-33, indication only) ───────────────────────────── */

export function yuzdelik(degerler: number[], p: number): number | null {
  if (!degerler.length) return null
  const s = [...degerler].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]
}

export interface GecikmeOzeti { yol: 'hizli' | 'model'; adet: number; p50: number | null; p95: number | null; butceIcinde: boolean | null }

/**
 * Harness turn time of the voice turns per path, against the budgets of Q-33. It is the time until the whole text
 * answer exists, with no audio in it: an indication, not time to first sound — the live spot check measures that.
 */
export function gecikmeOzeti(satirlar: KaliteSatiri[]): GecikmeOzeti[] {
  const ses = satirlar.filter((s) => s.yuzey === 'ses' && typeof s.ms === 'number')
  const hizli = ses.filter((s) => !s.modeleGitti).map((s) => s.ms!)
  const model = ses.filter((s) => s.modeleGitti).map((s) => s.ms!)
  const h50 = yuzdelik(hizli, 50), m50 = yuzdelik(model, 50), m95 = yuzdelik(model, 95)
  return [
    { yol: 'hizli', adet: hizli.length, p50: h50, p95: yuzdelik(hizli, 95), butceIcinde: h50 === null ? null : h50 <= GECIKME_BUTCESI.hizliP50 },
    { yol: 'model', adet: model.length, p50: m50, p95: m95, butceIcinde: m50 === null || m95 === null ? null : m50 <= GECIKME_BUTCESI.modelP50 && m95 <= GECIKME_BUTCESI.modelP95 },
  ]
}

/* ───────────────────────────── baseline ───────────────────────────── */

export type TabanModu = 'kuru' | 'canli'

export interface TabanKesiti {
  tarih: string
  /** Commit the run was made on. */
  sha: string
  model: string
  /** Graded turns (an entry is graded once per surface). */
  tur: number
  yargilanan: number
  /** Corpus FAIL count, and the turns that failed ("id/surface"). */
  fail: number
  failIdler: string[]
  /** Every graded turn ("id/surface") — tells a new entry from a known one. */
  idler: string[]
  puan: number
  toplam: KaliteSayimi
  kural: Record<string, KaliteSayimi>
  denetim: Record<string, KaliteSayimi>
  kategori: Record<string, KaliteSayimi>
  /** Failed verdicts per turn: "id/surface" → ["check@target", …]. Turns with none are left out. */
  ihlal: Record<string, string[]>
}

export interface KaliteTabani {
  surum: 1
  aciklama: string
  kuru: TabanKesiti | null
  canli: TabanKesiti | null
}

export const TABAN_ACIKLAMASI = 'Baseline of the Ayşe quality gate (docs/AYSE-KALITE-STANDARDI.md, Q-41). Generated by npm run denetim:kalite-taban[:kuru] from a corpus run; do not edit by hand. "kuru" = stand-in run: only answers of model-free handlers are judged, model-written answers are NOT measured. "canli" = live run on the primary model.'

const anahtar = (s: KaliteSatiri) => `${s.id}/${s.yuzey}`
const ihlalAdi = (k: KaliteKarari) => `${k.denetim}@${k.hedef}`

export function tabanKesitiKur(satirlar: KaliteSatiri[], g: { tarih: string; sha: string; model: string }): TabanKesiti {
  const o = kaliteOzetle(satirlar)
  const fail = satirlar.filter((s) => s.karar === 'FAIL').map(anahtar).sort()
  const ihlal: Record<string, string[]> = {}
  for (const s of satirlar) {
    const k = (s.kalite || []).filter((x) => !x.gecti).map(ihlalAdi).sort()
    if (k.length) ihlal[anahtar(s)] = k
  }
  return {
    tarih: g.tarih, sha: g.sha, model: g.model, tur: satirlar.length, yargilanan: o.yargilanan,
    fail: fail.length, failIdler: fail, idler: satirlar.map(anahtar).sort(),
    puan: o.puan, toplam: o.toplam, kural: o.kural, denetim: o.denetim, kategori: o.kategori, ihlal: sirali(ihlal),
  }
}

export interface Karsilastirma {
  gecti: boolean
  /** What got worse: each line fails the gate. */
  sorunlar: string[]
  /** What changed without failing the gate. */
  notlar: string[]
}

const pct = (s: KaliteSayimi) => `${(oran(s) * 100).toFixed(1)}% (${s.gecen}/${s.toplam})`
const liste = (a: string[], n = 12) => (a.length > n ? `${a.slice(0, n).join(', ')} … (+${a.length - n})` : a.join(', '))

/**
 * The gate. Everything is compared on the turns the baseline KNOWS: a new entry that documents an existing defect
 * (Q-40: the entry comes before the fix) lowers no rate — it is reported apart and enters the rates when the
 * baseline is regenerated. Fails when, against the baseline of the same mode:
 *   • the run has fewer graded turns (Q-40: the corpus only grows) — unless `kismi` (a filtered run);
 *   • the corpus FAIL count of the known turns is above the baseline's;
 *   • a new turn fails without naming the open defect it documents (`acikKusur`);
 *   • the pass rate of a rule or of a check is below the baseline's by more than `tolerans` percentage points;
 *   • the quality score is below the baseline's by more than `tolerans`;
 *   • a rule or check the baseline measured is no longer measured at all;
 *   • stand-in mode only (it is deterministic): a known turn fails that passed, or gets a failed verdict it did not have.
 * In live mode a single newly failing turn or verdict is a note — the model's wording moves from run to run; the
 * counts and rates above are what gate. A partial run (`kismi`) is compared turn by turn only.
 */
export function tabanlaKarsilastir(
  taban: TabanKesiti, satirlar: KaliteSatiri[], o: { mod: TabanModu; tolerans?: number; kismi?: boolean } = { mod: 'kuru' },
): Karsilastirma {
  const tolerans = (o.tolerans ?? 0) / 100
  const bilinen = new Set(taban.idler)
  const bilinenTurlar = satirlar.filter((s) => bilinen.has(anahtar(s)))
  const yeniTurlar = satirlar.filter((s) => !bilinen.has(anahtar(s)))
  const simdi = kaliteOzetle(bilinenTurlar)
  const sorunlar: string[] = [], notlar: string[] = []
  const kesin = o.mod === 'kuru'

  // ── Q-40 ──
  if (bilinenTurlar.length < taban.tur) {
    const m = `${taban.tur - bilinenTurlar.length} graded turn(s) of the baseline are missing from this run`
    if (o.kismi) notlar.push(`${m} (partial run: counts and rates not compared)`); else sorunlar.push(`Q-40 ${m} — the corpus only grows (a filtered run needs --kismi)`)
  }
  if (yeniTurlar.length) {
    const y = kaliteOzetle(yeniTurlar)
    notlar.push(`${yeniTurlar.length} turn(s) not in the baseline (score ${y.puan}, ${y.toplam.gecen}/${y.toplam.toplam} verdicts) — regenerate the baseline after the live pass`)
  }

  // ── Q-41: corpus FAIL ──
  const eskiFail = new Set(taban.failIdler)
  const bilinenFail = bilinenTurlar.filter((s) => s.karar === 'FAIL')
  const yeniBozulan = bilinenFail.filter((s) => !eskiFail.has(anahtar(s))).map(anahtar)
  const duzelen = bilinenTurlar.filter((s) => s.karar !== 'FAIL' && eskiFail.has(anahtar(s))).map(anahtar)
  if (!o.kismi && bilinenFail.length > taban.fail) sorunlar.push(`Q-41 corpus FAIL ${bilinenFail.length} > baseline ${taban.fail}`)
  if (yeniBozulan.length) (kesin ? sorunlar : notlar).push(`${kesin ? 'Q-41 ' : ''}newly failing turns: ${liste(yeniBozulan)}`)
  if (duzelen.length) notlar.push(`no longer failing: ${liste(duzelen)}`)
  const yeniFail = yeniTurlar.filter((s) => s.karar === 'FAIL')
  const kusursuz = yeniFail.filter((s) => !s.acikKusur).map(anahtar)
  if (kusursuz.length) sorunlar.push(`Q-41 new entries fail without naming an open defect (acikKusur): ${liste(kusursuz)}`)
  const kusurlu = yeniFail.filter((s) => s.acikKusur).map((s) => `${anahtar(s)} [${s.acikKusur}]`)
  if (kusurlu.length) notlar.push(`new entries failing on a listed open defect (allowed, Q-40): ${liste(kusurlu)}`)

  // ── Q-41: verdict by verdict ──
  const yeniIhlal: string[] = []
  for (const s of bilinenTurlar) {
    const eski = new Set(taban.ihlal[anahtar(s)] || [])
    for (const k of s.kalite || []) if (!k.gecti && !eski.has(ihlalAdi(k))) yeniIhlal.push(`${anahtar(s)} ${k.kural} ${k.denetim}`)
  }
  if (yeniIhlal.length) (kesin ? sorunlar : notlar).push(`${kesin ? 'Q-41 ' : ''}new failed verdicts: ${liste(yeniIhlal)}`)

  // ── Q-41: pass rates and score ──
  if (!o.kismi) {
    const dustu = (ad: string, once: Record<string, KaliteSayimi>, sonra: Record<string, KaliteSayimi>) => {
      for (const [k, e] of Object.entries(once)) {
        const s = sonra[k]
        if (!s) { sorunlar.push(`Q-41 ${ad} ${k}: measured in the baseline (${pct(e)}), not measured now`); continue }
        if (oran(s) < oran(e) - tolerans - 1e-9) sorunlar.push(`Q-41 ${ad} ${k}: pass rate ${pct(e)} → ${pct(s)}`)
        else if (Math.abs(oran(s) - oran(e)) > 1e-9) notlar.push(`${ad} ${k}: ${pct(e)} → ${pct(s)}`)
      }
      for (const k of Object.keys(sonra)) if (!once[k]) notlar.push(`${ad} ${k}: new, ${pct(sonra[k])}`)
    }
    dustu('rule', taban.kural, simdi.kural)
    dustu('check', taban.denetim, simdi.denetim)
    if (oran(simdi.toplam) < oran(taban.toplam) - tolerans - 1e-9) sorunlar.push(`Q-41 quality score ${pct(taban.toplam)} → ${pct(simdi.toplam)}`)
    else if (Math.abs(oran(simdi.toplam) - oran(taban.toplam)) > 1e-9) notlar.push(`quality score ${pct(taban.toplam)} → ${pct(simdi.toplam)}`)
  }

  return { gecti: sorunlar.length === 0, sorunlar, notlar }
}
