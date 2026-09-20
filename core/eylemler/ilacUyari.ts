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
 * Known coverage limit (docs/OPEN-COMMITMENTS.md NOTYA-EYLEM-21): the table holds 18 molecules. A
 * drug outside it resolves to null and gets no deterministic interaction verdict — the card then
 * says so rather than implying safety.
 */
import {
  TURKISH_DRUGS,
  calculatePediatricDose,
  checkInteractions,
  drugKeyFor,
  ifadeIlaciAnlatiyorMu,
  ifadeMetindeGecerMi,
} from '@/lib/asistan/turkishDrugs'
import { alerjiListe, notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import type { EylemBaglami } from './types'

export type UyariSiddeti = 'ciddi' | 'orta' | 'bilgi'
export type UyariTuru = 'alerji' | 'mukerrer_etken' | 'etkilesim' | 'pediatrik' | 'kapsam_disi' | 'ayse_notu'

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

const TABLO_KAYNAK = 'Notya ilaç tablosu (SGK/TİTCK listesi)'
const DOSYA_KAYNAK = 'Hasta dosyası'

/** The actions whose cards carry a drug check. */
export const ILAC_EYLEMLERI: ReadonlySet<string> = new Set(['ilac_ekle', 'ilac_doz_degistir'])

export interface AktifIlacSatiri {
  id?: string | null
  ilac_adi?: string | null
  etken_madde?: string | null
}

/** "Penisilin alerjisi" / "penisilin alerjik" → "penisilin"; the allergen itself is what matches. */
function alerjeniSadelestir(a: string): string {
  return a.replace(/\s*(alerjisi|alerji|alerjik|allerjisi)\s*$/i, '').trim()
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

    // b) The drug's own contraindication list names the allergen ("Penisilin alerjisi").
    const kontrendike = ilac?.contraindications.find((c) => /alerji/i.test(c) && ifadeMetindeGecerMi(alerjen, c))
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
    if (!checkInteractions(anahtar, mevcutAnahtar)) continue
    gorulen.add(mevcutAnahtar)
    out.push({
      tur: 'etkilesim',
      siddet: 'ciddi',
      baslik: 'İlaç etkileşimi',
      metin: `${TURKISH_DRUGS[anahtar].name} ile hastanın aktif ilacı "${s.ilac_adi}" (${TURKISH_DRUGS[mevcutAnahtar].name}) arasında etkileşim bildiriliyor.`,
      kaynak: TABLO_KAYNAK,
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

export function pediatrikUyarilar(
  yasAy: number | null,
  ilacAdi: string,
  etkenMadde: string | null | undefined,
  kiloKg: number | null
): IlacUyarisi[] {
  if (yasAy === null || yasAy >= ON_SEKIZ_YAS_AY) return []
  const anahtar = ilacAnahtari(ilacAdi, etkenMadde)
  const ilac = anahtar ? TURKISH_DRUGS[anahtar] : null
  if (!ilac) return []
  const out: IlacUyarisi[] = []

  for (const c of ilac.contraindications) {
    const sinir = yasAltiSiniri(c)
    if (sinir !== null && yasAy < sinir) {
      out.push({
        tur: 'pediatrik',
        siddet: 'ciddi',
        baslik: 'Yaş kontrendikasyonu',
        metin: `${ilac.name} için "${c}" kontrendikasyonu var; hasta ${yasAy} aylık.`,
        kaynak: TABLO_KAYNAK,
      })
    }
  }

  if (ilac.pediatricDose) {
    out.push({
      tur: 'pediatrik',
      siddet: 'bilgi',
      baslik: 'Pediatrik doz',
      metin:
        kiloKg && anahtar
          ? `${ilac.name} pediatrik doz (${kiloKg} kg): ${calculatePediatricDose(anahtar, kiloKg)}. Dozu siz belirliyorsunuz.`
          : `${ilac.name} pediatrik doz: ${ilac.pediatricDose}. Dosyada güncel kilo yok — kilo girilirse hesaplanabilir.`,
      kaynak: TABLO_KAYNAK,
    })
  }
  return out
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

/** Rows from `hasta_ilaclar`, this doctor's, this patient's, active only. */
async function aktifIlaclar(ctx: EylemBaglami): Promise<AktifIlacSatiri[]> {
  const { data } = await ctx.supabase
    .from('hasta_ilaclar')
    .select('id, ilac_adi, etken_madde')
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
  return alerjiListe(notAlanlariCoz((data as { notes_encrypted?: string | null }).notes_encrypted ?? null))
}

/**
 * Most recent recorded weight, from the same place ölçüm_ekle writes it (`notes.vitaller.kilo`).
 * Only asked for when the patient is a child — an adult card pays nothing for this.
 */
async function sonKiloKg(ctx: EylemBaglami): Promise<number | null> {
  const { data: seanslar } = await ctx.supabase
    .from('sessions')
    .select('id')
    .eq('doctor_id', ctx.doktorId)
    .eq('patient_id', ctx.hasta.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (!seanslar?.length) return null
  const { data: notlar } = await ctx.supabase
    .from('notes')
    .select('vitaller, created_at')
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
    ...pediatrikUyarilar(ctx.hasta.yasAy, ad, girdi.etkenMadde, kilo),
  ]

  // Honesty about coverage: silence from a table of 18 molecules is not a clean bill of health.
  if (!ilacAnahtari(ad, girdi.etkenMadde) && aktif.length > 0) {
    uyarilar.push({
      tur: 'kapsam_disi',
      siddet: 'bilgi',
      baslik: 'Etkileşim kontrolü yapılamadı',
      metin: `"${ad}" Notya ilaç tablosunda yok; hastanın ${aktif.length} aktif ilacıyla etkileşim otomatik kontrol edilemedi.`,
      kaynak: TABLO_KAYNAK,
    })
  }
  return uyarilar
}
