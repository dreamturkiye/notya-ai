/**
 * HASTA-MODULLERI (Kaan, 2026-11-24) — "make it modular and turn things on/off based on the patient: a patient who only
 * has hypertension and is not diabetic needs no diabetic charts". The Sağlığım daily health home used to pick its
 * measurements PER BRANŞ (lib/saglikEvi/bransAyari.ts), so a hypertension-only dahiliye patient got a glucose tile and an
 * unfillable glucose goal in the Ölçüm ring. This pure resolver decides the active modules PER PATIENT; every
 * downstream piece (quick-add tiles, Ölçüm ring goal, trends, Eğilim Bekçisi, badges / karne, Kontrol Öncesi Özet, the
 * doctor's Ev verisi tiles) follows its result. CORE: one resolver for all 30 medical branches and the 10 Özel Branşlar;
 * client-safe (the demo runs it in the browser) — the drug table lookup happens on the server (lib/saglikEvi/ilacSinifi.ts)
 * and only class labels arrive here.
 *
 * Precedence (highest first):
 *  1. The doctor's per-patient switches (ev_hedefler.ayarlar.moduller; the older `olcumler` / `kapali` fields read as
 *     switches too). The doctor's choice always wins, in both directions.
 *  2. Inferred from the patient file: the chronic-disease list on the record (patients.notes_encrypted
 *     `kronikHastaliklar`), ICD-10 codes of the doctor's approved notes, and ACTIVE doctor-approved prescriptions (the
 *     same rows Doz Takvimi reads). Conservative: when in doubt nothing is added; a diagnosis that explains a drug
 *     otherwise wins over the drug-class guess (metformin + PCOS ≠ diabetes). An inferred measurement is added only when
 *     the doctor's branş follows that measurement at all (its row in bransAyari lists it) — a dermatologist's patient
 *     with hypertension on file gets no BP tile — and the LDL card only in the cardiometabolic branches.
 *  3. The patient's own preferences (Tercihler): ADD optional general modules (kilo, nabız, su, bel; never counted in a
 *     daily goal) and remove modules that came ONLY from the branş default. A doctor-enabled or diagnosis / drug-derived
 *     module cannot be removed by the patient (shown as "Hekiminiz takip ediyor").
 *  4. The branş default (bransAyari) — only when 1 (switches turned ON) and 2 give no measurement and no card. Patient
 *     additions never switch the branş default off.
 *
 * brans-alan-sizmasi: the pediatric fever-medicine card stays pediatri / çocuk cerrahisi only (from bransAyari, never
 * inferred, never switchable elsewhere); the pregnancy BP profile is untouched (hedefler / bransAyari); the age-based
 * `veliDiliMi` wording rule is not involved. Logged data is never deleted when a module turns off — it is just no longer
 * prompted, goal-counted, trended or rule-checked (an urgent value is still caught: see kurallar.olcumKurallari).
 */
import type { OlcumTipi } from './tipler'
import { OLCUM_TIPLERI } from './tipler'
import type { BransGunlukAyari, GunlukKarti } from './bransAyari'
import type { HekimAyarlari } from './hedefler'
import { OLCUM_TANIMLARI } from './olcumler'
import { aramaKatla, KRONIK_TANILAR } from '@/lib/doktor/kronikHastaliklar'

/** A module the doctor can switch per patient: the 8 measurement kinds + the LDL card. */
export type ModulAnahtari = OlcumTipi | 'ldl'
export const MODUL_ANAHTARLARI: readonly ModulAnahtari[] = [...OLCUM_TIPLERI, 'ldl']
export type ModulKaynagi = 'hekim' | 'tani' | 'ilac' | 'hasta' | 'brans'

/** Optional general modules the patient may add on their own (never part of a daily goal). */
export const HASTA_EKLEYEBILIR: readonly OlcumTipi[] = ['kilo', 'nabiz', 'su', 'bel']

