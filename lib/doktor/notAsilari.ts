/**
 * NOTYA-ASI-NOT-01 (Kaan + Dr. Gökhan, 2026-09-23) — "Bu muayenede uygulanan aşılar": the structured list on the note
 * (notes.content_asilar) that reaches the aşı kartı (table asilar) when the note is approved (lib/doktor/notAsiAktarim).
 *
 * Pure — the note form (client), SOAP generation, the approve route and the backfill preview share it.
 * NOTYA-ASI-LOT-01: `asiLotYeriBul` reads a vaccine's lot no / uygulama yeri from its own clause (SOAP backstop +
 * scripts/asi-lot-backfill.mts).
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
// NOTYA-ASI-NOT-03 (2026-09-24): history lines ("Aşı durumu: Hepatit B 1. dozu uygulandı (Haziran 2024)",
// "doğum dozu", an explicit earlier date) describe past doses, not this visit — backfill preview caught them.
const ONCEKI = /(daha once|onceden|gecen (ay|yil|hafta|sefer|vizit|kontrol)|yapilmis(?!tir)|uygulanmis(?!tir)|olmus|karnesinde|karneye gore|aile hekimi|\basm\b|baska (yerde|kurumda|merkezde)|asi durumu|dogumda|dogum dozu|hastanede|(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik) \d{4}|\d{1,2}[./]\d{1,2}[./]\d{2,4})/
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
  // Rejoin the old line-numbering artifact ("Hepatit B\n1. dozu uygulandı") before splitting (NOTYA-SIRA-01).
  const cumleler = String(hamMetin || '').replace(/\n(?=\s*\d{1,2}\.\s*doz)/g, ' ').split(/[;\n]+|(?<!\d)[.!?]+(?:\s+|$)/)
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

// ─── NOTYA-ASI-LOT-01 — lot no + uygulama yeri from the text ────────────────────────────────────────
// Lot: an explicit marker ("lot", "lot no", "lot numarası", "seri no") + a code that has a digit. Read on the raw text so
// the code keeps its case ("Vaxi12345").
const LOT = /(?:^|[^\p{L}\p{N}])(?:lot(?:\s*(?:no|nr|numaras[ıi]))?|seri\s*(?:no|numaras[ıi]))\s*[:.#-]?\s*([\p{L}\p{N}][\p{L}\p{N}/-]{2,39})/iu
// Site, on folded text: route + body location. Shown in canonical Turkish spelling.
const YOL = /\b(im|sc|id|intramuskuler|intramuskular|subkutan|intradermal|oral|agizdan|agiz yoluyla|deri alti|kas ici)\b/g
const YER = /\b(?:(sag|sol)\s+)?(ust kol|uyluk|deltoid|omuz|bacak|kalca|gluteal|vastus lateralis)\b|\b(sag|sol) kol\b/g
const YOL_AD: Record<string, string> = {
  im: 'IM', sc: 'SC', id: 'ID', intramuskuler: 'intramüsküler', intramuskular: 'intramüsküler', agizdan: 'ağızdan',
  'agiz yoluyla': 'ağız yoluyla', 'deri alti': 'deri altı', 'kas ici': 'kas içi',
}
const YER_AD: Record<string, string> = { sag: 'sağ', 'ust kol': 'üst kol', kalca: 'kalça' }

function lotBul(ham: string): string | null {
  const m = ham.match(LOT)
  const kod = m?.[1]?.replace(/[/-]+$/, '')
  return kod && /\d/.test(kod) ? kod : null
}

function yerBul(katli: string): string | null {
  const out: string[] = []
  for (const m of katli.matchAll(YOL)) out.push(YOL_AD[m[1]] ?? m[1])
  for (const m of katli.matchAll(YER)) {
    const taraf = m[1] || m[3]
    const bolge = m[2] || 'kol'
    out.push([taraf ? YER_AD[taraf] ?? taraf : '', YER_AD[bolge] ?? bolge].filter(Boolean).join(' '))
  }
  const tekil = [...new Set(out)]
  return tekil.length ? tekil.join(' ') : null
}

interface AsiBolumu { seriler: string[]; ham: string; katli: string; verildi: boolean; devam: string[] }

/**
 * The text split into per-vaccine segments. Lines (and ";") first, then sentences; inside a sentence fragments split on
 * "," / "ve" / "ile" / "+" (as uygulananAsiParcalari). A fragment naming a vaccine starts that vaccine's segment; the
 * fragments after it (its dose, "(sol omuz", "lot: MMR12345)") belong to it until the next vaccine is named — so in
 * "KKK 1. doz (sol omuz, lot: MMR12345), Suçiçeği 1. doz (sağ omuz, lot: Rix12345) uygulandı" each lot stays with its
 * own vaccine. A later sentence on the same line that names no vaccine ("Menactra aşısı IM uygulandı. Lot no: acwy12345")
 * adds only its lot to the line's last segment (`devam`) — never a site.
 */
