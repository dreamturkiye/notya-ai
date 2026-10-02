/**
 * NOTYA-EYLEM-21 — the drug-safety check that is printed ON the ilaç card, before the tap.
 *
 * docs/AYSE-EYLEM-MIMARISI.md §5: "Drug-interaction warning runs before an ilac_ekle card is shown
 * and is printed on the card. Memory (hafıza) never softens a safety check." Until now the warning
 * only ever existed as a sentence the model chose to write in the chat bubble — i.e. it was as
 * reliable as an LLM's attention on that turn, and it did not survive into the confirm card at all.
 *
 * What this module is, and is not:
 *   • It is NOT a new drug database and NOT a new vendor call. It reads the table the app already
 *     ships (`lib/asistan/turkishDrugs.ts`, the same one behind `/doktor-tools/ilac-interaksiyon`'s
 *     molecule resolution) and the patient's own records. No network, no model, no cost.
 *   • It is deterministic. Same inputs → same warnings, every time, for every doctor. Nothing in
 *     here reads hafıza, doctor preferences or any per-doctor setting: a safety check that can be
 *     taught to go quiet is not a safety check. `core/eylemler/tests/ilacUyari.test.ts` asserts it.
 *
 * Four checks, from the two sources that are actually authoritative about THIS patient:
 *   1. alerji      — the patient's recorded allergies vs. the drug (molecule, brand, class, and the
 *                    drug's own "… alerjisi" contraindications)              → ciddi
 *   2. mükerrer    — a different NAME that resolves to the SAME molecule already active
 *                    (Parol + Minoset = two paracetamols)                    → ciddi
 *   3. etkileşim   — the table's own interaction entries, against the patient's active list → ciddi
 *   4. pediatrik   — age contraindications ("6 ay altı bebek") → ciddi; the table's mg/kg line and
 *                    the weight from the file                               → bilgi
 * Plus `ayse_notu`: the model's own sentence, carried onto the card LABELLED as Ayşe's note — never
 * `ciddi`, because a model's paragraph must not be what gates a doctor's tap.
 *
 * A `ciddi` warning never BLOCKS: the hekim is the authority. It requires a second, explicit tap
 * ("Uyarıyı gördüm, kaydet") and the acknowledgement is written to `eylem_kayitlari.uyari_onayi`.
 *
 * NOTYA-EYLEM-28/29/30 (2026-09-19): the table now holds 176 molecules, every one sourced from a
 * fetched TİTCK KÜB. Three things changed here with it —
 *   • interactions carry a SEVERITY and a one-line Turkish mechanism from the table, so a `ciddi`
 *     and an `orta` interaction no longer look the same on the card;
 *   • allergy matching also reads `alerjiSinifi`, so "penisilin alerjisi" reaches ampisilin and
 *     "sülfonamid alerjisi" reaches furosemid without anyone writing the pair down;
 *   • the pediatric line is computed from a UNIT-TYPED dose and, where the source stated a ceiling,
 *     carries an overdose verdict (NOTYA-EYLEM-30). A drug still outside the table gets no verdict
 *     and the card says so — and when NOTHING fires, the card says that silence is not safety.
 *
 * NOTYA-AYSE-GUVENLIK-01 (2026-10-02, action audit): two holes a forced card fell through —
 *   • the allergy check read only `patients.notes_encrypted.alerjiler`; an allergy that lived on the intake
 *     form (which the file card shows) never reached the card. Both are read now;
 *   • a fixed dose (montelukast 4 / 5 mg by age) was typed per kilogram and multiplied by the weight. A
 *     `sabitDoz` entry is never multiplied; its verdict is measured against the source's own age band, and a
 *     card whose dose could not be measured against any sourced reference says so (`doz_denetimsiz`).
 */
