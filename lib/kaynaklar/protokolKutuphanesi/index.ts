/**
 * TR-PROTOKOL-KUTUPHANESI — registry queries: per-branş documents, the citation-lock list (lib/doktor/kaynakKilidi), the
 * edition-aware Turkish source stack, coverage numbers and the monthly check's watch list. Pure, no I/O.
 *
 * ONE SOURCE OF TRUTH: a Turkish guideline year / SB Yayın No survives in a note only when an entry here is 'guncel' with that
 * year / number. The single documented exception is the KD legacy list (specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar.ts,
 * used unchanged by Ayşe's founder-locked answer path) — kept until the KD edition check (docs/OPEN-COMMITMENTS.md, 2026-11-17)
 * closes; the test pins it so it cannot grow.
 */
import type { DogrulanmisKaynak } from '@/lib/doktor/kaynakKilidi'
import { kdDogrulanmisKaynaklar } from '@/specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { PROTOKOL_BELGELERI, TAKIP_LISTELERI } from './belgeler'
import { ifadeGeciyor, kucukHarf } from './cip'
import type { BransKodu, ProtokolBelgesi, YayinciKodu } from './tipler'

export * from './tipler'
export { PROTOKOL_BELGELERI, TAKIP_LISTELERI, ARASTIRMA_TARIHI } from './belgeler'
export { kaynakCipleri, cipOlustur, cipMetni, type KaynakCipi } from './cip'

export const TIP_BRANSLARI = [
  'pediatri', 'kardiyoloji', 'noroloji', 'dahiliye', 'psikiyatri', 'genel-cerrahi', 'ortopedi', 'dermatoloji',
  'kulak-burun-bogaz', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'uroloji', 'radyoloji', 'anestezi', 'acil-tip',
  'fizik-tedavi', 'enfeksiyon-hastaliklari', 'endokrinoloji', 'gastroenteroloji', 'nefroloji', 'romatoloji', 'onkoloji',
  'gogus-hastaliklari', 'gogus-cerrahisi', 'plastik-cerrahi', 'beyin-cerrahisi', 'kalp-damar-cerrahisi', 'cocuk-cerrahisi',
  'aile-hekimligi', 'spor-hekimligi',
] as const satisfies readonly BransKodu[]

/** All 40: 30 medical branşlar + 10 Özel Branşlar. */
export const TUM_BRANSLAR: readonly BransKodu[] = [...TIP_BRANSLARI, ...KLINIK_YENI_SLUGS]

export function belgeBul(id: string): ProtokolBelgesi | undefined {
  return PROTOKOL_BELGELERI.find((b) => b.id === id)
}

const YAYINCI_SIRASI: Record<YayinciKodu, number> = { 'SB-SHGM': 0, 'SB-HSGM': 1, 'SB-KHGM': 2, SB: 3, TİTCK: 4, SGK: 5, TÜSEB: 6, DERNEK: 7, ULUSLARARASI: 8 }
const DURUM_SIRASI: Record<ProtokolBelgesi['durum'], number> = { guncel: 0, dogrulanamadi: 1, 'yerine-yenisi-geldi': 2 }

/** The branş's documents in the library order: confirmed first, SB before societies, superseded last. */
export function bransBelgeleri(brans: BransKodu): ProtokolBelgesi[] {
  return PROTOKOL_BELGELERI.filter((b) => b.branslar.includes(brans)).sort(
    (a, b) => DURUM_SIRASI[a.durum] - DURUM_SIRASI[b.durum] || YAYINCI_SIRASI[a.yayinciKodu] - YAYINCI_SIRASI[b.yayinciKodu] || a.kisaAd.localeCompare(b.kisaAd, 'tr'),
  )
}

/** Topic words of a document for the citation lock (whole-text check): its scope keywords + its citation names. */
function kilitKonusu(b: ProtokolBelgesi): string[] {
  return [...new Set([...b.konu, ...b.atifAdlari].map(kucukHarf))]
}

