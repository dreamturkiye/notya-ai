/**
 * NOTYA-ASI-NOT-01 (Kaan + Dr. Gökhan, 2026-09-23) — "Bu muayenede uygulanan aşılar": the structured list on the note
 * (notes.content_asilar) that reaches the aşı kartı (table asilar) when the note is approved (lib/doktor/notAsiAktarim).
 *
 * Pure — the note form (client), SOAP generation, the approve route and the backfill preview share it.
 *
 *  • ONLY vaccines stated as given IN THIS VISIT ("yapıldı", "uygulandı", "vuruldu", "verildi", "bugün yapıldı").
 *    Planned / recommended / next-visit / given-before vaccines stay in the plan text, never in the list.
 *    The model is told so (soapUret); `uygulananAsilariSuz` is the deterministic backstop against the transcript —
 *    a vaccine the doctor did not say was given this visit never ships (same spirit as soapDozUydurmaKilidi).
 *  • Name: the karne / voice Ayşe normalizer (asiAdiNormalize). Date: the visit date, never the model's.
 *  • Dose not spoken → next dose in the patient's series from the card, flagged `doz_hesaplandi` (form shows it yellow).
 *  • Card match (`notAsisiKartDurumu`) — against rows NOT written by this note:
 *      same series + same date (dose equal or unknown on either side) → `kartta_var`: no second row
 *      same series + same dose, other date                            → `catisma`: warning, not written
 *      same series + same date, different dose                         → `catisma`: warning, not written
 *      otherwise                                                        → `yeni`
 */
import { asiAdiNormalize } from '@/lib/asi/karneOkuma'
import { kayitSerisi, SERI_AD, type OzelKod, type SeriKod } from '@/specialties/pediatri/engines/asiPlan'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export interface NotAsisi {
  asi_adi: string
  doz_no: number | null
  /** YYYY-MM-DD — the visit date. */
  uygulama_tarihi: string | null
  lot_no?: string | null
  uygulama_yeri?: string | null
  notlar?: string | null
  /** Dose was not spoken — computed from the card (next in series). The form shows "Ayşe hesapladı — kontrol edin". */
  doz_hesaplandi?: boolean
}

/** An `asilar` row as far as matching needs it. */
export interface KartAsisi {
  id?: string
  asi_adi: string | null
  doz_no: number | null
  uygulama_tarihi: string | null
  kaynak?: string | null
  kaynak_note_id?: string | null
}

export type AsiKartDurumu =
  | { tur: 'yeni' }
  | { tur: 'kartta_var'; satir: KartAsisi }
  | { tur: 'catisma'; satir: KartAsisi; mesaj: string }

export const NOT_ASI_AZAMI = 20
export const DOZ_HESAPLANDI_ETIKETI = 'Ayşe hesapladı — kontrol edin'

const ISO = /^\d{4}-\d{2}-\d{2}$/

const OZEL_AD: Record<OzelKod, string> = {
  rota: 'Rotavirüs', menacwy: 'Meningokok ACWY', menb: 'Meningokok B', grip: 'Grip (influenza)', hpv: 'HPV',
}

/** Series key for matching: the vaccine engine's series (hepb, karma, grip…) or, off-schedule, the folded name. */
export function asiSeriAnahtari(ad: string | null | undefined): string {
  const t = String(ad || '').trim()
  if (!t) return ''
  return kayitSerisi(t) || `ad:${trAramaNormalize(t).replace(/\basisi\b|\basi\b/g, '').replace(/\s+/g, ' ').trim()}`
}

const metin = (v: unknown, azami = 120): string | null => {
  const t = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : ''
  return t ? t.slice(0, azami) : null
}

function dozCoz(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.trim().replace(/\.$/, '')) : NaN
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null
}

/**
 * Model output / client body / DB value → clean list. Names normalized, dose 1–12 or null, date ISO or null,
 * free text trimmed; duplicates (same series + dose) collapsed; at most NOT_ASI_AZAMI rows. Never invents a value.
 */
