/**
 * ESNEK-MUAYENE-B2 — the regression guard of the overnight learning loop (pure). A candidate becomes active only when, tested
 * against THIS doctor's own past approved notes, it breaks nothing:
 *   - it never changes a never-learned token (side, negation, number, dose, allergy) anywhere — korumaliDegisen = 0;
 *   - no past approved note contradicts it (the doctor approved the other wording / meaning / order) — kirilan = 0.
 * The notes that taught the candidate are excluded from the test (they agree by construction).
 * Never another doctor's notes: the server loads only doctor_id = this doctor (hasta-izolasyon).
 */
import { genislet, sozlukKur, coz, anahtar as sozlukAnahtari } from '@/core/elNotu/sozluk'
import type { SozlukGirdisi } from '@/core/elNotu/tipler'
import { korumaliImza } from './koruma'
import { bolumEtiketleri, listeStili, type Oneri } from './aday'
import { katla } from './metinAraclari'

export type GecmisNot = {
  id: string
  /** Approved note fields (subjektif, objektif, degerlendirme, plan, …). */
  alanlar: Record<string, string | null | undefined>
  /** The hand-note / typed-note source text(s) the note was built from, when it had any. */
  kaynakMetni?: string | null
}

export type RegresyonSonucu = { sinanan: number; destek: number; kirilan: number; korumaliDegisen: number; kirilanNotlar: string[]; gecti: boolean; neden?: 'celiski' | 'korumali' | 'kirdi' }

const notMetni = (n: GecmisNot) => Object.values(n.alanlar).filter((x): x is string => typeof x === 'string' && !!x.trim()).join('\n')
const kac = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Whole-phrase presence, folded (Turkish suffixes allowed after the phrase: "taşı", "taşlar"). */
export function ifadeVarMi(metin: string, ifade: string): boolean {
  const i = katla(ifade).trim()
  if (!i) return false
  return new RegExp(`(^|[^\\p{L}\\p{N}])${kac(i)}`, 'u').test(katla(metin))
}

function sonuc(r: Omit<RegresyonSonucu, 'gecti'>): RegresyonSonucu {
  return { ...r, kirilanNotlar: r.kirilanNotlar.slice(0, 3), gecti: r.kirilan === 0 && r.korumaliDegisen === 0 && !r.neden }
}

/** "a → b → c" order check of labels inside one text: true / false / null (fewer than two of them present). */
function siraUyar(metin: string, etiketler: string[]): boolean | null {
  const hedef = etiketler.map(katla)
  const gorulen = bolumEtiketleri(metin).map(katla).filter((e) => hedef.includes(e))
  if (gorulen.length < 2) return null
  const konum = gorulen.map((e) => hedef.indexOf(e))
  return konum.every((p, i) => i === 0 || p > konum[i - 1])
}