import {
  MOLEKUL_SAYISI,
  TURKISH_DRUGS,
  drugKeyFor,
  etkilesimBul,
  ifadeIlaciAnlatiyorMu,
  ifadeMetindeGecerMi,
  pediatrikDozHesapla,
} from '@/lib/asistan/turkishDrugs'
import { ilkKayitAlerjiMetni, notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import type { EylemBaglami } from './types'
import { arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type UyariSiddeti = 'ciddi' | 'orta' | 'bilgi'
export type UyariTuru =
  | 'alerji'
  | 'mukerrer_etken'
  | 'etkilesim'
  | 'pediatrik'
  | 'pediatrik_asim'
  /** NOTYA-AYSE-GUVENLIK-01 — the written dose could NOT be measured against a sourced reference; said, not hidden. */
  | 'doz_denetimsiz'
  | 'kapsam_disi'
  | 'kapsam_notu'
  | 'ayse_notu'

/**
 * Printed under the warnings block when NOTHING fired. Silence from a 176-molecule table is not a
 * clean bill of health, and a card that says nothing reads as one — Kaan, 2026-09-19.
 */
export const UYARI_YOK_CUMLESI = 'Tabloda uyarı bulunmadı; bu, etkileşim olmadığı anlamına gelmez.'

/** Shown on a computed pediatric dose line while no physician has signed the entry off. */
export const TEYIT_CUMLESI = "KÜB'den teyit edin."


export interface IlacUyarisi {
  tur: UyariTuru
  siddet: UyariSiddeti
  /** Short Turkish label, rendered bold on the card. */
  baslik: string
  /** One Turkish sentence for the doctor. */
  metin: string
  /** Where the statement comes from — printed small, so the doctor can weigh it. */
  kaynak: string
}

const TABLO_KAYNAK = `Notya ilaç tablosu (${MOLEKUL_SAYISI} molekül, TİTCK KÜB)`
const DOSYA_KAYNAK = 'Hasta dosyası'

/** The actions whose cards carry a drug check. */
export const ILAC_EYLEMLERI: ReadonlySet<string> = new Set(['ilac_ekle', 'ilac_doz_degistir'])

export interface AktifIlacSatiri {
  id?: string | null
  ilac_adi?: string | null
  etken_madde?: string | null
}

/** Words a doctor or a parent writes around the allergen ("penisiline alerjisi var") — not part of its name. */
const ALERJI_DOLGU = new Set(['alerjisi', 'alerji', 'alerjik', 'allerjisi', 'allerji', 'var', 'mevcut', 'karşı'])

/** "Penisilin alerjisi" / "penisiline alerjisi var" → "penisilin(e)"; the allergen itself is what matches. */
function alerjeniSadelestir(a: string): string {
  return a
    .split(/\s+/)
    .filter((s) => !ALERJI_DOLGU.has(s.toLocaleLowerCase('tr').replace(/[.,;:!]+$/, '')))
    .join(' ')
    .trim()
}

const ALERJI_YOK = /^(yok|hay[ıi]r|bilinen alerjisi? yok|bilinen yok|-|none)$/i

/**
 * One free-text allergy line → its entries. Splits on , ; and newline but NOT inside parentheses:
 * "Penisilin (ürtiker, 3 yaşında amoksisilin sonrası)" is one allergy with an aside, not two.
 */
export function alerjiParcalari(metin: string | null | undefined): string[] {
  return String(metin ?? '')
    .split(/[,;\n]+(?![^(]*\))/)
    .map((x) => x.trim())
    .filter((x) => x && !ALERJI_YOK.test(x))
}

function ilacMetni(ilacAdi: string, etkenMadde?: string | null): string {
  return [ilacAdi, etkenMadde].filter(Boolean).join(' ')
}

/** Resolve a written drug to a table key, preferring the etken madde when the doctor supplied one. */
export function ilacAnahtari(ilacAdi: string, etkenMadde?: string | null): string | null {
  return drugKeyFor(String(etkenMadde || '')) || drugKeyFor(String(ilacAdi || ''))
}

/* ─────────────────────────────── 1 · Alerji ─────────────────────────────── */

export function alerjiUyarilari(alerjiler: string[], ilacAdi: string, etkenMadde?: string | null): IlacUyarisi[] {
  const anahtar = ilacAnahtari(ilacAdi, etkenMadde)
  const ilac = anahtar ? TURKISH_DRUGS[anahtar] : null
  const serbestMetin = ilacMetni(ilacAdi, etkenMadde)
  const out: IlacUyarisi[] = []

  for (const ham of alerjiler) {
    const alerjen = alerjeniSadelestir(ham)
    if (!alerjen) continue

    // a) The allergen names the drug itself — molecule, brand or pharmacological class.
    const adEslesti = ilac ? ifadeIlaciAnlatiyorMu(alerjen, ilac) : ifadeMetindeGecerMi(alerjen, serbestMetin)
    if (adEslesti) {
      out.push({
        tur: 'alerji',
        siddet: 'ciddi',
        baslik: 'Alerji kaydı',
        metin: `Dosyada "${ham}" alerjisi kayıtlı ve ${ilacAdi} bu tanımla eşleşiyor.`,
        kaynak: DOSYA_KAYNAK,
      })
      continue
    }

    // b) The allergen names a cross-reactivity GROUP the drug belongs to. This is what carries
    //    "penisilin alerjisi" onto the ampisilin card and "sülfonamid alerjisi" onto furosemid —
    //    the KÜBs say so in §4.3 and the table encodes it once, in `alerjiSinifi`.
    const sinif = ilac?.alerjiSinifi?.find((g) => ifadeMetindeGecerMi(g, alerjen) || ifadeMetindeGecerMi(alerjen, g))
    if (sinif) {
      out.push({
        tur: 'alerji',
        siddet: 'ciddi',
        baslik: 'Alerji sınıfı',
        metin: `Dosyada "${ham}" alerjisi kayıtlı; ${ilac?.name} "${sinif}" çapraz duyarlılık grubunda.`,
        kaynak: `${DOSYA_KAYNAK} + ${TABLO_KAYNAK}`,
      })
      continue
    }

    // c) The drug's own contraindication list names the allergen ("Penisilin alerjisi").
    const kontrendike = ilac?.contraindications.find((c) => /alerji|duyarl/i.test(c) && ifadeMetindeGecerMi(alerjen, c))
    if (kontrendike) {
      out.push({
        tur: 'alerji',
        siddet: 'ciddi',
        baslik: 'Alerji kaydı',
        metin: `Dosyada "${ham}" alerjisi kayıtlı; ${ilac?.name} kontrendikasyonları arasında "${kontrendike}" var.`,
        kaynak: `${DOSYA_KAYNAK} + ${TABLO_KAYNAK}`,
      })
    }
  }
  return out
}

/* ──────────────────────── 2 · Mükerrer etken madde ──────────────────────── */

/**
 * The dangerous duplicate is the one the eye does not catch: two different boxes, one molecule
 * (Parol + Minoset). An identical NAME is already reported by the action's own `mukerrerKontrol`,
 * so it is not repeated here — two sentences saying the same thing is how a card stops being read.
 */
export function mukerrerEtkenUyarilari(
  aktif: AktifIlacSatiri[],
  ilacAdi: string,
  etkenMadde?: string | null,
  haricTutulanId?: string | null
): IlacUyarisi[] {
  const anahtar = ilacAnahtari(ilacAdi, etkenMadde)
  const yeniAd = String(ilacAdi || '').trim()
  const out: IlacUyarisi[] = []

  for (const s of aktif) {
    if (haricTutulanId && s.id && String(s.id) === String(haricTutulanId)) continue
    const mevcutAd = String(s.ilac_adi || '').trim()
    if (!mevcutAd) continue
    if (mevcutAd.localeCompare(yeniAd, 'tr', { sensitivity: 'base' }) === 0) continue // aynı ad → mukerrerKontrol söylüyor

    const mevcutAnahtar = ilacAnahtari(mevcutAd, s.etken_madde)
    const ayniEtken =
      (anahtar && mevcutAnahtar && anahtar === mevcutAnahtar) ||
      Boolean(
        etkenMadde &&
          s.etken_madde &&
          String(etkenMadde).localeCompare(String(s.etken_madde), 'tr', { sensitivity: 'base' }) === 0
      )
    if (!ayniEtken) continue

    const etken = anahtar ? TURKISH_DRUGS[anahtar]?.name : String(etkenMadde || '')
    out.push({
      tur: 'mukerrer_etken',
      siddet: 'ciddi',
      baslik: 'Aynı etken madde',
      metin: `Hastada "${mevcutAd}" aktif ve aynı etken maddeyi (${etken}) içeriyor — çift doz riski.`,
      kaynak: `${DOSYA_KAYNAK} + ${TABLO_KAYNAK}`,
    })
  }
  return out
}

/* ─────────────────────────── 3 · Etkileşim ─────────────────────────── */

export function etkilesimUyarilari(aktif: AktifIlacSatiri[], ilacAdi: string, etkenMadde?: string | null): IlacUyarisi[] {
  const anahtar = ilacAnahtari(ilacAdi, etkenMadde)
  if (!anahtar) return []
  const out: IlacUyarisi[] = []
  const gorulen = new Set<string>()

  for (const s of aktif) {
    const mevcutAnahtar = ilacAnahtari(String(s.ilac_adi || ''), s.etken_madde)
    if (!mevcutAnahtar || mevcutAnahtar === anahtar || gorulen.has(mevcutAnahtar)) continue
    const bulgu = etkilesimBul(anahtar, mevcutAnahtar)
    if (!bulgu) continue
    gorulen.add(mevcutAnahtar)
    out.push({
      tur: 'etkilesim',
      // The table's own severity. An `orta` interaction is real but does not demand the second tap;
      // grading everything `ciddi` is how a warning block stops being read.
      siddet: bulgu.siddet,
      baslik: bulgu.siddet === 'ciddi' ? 'İlaç etkileşimi (ciddi)' : 'İlaç etkileşimi',
      metin: `${TURKISH_DRUGS[anahtar].name} + "${s.ilac_adi}" (${TURKISH_DRUGS[mevcutAnahtar].name}): ${bulgu.not}`,
      kaynak: `${TABLO_KAYNAK} — ${bulgu.bildiren} KÜB §4.5`,
    })
  }
  return out
}

/* ─────────────────────────── 4 · Pediatrik ─────────────────────────── */

const ON_SEKIZ_YAS_AY = 18 * 12

/** "6 ay altı bebek" / "2 yaş altı" → the age below which the drug is contraindicated, in months. */
function yasAltiSiniri(ifade: string): number | null {
  const m = /(\d+)\s*(ay|yaş|yas)\s*alt/i.exec(ifade)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n)) return null
  return /ay/i.test(m[2]) ? n : n * 12
}

