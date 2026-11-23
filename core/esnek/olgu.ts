/**
 * ESNEK-MUAYENE-B1 — clinical-content comparison (pure, deterministic, no model): Notya's own draft from the pages vs the
 * note the secretary typed. Compared at FACT level, never wording:
 *   ayni    — the same finding / statement in both, with the same side, presence (var/yok) and numbers;
 *   farkli  — the same finding in both, but side, presence or a number differs (or Notya's reading is still unconfirmed);
 *   eksik   — in the secretary's note, not in Notya's;
 *   fazla   — in Notya's note, not in the secretary's.
 * A note is "aynı içerikte" only when every fact is `ayni` (honest: one missing fact = not the same content).
 *
 * Abbreviations are expanded with the build's lexicon (the doctor's own entries first) before comparing, so "KZ doğal" and
 * "kulak zarı intakt" are the same fact. Country-neutral: the lexicon and words are injected.
 */
import { ayniKume, cumleler, dolguMu, etiketAyir, katla, kelimeler, kok, sayilar } from './metinAraclari'

export type Olgu = {
  /** The clause as written (for the doctor's view and the learning step). */
  metin: string
  /** Section label the clause stood under, if any ("Muayene", "Plan"). */
  bolum: string | null
  /** Content keys (stems) — what the fact is about. */
  kavram: string[]
  olumsuz: boolean
  taraf: 'sag' | 'sol' | 'bilateral' | null
  sayilar: string[]
  /** Notya's reading still carries an unconfirmed ⟦…⟧ word. */
  belirsiz: boolean
}

export type Genisletici = (metin: string) => string

const TARAF_SAG = new Set(['sag', 'sagda', 'sagdan', 'sagi', 'sg', 'r', 'rt', 'right', "o'ng", 'ong', 'справа', 'правый', 'правая'])
const TARAF_SOL = new Set(['sol', 'solda', 'soldan', 'solu', 'sl', 'l', 'lt', 'left', 'chap', 'слева', 'левый', 'левая'])
const TARAF_IKI = new Set(['bilateral', 'bilat', 'bil', 'b/l', 'iki', 'ikitarafli', 'ikki', 'двусторонний'])
const OLUMSUZ = new Set(['yok', 'yoktur', 'olmayan', 'negatif', 'neg', 'saptanmadi', 'izlenmedi', 'degil', 'hayir', 'ø', '∅', 'no', 'none', 'nil', 'absent', 'negative', 'denies', 'without', "yo'q", 'yoq', 'нет', 'без'])
const DEGISIM = new Set(['↑', '↓', '→', '=', '+'])

/** Facts of a text. `genislet` expands abbreviations (lexicon); placeholders ⟦key|word?⟧ mark an unconfirmed reading. */
export function olgulariCikar(metin: string, genislet: Genisletici = (s) => s): Olgu[] {
  const out: Olgu[] = []
  let bolum: string | null = null
  for (const ham of cumleler(String(metin || ''))) {
    const belirsiz = /⟦[^⟧]*⟧/.test(ham)
    const temiz = ham.replace(/⟦[a-z0-9-]+\|([^⟧]*?)\??⟧/g, '$1').replace(/⟦[^⟧]*⟧/g, ' ')
    const { etiket, govde } = etiketAyir(temiz)
    if (etiket) bolum = etiket
    if (!govde) continue
    // a comma list after a label is a list of findings ("KBB: KZ doğal, septum orta hat, tonsil hipertrofik")
    const parcalar = etiket && govde.includes(',') ? govde.split(/,\s*/) : [govde]
    for (const p of parcalar) {
      const g = genislet(p)
      const ws = kelimeler(g)
      const katlanmis = ws.map(katla)
      let taraf: Olgu['taraf'] = null
      for (const k of katlanmis) {
        if (TARAF_IKI.has(k)) taraf = 'bilateral'
        else if (TARAF_SAG.has(k)) taraf = taraf && taraf !== 'sag' ? 'bilateral' : 'sag'
        else if (TARAF_SOL.has(k)) taraf = taraf && taraf !== 'sol' ? 'bilateral' : 'sol'
      }
      const olumsuz = katlanmis.some((k) => OLUMSUZ.has(k) || /^[øØ∅]/.test(k)) || /\(-\)/.test(g)
      const kavram = [...new Set(ws.filter((w, i) => {
        const k = katlanmis[i]
        if (!k || dolguMu(k) || OLUMSUZ.has(k) || TARAF_SAG.has(k) || TARAF_SOL.has(k) || TARAF_IKI.has(k) || DEGISIM.has(k)) return false
        if (/^\d/.test(k)) return false
        return k.length >= 2
      }).map(kok).filter(Boolean))]
      if (!kavram.length) continue
      out.push({ metin: p.trim(), bolum, kavram, olumsuz, taraf, sayilar: sayilar(g), belirsiz })
    }
  }
  return out
}

/** Overlap of two facts' content keys: shared / smaller set (a short statement fully inside a longer one matches). */
export function kavramBenzerligi(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const sb = new Set(b)
  const ortak = a.filter((x) => sb.has(x)).length
  return ortak / Math.min(a.length, b.length)
}