function asiBolumleri(hamMetin: string): AsiBolumu[] {
  const out: AsiBolumu[] = []
  const satirlar = String(hamMetin || '').replace(/\n(?=\s*\d{1,2}\.\s*doz)/g, ' ').split(/[;\n]+/)
  for (const satir of satirlar) {
    let sonSatirBolumu: AsiBolumu | null = null
    // "…lot: A111. Sonraki cümle" ends a sentence after a digit too (a capital follows); "2. doz" does not.
    for (const cumle of satir.split(/(?<!\d)[.!?]+(?:\s+|$)|(?<=\d)[.!?]+(?:\s+(?=[A-ZÇĞİÖŞÜ])|$)/)) {
      const katliCumle = trAramaNormalize(cumle)
      if (!katliCumle) continue
      const verildi = VERILDI.test(katliCumle) && !PLAN.test(katliCumle) && !ONCEKI.test(katliCumle)
      const asiCumlesi = ASI_SOZU.test(katliCumle)
      let bolum: AsiBolumu | null = null
      let seriBulundu = false
      for (const parca of cumle.split(/\s*,\s*|\s+ve\s+|\s+ile\s+|\s*\+\s*/i).filter(Boolean)) {
        // A lot code must not name a series ("acwy12345").
        const lot = lotBul(parca)
        const katli = trAramaNormalize(lot ? parca.replace(lot, ' ') : parca)
        const seriler = asiCumlesi ? parcaSerileri(katli) : []
        if (seriler.length) {
          seriBulundu = true
          bolum = { seriler, ham: parca, katli, verildi, devam: [] }
          if (!PLAN.test(katli) && !ONCEKI.test(katli) && !/\bonceki\b/.test(katli)) out.push(bolum)
          sonSatirBolumu = bolum
        } else if (bolum) {
          bolum.ham += `, ${parca}`
          bolum.katli += `, ${katli}`
        }
      }
      if (!seriBulundu && sonSatirBolumu) sonSatirBolumu.devam.push(cumle)
    }
  }
  return out
}

/**
 * NOTYA-ASI-LOT-01 — lot no + uygulama yeri the text states for THIS vaccine (its own segment, see asiBolumleri).
 * Segments in a "given this visit" sentence win over neutral mentions (plan list "KKK (MMR) 1. dozu — sol omuz, lot: …");
 * two different values → empty. Never invented: no marker → null.
 */
export function asiLotYeriBul(hamMetin: string | null | undefined, asiAdi: string): { lot_no: string | null; uygulama_yeri: string | null; cumle: string | null } {
  const seri = kayitSerisi(asiAdi)
  const ad = trAramaNormalize(asiAdi).replace(/\(.*?\)|\basisi\b|\basi\b/g, ' ').replace(/\s+/g, ' ').trim()
  const bolumler = asiBolumleri(String(hamMetin || '')).filter((b) => (seri ? b.seriler.includes(seri) : ad.length >= 3 && b.katli.includes(ad)))
  const sec = (deger: (b: AsiBolumu) => string | null): { v: string | null; b: AsiBolumu | null } => {
    for (const grup of [bolumler.filter((b) => b.verildi), bolumler]) {
      const adaylar = grup.map((b) => ({ v: deger(b), b })).filter((x): x is { v: string; b: AsiBolumu } => !!x.v)
      const farkli = new Set(adaylar.map((x) => x.v.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]/gu, '')))
      if (farkli.size === 1) return adaylar[0]
      if (farkli.size > 1) return { v: null, b: null }
    }
    return { v: null, b: null }
  }
  const lot = sec((b) => lotBul(b.ham) ?? b.devam.map(lotBul).find(Boolean) ?? null)
  const yer = sec((b) => yerBul(b.katli))
  const kaynak = lot.b || yer.b
  return {
    lot_no: lot.v ? lot.v.slice(0, 60) : null,
    uygulama_yeri: yer.v ? yer.v.slice(0, 80) : null,
    cumle: kaynak ? [kaynak.ham, ...kaynak.devam].join('. ').replace(/\s+/g, ' ').trim().slice(0, 200) : null,
  }
}

/** SOAP backstop: lot / site the model left empty are filled from the transcript when it states them for that vaccine. */
export function asiLotYeriTamamla(liste: NotAsisi[], transcript: string | null | undefined): NotAsisi[] {
  return liste.map((a) => {
    if (a.lot_no && a.uygulama_yeri) return a
    const b = asiLotYeriBul(transcript, a.asi_adi)
    const out = { ...a }
    if (!out.lot_no && b.lot_no) out.lot_no = b.lot_no
    if (!out.uygulama_yeri && b.uygulama_yeri) out.uygulama_yeri = b.uygulama_yeri
    return out
  })
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