/**
 * `verilenGunlukMg` — the daily milligram total the doctor wrote on the card, when it can be read
 * from the dose field. Only then can an overdose VERDICT be given, and only against a ceiling the
 * source actually stated (NOTYA-EYLEM-30).
 */
export function pediatrikUyarilar(
  yasAy: number | null,
  ilacAdi: string,
  etkenMadde: string | null | undefined,
  kiloKg: number | null,
  verilenGunlukMg?: number | null
): IlacUyarisi[] {
  if (yasAy === null || yasAy >= ON_SEKIZ_YAS_AY) return []
  const anahtar = ilacAnahtari(ilacAdi, etkenMadde)
  const ilac = anahtar ? TURKISH_DRUGS[anahtar] : null
  if (!ilac || !anahtar) return []
  const out: IlacUyarisi[] = []

  // a) Age floor from the structured field, then from the contraindication prose. The structured
  //    number is the KÜB's own; the prose scan stays because some KÜBs only say it in a sentence.
  const yasSiniri = typeof ilac.yasKontrendikasyonAy === 'number' ? ilac.yasKontrendikasyonAy : null
  if (yasSiniri !== null && yasAy < yasSiniri) {
    out.push({
      tur: 'pediatrik',
      siddet: 'ciddi',
      baslik: 'Yaş kontrendikasyonu',
      metin: `${ilac.name} ${yasSiniri < 24 ? `${yasSiniri} ay` : `${Math.round(yasSiniri / 12)} yaş`} altında kullanılmaz; hasta ${yasAy} aylık.`,
      kaynak: `${TABLO_KAYNAK} — ${ilac.kaynak.belge}`,
    })
  }
  for (const c of ilac.contraindications) {
    const sinir = yasAltiSiniri(c)
    if (sinir !== null && yasAy < sinir && sinir !== yasSiniri) {
      out.push({
        tur: 'pediatrik',
        siddet: 'ciddi',
        baslik: 'Yaş kontrendikasyonu',
        metin: `${ilac.name} için "${c}" kontrendikasyonu var; hasta ${yasAy} aylık.`,
        kaynak: TABLO_KAYNAK,
      })
    }
  }

  // b) The dose line. `hekimDogruladi` is false for every entry today, so every computed pediatric
  //    dose carries "KÜB'den teyit edin" — the number is the KÜB's, the responsibility is the
  //    hekim's, and the card must not let the two blur.
  //    NOTYA-AYSE-GUVENLIK-01: a fixed-dose entry needs no weight and is never multiplied by one; its verdict
  //    is measured against the age band the source gives for this patient's age.
  const p = ilac.pediatrik
  const hesap = p?.sabitDoz
    ? pediatrikDozHesapla(anahtar, kiloKg ?? 0, verilenGunlukMg ?? undefined, yasAy)
    : kiloKg ? pediatrikDozHesapla(anahtar, kiloKg, verilenGunlukMg ?? undefined) : null
  if (hesap) {
    out.push({
      tur: 'pediatrik',
      siddet: 'bilgi',
      baslik: 'Pediatrik doz',
      metin: `${ilac.name}${p?.sabitDoz ? '' : ` (${kiloKg} kg)`}: ${hesap.metin} Dozu siz belirliyorsunuz.${hesap.hekimDogruladi ? '' : ` ${TEYIT_CUMLESI}`}`,
      kaynak: `${TABLO_KAYNAK} — ${ilac.kaynak.belge}`,
    })
    // c) The verdict, only when a ceiling was sourced AND a written daily total was readable.
    if (hesap.asim && hesap.asimMetni) {
      out.push({
        tur: 'pediatrik_asim',
        siddet: 'ciddi',
        baslik: 'Pediatrik doz aşımı',
        metin: `${hesap.asimMetni}${hesap.hekimDogruladi ? '' : ` ${TEYIT_CUMLESI}`}`,
        kaynak: `${TABLO_KAYNAK} — ${ilac.kaynak.belge}`,
      })
    }
  } else if (ilac.pediatrik || ilac.pediatricDose) {
    out.push({
      tur: 'pediatrik',
      siddet: 'bilgi',
      baslik: 'Pediatrik doz',
      metin: `${ilac.name} pediatrik doz: ${ilac.pediatrik?.metin || ilac.pediatricDose}. Dosyada güncel kilo yok — kilo girilirse hesaplanabilir.${TEYIT_CUMLESI ? ` ${TEYIT_CUMLESI}` : ''}`,
      kaynak: `${TABLO_KAYNAK} — ${ilac.kaynak.belge}`,
    })
  }

  // d) NOTYA-AYSE-GUVENLIK-01: no verdict could be given → the card SAYS the dose was not checked, and why.
  //    A card that prints a reference line and stays silent about the written dose reads as "dose is fine".
  if (!hesap || hesap.asim === undefined) {
    const tavanKaynakli = Boolean(p) && (typeof p?.maxMgKgGun === 'number' || typeof p?.mutlakMaxMgGun === 'number')
    const neden = !p
      ? `${ilac.name} için Notya ilaç tablosunda yapılandırılmış pediatrik doz bilgisi yok; yazılan doz otomatik denetlenmedi.`
      : hesap
        ? hesap.tavanMgGun === undefined
          ? `${ilac.name} için Notya ilaç tablosunda bu yaşa ait kaynaklı bir doz üst sınırı yok; yazılan doz otomatik denetlenmedi.`
          : 'Yazılan doz günlük miligram olarak okunamadı; kaynaktaki üst sınırla karşılaştırılamadı.'
        : tavanKaynakli
          ? 'Dosyada güncel kilo olmadığı için yazılan doz kaynaktaki üst sınırla karşılaştırılamadı.'
          : `${ilac.name} için Notya ilaç tablosunda kaynaklı bir pediatrik doz üst sınırı yok; yazılan doz otomatik denetlenmedi.`
    out.push({ tur: 'doz_denetimsiz', siddet: 'bilgi', baslik: 'Doz denetimi yapılamadı', metin: neden, kaynak: TABLO_KAYNAK })
  }
  return out
}

