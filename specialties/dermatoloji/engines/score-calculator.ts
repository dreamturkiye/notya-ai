/**
 * Scores stay in this folder. PASI BSA PGA DLQI EASI SCORAD POEM UAS7 VASI SALT Hurley PDAI.
 */
export type PasiRegion = { e: number; i: number; d: number; a: number; /** EASI likenifikasyon (4. şiddet bileşeni); PASI'de kullanılmaz. */ l?: number }

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

/** PASI = 0.1(E+I+D)A head + 0.2 upper + 0.3 trunk + 0.4 lower. E/I/D 0–4, A 0–6. */
export function pasi(input: { head: PasiRegion; upper: PasiRegion; trunk: PasiRegion; lower: PasiRegion }): number {
  const part = (w: number, r: PasiRegion) =>
    w * (clamp(r.e, 0, 4) + clamp(r.i, 0, 4) + clamp(r.d, 0, 4)) * clamp(r.a, 0, 6)
  const v = part(0.1, input.head) + part(0.2, input.upper) + part(0.3, input.trunk) + part(0.4, input.lower)
  return Math.round(v * 10) / 10
}

export function dlqi(items0to3: number[]): number {
  return items0to3.slice(0, 10).reduce((s, n) => s + clamp(n, 0, 3), 0)
}

/** EASI şiddeti dört bileşendir: eritem, ödem/papülasyon, ekskoriasyon, likenifikasyon (her biri 0–3). */
export function easi(input: { head: PasiRegion; upper: PasiRegion; trunk: PasiRegion; lower: PasiRegion }): number {
  const area = (a: number) => clamp(a, 0, 6)
  const sev = (r: PasiRegion) => clamp(r.e, 0, 3) + clamp(r.i, 0, 3) + clamp(r.d, 0, 3) + clamp(r.l ?? 0, 0, 3)
  const v = 0.1 * sev(input.head) * area(input.head.a)
    + 0.2 * sev(input.upper) * area(input.upper.a)
    + 0.3 * sev(input.trunk) * area(input.trunk.a)
    + 0.4 * sev(input.lower) * area(input.lower.a)
  return Math.round(v * 10) / 10
}

export function uas7(daily0to6: number[]): number {
  return daily0to6.slice(0, 7).reduce((s, n) => s + clamp(n, 0, 6), 0)
}

export function salt(percent: number): number {
  return clamp(percent, 0, 100)
}

export function pdai(score: number): number {
  return clamp(score, 0, 263)
}

export function hurley(stage: 1 | 2 | 3): 1 | 2 | 3 {
  return stage
}

export function poem(items0to4: number[]): number {
  return items0to4.slice(0, 7).reduce((s, n) => s + clamp(n, 0, 4), 0)
}

export function pga(score0to4: number): number {
  return clamp(score0to4, 0, 4)
}

export function bsaPercent(p: number): number {
  return clamp(p, 0, 100)
}

export function scorad(extent0to100: number, intensity0to18: number, subjective0to20: number): number {
  return Math.round((extent0to100 / 5 + 3.5 * intensity0to18 + subjective0to20) * 10) / 10
}

export function vasi(percent: number): number {
  return clamp(percent, 0, 100)
}

// ──────────────────────────────────────────────────────────────────────────────
// DERM-EXCEPTIONAL-01 — bölge çalışma sayfaları (PASI / EASI / SCORAD / SALT / UAS7 / IGA).
// Serbest sayı girişi yerine hekim bölge bölge E/I/D + alan girer, toplam burada hesaplanır.
// Eşikler ve şiddet bantları rol atfıyla anılır (PSOKİD 2025 “onluk kuralı”, TDD AD 2018);
// tedavi, potens ve doz kararı hekimindir — burada ilaç adı veya doz yoktur.
// ──────────────────────────────────────────────────────────────────────────────

export type BolgeAnahtari = 'head' | 'upper' | 'trunk' | 'lower'

export type BolgeTanimi = {
  id: BolgeAnahtari
  /** Hekime görünen TR etiket */
  ad: string
  /** PASI / EASI yetişkin bölge katsayısı */
  agirlik: number
  /** Bölgenin vücut yüzeyine yaklaşık katkısı — hekime ipucu */
  ipucu: string
}

