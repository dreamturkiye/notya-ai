/**
 * ESNEK-MUAYENE-B2 — learning candidates (pure). The day's corrections become CANDIDATES first; the overnight loop tests each
 * one against the doctor's own past approved notes and activates only what breaks nothing (regresyon.ts).
 *
 * Kinds (each a deterministic transformation, never free text from one patient's note):
 *   sozluk — the doctor's abbreviation → its meaning ("KZ" = "kulak zarı"): from the secretary's note in shadow mode, or a
 *            Doğrula answer that expanded a short form;
 *   bicim  — note format: the order of section labels, the plan list style (numbered / dash);
 *   kural  — a phrasing rule the existing correction learning (lib/doktor/ogrenme) promoted from the doctor's edits; the
 *            overnight loop re-tests it and sends it back to "aday" if it breaks a past approved note.
 * Every candidate is refused at creation when it touches a never-learned class (koruma.ts).
 */
import { ogrenilemezMi } from './koruma'
import { cumleler, etiketAyir, katla, kelimeler, kok } from './metinAraclari'
import type { Karsilastirma } from './olgu'

export type AdayTuru = 'sozluk' | 'bicim' | 'kural'
export type AdayKaynagi = 'golge' | 'dogrula' | 'duzeltme'

export type SozlukOnerisi = { tur: 'sozluk'; kisaltma: string; anlam: string }
export type BicimOnerisi =
  | { tur: 'bicim'; alt: 'bolum_sirasi'; etiketler: string[] }
  | { tur: 'bicim'; alt: 'plan_liste'; stil: 'numarali' | 'tire' }
export type KuralOnerisi = { tur: 'kural'; anahtar: string; deger: string }
export type Oneri = SozlukOnerisi | BicimOnerisi | KuralOnerisi

export type Aday = { tur: AdayTuru; anahtar: string; oneri: Oneri; kaynak: AdayKaynagi; kanit: string }

/** Stable key of a candidate (dedupe across days). */
export function adayAnahtari(o: Oneri): string {
  if (o.tur === 'sozluk') return `sozluk:${katla(o.kisaltma).trim()}`.slice(0, 120)
  if (o.tur === 'kural') return `kural:${o.anahtar}`.slice(0, 120)
  return o.alt === 'bolum_sirasi' ? `bicim:bolum_sirasi:${o.etiketler.map(katla).join('>')}`.slice(0, 120) : `bicim:plan_liste:${o.stil}`
}

/** The texts of a candidate that the never-learned guard checks. */
export function adayMetinleri(o: Oneri): string[] {
  if (o.tur === 'sozluk') return [o.kisaltma, o.anlam]
  if (o.tur === 'kural') return [o.deger]
  return o.alt === 'bolum_sirasi' ? o.etiketler : []
}

/** Refused at creation: any never-learned class / identity in any of its texts. */
export const korumaliAdayMi = (o: Oneri, adlar: string[] = []) => adayMetinleri(o).some((m) => ogrenilemezMi(m, adlar))

const adayKur = (o: Oneri, kaynak: AdayKaynagi, kanit: string, adlar: string[] = []): Aday | null =>
  korumaliAdayMi(o, adlar) ? null : { tur: o.tur, anahtar: adayAnahtari(o), oneri: o, kaynak, kanit }

/** Abbreviation-shaped token: 2–6 characters, ≥ 2 capitals or a trailing dot, not a plain number. */
export function kisaltmaBicimli(t: string): boolean {
  const x = t.trim().replace(/[,;:]+$/, '')
  if (x.length < 2 || x.length > 6 || /^\d/.test(x)) return false
  const buyuk = (x.match(/[A-ZÇĞİÖŞÜ]/g) || []).length
  return buyuk >= 2 || /^[A-Za-zÇĞİÖŞÜçğıöşü]{1,4}\.$/.test(x)
}

/**
 * Shadow mode → abbreviation candidates. For a matched fact pair whose Notya side still carries ONE abbreviation-shaped token
 * the lexicon did not expand, and whose secretary side has 1–4 consecutive words Notya's side does not: token = those words.
 */
export function golgedenSozlukAdaylari(k: Karsilastirma, bilinen: (t: string) => boolean, kanit: string, adlar: string[] = []): Aday[] {
  const out: Aday[] = []
  for (const o of k.ogeler) {
    if (o.durum !== 'ayni' && o.durum !== 'farkli') continue
    const nTok = kelimeler(o.notya.metin)
    const kis = nTok.filter((t) => kisaltmaBicimli(t) && !bilinen(t))
    if (kis.length !== 1) continue
    const nKok = new Set(nTok.map(kok))
    const sTok = kelimeler(o.sekreter.metin)
    // the longest run of secretary words whose stems Notya's clause does not have
    let en: string[] = [], cur: string[] = []
    for (const w of sTok) {
      if (!nKok.has(kok(w)) && /\p{L}/u.test(w)) { cur.push(w); if (cur.length > en.length) en = [...cur] } else cur = []
    }
    if (en.length < 1 || en.length > 4) continue
    const anlam = en.join(' ')
    if (katla(anlam).replace(/[^\p{L}]/gu, '').length < 3) continue
    const a = adayKur({ tur: 'sozluk', kisaltma: kis[0].replace(/[,;:]+$/, ''), anlam }, 'golge', kanit, adlar)
    if (a) out.push(a)
  }
  return out
}