/**
 * The verified list for lib/doktor/kaynakKilidi built from the registry: every 'guncel' document with a printed year gives
 * one entry per society / SB family code (numara = year), and its SB Yayın No gives an 'SB-YAYIN' entry.
 */
export function kayitKaynakKilidiListesi(belgeler: readonly ProtokolBelgesi[] = PROTOKOL_BELGELERI): DogrulanmisKaynak[] {
  const out: DogrulanmisKaynak[] = []
  for (const b of belgeler) {
    if (b.durum !== 'guncel') continue
    const etiket = `${b.kisaAd}${b.surum ? ` — ${b.surum}` : ''}`
    const konu = kilitKonusu(b)
    // 'SB-BELGE' binds the year to the document NAME (kaynakKilidi checks the cited name contains one of these), so it
    // carries only the citation names — never generic scope words that another document's name could contain.
    // A focused update's year is a confirmed citation year of the same document ("ESC 2025 dislipidemi" → 2019 + 2025 FU).
    const yillar = b.yil ? [b.yil, ...(b.odakGuncellemeleri || []).map((o) => o.yil)] : []
    for (const yil of yillar) for (const aile of b.kurumKodlari || []) out.push({ aile, numara: yil, etiket, konu: aile === 'SB-BELGE' ? b.atifAdlari.map(kucukHarf) : konu })
    if (b.yayinNo) out.push({ aile: 'SB-YAYIN', numara: b.yayinNo, etiket: `${etiket} (SB Yayın No. ${b.yayinNo})`, konu })
  }
  return out
}

/** KD legacy entries (Ayşe's locked path uses the same list) — see the header. */
export function kdEskiListe(): DogrulanmisKaynak[] {
  return kdDogrulanmisKaynaklar()
}

/** The list a note of this branş is locked against: the registry (all branşlar — a correct citation is correct anywhere;
 * the topic check stops misuse) + for kadın doğum the KD list (ACOG / SMFM numbers and the legacy TR entries). */
export function bransDogrulanmisKaynaklar(brans: string | null | undefined): DogrulanmisKaynak[] {
  const kayit = kayitKaynakKilidiListesi()
  return brans === 'kadin-hastaliklari-dogum' ? [...kdEskiListe(), ...kayit] : kayit
}

/** Edition-aware Turkish source stack of a branş (same 5-slot spirit as TURKISH_REFS, read from the registry). */
export function turkKaynakBelgeleri(brans: BransKodu): ProtokolBelgesi[] {
  return bransBelgeleri(brans).filter((b) => b.durum !== 'yerine-yenisi-geldi')
}

export function turkKaynakYigini(brans: BransKodu): string[] {
  return turkKaynakBelgeleri(brans)
    .map((b) => (b.durum === 'guncel' && b.surum ? `${b.kisaAd} — ${b.surum}` : `${b.kisaAd} (baskı doğrulanmadı)`))
}

/** Normalised text for the static-list de-duplication: lower-case TR, "T.C." dropped, punctuation → space. */
export function kaynakNorm(s: string): string {
  return kucukHarf(s).replace(/^t\.c\.\s*/, '').replace(/[—–()/:;,.'"’+]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * KAYNAK-BIRLESTIRME-ESC (2026-11-26): the parts of one static stack item ("ESC 2024 AF; ESC 2026 KY") that no registry
 * document of the branş names. A part is covered only when it contains one of a document's citation names (atifAdlari,
 * ≥ 6 letters) — never by a society-level placeholder (they have no citation names), so a richer static line ("TPK kılavuzları (AGE, ISPA, enürezis)") is
 * kept next to the registry's bare "Türk Pediatri Kurumu" entry.
 */
export function kapsanmayanParcalar(statik: string, belgeler: readonly ProtokolBelgesi[]): string[] {
  const adlar = [...new Set(belgeler.flatMap((b) => b.atifAdlari).map(kaynakNorm).filter((a) => a.replace(/\s/g, '').length >= 6))]
  return statik
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      const n = kaynakNorm(p)
      return !adlar.some((a) => ifadeGeciyor(n, a))
    })
}

