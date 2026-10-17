/**
 * FOTO-AI-01 — strict structured output of the clinical-photo evaluation (decision SUPPORT, never a diagnosis).
 *
 * This file is the contract: the types, the closed vocabularies, and a hand-written validator that turns whatever the
 * model returned into a FotoDegerlendirme or a list of precise errors (which drive the one repair attempt in
 * degerlendir.ts). It lives in lib/doktor/muayeneEk/ next to the attachment classifier it extends (tur = 'foto').
 * Pure + client-safe (no server imports). No model name is written here (ai-model-politikasi).
 */
import { bolgeIdMi } from '@/lib/doktor/fotoArsiv/bolgeler'

/** Part of the cache key and recorded with every evaluation: change the prompt or the rules -> bump this. */
export const FOTO_AI_SURUMU = 'foto-ai-v1'

export type FotoMod = 'genel' | 'pediatrik'

export const GUVEN_DUZEYLERI = ['yuksek', 'orta', 'dusuk'] as const
export type Guven = (typeof GUVEN_DUZEYLERI)[number]
export const GUVEN_ETIKETI: Record<Guven, string> = { yuksek: 'Yüksek güven', orta: 'Orta güven', dusuk: 'Düşük güven' }

export type KaliteGenel = 'iyi' | 'orta' | 'yetersiz'
export type Bulaniklik = 'yok' | 'hafif' | 'belirgin'
export type Isik = 'yeterli' | 'az' | 'asiri' | 'yansima'
export type Kadraj = 'uygun' | 'kismen' | 'uygun-degil'
export type BayrakDurumu = 'var' | 'olasi' | 'yok' | 'degerlendirilemez'

/** Red-flag screen. Every code carries explicit criteria; "var"/"olasi" without a stated criterion is downgraded. */
export const GENEL_BAYRAKLAR = [
  'pigmentli-lezyon-abcde',
  'enfeksiyon-selulit',
  'peteshi-purpura',
  'sarilik',
  'yanik',
  'yara-ulser-nekroz',
  'akut-sislik-anjiyoodem',
  'aktif-kanama',
] as const
/** Added ONLY for pediatri / çocuk cerrahisi (brans-alan-sizmasi). */
export const PEDIATRIK_BAYRAKLAR = ['sarilik-yasa-duyarli', 'hemanjiyom-riskli-konum'] as const

export type BayrakKodu = (typeof GENEL_BAYRAKLAR)[number] | (typeof PEDIATRIK_BAYRAKLAR)[number]

export function bayrakKodlari(mod: FotoMod): readonly string[] {
  return mod === 'pediatrik' ? [...GENEL_BAYRAKLAR, ...PEDIATRIK_BAYRAKLAR] : GENEL_BAYRAKLAR
}

export const BAYRAK_ETIKETI: Record<BayrakKodu, string> = {
  'pigmentli-lezyon-abcde': 'Pigmentli lezyon (ABCDE ipuçları)',
  'enfeksiyon-selulit': 'Enfeksiyon / selülit belirtileri',
  'peteshi-purpura': 'Peteşi / purpura (basmakla solmayan)',
  sarilik: 'Sarılık (ciltte / skleralarda sarı renk)',
  yanik: 'Yanık',
  'yara-ulser-nekroz': 'İyileşmeyen yara / ülser / nekroz',
  'akut-sislik-anjiyoodem': 'Akut yüz-dudak-dil şişliği',
  'aktif-kanama': 'Aktif kanama',
  'sarilik-yasa-duyarli': 'Sarılık (yaşa göre değerlendirme)',
  'hemanjiyom-riskli-konum': 'Hemanjiyom: riskli konum / özellik',
}

export interface FotoKalite {
  genel: KaliteGenel
  bulaniklik: Bulaniklik
  isik: Isik
  kadraj: Kadraj
  olcekReferansi: boolean
  bolgeBelirlenebilir: boolean
  /** Turkish "çekimi yenileyin" suggestion; REQUIRED when genel = yetersiz. */
  yenidenCekim: string | null
}

export interface FotoMorfoloji {
  renk: string
  /** Only when a scale reference is visible; otherwise null (never a guess). */
  boyut: string | null
  sinir: string
  yuzey: string
  dagilim: string
  sayi: string
}

export interface FotoGozlem { anahtar: string; metin: string; guven: Guven }
export interface FotoBayrak { kod: string; durum: BayrakDurumu; kriter: string; not: string }
export interface FotoAyirici { anahtar: string; ad: string; guven: Guven; ayirtEdici: string }