/** Section labels of a note, in order (deduplicated). */
export function bolumEtiketleri(metin: string): string[] {
  const out: string[] = []
  for (const c of cumleler(metin)) {
    const { etiket } = etiketAyir(c)
    if (etiket && !out.some((x) => katla(x) === katla(etiket))) out.push(etiket)
  }
  return out
}

/** Plan list style of a text block: numbered ("1." / "1)"), dash ("-" / "•"), or none. */
export function listeStili(metin: string): 'numarali' | 'tire' | null {
  const satirlar = String(metin || '').split('\n').map((s) => s.trim()).filter(Boolean)
  if (satirlar.length < 2) return null
  const num = satirlar.filter((s) => /^\d{1,2}[.)]\s/.test(s)).length
  const tire = satirlar.filter((s) => /^[-•*]\s/.test(s)).length
  if (num >= 2 && num >= tire) return 'numarali'
  if (tire >= 2) return 'tire'
  return null
}

/** The plan block of a free note: lines after a "Plan / Tedavi / Öneri" label until the next label. */
export function planBlogu(metin: string): string {
  const satirlar = String(metin || '').split('\n')
  const out: string[] = []
  let icinde = false
  for (const s of satirlar) {
    const { etiket, govde } = etiketAyir(s)
    if (etiket) { icinde = /^(plan|tedavi|öneri|oneri|öneriler|treatment|management|reja|план)/i.test(etiket); if (icinde && govde) out.push(govde); continue }
    if (icinde) out.push(s)
  }
  return out.join('\n')
}

/** Shadow mode → format candidates from the secretary's note (her format IS the doctor's note format today). */
export function golgedenBicimAdaylari(sekreterMetni: string, kanit: string, adlar: string[] = []): Aday[] {
  const out: Aday[] = []
  const etiketler = bolumEtiketleri(sekreterMetni).slice(0, 8)
  if (etiketler.length >= 3) { const a = adayKur({ tur: 'bicim', alt: 'bolum_sirasi', etiketler }, 'golge', kanit, adlar); if (a) out.push(a) }
  const stil = listeStili(planBlogu(sekreterMetni))
  if (stil) { const a = adayKur({ tur: 'bicim', alt: 'plan_liste', stil }, 'golge', kanit); if (a) out.push(a) }
  return out
}

/**
 * Doğrula answers → abbreviation candidates: a short abbreviation-shaped reading the doctor / secretary answered with a longer
 * expansion ("KZ" → "kulak zarı"). Protected questions (side, negation, numbers, doses, drugs, allergies) never teach.
 */
export function dogrulamadanAdaylar(cevaplar: { okunan: string | null; cevap: string | null; sinif: string; id: string }[]): Aday[] {
  const out: Aday[] = []
  for (const c of cevaplar) {
    if (c.sinif !== 'kelime' || !c.okunan || !c.cevap) continue
    const ok = c.okunan.trim(), cv = c.cevap.trim()
    if (!kisaltmaBicimli(ok) || cv.length < ok.length + 2 || katla(cv).startsWith(katla(ok).replace(/\.$/, '') + ' ')) continue
    if (cv.split(/\s+/).length > 4) continue
    const a = adayKur({ tur: 'sozluk', kisaltma: ok, anlam: cv }, 'dogrula', c.id)
    if (a) out.push(a)
  }
  return out
}

/** Human sentence of an activated candidate, in the build's words. */
export function adayCumlesi(o: Oneri, k: { sozluk: (a: string, b: string) => string; bolumSirasi: (e: string) => string; planNumarali: string; planTire: string }): string {
  if (o.tur === 'sozluk') return k.sozluk(o.kisaltma, o.anlam)
  if (o.tur === 'kural') return o.deger
  return o.alt === 'bolum_sirasi' ? k.bolumSirasi(o.etiketler.join(' → ')) : o.stil === 'numarali' ? k.planNumarali : k.planTire
}

/** The doctor-level rule sentence written to doktor_hafiza for an activated format candidate (Türkiye words injected). */
export function bicimKurali(o: BicimOnerisi, k: { bolumSirasi: (e: string) => string; planNumarali: string; planTire: string }): { anahtar: string; deger: string } {
  if (o.alt === 'bolum_sirasi') return { anahtar: `gece-sira-${o.etiketler.map((e) => katla(e).replace(/[^a-z]/g, '')).join('-')}`.slice(0, 60), deger: k.bolumSirasi(o.etiketler.join(' → ')) }
  return { anahtar: `gece-plan-${o.stil}`, deger: o.stil === 'numarali' ? k.planNumarali : k.planTire }
}