export type BirlesikKaynakYigini = {
  /** Registry lines first (numbered, edition-aware), then the static extras (unnumbered). */
  satirlar: string[]
  /** Registry ids, aligned with satirlar[0 … belgeIdleri.length - 1]: Ayşe's hidden "k" numbers map here only. */
  belgeIdleri: string[]
  /** Static items (or the uncovered parts of one) that no registry document names. */
  ekler: string[]
}

/**
 * Merge, never replace (fix for the 2026-11-24 regression where any registry entry dropped the whole static stack): the
 * registry stack of the branş + every static item / part the registry does not cover.
 */
export function birlesikKaynakYigini(brans: BransKodu, statik: readonly string[]): BirlesikKaynakYigini {
  const belgeler = turkKaynakBelgeleri(brans)
  // Only a document with a confirmed edition covers a static line (current, or a superseded edition the line names): an
  // unconfirmed registry entry is a bare name, while the static line often carries the scope rule ("tanı/reçete yok").
  const kapsam = bransBelgeleri(brans).filter((b) => b.durum !== 'dogrulanamadi')
  const ekler = statik.flatMap((s) => {
    const kalan = kapsanmayanParcalar(s, kapsam)
    return kalan.length ? [kalan.join('; ')] : []
  })
  return { satirlar: [...turkKaynakYigini(brans), ...ekler], belgeIdleri: belgeler.map((b) => b.id), ekler }
}

/** Ayşe's hidden "k" field: 1-based numbers into her numbered TR source list → registry ids (max 2, invalid ones dropped). */
export function kaynakNumaralariniCoz(belgeIdleri: readonly string[] | undefined, k: unknown): string[] {
  if (!belgeIdleri?.length || !Array.isArray(k)) return []
  const ids = k.map((n) => (typeof n === 'number' ? n : Number(n))).filter((n) => Number.isInteger(n) && n >= 1 && n <= belgeIdleri.length).map((n) => belgeIdleri[n - 1])
  return [...new Set(ids)].slice(0, 2)
}

export type BransKapsami = { brans: BransKodu; toplam: number; surumDogrulanmis: number; dogrulanamadi: number; yerineYenisiGeldi: number }

export function bransKapsami(brans: BransKodu): BransKapsami {
  const l = PROTOKOL_BELGELERI.filter((b) => b.branslar.includes(brans))
  return {
    brans,
    toplam: l.length,
    surumDogrulanmis: l.filter((b) => b.durum === 'guncel' && Boolean(b.surum)).length,
    dogrulanamadi: l.filter((b) => b.durum === 'dogrulanamadi').length,
    yerineYenisiGeldi: l.filter((b) => b.durum === 'yerine-yenisi-geldi').length,
  }
}

export type TakipHedefi = { url: string; belgeIdleri: string[]; listeId: string | null; belgeIsaretleri: string[] }

/** Every official URL the monthly check reads, de-duplicated: document links, extra watch pages, listing pages. */
export function takipHedefleri(): TakipHedefi[] {
  const harita = new Map<string, TakipHedefi>()
  const ekle = (url: string, belgeId: string | null, listeId: string | null, isaretler: string[] = []) => {
    const h = harita.get(url) || { url, belgeIdleri: [], listeId: null, belgeIsaretleri: [] }
    if (belgeId && !h.belgeIdleri.includes(belgeId)) h.belgeIdleri.push(belgeId)
    if (listeId) { h.listeId = listeId; h.belgeIsaretleri = isaretler }
    harita.set(url, h)
  }
  for (const b of PROTOKOL_BELGELERI) {
    if (b.durum === 'yerine-yenisi-geldi') continue
    if (b.url && b.url !== 'https://www.sgk.gov.tr' && !b.yalnizTakipUrl) ekle(b.url, b.id, null)
    for (const u of b.takipUrl || []) ekle(u, b.id, null)
  }
  for (const l of TAKIP_LISTELERI) ekle(l.url, null, l.id, l.belgeIsaretleri)
  return [...harita.values()]
}