export interface FotoDegerlendirme {
  surum: string
  mod: FotoMod
  kalite: FotoKalite
  bolge: { id: string | null; guven: Guven }
  degerlendirilebilir: boolean
  abstain: { neden: string } | null
  morfoloji: FotoMorfoloji | null
  gozlemler: FotoGozlem[]
  kirmiziBayraklar: FotoBayrak[]
  ayiricilar: FotoAyirici[]
  /** "Doktor incelemesi gerekir" style triage hint; never a treatment instruction. */
  oneri: string | null
  sinirlar: string[]
}

/** Provenance recorded with every stored evaluation (KVKK / audit: which model + which prompt produced it). */
export interface FotoUretimKaydi {
  surum: string
  model: string | null
  /** 'model' = this call produced it; 'onbellek' = served from the hash cache, no call made */
  kaynak: 'model' | 'onbellek'
  uretildi: string
  onarimDenendi: boolean
  /** The model's output only parsed after the repair step. */
  onarildi: boolean
}

export const AZAMI = { metin: 420, kisa: 160, gozlem: 8, ayirici: 4, sinir: 6 } as const

// ─── Coercion helpers ────────────────────────────────────────────────────────────────────────────────────
const TR_KATLA: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
export function katla(x: unknown): string {
  return String(x ?? '').trim().toLocaleLowerCase('tr-TR').replace(/[çğıiöşüâîû]/g, (c) => TR_KATLA[c] ?? c).replace(/[\s_]+/g, '-')
}

const SINONIM: Record<string, string> = {
  high: 'yuksek', medium: 'orta', moderate: 'orta', low: 'dusuk', yuksek: 'yuksek', orta: 'orta', dusuk: 'dusuk',
  good: 'iyi', poor: 'yetersiz', bad: 'yetersiz', yetersiz: 'yetersiz', iyi: 'iyi', yeterli: 'yeterli',
  none: 'yok', mild: 'hafif', marked: 'belirgin', severe: 'belirgin', yok: 'yok', hafif: 'hafif', belirgin: 'belirgin',
  dim: 'az', insufficient: 'az', az: 'az', overexposed: 'asiri', asiri: 'asiri', glare: 'yansima', yansima: 'yansima', parlama: 'yansima',
  suitable: 'uygun', uygun: 'uygun', partial: 'kismen', kismen: 'kismen', 'uygun-degil': 'uygun-degil', 'uygun-degildir': 'uygun-degil', unsuitable: 'uygun-degil',
  present: 'var', var: 'var', possible: 'olasi', olasi: 'olasi', absent: 'yok', 'not-assessable': 'degerlendirilemez', degerlendirilemez: 'degerlendirilemez', 'degerlendirilemiyor': 'degerlendirilemez',
}
function enumDeger<T extends string>(x: unknown, izinli: readonly T[]): T | undefined {
  const k = katla(x)
  const s = SINONIM[k] ?? k
  return (izinli as readonly string[]).includes(s) ? (s as T) : undefined
}

function metin(x: unknown, azami: number): string {
  if (typeof x !== 'string') return ''
  return Array.from(x.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, azami).join('')
}

export function slug(x: unknown, azami = 40): string {
  return katla(x).replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, azami)
}

function boolDeger(x: unknown): boolean | undefined {
  if (typeof x === 'boolean') return x
  if (x === 'true' || x === 'evet') return true
  if (x === 'false' || x === 'hayır' || x === 'hayir') return false
  return undefined
}

/** The quality block alone (also the whole answer of the pre-save quality gate). */
export function kaliteDogrula(ham: unknown): { kalite: FotoKalite | null; hatalar: string[] } {
  const hatalar: string[] = []
  const kq = ham && typeof ham === 'object' && !Array.isArray(ham) ? (ham as Record<string, unknown>) : null
  if (!kq) return { kalite: null, hatalar: ['"kalite" nesnesi eksik.'] }
  const genel = enumDeger(kq.genel, ['iyi', 'orta', 'yetersiz'] as const)
  const bulaniklik = enumDeger(kq.bulaniklik, ['yok', 'hafif', 'belirgin'] as const)
  const isik = enumDeger(kq.isik, ['yeterli', 'az', 'asiri', 'yansima'] as const)
  const kadraj = enumDeger(kq.kadraj, ['uygun', 'kismen', 'uygun-degil'] as const)
  const olcek = boolDeger(kq.olcekReferansi)
  const bolgeOk = boolDeger(kq.bolgeBelirlenebilir)
  if (!genel) hatalar.push('kalite.genel: iyi | orta | yetersiz olmalı.')
  if (!bulaniklik) hatalar.push('kalite.bulaniklik: yok | hafif | belirgin olmalı.')
  if (!isik) hatalar.push('kalite.isik: yeterli | az | asiri | yansima olmalı.')
  if (!kadraj) hatalar.push('kalite.kadraj: uygun | kismen | uygun-degil olmalı.')
  if (olcek === undefined) hatalar.push('kalite.olcekReferansi: boolean olmalı.')
  if (bolgeOk === undefined) hatalar.push('kalite.bolgeBelirlenebilir: boolean olmalı.')
  if (!(genel && bulaniklik && isik && kadraj && olcek !== undefined && bolgeOk !== undefined)) return { kalite: null, hatalar }
  return { kalite: { genel, bulaniklik, isik, kadraj, olcekReferansi: olcek, bolgeBelirlenebilir: bolgeOk, yenidenCekim: metin(kq.yenidenCekim, AZAMI.kisa * 2) || null }, hatalar }
}