const SAYI_SOZU: Record<string, number> = { bir: 1, tek: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6 }
const SAYI = String.raw`(\d+|bir|tek|iki|üç|dört|beş|altı)`
const sayiOku = (s: string): number => (/^\d+$/.test(s) ? Number(s) : SAYI_SOZU[s.toLocaleLowerCase('tr')] ?? NaN)

/**
 * Daily milligram total from a written dose field ("500 mg 3x1", "2x250 mg", "250 mg günde iki kez",
 * "8 saatte bir"). Returns null when the line cannot be read as milligrams — an unreadable dose must
 * produce NO verdict rather than a guessed one. That includes a per-kilogram dose ("45 mg/kg/gün" is
 * not 45 mg) and an as-needed line with no stated frequency.
 *
 * A dose with no frequency at all is read as ONE dose a day: the lowest daily total it can mean, so an
 * "exceeds" verdict from it is sound.
 */
export function gunlukMgOku(doz: string | null | undefined, siklik?: string | null): number | null {
  const metin = `${doz || ''} ${siklik || ''}`.trim()
  if (!metin) return null
  if (/(?:mg|miligram)\s*\/\s*kg/i.test(metin)) return null
  const mg = /(\d+(?:[.,]\d+)?)\s*(?:mg|miligram)/i.exec(metin)
  if (!mg) return null
  const birim = Number(mg[1].replace(',', '.'))
  if (!Number.isFinite(birim) || birim <= 0) return null
  // "3x1", "2 x 1" → 3 × 1 doses; "2x250 mg" → 2 doses of the milligram figure itself.
  const carpim = /(\d+)\s*[xX×]\s*(\d+(?:[.,]\d+)?)(\s*(?:mg|miligram))?/.exec(metin)
  if (carpim) return carpim[3] ? birim * Number(carpim[1]) : birim * Number(carpim[1]) * Number(carpim[2].replace(',', '.'))
  // "günde 3", "günde iki kez", "3 kez", "iki defa"
  const kez = new RegExp(String.raw`(?:günde|gunde)\s*${SAYI}(?![\d.,]*\s*(?:mg|miligram))|${SAYI}\s*(?:kez|defa|kere)`, 'i').exec(metin)
  if (kez) {
    const n = sayiOku(kez[1] || kez[2])
    return Number.isFinite(n) && n > 0 ? birim * n : null
  }
  // "8 saatte bir" → 3 doses a day.
  const saatte = /(\d+)\s*saatte\s*bir/i.exec(metin)
  if (saatte) {
    const n = Number(saatte[1])
    return n > 0 && n <= 24 ? birim * Math.floor(24 / n) : null
  }
  // "sabah akşam", "sabah öğle akşam" → one dose per named time of day.
  const vakit = new Set((metin.toLocaleLowerCase('tr').match(/sabah|öğle|akşam|gece/g) || []))
  if (vakit.size >= 2) return birim * vakit.size
  // As needed, no stated frequency: the daily total is not known.
  if (/gerekti[ğg]inde|gerekirse|l[üu]zum/i.test(metin)) return null
  return birim
}

