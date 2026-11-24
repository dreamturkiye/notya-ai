/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the El Notu regression guard (pure). "Any reader change must not lower it before
 * shipping." The weekly production run (lib/elNotu/regresyon.ts) re-reads the consented set through the production model
 * path and RECORDS every model answer with the same replay key as the evaluation harness (scripts/el-notu-degerlendir.mts
 * `--model kayit`). The guard (scripts/el-notu-regresyon-bekcisi.mts) replays those answers through the CURRENT reader code
 * and compares the score with the recorded week's: a change in orchestration, consensus, normalisation guard, Doğrula
 * budget or scoring that lowers the score fails. A prompt change asks questions no recording answers — the guard then
 * fails as STALE (never a silent pass) until the set is re-recorded on the production model.
 *
 * Shared by the weekly run, the guard script and the harness, so all three measure with exactly the same rules.
 */
import crypto from 'node:crypto'
import { sayfayiOku, kaynakMetni, type GorselBlok, type ModelKapisi, type OkuyucuDili, type SayfaPaketi, type SayfaSonucu } from './okuyucu'
import { sayfaPuanla, toplamPuan, type DegerlendirmeGercegi, type SayfaPuani, type ToplamPuan } from './degerlendirme'
import { sozlukKur } from './sozluk'
import { anahatOgren } from './anahat'
import { kelimeAnahtari } from './uzlastir'
import type { AnahatAlani } from './anahat'
import type { SozlukGirdisi } from './tipler'
import type { IlacEslesmesi } from './korumali'

type Tohum = { brans: SozlukGirdisi[]; genel: SozlukGirdisi[] }
type GorselCagri = Parameters<ModelKapisi['gorselJson']>[0]
type MetinCagri = Parameters<ModelKapisi['metinJson']>[0]

/** The harness' replay key: page, call label and a hash of the system prompt + every input (pictures by their first bytes). */
export function kayitAnahtari(sayfaAdi: string, etiket: string, sistem: string, girdi: unknown): string {
  return `${sayfaAdi}-${etiket}-${crypto.createHash('sha256').update(JSON.stringify([sistem, girdi])).digest('hex').slice(0, 16)}.json`
}
export const gorselGirdi = (o: GorselCagri) => o.parcalar.map((p) => (p.tur === 'metin' ? p.metin : p.gorsel.base64.slice(0, 64) + p.gorsel.base64.length))

/** Wraps a live model: every answer is also written into `kayit` under its replay key. */
export function kaydedenModel(ic: ModelKapisi, sayfaAdi: string, kayit: Record<string, unknown>): ModelKapisi {
  return {
    async gorselJson(o) { const y = await ic.gorselJson(o); kayit[kayitAnahtari(sayfaAdi, o.etiket, o.sistem, gorselGirdi(o))] = y; return y },
    async metinJson(o: MetinCagri) { const y = await ic.metinJson(o); kayit[kayitAnahtari(sayfaAdi, o.etiket, o.sistem, o.mesaj)] = y; return y },
  }
}

export class KayitYok extends Error { constructor(public anahtar: string) { super('kayit yok'); this.name = 'KayitYok' } }

/** Replays recorded answers; a question with no recording is noted in `eksik` and throws (the reader then cannot vote). */
export function oynatanModel(kayit: Record<string, unknown>, sayfaAdi: string, eksik: string[]): ModelKapisi {
  const al = (a: string) => { if (!(a in kayit)) { eksik.push(a); throw new KayitYok(a) } return kayit[a] }
  return {
    async gorselJson(o) { return al(kayitAnahtari(sayfaAdi, o.etiket, o.sistem, gorselGirdi(o))) },
    async metinJson(o: MetinCagri) { return al(kayitAnahtari(sayfaAdi, o.etiket, o.sistem, o.mesaj)) },
  }
}

/** One page of the set as the weekly run and the guard read it (masked package + clinical-only ground truth). */
export type SetSayfasi = { ad: string; brans: string | null; paket: SayfaPaketi; maskeliSayfa: GorselBlok; gercekler: DegerlendirmeGercegi[] }

export type OlcumOrtami = {
  dil: OkuyucuDili
  /** The branş seed the production reader uses (curated + founder-approved) and the general seed. */
  tohum: (brans: string | null) => Tohum | Promise<Tohum>
  /** The build's default outline for the branş (a new doctor has no learned outline). */
  anahat: (brans: string | null) => AnahatAlani[]
  bransAdi: (brans: string | null) => string
  ilac?: IlacEslesmesi
  /** Injected reader (tests replace it to prove a worse reader fails the guard). */
  oku?: typeof sayfayiOku
}

/**
 * Read one set page as a NEW doctor of its branş would be read (branş seed, no personal memory, no vocabulary) — the
 * shared reader is what a reader change touches — and score it exactly like the founder evaluation route.
 */