/** Yetişkin bölge katsayıları. Çocukta baş/alt ekstremite katsayıları farklıdır — pediatrik hesap hekim teyidiyle. */
export const PASI_BOLGELERI: BolgeTanimi[] = [
  { id: 'head', ad: 'Baş / boyun', agirlik: 0.1, ipucu: 'yüz, saçlı deri, boyun' },
  { id: 'upper', ad: 'Üst ekstremiteler', agirlik: 0.2, ipucu: 'kollar, eller' },
  { id: 'trunk', ad: 'Gövde', agirlik: 0.3, ipucu: 'göğüs, karın, sırt, aksilla, kasık' },
  { id: 'lower', ad: 'Alt ekstremiteler', agirlik: 0.4, ipucu: 'kalça, bacaklar, ayaklar' },
]

/** PASI şiddet alanları: E/I/D 0–4. */
export const PASI_SIDDET_ALANLARI: Array<{ id: keyof Pick<PasiRegion, 'e' | 'i' | 'd'>; ad: string; max: number }> = [
  { id: 'e', ad: 'Eritem', max: 4 },
  { id: 'i', ad: 'İndurasyon / kalınlık', max: 4 },
  { id: 'd', ad: 'Deskuamasyon (pullanma)', max: 4 },
]

/** EASI şiddet alanları: 0–3 (indurasyon yerine papülasyon, ayrıca ekskoriasyon EASI’de dördüncü alandır). */
export const EASI_SIDDET_ALANLARI: Array<{ id: keyof Pick<PasiRegion, 'e' | 'i' | 'd'>; ad: string; max: number }> = [
  { id: 'e', ad: 'Eritem', max: 3 },
  { id: 'i', ad: 'Ödem / papülasyon', max: 3 },
  { id: 'd', ad: 'Ekskoriasyon + likenifikasyon', max: 3 },
]

/** PASI alan skoru 0–6 karşılıkları (bölge içi tutulum yüzdesi). */
export const PASI_ALAN_SKALASI: Array<{ skor: number; ad: string }> = [
  { skor: 0, ad: 'tutulum yok' },
  { skor: 1, ad: '%1–9' },
  { skor: 2, ad: '%10–29' },
  { skor: 3, ad: '%30–49' },
  { skor: 4, ad: '%50–69' },
  { skor: 5, ad: '%70–89' },
  { skor: 6, ad: '%90–100' },
]

/** EASI alan skoru 0–6 karşılıkları. */
export const EASI_ALAN_SKALASI: Array<{ skor: number; ad: string }> = [
  { skor: 0, ad: 'tutulum yok' },
  { skor: 1, ad: '%1–9' },
  { skor: 2, ad: '%10–29' },
  { skor: 3, ad: '%30–49' },
  { skor: 4, ad: '%50–69' },
  { skor: 5, ad: '%70–89' },
  { skor: 6, ad: '%90–100' },
]

export type BolgeGirdisi = Record<BolgeAnahtari, PasiRegion>

export type BolgeKatkisi = {
  id: BolgeAnahtari
  ad: string
  agirlik: number
  /** E+I+D toplamı */
  siddet: number
  /** alan skoru 0–6 */
  alan: number
  /** bölgenin toplama katkısı */
  katki: number
  /** hekim bu bölgeye hiç dokunmadıysa true — eksik uyarısı */
  bos: boolean
}

export type SkorDokumu = {
  skor: 'pasi' | 'easi'
  toplam: number
  /** 0–72 ölçeğinde bant */
  bant: string
  bolgeler: BolgeKatkisi[]
  /** hiç veri girilmemiş bölgeler — hekime "eksik" uyarısı (0 girmek de geçerli bir cevaptır) */
  eksikBolgeler: string[]
}

function bolgeBos(r: PasiRegion | undefined): boolean {
  return !r || (r.e === 0 && r.i === 0 && r.d === 0 && r.a === 0)
}