/* ─────────────────────────── Ayşe'nin notu ─────────────────────────── */

/**
 * The model's own interaction sentence, carried onto the card so it is not lost — but LABELLED, and
 * never `ciddi`. What gates a doctor's second tap must be something the system can re-derive.
 */
export function ayseNotuUyarisi(not: string | null | undefined): IlacUyarisi | null {
  const m = String(not || '').trim()
  if (!m) return null
  return { tur: 'ayse_notu', siddet: 'orta', baslik: "Ayşe'nin notu", metin: m.slice(0, 600), kaynak: 'Ayşe (model) — doğrulaması hekimde' }
}

/* ─────────────────────────── Bileşik ─────────────────────────── */

export function ciddiUyariVarMi(uyarilar: readonly IlacUyarisi[]): boolean {
  return uyarilar.some((u) => u.siddet === 'ciddi')
}

/** Rows from `hasta_ilaclar`, this doctor's, this patient's, active only (NOTYA-ARSIV-02: not an archived muayene's). */
async function aktifIlaclar(ctx: EylemBaglami): Promise<AktifIlacSatiri[]> {
  const { data } = await arsivsizIlaclar(ctx.supabase, 'id, ilac_adi, etken_madde')
    .eq('doctor_id', ctx.doktorId)
    .eq('patient_id', ctx.hasta.id)
    .eq('aktif', true)
    .limit(50)
  return (data || []) as AktifIlacSatiri[]
}

