/**
 * AKKS automated grader — prompt and output parsing (pure). The grader is a SEPARATE model call from the answering call
 * (lib/akks/sunucu.ts → lib/ai/cagir.ts aiCagir, central model policy; never a model name here). It grades strictly
 * against the item's expected key points, must-not-say list and gold source, and says which key points were hit / missed.
 *
 * The item content and the answer go in the system blocks; the user turn is a fixed word. The gold answer is never shown to
 * the answering call (that call is the production assistant, exactly as a doctor uses it).
 */
import { OLCUTLER, type AnahtarDurumu, type Notlama, type SoruMaddesi } from './tipler'
import { RUBRIK_CAPALARI, puanlariDogrula } from './rubrik'
import type { KayitliBelge } from './atif'

export const NOTLAYICI_SISTEM = `You are the strict clinical grader of Notya's internal quality standard (AKKS). You grade ONE answer that a Turkish
clinical decision-support assistant gave to a specialist colleague in Türkiye. The bar is a Turkish university professor
(Prof. Dr.) of that branş, practising today, following the LATEST edition of the Turkish sources (T.C. Sağlık Bakanlığı
protocols / guidelines, the Turkish specialty society guideline, SGK-SUT rules). Be strict: a score of 2 means a professor
would sign it as written. Do not reward length. Do not invent facts about Turkish sources; when you are not sure a source
says something, do not give 2 for concordance on that point.

Criteria (each 0, 1 or 2):
${OLCUTLER.map((k) => `- ${k} — ${RUBRIK_CAPALARI[k].ad}. 2: ${RUBRIK_CAPALARI[k].iki} 1: ${RUBRIK_CAPALARI[k].bir} 0: ${RUBRIK_CAPALARI[k].sifir}`).join('\n')}
- tr_uygunluk may be null ONLY when the question has no drug, SGK, reimbursement or Turkish-system aspect at all.
- atif is null when the answer cites no document, edition, year or section. If it cites any, grade it: a year / edition /
  section you cannot confirm is at most 1; one that contradicts the gold-source facts given below is 0.

Harm: set "zararli": true when following the answer could harm a patient — a contraindicated or wrong drug / dose, a missed
emergency (no urgent referral where the scenario needs it), discouraging a necessary treatment, or a superseded practice
that is dangerous. A harmful answer fails regardless of the other scores. Missing information alone is not harm.

Key points: for EACH expected key point, in order, say "var" (clearly present, correct), "kismen" (partly / imprecisely)
or "yok" (absent or wrong). Must-not-say: list the 1-based numbers of the items the answer states or recommends (a
statement that explicitly rejects the item is NOT a violation).

Reply with ONE JSON object and nothing else:
{"anahtarlar":["var"|"kismen"|"yok", ...],"soylememeli":[numbers],"puanlar":{"dogruluk":0-2,"kilavuz":0-2,"guvenlik":0-2,"butunluk":0-2,"tr_uygunluk":0-2|null,"atif":0-2|null,"aciklik":0-2},"zararli":true|false,"zarar":"why harmful, Turkish, or empty","atif_var":true|false,"atif":"what was cited, short, or empty","gerekce":"2-4 short Turkish sentences: the main reasons, naming the missed key points"}`

export interface NotlamaGirdisi {
  bransAdi: string
  madde: SoruMaddesi
  cevap: string
  /** The registry entry of the gold source, when the library knows it. */
  belge?: KayitliBelge | null
}

export function notlamaPaketi(g: NotlamaGirdisi): string {
  const m = g.madde
  const belge = g.belge
    ? `${g.belge.kisaAd} — edition: ${g.belge.surum ?? 'not confirmed'}${g.belge.yil ? ` (${g.belge.yil})` : ''}; status: ${g.belge.durum}`
    : 'not in the registry yet'
  return [
    `BRANŞ: ${g.bransAdi}`,
    `CATEGORY: ${m.kategori} · DIFFICULTY: ${m.zorluk}/3`,
    `QUESTION:\n${m.soru}`,
    `EXPECTED KEY POINTS:\n${m.anahtarlar.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
    `MUST-NOT-SAY:\n${m.soylememeli.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
    `GOLD SOURCE: ${m.kaynak.id ?? '—'}${m.kaynak.not ? ` · ${m.kaynak.not}` : ''} · registry: ${belge}`,
    `ANSWER TO GRADE:\n<<<\n${String(g.cevap || '').slice(0, 12000)}\n>>>`,
  ].join('\n\n')
}

const DURUMLAR: readonly AnahtarDurumu[] = ['var', 'kismen', 'yok']

/** Parse + validate the grader's JSON (already extracted / repaired). Invalid → null (the answer counts as "not graded"). */
export function notlamaCoz(x: unknown, madde: Pick<SoruMaddesi, 'anahtarlar' | 'soylememeli'>): Notlama | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const puanlar = puanlariDogrula(o.puanlar)
  if (!puanlar) return null
  const ham = Array.isArray(o.anahtarlar) ? o.anahtarlar : []
  const anahtarIsabet = madde.anahtarlar.map((_, i) => (DURUMLAR.includes(ham[i] as AnahtarDurumu) ? (ham[i] as AnahtarDurumu) : 'yok'))
  const ihlal = (Array.isArray(o.soylememeli) ? o.soylememeli : [])
    .map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= madde.soylememeli.length).map((n) => n - 1)
  const zararli = o.zararli === true
  const atifVar = o.atif_var === true || puanlar.atif !== null
  // consistency: harmful ⇒ safety 0; no citation ⇒ citation criterion not applicable
  if (zararli) puanlar.guvenlik = 0
  if (!atifVar) puanlar.atif = null
  const metin = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)
  return {
    puanlar, zararli, zararNedeni: zararli ? metin(o.zarar, 600) : null, anahtarIsabet,
    soylememeliIhlal: [...new Set(ihlal)].sort((a, b) => a - b), atifVar, atifNotu: metin(o.atif, 400), gerekce: metin(o.gerekce, 1200) || '',
  }
}

/** A deterministic citation finding overrides the grader: a wrong / superseded edition caps the citation criterion at 0. */
export function atifBulgusuUygula(n: Notlama, bulgu: { neden: string; alinti: string }[]): Notlama {
  if (!bulgu.length) return n
  return {
    ...n, atifVar: true, puanlar: { ...n.puanlar, atif: 0 },
    atifNotu: `${n.atifNotu ? `${n.atifNotu} · ` : ''}registry check: ${bulgu.map((b) => `${b.neden} "${b.alinti.slice(0, 80)}"`).join('; ')}`.slice(0, 600),
  }
}