/** One active prescription as the resolver sees it: the drug-table key and every class label (server-resolved). */
export interface IlacGirdisi { ad: string; anahtar: string | null; siniflar: readonly string[] }

/** What the patient file says (chronic list, ICD-10 codes of approved notes, active approved prescriptions). */
export interface KlinikGirdi { tanilar: readonly string[]; icdKodlari: readonly string[]; ilaclar: readonly IlacGirdisi[] }
export const BOS_KLINIK: KlinikGirdi = { tanilar: [], icdKodlari: [], ilaclar: [] }

/** The patient's own module choices (ev_tercihler.moduller). */
export interface HastaModulTercihi { eklenen: OlcumTipi[]; cikarilan: ModulAnahtari[] }
export const BOS_HASTA_TERCIHI: HastaModulTercihi = { eklenen: [], cikarilan: [] }

export interface ModulGirdisi {
  bransAnahtar: string
  ayar: BransGunlukAyari
  hekim: HekimAyarlari | null | undefined
  klinik?: KlinikGirdi | null
  hasta?: HastaModulTercihi | null
}

export interface AktifModul {
  anahtar: ModulAnahtari
  tur: 'olcum' | 'kart'
  kaynak: ModulKaynagi
  /** Why (doctor-side only — never shown to the patient): the diagnosis or drug name that turned it on. */
  neden: string | null
  /** Readings per day for the Ölçüm ring (0 = optional, never a goal). Cards: 0. */
  gunlukHedef: number
  /** The patient may switch it off (it came only from the branş default, or the patient added it). */
  hastaKapatabilir: boolean
}

/** One row of the doctor's Modüller control: every switchable module with its state and where it comes from. */
export interface ModulSecenegi {
  anahtar: ModulAnahtari
  tur: 'olcum' | 'kart'
  acik: boolean
  /** Source when on; when off by the doctor, what it would be without the switch (null = nothing would turn it on). */
  kaynak: ModulKaynagi | null
  neden: string | null
  /** The doctor's explicit switch for this patient (null = automatic). */
  hekimSecimi: 'acik' | 'kapali' | null
  /** The patient switched this branş-default module off. */
  hastaKapatti: boolean
  gunlukHedef: number
}

export interface HastaModulleri {
  aktif: AktifModul[]
  /** Active measurement kinds, in display order (quick-add tiles, trends, rules, badges, karne). */
  olcumler: OlcumTipi[]
  gunlukHedef: Partial<Record<OlcumTipi, number>>
  kartlar: GunlukKarti[]
  kiloHekimeBildir: boolean
  /** The doctor's control rows (all switchable modules). */
  secenekler: ModulSecenegi[]
  /** The patient's control: optional modules they may add (not active now). */
  eklenebilir: OlcumTipi[]
  /** Branş-default modules the patient switched off (they can turn them back on). */
  hastaKapatti: ModulAnahtari[]
}

// ─── inference (step 2) ───────────────────────────────────────────────────────────────────────────────────────────

type Cikarim = Map<ModulAnahtari, { kaynak: 'tani' | 'ilac'; neden: string }>

/** ICD-10 code (any spelling: "I10", "e11.9", "I10.0 – Esansiyel HT") → category "I10" / "E11"; null when none. */
export function icdKategori(ham: string): string | null {
  const m = String(ham || '').toUpperCase().match(/\b([A-Z])(\d{2})(?:\.\d{1,2})?\b/)
  return m ? `${m[1]}${m[2]}` : null
}

const aralikta = (kod: string, harf: string, bas: number, bit: number) => kod[0] === harf && Number(kod.slice(1)) >= bas && Number(kod.slice(1)) <= bit

/**
 * A chronic-list entry ("Hipertansiyon", "yüksek tansiyon", "Tip 2 diyabet", "E11 Diyabet") → ICD-10 category, using the
 * picker's own list (lib/doktor/kronikHastaliklar.ts: name, synonyms, code). Whole words only — "Prediyabet" is not
 * "Diyabet", "diyabetik nöropati" is not diabetes. Unknown free text → null (conservative).
 */