export function bolgeDogrula(ham: unknown): { id: string | null; guven: Guven } {
  const kb = ham && typeof ham === 'object' ? (ham as Record<string, unknown>) : {}
  const id = bolgeIdMi(katla(kb.id)) ? katla(kb.id) : null
  return { id, guven: enumDeger(kb.guven, GUVEN_DUZEYLERI) ?? 'dusuk' }
}

export interface DogrulamaSonucu { deger?: FotoDegerlendirme; hatalar: string[] }

/**
 * Validates + normalises one model answer. Structural problems (missing quality block, wrong types, unknown enum that
 * cannot be coerced) are returned as `hatalar`; small deviations (case, Turkish letters, English synonyms, overlong
 * strings, unknown extra fields) are fixed silently. Calibration rules (abstain, confidence caps) are NOT applied here:
 * see kalibrasyon.ts, which also runs on cached rows.
 */
export function fotoSonucuDogrula(ham: unknown, mod: FotoMod): DogrulamaSonucu {
  const hatalar: string[] = []
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return { hatalar: ['Kök değer bir JSON nesnesi olmalı.'] }
  const k = ham as Record<string, unknown>

  // quality
  const kd = kaliteDogrula(k.kalite)
  const kalite = kd.kalite
  hatalar.push(...kd.hatalar)

  const degerlendirilebilir = boolDeger(k.degerlendirilebilir)
  if (degerlendirilebilir === undefined) hatalar.push('"degerlendirilebilir" boolean olmalı.')

  // region
  const bolge = bolgeDogrula(k.bolge)

  // abstain
  const ka = k.abstain && typeof k.abstain === 'object' ? (k.abstain as Record<string, unknown>) : null
  const abstainNeden = ka ? metin(ka.neden, AZAMI.metin) : ''
  if (degerlendirilebilir === false && !abstainNeden) hatalar.push('degerlendirilebilir=false ise "abstain.neden" zorunlu.')

  // morphology
  let morfoloji: FotoMorfoloji | null = null
  const km = k.morfoloji && typeof k.morfoloji === 'object' ? (k.morfoloji as Record<string, unknown>) : null
  if (km) {
    morfoloji = {
      renk: metin(km.renk, AZAMI.kisa), boyut: metin(km.boyut, AZAMI.kisa) || null, sinir: metin(km.sinir, AZAMI.kisa),
      yuzey: metin(km.yuzey, AZAMI.kisa), dagilim: metin(km.dagilim, AZAMI.kisa), sayi: metin(km.sayi, AZAMI.kisa),
    }
  }
  if (degerlendirilebilir === true && !morfoloji) hatalar.push('degerlendirilebilir=true ise "morfoloji" nesnesi zorunlu.')

  // observations
  const gozlemler: FotoGozlem[] = []
  if (k.gozlemler !== undefined && !Array.isArray(k.gozlemler)) hatalar.push('"gozlemler" bir dizi olmalı.')
  for (const g of Array.isArray(k.gozlemler) ? (k.gozlemler as unknown[]) : []) {
    if (!g || typeof g !== 'object') continue
    const o = g as Record<string, unknown>
    const m = metin(o.metin, AZAMI.metin)
    if (!m) continue
    gozlemler.push({ anahtar: `g${gozlemler.length + 1}`, metin: m, guven: enumDeger(o.guven, GUVEN_DUZEYLERI) ?? 'dusuk' })
    if (gozlemler.length >= AZAMI.gozlem) break
  }

  // red flags
  const kodlar = bayrakKodlari(mod)
  const bayraklar: FotoBayrak[] = []
  if (k.kirmiziBayraklar !== undefined && !Array.isArray(k.kirmiziBayraklar)) hatalar.push('"kirmiziBayraklar" bir dizi olmalı.')
  for (const b of Array.isArray(k.kirmiziBayraklar) ? (k.kirmiziBayraklar as unknown[]) : []) {
    if (!b || typeof b !== 'object') continue
    const o = b as Record<string, unknown>
    const kod = katla(o.kod)
    if (!kodlar.includes(kod)) continue // unknown or other-specialty code: dropped (no leak into this branş)
    if (bayraklar.some((x) => x.kod === kod)) continue
    const durum = enumDeger(o.durum, ['var', 'olasi', 'yok', 'degerlendirilemez'] as const)
    if (!durum) { hatalar.push(`kirmiziBayraklar[${kod}].durum: var | olasi | yok | degerlendirilemez olmalı.`); continue }
    bayraklar.push({ kod, durum, kriter: metin(o.kriter, AZAMI.metin), not: metin(o.not, AZAMI.metin) })
  }
  // The screen must be complete: a code the model skipped is reported as not assessable (never as "yok").
  for (const kod of kodlar) if (!bayraklar.some((x) => x.kod === kod)) bayraklar.push({ kod, durum: 'degerlendirilemez', kriter: '', not: '' })

  // differential considerations
  const ayiricilar: FotoAyirici[] = []
  if (k.ayiricilar !== undefined && !Array.isArray(k.ayiricilar)) hatalar.push('"ayiricilar" bir dizi olmalı.')
  for (const a of Array.isArray(k.ayiricilar) ? (k.ayiricilar as unknown[]) : []) {
    if (!a || typeof a !== 'object') continue
    const o = a as Record<string, unknown>
    const ad = metin(o.ad, 90)
    const anahtar = slug(ad)
    if (!ad || !anahtar || ayiricilar.some((x) => x.anahtar === anahtar)) continue
    ayiricilar.push({ anahtar, ad, guven: enumDeger(o.guven, GUVEN_DUZEYLERI) ?? 'dusuk', ayirtEdici: metin(o.ayirtEdici, AZAMI.metin) })
    if (ayiricilar.length >= AZAMI.ayirici) break
  }

  const sinirlar = (Array.isArray(k.sinirlar) ? (k.sinirlar as unknown[]) : []).map((x) => metin(x, AZAMI.metin)).filter(Boolean).slice(0, AZAMI.sinir)

  if (hatalar.length || !kalite || degerlendirilebilir === undefined) return { hatalar: hatalar.length ? hatalar : ['Şema doğrulanamadı.'] }

  return {
    hatalar: [],
    deger: {
      surum: FOTO_AI_SURUMU, mod, kalite, bolge, degerlendirilebilir,
      abstain: degerlendirilebilir ? null : { neden: abstainNeden },
      morfoloji: degerlendirilebilir ? morfoloji : null,
      gozlemler, kirmiziBayraklar: bayraklar, ayiricilar,
      oneri: metin(k.oneri, AZAMI.metin) || null,
      sinirlar,
    },
  }
}