/** Parse the deterministic sentences the existing correction learning writes (lib/doktor/ogrenme/kuralTuret.ts). */
export function kuralCoz(deger: string): { tur: 'terim'; once: string; sonra: string } | { tur: 'silme'; kalip: string } | { tur: 'ilac'; once: string; sonra: string } | { tur: 'sira'; etiketler: string[] } | { tur: 'diger' } {
  let m = /^"([^"]+)"\s+yerine\s+"([^"]+)"\s+yaz$/.exec(deger)
  if (m) return { tur: 'terim', once: m[1], sonra: m[2] }
  m = /^Şu kalıbı nottan çıkar:\s*(.+)$/i.exec(deger)
  if (m) return { tur: 'silme', kalip: m[1].trim() }
  m = /^(.+?)\s+yerine\s+(.+?)\s+yaz\s+\(aynı endikasyon\)$/.exec(deger)
  if (m) return { tur: 'ilac', once: m[1].trim(), sonra: m[2].trim() }
  m = /^Bölüm sırası:\s*(.+)$/i.exec(deger)
  if (m) return { tur: 'sira', etiketler: m[1].split(/\s*→\s*/).map((x) => x.trim()).filter(Boolean) }
  return { tur: 'diger' }
}

export type RegresyonBaglami = {
  /** The doctor's own lexicon + branş seed + general seed (sozluk candidates). */
  hekimSozlugu: SozlukGirdisi[]
  bransTohum: SozlukGirdisi[]
  genelTohum: SozlukGirdisi[]
}

/** Test one candidate against the doctor's past approved notes (evidence notes excluded). */
export function adayiSina(o: Oneri, notlar: GecmisNot[], kanitNotlari: string[] = [], b: RegresyonBaglami = { hekimSozlugu: [], bransTohum: [], genelTohum: [] }): RegresyonSonucu {
  const disla = new Set(kanitNotlari)
  const test = notlar.filter((n) => !disla.has(n.id))
  let destek = 0, kirilan = 0, korumaliDegisen = 0, sinanan = 0
  const kirilanNotlar: string[] = []
  const kir = (id: string) => { kirilan++; kirilanNotlar.push(id) }

  if (o.tur === 'sozluk') {
    const anah = sozlukAnahtari(o.kisaltma)
    const kendi = b.hekimSozlugu.find((g) => sozlukAnahtari(g.kisaltma) === anah)
    if (kendi && katla(kendi.anlam) !== katla(o.anlam)) return sonuc({ sinanan: 0, destek: 0, kirilan: 0, korumaliDegisen: 0, kirilanNotlar: [], neden: 'celiski' })
    const once = sozlukKur(b.hekimSozlugu, b.bransTohum, b.genelTohum)
    const sonra = sozlukKur([{ kisaltma: o.kisaltma, anlam: o.anlam, kaynak: 'hekim', baglam: 'kelime' }, ...b.hekimSozlugu], b.bransTohum, b.genelTohum)
    const baskaAnlamlar = (() => { const c = coz(once, o.kisaltma); return c && 'belirsiz' in c ? c.belirsiz : c && 'anlam' in c ? [c.anlam] : [] })().filter((a) => katla(a) !== katla(o.anlam))
    for (const n of test) {
      const kaynak = String(n.kaynakMetni || '')
      const satirlar = kaynak.split('\n').filter((s) => s.split(/\s+/).some((w) => sozlukAnahtari(w) === anah))
      if (!satirlar.length) continue
      sinanan++
      for (const s of satirlar) {
        const a = genislet(once, s).metin, c = genislet(sonra, s).metin
        if (korumaliImza(a).join('|') !== korumaliImza(c).join('|')) { korumaliDegisen++; kirilanNotlar.push(n.id) }
      }
      const metin = notMetni(n)
      if (ifadeVarMi(metin, o.anlam)) destek++
      else if (baskaAnlamlar.some((x) => ifadeVarMi(metin, x))) kir(n.id)
    }
    return sonuc({ sinanan, destek, kirilan, korumaliDegisen, kirilanNotlar })
  }

  if (o.tur === 'bicim') {
    for (const n of test) {
      if (o.alt === 'bolum_sirasi') {
        const u = siraUyar(notMetni(n), o.etiketler)
        if (u === null) continue
        sinanan++
        if (u) destek++; else kir(n.id)
      } else {
        const st = listeStili(String(n.alanlar.plan || ''))
        if (!st) continue
        sinanan++
        if (st === o.stil) destek++; else kir(n.id)
      }
    }
    return sonuc({ sinanan, destek, kirilan, korumaliDegisen, kirilanNotlar })
  }

  // kural — phrasing rules promoted by the existing correction learning
  const k = kuralCoz(o.deger)
  if (k.tur === 'terim' || k.tur === 'ilac') {
    if (korumaliImza(k.once).join('|') !== korumaliImza(k.sonra).join('|')) return sonuc({ sinanan: 0, destek: 0, kirilan: 0, korumaliDegisen: 1, kirilanNotlar: [], neden: 'korumali' })
    for (const n of test) {
      const m = notMetni(n)
      const varOnce = ifadeVarMi(m, k.once), varSonra = ifadeVarMi(m, k.sonra)
      if (!varOnce && !varSonra) continue
      sinanan++
      if (varOnce) kir(n.id); else destek++
    }
  } else if (k.tur === 'silme') {
    if (k.kalip.length >= 6) for (const n of test) { sinanan++; if (ifadeVarMi(notMetni(n), k.kalip)) kir(n.id); else destek++ }
  } else if (k.tur === 'sira') {
    for (const n of test) { const u = siraUyar(notMetni(n), k.etiketler); if (u === null) continue; sinanan++; if (u) destek++; else kir(n.id) }
  }
  return sonuc({ sinanan, destek, kirilan, korumaliDegisen, kirilanNotlar })
}

/** Two independent pieces of evidence (two notes / two answers) AND a clean regression → activate. */
export const AKTIF_ASGARI_KANIT = 2
export function aktiflesirMi(kanitSayisi: number, r: RegresyonSonucu): boolean {
  return kanitSayisi >= AKTIF_ASGARI_KANIT && r.gecti
}