export function taniKategorisi(ham: string): string | null {
  const s = aramaKatla(String(ham || ''))
  if (!s) return null
  const kod = icdKategori(ham)
  if (kod) return kod
  const sinir = (metin: string, aday: string) => metin === aday || (metin.startsWith(aday) && /^[\s,;:/()–-]/.test(metin.slice(aday.length)))
  let en: { kod: string; uzunluk: number } | null = null
  for (const t of KRONIK_TANILAR) {
    for (const ad of [t.ad, ...(t.esAnlam || [])]) {
      const a = aramaKatla(ad)
      if (a.length < 3 && s !== a) continue // "ht", "dm", "af" only as the whole entry
      if (sinir(s, a) && (!en || a.length > en.uzunluk)) en = { kod: icdKategori(t.kod) || t.kod, uzunluk: a.length }
    }
  }
  return en?.kod ?? null
}

/** Drug groups that justify a module (conservative; class labels from the drug table, lib/asistan/ilac/veri). */
const KB_SINIFLARI = ['RAAS blokeri', 'Dihidropiridin', 'Tiyazid diüretik', 'Tiyazid benzeri diüretik', 'Santral etkili antihipertansif']
const GLUKOZ_SINIFLARI = ['İnsülin', 'Sülfonilüre', 'DPP-4 inhibitörü', 'GLP-1 agonisti']
/** SGLT2 inhibitors are left out on purpose (heart-failure / kidney indications); beta blockers too (migraine, rhythm). */
const LDL_SINIFLARI = ['Statin', 'Kolesterol emilim inhibitörü']

export function klinikCikarim(k: KlinikGirdi | null | undefined, ayar: BransGunlukAyari): { moduller: Cikarim; kiloBildir: boolean } {
  const out: Cikarim = new Map()
  let kiloBildir = false
  if (!k) return { moduller: out, kiloBildir }
  const izinli = new Set<string>(ayar.olcumler)
  const ekle = (m: ModulAnahtari, kaynak: 'tani' | 'ilac', neden: string) => {
    if (m === 'ldl' ? !ayar.kartlar.includes('ldl') : !izinli.has(m)) return
    const v = out.get(m)
    if (!v || (v.kaynak === 'ilac' && kaynak === 'tani')) out.set(m, { kaynak, neden }) // a diagnosis is the better reason
  }
  const tanilar: Array<{ kod: string; ad: string }> = []
  for (const t of k.tanilar) { const kod = taniKategorisi(t); if (kod) tanilar.push({ kod, ad: String(t).trim() }) }
  for (const c of k.icdKodlari) { const kod = icdKategori(c); if (kod) tanilar.push({ kod, ad: kod }) }
  const var_ = (f: (kod: string) => boolean) => tanilar.some((t) => f(t.kod))
  for (const t of tanilar) {
    if (aralikta(t.kod, 'I', 10, 15)) ekle('kb', 'tani', t.ad)
    if (aralikta(t.kod, 'E', 10, 14)) ekle('glukoz', 'tani', t.ad)
    if (t.kod === 'I50' || t.kod === 'N18') { ekle('kilo', 'tani', t.ad); if (ayar.olcumler.includes('kilo')) kiloBildir = true }
    if (t.kod === 'E78') ekle('ldl', 'tani', t.ad)
    if (t.kod === 'J45' || t.kod === 'J44') ekle('spo2', 'tani', t.ad)
  }
  // Metformin is also written for PCOS and prediabetes: those diagnoses explain it, so it says nothing about glucose then.
  const metforminAciklanir = var_((kod) => kod === 'E28' || kod === 'R73')
  for (const i of k.ilaclar) {
    const s = new Set(i.siniflar)
    const ad = String(i.ad || '').trim() || 'İlaç'
    if (KB_SINIFLARI.some((x) => s.has(x))) ekle('kb', 'ilac', ad)
    if (GLUKOZ_SINIFLARI.some((x) => s.has(x)) || (i.anahtar === 'metformin' && !metforminAciklanir)) ekle('glukoz', 'ilac', ad)
    if (LDL_SINIFLARI.some((x) => s.has(x))) ekle('ldl', 'ilac', ad)
  }
  return { moduller: out, kiloBildir }
}