async function hastaAlerjileri(ctx: EylemBaglami): Promise<string[]> {
  const { data } = await ctx.supabase
    .from('patients')
    .select('notes_encrypted')
    .eq('id', ctx.hasta.id)
    .eq('doctor_id', ctx.doktorId)
    .maybeSingle()
  if (!data) return []
  // The raw line, split here: `alerjiListe` cuts on every comma and breaks "Penisilin (ürtiker, 3 yaşında …)" in two.
  const kayit = alerjiParcalari(notAlanlariCoz((data as { notes_encrypted?: string | null }).notes_encrypted ?? null).alerjiler)
  const form = await ilkKayitAlerjileri(ctx)
  const gorulen = new Set(kayit.map((a) => a.toLocaleLowerCase('tr')))
  return [...kayit, ...form.filter((a) => !gorulen.has(a.toLocaleLowerCase('tr')))]
}

/**
 * NOTYA-AYSE-GUVENLIK-01 — the allergy the patient (or the parent) wrote on the intake form.
 *
 * The file card and "Alerjisi var mı" read it from there (lib/doktor/hastaDosyaDerleyici.ts); the drug check read
 * only `patients.notes_encrypted.alerjiler`. A chart whose allergy lived only on the form therefore SHOWED
 * "Penisilin" and prepared an amoksisilin card with no allergy warning (action audit 2026-10-02, sentence 10).
 * Both sources are read and merged: an allergy the doctor can see in the file must reach the card.
 *
 * HASTA-IZOLASYON-01: the form row is read by patient id AND this doctor's id.
 */