export function bosBolge(): PasiRegion {
  return { e: 0, i: 0, d: 0, a: 0 }
}

export function bosBolgeGirdisi(): BolgeGirdisi {
  return { head: bosBolge(), upper: bosBolge(), trunk: bosBolge(), lower: bosBolge() }
}

/** PASI bandı — 0–72 ölçeği. PSOKİD “onluk kuralı”: PASI ≥ 10 orta-şiddetli tarafta değerlendirilir (karar hekimin). */
export function pasiBant(v: number): string {
  if (v === 0) return 'tutulum yok'
  if (v < 5) return 'hafif (<5)'
  if (v < 10) return 'hafif–orta (5–10)'
  if (v < 20) return 'orta–şiddetli (10–20)'
  return 'şiddetli (≥20)'
}

/** EASI bandı — 0–72 ölçeği (yaygın kullanılan kesim noktaları; klinik karar hekimin). */
export function easiBant(v: number): string {
  if (v === 0) return 'temiz'
  if (v <= 1) return 'neredeyse temiz (≤1)'
  if (v <= 7) return 'hafif (1,1–7)'
  if (v <= 21) return 'orta (7,1–21)'
  if (v <= 50) return 'şiddetli (21,1–50)'
  return 'çok şiddetli (>50)'
}

function dokum(skor: 'pasi' | 'easi', input: BolgeGirdisi): SkorDokumu {
  const sevMax = skor === 'pasi' ? 4 : 3
  const bolgeler: BolgeKatkisi[] = PASI_BOLGELERI.map((b) => {
    const r = input[b.id] || bosBolge()
    const siddet = skor === 'pasi'
      ? clamp(r.e, 0, sevMax) + clamp(r.i, 0, sevMax) + clamp(r.d, 0, sevMax)
      : clamp(r.e, 0, sevMax) + clamp(r.i, 0, sevMax) + clamp(r.d, 0, sevMax) + clamp(r.l ?? 0, 0, sevMax)
    const alan = clamp(r.a, 0, 6)
    return {
      id: b.id,
      ad: b.ad,
      agirlik: b.agirlik,
      siddet,
      alan,
      katki: Math.round(b.agirlik * siddet * alan * 100) / 100,
      bos: bolgeBos(input[b.id]),
    }
  })
  const toplam = skor === 'pasi' ? pasi(input) : easi(input)
  return {
    skor,
    toplam,
    bant: skor === 'pasi' ? pasiBant(toplam) : easiBant(toplam),
    bolgeler,
    eksikBolgeler: bolgeler.filter((b) => b.bos).map((b) => b.ad),
  }
}

/** PASI bölge dökümü — toplam `pasi()` ile aynı sonucu verir. */
export function pasiDokumu(input: BolgeGirdisi): SkorDokumu {
  return dokum('pasi', input)
}

/** EASI bölge dökümü — toplam `easi()` ile aynı sonucu verir. */
export function easiDokumu(input: BolgeGirdisi): SkorDokumu {
  return dokum('easi', input)
}

/** Dökümü kayıt (jsonb) için düzleştirir; okunurluk hekim içindir. */
export function dokumOzeti(d: SkorDokumu): string {
  return d.bolgeler.map((b) => `${b.ad}: E/I/D ${b.siddet} · alan ${b.alan} → ${b.katki}`).join(' | ')
}

// ── SCORAD ────────────────────────────────────────────────────────────────────

/** SCORAD B bileşeni: 6 alan, her biri 0–3 (toplam 0–18). */
export const SCORAD_SIDDET_ALANLARI: Array<{ id: string; ad: string }> = [
  { id: 'eritem', ad: 'Eritem' },
  { id: 'odem', ad: 'Ödem / papülasyon' },
  { id: 'sizinti', ad: 'Sızıntı / kabuklanma' },
  { id: 'ekskoriasyon', ad: 'Ekskoriasyon' },
  { id: 'likenifikasyon', ad: 'Likenifikasyon' },
  { id: 'kuruluk', ad: 'Kuruluk (tutulmayan deride)' },
]