// ─── switches (step 1) ────────────────────────────────────────────────────────────────────────────────────────────

/** The doctor's explicit switches, merging the newer `moduller` with the older `olcumler` (on) / `kapali` (off) fields. */
export function hekimSecimleri(h: HekimAyarlari | null | undefined): Map<ModulAnahtari, 'acik' | 'kapali'> {
  const out = new Map<ModulAnahtari, 'acik' | 'kapali'>()
  for (const t of h?.olcumler || []) out.set(t, 'acik')
  for (const t of h?.kapali || []) out.set(t, 'kapali')
  for (const t of h?.moduller?.acik || []) out.set(t, 'acik')
  for (const t of h?.moduller?.kapali || []) out.set(t, 'kapali')
  return out
}

/** Clean a stored / posted patient preference object. */
export function hastaTercihiTemizle(ham: unknown): HastaModulTercihi {
  const h = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const liste = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    eklenen: HASTA_EKLEYEBILIR.filter((t) => liste(h.eklenen).includes(t)),
    cikarilan: MODUL_ANAHTARLARI.filter((t) => liste(h.cikarilan).includes(t)),
  }
}

/** The patient switches one module on / off: returns the new stored preference (the resolver still enforces the rules). */
export function hastaTercihiDegistir(t: HastaModulTercihi, anahtar: unknown, acik: boolean): HastaModulTercihi | null {
  if (!MODUL_ANAHTARLARI.includes(anahtar as ModulAnahtari)) return null
  const a = anahtar as ModulAnahtari
  const eklenen = t.eklenen.filter((x) => x !== a)
  const cikarilan = t.cikarilan.filter((x) => x !== a)
  if (acik) { if (HASTA_EKLEYEBILIR.includes(a as OlcumTipi)) eklenen.push(a as OlcumTipi) }
  else cikarilan.push(a)
  return { eklenen, cikarilan }
}

// ─── the resolver ─────────────────────────────────────────────────────────────────────────────────────────────────

const KATALOG_SIRASI = new Map(MODUL_ANAHTARLARI.map((m, i) => [m, i]))