export function notAsilariniTemizle(ham: unknown): NotAsisi[] {
  if (!Array.isArray(ham)) return []
  const out: NotAsisi[] = []
  const gorulen = new Set<string>()
  for (const x of ham) {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
    const ad = asiAdiNormalize(String(o.asi_adi ?? o.ad ?? o.asiAdi ?? '').trim()).slice(0, 120)
    if (!ad) continue
    const doz = dozCoz(o.doz_no ?? o.dozNo ?? o.doz)
    const tarihHam = String(o.uygulama_tarihi ?? o.tarih ?? '').slice(0, 10)
    const anahtar = `${asiSeriAnahtari(ad)}#${doz ?? '-'}`
    if (gorulen.has(anahtar)) continue
    gorulen.add(anahtar)
    const a: NotAsisi = { asi_adi: ad, doz_no: doz, uygulama_tarihi: ISO.test(tarihHam) ? tarihHam : null }
    const lot = metin(o.lot_no ?? o.lot, 60)
    const yer = metin(o.uygulama_yeri ?? o.yer, 80)
    const not = metin(o.notlar ?? o.not, 300)
    if (lot) a.lot_no = lot
    if (yer) a.uygulama_yeri = yer
    if (not) a.notlar = not
    if (o.doz_hesaplandi === true && doz != null) a.doz_hesaplandi = true
    out.push(a)
    if (out.length >= NOT_ASI_AZAMI) break
  }
  return out
}

// ─── "Given in this visit" — clause reading ─────────────────────────────────────────────────────────
// Folded text (trAramaNormalize: ı/İ → i, no diacritics).
const VERILDI = /(yapild|uyguland|vuruld|verild|yaptik|uyguladik|vurduk|yapilmistir|uygulanmistir|verilmistir)/
const PLAN = /(planlan|planli|yapilacak|uygulanacak|verilecek|vurulacak|yapilmali|uygulanmali|oneril|sonraki|gelecek|randevu|yapilmasi|uygulanmasi|hatirlat|ertelen|yapilmadi|uygulanmadi|verilmedi|vurulmadi|reddet|istemedi)/
// "Grip", "kızamık", "suçiçeği", "hepatit" are also diseases — a fragment counts only with a vaccine word or abbreviation.
const ASI_SOZU = /\basi(si|lari|lar|yi|sini|larini|nin|sinin)?\b|\bdoz|\brapel|\b(dabt|kpa|opa|kkk|bcg|td|hpv|mmr|dtap|ipa|hib|hexa|heksa|penta|prevenar|synflorix|priorix|varilrix|varivax|gardasil|rotarix|rotateq|bexsero|nimenrix|menactra|vaxigrip|influvac)\b/
const ONCEKI = /(daha once|onceden|gecen (ay|yil|hafta|sefer|vizit|kontrol)|yapilmis(?!tir)|uygulanmis(?!tir)|olmus|karnesinde|karneye gore|aile hekimi|\basm\b|baska (yerde|kurumda|merkezde))/
const SIRA_KELIME: Record<string, number> = { birinci: 1, ilk: 1, ikinci: 2, ucuncu: 3, dorduncu: 4, besinci: 5, altinci: 6 }

export interface UygulananAsiParcasi {
  seri: string
  /** Dose number stated in the fragment, if any. */
  doz: number | null
  /** The clause it was read from (for the backfill table). */
  cumle: string
}

function parcaDozu(parca: string): number | null {
  const m = parca.match(/(?:^|\D)(\d{1,2})\s*\.?\s*(?:doz|dozu|dozunu)\b/) || parca.match(/\bdoz\s*(\d{1,2})\b/)
  if (m) return dozCoz(m[1])
  const s = parca.match(/\b(birinci|ilk|ikinci|ucuncu|dorduncu|besinci|altinci)\s+doz/)
  return s ? SIRA_KELIME[s[1]] : null
}

function parcaSerileri(parca: string): string[] {
  const out = new Set<string>()
  const k = kayitSerisi(parca)
  if (k) out.add(k)
  // "DaBT-İPA-Hib + KPA" → both; a fragment may carry two series joined by "/" or "-".
  for (const alt of parca.split(/\s*\/\s*|\s+-\s+/)) { const s = kayitSerisi(alt); if (s) out.add(s) }
  return [...out]
}