export async function sayfaOlc(s: SetSayfasi, model: ModelKapisi, o: OlcumOrtami): Promise<{ puan: SayfaPuani; sonuc: SayfaSonucu }> {
  const t = await o.tohum(s.brans)
  const sozluk = sozlukKur([], t.brans, t.genel)
  const anlam = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
  const oku = o.oku || sayfayiOku
  const sonuc = await oku(s.paket, {
    bransAdi: o.bransAdi(s.brans), dil: o.dil, sozluk, hafiza: [], dagarcik: new Map(), sorulmusKisaltmalar: new Set(), ilac: o.ilac,
    sozcukMu: (w) => anlam.has(kelimeAnahtari(w)), sayfaGorseli: s.maskeliSayfa, anahat: anahatOgren([], o.anahat(s.brans)),
  }, model)
  const metin = kaynakMetni([sonuc], o.dil, (id) => s.paket.bolgeler.find((x) => x.id === id)?.etiket || id)
  const puan = sayfaPuanla({
    metin, dogrula: sonuc.dogrula, gercekler: s.gercekler,
    hamKelimeler: sonuc.satirlar.flatMap((l) => l.kelimeler.flatMap((k) => [k.metin, ...k.adaylar])),
    izinli: [...sozluk.girdiler.flatMap((x) => [x.kisaltma, x.anlam]), ...o.dil.bagSozcukleri, o.dil.cizimBasligi, ...Object.values(o.dil.taraf), ...s.paket.bolgeler.map((x) => x.etiket)],
    okunamadi: o.dil.okunamadi,
  })
  return { puan, sonuc }
}

/** Replay the whole set through the current reader. */
export async function setiOynat(sayfalar: SetSayfasi[], kayitlar: Record<string, Record<string, unknown>>, o: OlcumOrtami): Promise<{ toplam: ToplamPuan; puanlar: SayfaPuani[]; eksik: { sayfa: string; anahtar: string }[] }> {
  const puanlar: SayfaPuani[] = []
  const eksik: { sayfa: string; anahtar: string }[] = []
  for (const s of sayfalar) {
    const e: string[] = []
    const { puan } = await sayfaOlc(s, oynatanModel(kayitlar[s.ad] || {}, s.ad, e), o)
    puanlar.push(puan)
    for (const a of e) eksik.push({ sayfa: s.ad, anahtar: a })
  }
  return { toplam: toplamPuan(puanlar), puanlar, eksik }
}

/** Stored per-page numbers (el_notu_regresyon_olcumleri) → the scoring core's page shape, for toplamPuan. */
export type OlcumSatiri = { gercek: number; kesin: number; dogrulamada: number; adayda: number; isaretli: number; kacan: number; dogrula: number; korumali_soru: number; korumali_gercek: number; korumali_dogrula_ile: number; uydurma: number }
export function olcumdenPuan(r: OlcumSatiri): SayfaPuani {
  const n = (x: unknown) => Math.max(0, Number(x) || 0)
  return {
    gercek: n(r.gercek), kesin: n(r.kesin), dogrulamada: n(r.dogrulamada), adayda: n(r.adayda), isaretli: n(r.isaretli), kacan: n(r.kacan),
    korumali: { gercek: n(r.korumali_gercek), kesin: 0, dogrulaIle: n(r.korumali_dogrula_ile) }, dogrula: n(r.dogrula), korumaliSoru: n(r.korumali_soru),
    uydurma: Array.from({ length: n(r.uydurma) }, () => ''), gercekler: [],
  }
}
export function puandanOlcum(p: SayfaPuani): OlcumSatiri {
  return { gercek: p.gercek, kesin: p.kesin, dogrulamada: p.dogrulamada, adayda: p.adayda, isaretli: p.isaretli, kacan: p.kacan, dogrula: p.dogrula, korumali_soru: p.korumaliSoru, korumali_gercek: p.korumali.gercek, korumali_dogrula_ile: p.korumali.dogrulaIle, uydurma: p.uydurma.length }
}

/** Questions per page may rise by at most this much (replay is deterministic; the slack only absorbs rounding). */
export const SORU_TOLERANSI = 0.05

/**
 * The verdict. Fails when the set changed under the baseline (refresh it), when facts found after Doğrula, facts accepted
 * without a question or protected facts found drop, when invented words rise, or when questions per page rise.
 */
export function bekciKarari(taban: ToplamPuan, simdi: ToplamPuan): { gecti: boolean; nedenler: string[] } {
  const nedenler: string[] = []
  if (taban.sayfa !== simdi.sayfa || taban.gercek !== simdi.gercek) nedenler.push(`set changed (pages ${taban.sayfa}→${simdi.sayfa}, facts ${taban.gercek}→${simdi.gercek}): refresh the baseline`)
  else {
    if (simdi.dogrulaIleYuzde < taban.dogrulaIleYuzde) nedenler.push(`facts after Doğrula fell ${taban.dogrulaIleYuzde}% → ${simdi.dogrulaIleYuzde}%`)
    if (simdi.kesinYuzde < taban.kesinYuzde) nedenler.push(`facts accepted without a question fell ${taban.kesinYuzde}% → ${simdi.kesinYuzde}%`)
    if (simdi.korumali.dogrulaIle < taban.korumali.dogrulaIle) nedenler.push(`protected facts found fell ${taban.korumali.dogrulaIle} → ${simdi.korumali.dogrulaIle}`)
    if (simdi.uydurma > taban.uydurma) nedenler.push(`invented words rose ${taban.uydurma} → ${simdi.uydurma}`)
    if (simdi.dogrulaSayfaBasina > taban.dogrulaSayfaBasina + SORU_TOLERANSI) nedenler.push(`Doğrula questions per page rose ${taban.dogrulaSayfaBasina} → ${simdi.dogrulaSayfaBasina}`)
  }
  return { gecti: nedenler.length === 0, nedenler }
}