export function hastaModulleri(g: ModulGirdisi): HastaModulleri {
  const { ayar } = g
  const secim = hekimSecimleri(g.hekim)
  const { moduller: cikarim, kiloBildir: cikarimKilo } = klinikCikarim(g.klinik, ayar)
  const hasta = g.hasta ? hastaTercihiTemizle(g.hasta) : BOS_HASTA_TERCIHI
  const hekimAcik = [...secim].filter(([, v]) => v === 'acik').map(([k]) => k)

  // Step 4 applies only when the doctor's ON switches and the patient file give nothing.
  const bransUygula = hekimAcik.length === 0 && cikarim.size === 0
  const bransModulleri: ModulAnahtari[] = bransUygula ? [...ayar.olcumler, ...(ayar.kartlar.includes('ldl') ? ['ldl' as const] : [])] : []

  const hedef = (m: ModulAnahtari, kaynak: ModulKaynagi): number => {
    if (m === 'ldl' || kaynak === 'hasta') return 0
    const t = m as OlcumTipi
    return ayar.gunlukHedef[t] ?? (ayar.olcumler.includes(t) ? OLCUM_TANIMLARI[t].gunlukHedef : 0)
  }

  // The source each module would have without the doctor's OFF switch (and without the patient's removal).
  const otomatik = new Map<ModulAnahtari, { kaynak: ModulKaynagi; neden: string | null }>()
  for (const m of bransModulleri) otomatik.set(m, { kaynak: 'brans', neden: null })
  for (const t of hasta.eklenen) if (!otomatik.has(t)) otomatik.set(t, { kaynak: 'hasta', neden: null })
  for (const [m, v] of cikarim) otomatik.set(m, v)

  const aktif: AktifModul[] = []
  const secenekler: ModulSecenegi[] = []
  const hastaKapatti: ModulAnahtari[] = []
  for (const m of MODUL_ANAHTARLARI) {
    const s = secim.get(m) ?? null
    const o = otomatik.get(m) ?? null
    let kaynak: ModulKaynagi | null = s === 'acik' ? 'hekim' : o?.kaynak ?? null
    const neden = s === 'acik' ? null : o?.neden ?? null
    // The patient may remove only what came from the branş default (or their own addition, already handled above).
    const kapattiMi = kaynak === 'brans' && hasta.cikarilan.includes(m)
    if (kapattiMi) hastaKapatti.push(m)
    const acik = s !== 'kapali' && kaynak !== null && !kapattiMi
    if (!acik && s === 'kapali') kaynak = o?.kaynak ?? null
    const tur = m === 'ldl' ? 'kart' as const : 'olcum' as const
    const gh = kaynak ? hedef(m, kaynak) : 0
    secenekler.push({ anahtar: m, tur, acik, kaynak, neden, hekimSecimi: s, hastaKapatti: kapattiMi, gunlukHedef: acik ? gh : 0 })
    if (acik && kaynak) aktif.push({ anahtar: m, tur, kaynak, neden, gunlukHedef: gh, hastaKapatabilir: kaynak === 'brans' || kaynak === 'hasta' })
  }

  // Display order: the branş's own order first (its rows were curated), then the catalog order.
  const bransSira = (m: ModulAnahtari) => { const i = ayar.olcumler.indexOf(m as OlcumTipi); return i >= 0 ? i : 100 + (KATALOG_SIRASI.get(m) ?? 0) }
  aktif.sort((a, b) => bransSira(a.anahtar) - bransSira(b.anahtar))
  const olcumler = aktif.filter((x) => x.tur === 'olcum').map((x) => x.anahtar as OlcumTipi)
  const gunlukHedef: Partial<Record<OlcumTipi, number>> = {}
  for (const x of aktif) if (x.tur === 'olcum') gunlukHedef[x.anahtar as OlcumTipi] = x.gunlukHedef

  const kartlar: GunlukKarti[] = []
  if (aktif.some((x) => x.anahtar === 'ldl')) kartlar.push('ldl')
  const kilo = aktif.find((x) => x.anahtar === 'kilo')
  if (kilo && (ayar.kartlar.includes('kilo_egilim') || kilo.kaynak === 'tani')) kartlar.push('kilo_egilim')
  if (olcumler.includes('su')) kartlar.push('su_sayaci')
  // brans-alan-sizmasi: the fever-medicine card exists only where the branş row has it (pediatri / çocuk cerrahisi).
  if (ayar.kartlar.includes('ates_ilac')) kartlar.push('ates_ilac')

  return {
    aktif, olcumler, gunlukHedef, kartlar,
    kiloHekimeBildir: g.hekim?.kiloBildir ?? (cikarimKilo || ayar.kiloHekimeBildir),
    secenekler,
    eklenebilir: HASTA_EKLEYEBILIR.filter((t) => !olcumler.includes(t) && secim.get(t) !== 'kapali'),
    hastaKapatti,
  }
}

/** Is this measurement kind followed for the patient (prompted, goal-counted, trended, rule-checked)? */
export function takipEdiliyor(m: Pick<HastaModulleri, 'olcumler'>, tip: OlcumTipi): boolean {
  return m.olcumler.includes(tip)
}