export type ScoradGirdisi = {
  /** A: tutulan vücut yüzey alanı yüzdesi (0–100) */
  yaygınlık: number
  /** B: alan başına 0–3 */
  siddet: Record<string, number>
  /** C: kaşıntı 0–10 */
  kasinti: number
  /** C: uykusuzluk 0–10 */
  uykusuzluk: number
}

export type ScoradSonuc = {
  toplam: number
  a: number
  b: number
  c: number
  bant: string
  eksikler: string[]
}

/** SCORAD bandı — 0–103 ölçeği (yaygın kesim noktaları; karar hekimin). */
export function scoradBant(v: number): string {
  if (v < 25) return 'hafif (<25)'
  if (v <= 50) return 'orta (25–50)'
  return 'şiddetli (>50)'
}

export function scoradHesap(g: ScoradGirdisi): ScoradSonuc {
  const a = clamp(g.yaygınlık, 0, 100)
  const b = SCORAD_SIDDET_ALANLARI.reduce((s, alan) => s + clamp(Number(g.siddet?.[alan.id] ?? 0), 0, 3), 0)
  const c = clamp(g.kasinti, 0, 10) + clamp(g.uykusuzluk, 0, 10)
  const eksikler: string[] = []
  if (a === 0) eksikler.push('Tutulan yüzey alanı (%)')
  if (b === 0) eksikler.push('Şiddet alanları (6 alan)')
  return { toplam: scorad(a, b, c), a, b, c, bant: scoradBant(scorad(a, b, c)), eksikler }
}

// ── DLQI / UAS7 / SALT / IGA ──────────────────────────────────────────────────

/**
 * DLQI 10 soru, her biri 0–3 (toplam 0–30). Soru metinleri telifli anketten alınmaz —
 * hekim kendi formundaki sıraya göre puanları girer.
 */
export const DLQI_SORU_SAYISI = 10

export function dlqiBant(v: number): string {
  if (v <= 1) return 'yaşam kalitesine etkisi yok (0–1)'
  if (v <= 5) return 'hafif etki (2–5)'
  if (v <= 10) return 'orta etki (6–10)'
  if (v <= 20) return 'belirgin etki (11–20)'
  return 'çok belirgin etki (21–30)'
}

/** UAS7: 7 gün × (kabartı 0–3 + kaşıntı 0–3) = 0–42. */
export type UasGun = { kabarti: number; kasinti: number }

export function uas7Gunlerden(gunler: UasGun[]): { toplam: number; gunSayisi: number; bant: string; eksikGun: number } {
  const g = gunler.slice(0, 7)
  const toplam = g.reduce((s, x) => s + clamp(x.kabarti, 0, 3) + clamp(x.kasinti, 0, 3), 0)
  return { toplam, gunSayisi: g.length, bant: uas7Bant(toplam), eksikGun: Math.max(0, 7 - g.length) }
}

export function uas7Bant(v: number): string {
  if (v === 0) return 'ürtiker yok (0)'
  if (v <= 6) return 'iyi kontrollü (1–6)'
  if (v <= 15) return 'hafif (7–15)'
  if (v <= 27) return 'orta (16–27)'
  return 'şiddetli (28–42)'
}

/** SALT: saçlı deri dört bölgesi ağırlıklı — vertex %40, sağ %18, sol %18, oksiput %24. */
export const SALT_BOLGELERI: Array<{ id: 'vertex' | 'sag' | 'sol' | 'oksiput'; ad: string; agirlik: number }> = [
  { id: 'vertex', ad: 'Vertex (üst)', agirlik: 0.4 },
  { id: 'sag', ad: 'Sağ yan', agirlik: 0.18 },
  { id: 'sol', ad: 'Sol yan', agirlik: 0.18 },
  { id: 'oksiput', ad: 'Oksiput (arka)', agirlik: 0.24 },
]

export type SaltGirdisi = Record<'vertex' | 'sag' | 'sol' | 'oksiput', number>