export const ESLESME_ESIGI = 0.5

export type FarkTuru = 'taraf' | 'olumsuzluk' | 'sayi' | 'okunamadi'
export type KarsilastirmaOgesi =
  | { durum: 'ayni'; notya: Olgu; sekreter: Olgu }
  | { durum: 'farkli'; notya: Olgu; sekreter: Olgu; neden: FarkTuru[] }
  | { durum: 'eksik'; sekreter: Olgu }
  | { durum: 'fazla'; notya: Olgu }

export type Karsilastirma = {
  ogeler: KarsilastirmaOgesi[]
  sayim: { ayni: number; farkli: number; eksik: number; fazla: number }
  /** ayni / all facts (0..1). */
  skor: number
  /** Every fact is the same (no difference, nothing missing, nothing extra). */
  ayniIcerik: boolean
}

function farklar(a: Olgu, b: Olgu): FarkTuru[] {
  const f: FarkTuru[] = []
  if (a.belirsiz) f.push('okunamadi')
  if (a.olumsuz !== b.olumsuz) f.push('olumsuzluk')
  if ((a.taraf || b.taraf) && a.taraf !== b.taraf) f.push('taraf')
  if ((a.sayilar.length || b.sayilar.length) && !ayniKume(a.sayilar, b.sayilar)) f.push('sayi')
  return f
}

/** Facts paired greedily, best overlap first; each fact pairs at most once. */
export function olgulariKarsilastir(notya: Olgu[], sekreter: Olgu[]): Karsilastirma {
  const adaylar: { i: number; j: number; s: number }[] = []
  notya.forEach((a, i) => sekreter.forEach((b, j) => { const s = kavramBenzerligi(a.kavram, b.kavram); if (s >= ESLESME_ESIGI) adaylar.push({ i, j, s }) }))
  adaylar.sort((x, y) => y.s - x.s || x.i - y.i || x.j - y.j)
  const ni = new Set<number>(), sj = new Set<number>()
  const ogeler: KarsilastirmaOgesi[] = []
  for (const c of adaylar) {
    if (ni.has(c.i) || sj.has(c.j)) continue
    ni.add(c.i); sj.add(c.j)
    const f = farklar(notya[c.i], sekreter[c.j])
    ogeler.push(f.length ? { durum: 'farkli', notya: notya[c.i], sekreter: sekreter[c.j], neden: f } : { durum: 'ayni', notya: notya[c.i], sekreter: sekreter[c.j] })
  }
  sekreter.forEach((b, j) => { if (!sj.has(j)) ogeler.push({ durum: 'eksik', sekreter: b }) })
  notya.forEach((a, i) => { if (!ni.has(i)) ogeler.push({ durum: 'fazla', notya: a }) })
  const sayim = { ayni: 0, farkli: 0, eksik: 0, fazla: 0 }
  for (const o of ogeler) sayim[o.durum]++
  const toplam = ogeler.length
  const skor = toplam ? sayim.ayni / toplam : 0
  return { ogeler, sayim, skor: Math.round(skor * 1000) / 1000, ayniIcerik: toplam > 0 && sayim.ayni === toplam }
}

/** Both notes as text → comparison. */
export function notlariKarsilastir(notyaMetni: string, sekreterMetni: string, genislet?: Genisletici): Karsilastirma {
  return olgulariKarsilastir(olgulariCikar(notyaMetni, genislet), olgulariCikar(sekreterMetni, genislet))
}

// ── rolling match and the offer ────────────────────────────────────────────────────────────────────────────────────

export const GOLGE_HEDEF = 0.9
/** The offer needs enough evidence: at least this many compared notes in the window. */
export const GOLGE_ASGARI_NOT = 15
export const GOLGE_PENCERE = 30

export type GolgeKaydi = { ayniIcerik: boolean; skor: number; gun: string }

/** Share of "aynı içerikte" notes among the last GOLGE_PENCERE comparisons. */
export function kayanEslesme(kayitlar: GolgeKaydi[]): { oran: number | null; not: number; ayni: number } {
  const son = [...kayitlar].sort((a, b) => (a.gun < b.gun ? 1 : a.gun > b.gun ? -1 : 0)).slice(0, GOLGE_PENCERE)
  const ayni = son.filter((k) => k.ayniIcerik).length
  return { oran: son.length ? ayni / son.length : null, not: son.length, ayni }
}

/** Offer "yarın sekreteriniz yazmasın" only with enough notes AND the rolling match at or above the target. */
export function teklifUygunMu(kayitlar: GolgeKaydi[], hedef = GOLGE_HEDEF): boolean {
  const k = kayanEslesme(kayitlar)
  return k.not >= GOLGE_ASGARI_NOT && k.oran !== null && k.oran >= hedef
}

/** Today's numbers for the one daily line ("Bugünkü 18 notun 15'ini … aynı içerikte yazdım"). */
export function gunlukGolge(kayitlar: GolgeKaydi[], gun: string): { toplam: number; ayni: number } {
  const bugun = kayitlar.filter((k) => k.gun === gun)
  return { toplam: bugun.length, ayni: bugun.filter((k) => k.ayniIcerik).length }
}