async function ilkKayitAlerjileri(ctx: EylemBaglami): Promise<string[]> {
  const { data } = await ctx.supabase
    .from('hasta_intake_formlari')
    .select('form_data_encrypted')
    .eq('patient_id', ctx.hasta.id)
    .eq('doktor_id', ctx.doktorId)
    .order('created_at', { ascending: false })
    .limit(1)
  return alerjiParcalari(ilkKayitAlerjiMetni((data?.[0] as { form_data_encrypted?: string | null } | undefined)?.form_data_encrypted))
}

/**
 * Most recent recorded weight, from the same place ölçüm_ekle writes it (`notes.vitaller.kilo`).
 * Only asked for when the patient is a child — an adult card pays nothing for this.
 */
async function sonKiloKg(ctx: EylemBaglami): Promise<number | null> {
  // NOTYA-ARSIV-01: arşivlenmiş muayenenin kilosu doz uyarısına girmez.
  const { data: seanslar } = await arsivsizSeanslar(ctx.supabase, 'id')
    .eq('doctor_id', ctx.doktorId)
    .eq('patient_id', ctx.hasta.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (!seanslar?.length) return null
  const { data: notlar } = await arsivsizNotlar(ctx.supabase, 'vitaller, created_at')
    .in('session_id', seanslar.map((s) => (s as { id: string }).id))
    .order('created_at', { ascending: false })
    .limit(20)
  for (const n of notlar || []) {
    const v = (n as { vitaller?: unknown }).vitaller
    const kilo = v && typeof v === 'object' ? Number((v as Record<string, unknown>).kilo) : NaN
    if (Number.isFinite(kilo) && kilo > 0) return kilo
  }
  return null
}

export interface IlacUyariGirdisi {
  ilacAdi: string
  etkenMadde?: string | null
  /** Dose line as written on the card — the only input that can license an overdose verdict. */
  doz?: string | null
  kullanimSikligi?: string | null
  /** For `ilac_doz_degistir`: the row being edited is not its own duplicate. */
  haricTutulanId?: string | null
}

/**
 * THE check. Run when the card is prepared AND again at commit (core/eylemler/onayla.ts) — the
 * patient's med list may have changed in between, and a card that was safe an hour ago is not a
 * statement about now.
 */
export async function ilacUyarilariHesapla(ctx: EylemBaglami, girdi: IlacUyariGirdisi): Promise<IlacUyarisi[]> {
  const ad = String(girdi.ilacAdi || '').trim()
  if (!ad) return []

  const [aktif, alerjiler] = await Promise.all([aktifIlaclar(ctx), hastaAlerjileri(ctx)])
  const cocuk = ctx.hasta.yasAy !== null && ctx.hasta.yasAy < ON_SEKIZ_YAS_AY
  const kilo = cocuk ? await sonKiloKg(ctx) : null

  const uyarilar: IlacUyarisi[] = [
    ...alerjiUyarilari(alerjiler, ad, girdi.etkenMadde),
    ...mukerrerEtkenUyarilari(aktif, ad, girdi.etkenMadde, girdi.haricTutulanId),
    ...etkilesimUyarilari(aktif, ad, girdi.etkenMadde),
    ...pediatrikUyarilar(ctx.hasta.yasAy, ad, girdi.etkenMadde, kilo, gunlukMgOku(girdi.doz, girdi.kullanimSikligi)),
  ]

  // Honesty about coverage: silence from the table is not a clean bill of health.
  if (!ilacAnahtari(ad, girdi.etkenMadde)) {
    uyarilar.push({
      tur: 'kapsam_disi',
      siddet: 'bilgi',
      baslik: 'Etkileşim kontrolü yapılamadı',
      metin: aktif.length
        ? `"${ad}" Notya ilaç tablosunda yok; hastanın ${aktif.length} aktif ilacıyla etkileşim ve yazılan doz otomatik kontrol edilemedi.`
        : `"${ad}" Notya ilaç tablosunda yok; bu ilaç için otomatik etkileşim, alerji ve doz kontrolü yapılamadı.`,
      kaynak: TABLO_KAYNAK,
    })
  } else if (uyarilar.length === 0) {
    // NOTHING fired and the drug IS in the table. The card must still not read as "safe".
    uyarilar.push({
      tur: 'kapsam_notu',
      siddet: 'bilgi',
      baslik: 'Uyarı bulunmadı',
      metin: UYARI_YOK_CUMLESI,
      kaynak: TABLO_KAYNAK,
    })
  }
  return uyarilar
}

/**
 * NOTYA-EYLEM-31 — Ayşe'nin uyarı cümlesini DÜZ METİNDEN çıkarır.
 *
 * `proactiveWarning` yapısal olarak yalnız `/api/asistan/chat` yanıtında vardı; Danış ve not içi
 * kutu düz metin döndürüyor, orada modelin uyarı cümlesi baloncukta kalıp karta HİÇ taşınmıyordu.
 * Aynı deterministik kontroller üç yüzeyde de koşuyordu ama hekimin kartta gördüğü şey farklıydı.
 *
 * Konsult yanıtını yapısallaştırmak (ikinci bir model çağrısı ya da JSON zorlaması) yerine burada
 * seçim yapılıyor: yanıttaki cümlelerden RİSK sözcüğü taşıyanlar alınır. Yanlış seçim ucuzdur —
 * çıktı `orta` şiddetle, "Ayşe'nin notu" etiketiyle ve "doğrulaması hekimde" kaynağıyla basılır;
 * hiçbir zaman `ciddi` olmaz ve hiçbir zaman ikinci dokunuşu tetiklemez. Hiçbir şey seçilmezse
 * kartta Ayşe'nin notu satırı çıkmaz — uydurulmuş bir uyarı basmaktansa hiç basmamak doğrudur.
 */
const RISK_SOZCUKLERI =
  /etkileşim|risk|dikkat|uyar|kontrendike|alerji|yan etki|artırabilir|azaltabilir|kanama|toksis|doz aşım|birlikte kullan|önerilmez|kaçınıl/i

/** Model çıktısında kart yerine metin biçimi üretilmişse temizlenecek başlık kalıntıları. */
const BASLIK_KALINTISI = /^\s*(hocam[,:]?|not[:.]|uyarı[:.]|dikkat[:.])\s*/i

export function ayseUyariCumlesi(cevap: string | null | undefined, enCok = 2): string | null {
  const metin = String(cevap || '').trim()
  if (!metin) return null
  const cumleler = metin
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 25 && c.length <= 400)
  const secilen = cumleler.filter((c) => RISK_SOZCUKLERI.test(c)).slice(0, enCok)
  if (!secilen.length) return null
  return secilen.map((c) => c.replace(BASLIK_KALINTISI, '')).join(' ').slice(0, 600)
}