/**
 * Every (series, dose) the text says was given in this visit. Clauses split on ; . ! ? and new lines (not "2. doz");
 * fragments on "," / "ve" / "ile" / "+". Turkish is verb-final: a fragment without its own verb takes the next
 * fragment's ("Hepatit B ve KPA aşıları uygulandı" → both). A plan / not-given / given-before word in the fragment or
 * in the verb it borrows drops it ("2. ay kontrolünde DaBT-İPA-Hib 1. doz planlandı" → nothing).
 */
export function uygulananAsiParcalari(hamMetin: string | null | undefined): UygulananAsiParcasi[] {
  const out: UygulananAsiParcasi[] = []
  const cumleler = String(hamMetin || '').split(/[;\n]+|(?<!\d)[.!?]+(?:\s+|$)/)
  for (const cumleHam of cumleler) {
    const cumle = trAramaNormalize(cumleHam)
    if (!cumle) continue
    const parcalar = cumle.split(/\s*,\s*|\s+ve\s+|\s+ile\s+|\s*\+\s*/).filter(Boolean)
    for (let i = 0; i < parcalar.length; i++) {
      const seriler = parcaSerileri(parcalar[i])
      if (!seriler.length) continue
      if (PLAN.test(parcalar[i]) || ONCEKI.test(parcalar[i])) continue
      let fiil: string | null = null
      for (let j = i; j < parcalar.length; j++) {
        if (VERILDI.test(parcalar[j]) || PLAN.test(parcalar[j]) || ONCEKI.test(parcalar[j])) { fiil = parcalar[j]; break }
      }
      if (!fiil || !VERILDI.test(fiil) || PLAN.test(fiil) || ONCEKI.test(fiil)) continue
      if (!ASI_SOZU.test(parcalar[i]) && !ASI_SOZU.test(fiil)) continue
      const doz = parcaDozu(parcalar[i])
      for (const seri of seriler) out.push({ seri, doz, cumle: cumleHam.trim().slice(0, 200) })
    }
  }
  return out
}

/** Canonical display name for a series key (backfill preview). */
export function seriAdi(seri: string): string {
  if (seri in SERI_AD) return SERI_AD[seri as SeriKod]
  if (seri in OZEL_AD) return OZEL_AD[seri as OzelKod]
  return seri
}

/**
 * Deterministic backstop on the model's list: keep a vaccine only if the transcript says it was given in this visit;
 * a dose number the transcript does not state is dropped (→ computed from the card); lot / site only if spoken.
 * Off-schedule names (no series) are kept when the name itself appears in a "given" clause.
 */
export function uygulananAsilariSuz(liste: NotAsisi[], transcript: string | null | undefined): NotAsisi[] {
  const parcalar = uygulananAsiParcalari(transcript)
  const katli = trAramaNormalize(transcript)
  const sikisik = katli.replace(/[^a-z0-9]/g, '')
  const out: NotAsisi[] = []
  for (const a of liste) {
    const seri = kayitSerisi(a.asi_adi)
    let eslesen: UygulananAsiParcasi[]
    if (seri) eslesen = parcalar.filter((p) => p.seri === seri)
    else {
      const ad = trAramaNormalize(a.asi_adi).replace(/\basisi\b|\basi\b/g, '').trim()
      eslesen = ad.length >= 3
        ? uygulananCumleler(transcript).filter((c) => c.includes(ad)).map((c) => ({ seri: '', doz: parcaDozu(c), cumle: c }))
        : []
    }
    if (!eslesen.length) continue
    const soylenenDozlar = eslesen.map((p) => p.doz).filter((d): d is number => d != null)
    const doz = a.doz_no != null && soylenenDozlar.includes(a.doz_no) ? a.doz_no : soylenenDozlar.length === 1 ? soylenenDozlar[0] : null
    const temiz: NotAsisi = { asi_adi: a.asi_adi, doz_no: doz, uygulama_tarihi: a.uygulama_tarihi }
    if (a.lot_no && sikisik.includes(trAramaNormalize(a.lot_no).replace(/[^a-z0-9]/g, ''))) temiz.lot_no = a.lot_no
    if (a.uygulama_yeri && trAramaNormalize(a.uygulama_yeri).split(' ').filter((w) => w.length >= 3).every((w) => katli.includes(w))) temiz.uygulama_yeri = a.uygulama_yeri
    if (a.notlar) temiz.notlar = a.notlar
    out.push(temiz)
  }
  return out
}