export function saltBolgelerden(g: SaltGirdisi): { toplam: number; bant: string; bolgeler: Array<{ ad: string; yuzde: number; katki: number }> } {
  const bolgeler = SALT_BOLGELERI.map((b) => {
    const yuzde = clamp(Number(g[b.id] ?? 0), 0, 100)
    return { ad: b.ad, yuzde, katki: Math.round(b.agirlik * yuzde * 10) / 10 }
  })
  const toplam = Math.round(bolgeler.reduce((s, b) => s + b.katki, 0) * 10) / 10
  return { toplam: salt(toplam), bant: saltBant(toplam), bolgeler }
}

export function saltBant(v: number): string {
  if (v === 0) return 'kayıp yok'
  if (v < 25) return 'S1 (<%25)'
  if (v < 50) return 'S2 (%25–49)'
  if (v < 75) return 'S3 (%50–74)'
  if (v < 100) return 'S4 (%75–99)'
  return 'S5 (%100)'
}

/** Akne IGA — 5 basamaklı hekim değerlendirmesi (0–4). Tedavi seçimi ve doz hekimin. */
export const AKNE_IGA: Array<{ skor: 0 | 1 | 2 | 3 | 4; ad: string; tanim: string }> = [
  { skor: 0, ad: 'Temiz', tanim: 'Lezyon yok; post-inflamatuvar renk değişikliği olabilir' },
  { skor: 1, ad: 'Neredeyse temiz', tanim: 'Az sayıda dağınık komedon ve nadir küçük papül' },
  { skor: 2, ad: 'Hafif', tanim: 'Komedonlar belirgin, az sayıda papül ve püstül' },
  { skor: 3, ad: 'Orta', tanim: 'Çok sayıda papül ve püstül; en fazla bir nodül' },
  { skor: 4, ad: 'Şiddetli', tanim: 'Yaygın papül ve püstül ile birlikte nodüller' },
]

export function akneIga(skor: number): 0 | 1 | 2 | 3 | 4 {
  return clamp(Math.round(skor), 0, 4) as 0 | 1 | 2 | 3 | 4
}

export function akneIgaAdi(skor: number): string {
  return AKNE_IGA.find((x) => x.skor === akneIga(skor))?.ad ?? '—'
}

// ── Trend (iki kayıt arası değişim) ───────────────────────────────────────────

export type SkorTrend = {
  ad: string
  ilk: number
  son: number
  fark: number
  yuzde: number | null
  yon: 'iyilesme' | 'kotulesme' | 'degismedi'
}

/** Kronolojik iki değerden trend. Yüzde değişim ilk değer 0 ise null (bölme yok). */
export function skorTrend(ad: string, ilk: number | null | undefined, son: number | null | undefined): SkorTrend | null {
  if (ilk == null || son == null) return null
  const fark = Math.round((son - ilk) * 10) / 10
  return {
    ad,
    ilk,
    son,
    fark,
    yuzde: ilk === 0 ? null : Math.round(((son - ilk) / ilk) * 1000) / 10,
    yon: fark < 0 ? 'iyilesme' : fark > 0 ? 'kotulesme' : 'degismedi',
  }
}

/** Araçlar › PASI/EASI — SiddetBandi şekli (karar desteği; klinik yorum hekimindir). */
export type SiddetBandi = { kod: 'hafif' | 'orta' | 'siddetli'; ad: string }

export function pasiBandi(deger: number): SiddetBandi {
  if (deger < 10) return { kod: 'hafif', ad: pasiBant(deger) }
  if (deger < 20) return { kod: 'orta', ad: pasiBant(deger) }
  return { kod: 'siddetli', ad: pasiBant(deger) }
}

export function easiBandi(deger: number): SiddetBandi {
  if (deger < 7) return { kod: 'hafif', ad: easiBant(deger) }
  if (deger < 21) return { kod: 'orta', ad: easiBant(deger) }
  return { kod: 'siddetli', ad: easiBant(deger) }
}

export function scoradBandi(deger: number): SiddetBandi {
  if (deger < 25) return { kod: 'hafif', ad: scoradBant(deger) }
  if (deger < 50) return { kod: 'orta', ad: scoradBant(deger) }
  return { kod: 'siddetli', ad: scoradBant(deger) }
}