/** Feedback targets of one evaluation: stable keys the doctor can Kabul / Düzelt / Reddet. */
export interface GozlemHedefi { anahtar: string; alan: 'bolge' | 'morfoloji' | 'gozlem' | 'bayrak' | 'ayirici'; ozellik: string; etiket: string }

export function gozlemHedefleri(d: FotoDegerlendirme): GozlemHedefi[] {
  const h: GozlemHedefi[] = []
  if (d.bolge.id) h.push({ anahtar: 'bolge', alan: 'bolge', ozellik: `bolge:${d.bolge.id}`, etiket: 'Bölge' })
  if (d.morfoloji) h.push({ anahtar: 'morfoloji', alan: 'morfoloji', ozellik: 'morfoloji', etiket: 'Morfolojik tanım' })
  for (const g of d.gozlemler) h.push({ anahtar: g.anahtar, alan: 'gozlem', ozellik: 'gozlem', etiket: g.metin })
  for (const b of d.kirmiziBayraklar) if (b.durum === 'var' || b.durum === 'olasi') h.push({ anahtar: `bayrak:${b.kod}`, alan: 'bayrak', ozellik: `bayrak:${b.kod}`, etiket: b.kod })
  for (const a of d.ayiricilar) h.push({ anahtar: `ayirici:${a.anahtar}`, alan: 'ayirici', ozellik: `ayirici:${a.anahtar}`, etiket: a.ad })
  return h
}