/** Folded clauses that carry a "given" verb and no plan / before word (off-schedule name check). */
function uygulananCumleler(hamMetin: string | null | undefined): string[] {
  return String(hamMetin || '').split(/[;\n]+|(?<!\d)[.!?]+(?:\s+|$)/).map((c) => trAramaNormalize(c))
    .filter((c) => c && VERILDI.test(c) && !PLAN.test(c) && !ONCEKI.test(c))
}

/** Next dose in the series from the card (rows of the same series; highest dose or row count, + 1). */
export function sonrakiDozNo(asiAdi: string, kart: KartAsisi[], oncesiIso?: string | null): number {
  const anahtar = asiSeriAnahtari(asiAdi)
  const ayni = kart.filter((k) => asiSeriAnahtari(k.asi_adi) === anahtar && (!oncesiIso || !k.uygulama_tarihi || String(k.uygulama_tarihi).slice(0, 10) < oncesiIso))
  const enYuksek = ayni.reduce((m, k) => Math.max(m, Number(k.doz_no) || 0), 0)
  return Math.min(12, Math.max(enYuksek, ayni.length) + 1)
}

/** Dose not spoken → computed from the card and flagged. Rows with a dose are left alone. */
export function dozlariTamamla(liste: NotAsisi[], kart: KartAsisi[]): NotAsisi[] {
  return liste.map((a) => (a.doz_no != null ? a : { ...a, doz_no: sonrakiDozNo(a.asi_adi, kart, a.uygulama_tarihi), doz_hesaplandi: true }))
}

const trGun = (iso: string | null | undefined): string => {
  const t = String(iso || '').slice(0, 10)
  return ISO.test(t) ? `${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(0, 4)}` : 'tarihsiz'
}

/** Where a note vaccine stands against the card (rows written by OTHER sources / notes). See the file header. */
export function notAsisiKartDurumu(a: NotAsisi, kart: KartAsisi[]): AsiKartDurumu {
  const anahtar = asiSeriAnahtari(a.asi_adi)
  const ayni = kart.filter((k) => asiSeriAnahtari(k.asi_adi) === anahtar)
  const tarih = a.uygulama_tarihi ? a.uygulama_tarihi.slice(0, 10) : null
  const ad = a.asi_adi
  for (const k of ayni) {
    const kt = k.uygulama_tarihi ? String(k.uygulama_tarihi).slice(0, 10) : null
    if (!tarih || kt !== tarih) continue
    if (a.doz_no != null && k.doz_no != null && Number(k.doz_no) !== a.doz_no) {
      return { tur: 'catisma', satir: k, mesaj: `Bu hastada ${ad} ${trGun(kt)} tarihinde ${k.doz_no}. doz olarak kayıtlı` }
    }
    return { tur: 'kartta_var', satir: k }
  }
  if (a.doz_no != null) {
    const k = ayni.find((x) => x.doz_no != null && Number(x.doz_no) === a.doz_no)
    if (k) return { tur: 'catisma', satir: k, mesaj: `Bu hastada ${ad} ${a.doz_no}. doz zaten kayıtlı (${trGun(k.uygulama_tarihi)})` }
  }
  return { tur: 'yeni' }
}

/** One line per vaccine for the checklist text ("Aşı durumu" is satisfied by a vaccine in this note). */
export function notAsiMetinSatirlari(ham: unknown): string[] {
  return notAsilariniTemizle(ham).map((a) => `Aşı: ${a.asi_adi}${a.doz_no ? ` ${a.doz_no}. doz` : ''} uygulandı`)
}
