/**
 * NOTYA-MODEL-LUNAPRO-01 — G4 devre kesici (circuit breaker), birincil model başına.
 *
 * Kayan pencere: birincil model son 5 dakikada ≥5 G1 (transport) / G2 (low_conf) hatası ürettiyse devre AÇILIR ve
 * 10 dakika boyunca o modele giden TÜM çağrılar koruyucuya (Sonnet 5) gider (neden = 'devre'). Süre dolunca YARI AÇIK:
 * tek bir yoklama çağrısı birincil modele gider — başarı devreyi kapatır, hata 10 dakika daha açar. Yoklama sürerken
 * gelen diğer çağrılar koruyucuya gider.
 *
 * Durum yalnız bu süreçtedir (dış depo yok). Vercel örnekleri birbirinden bağımsızdır: her sıcak örnek kendi
 * penceresini tutar, soğuk başlayan örnek kapalı devreyle başlar. Bu bilinçli: yanlış açık kalan paylaşılan bir
 * devre bütün trafiği Sonnet'e iterdi; örnek başına devre en kötü ihtimalle birkaç çağrıyı fazladan dener.
 *
 * Saat enjekte edilebilir (DEVRE_SAAT.simdi) — testler zamanı kendileri ilerletir.
 */

/**
 * NOTYA-MODEL-LUNAPRO-03 (Kaan, 2026-09-27): "Sonnet only for that request; the next request goes back to Luna-Pro
 * immediately — never stay on Sonnet and run up the bill." A 10-minute open state would hold traffic on the guardian,
 * so the breaker is OFF unless NOTYA_DEVRE_ACIK=1 (kept in code for a provider-outage decision later). When off,
 * devreDurumu is always 'kapali' and every request tries the primary first; per-request fallback is unchanged.
 */
export function devreEtkinMi(): boolean {
  return process.env.NOTYA_DEVRE_ACIK === '1'
}
export const DEVRE_AYAR = {
  /** Pencere içinde bu kadar hata devreyi açar. */
  esik: 5,
  /** Kayan pencere (ms). */
  pencereMs: 5 * 60_000,
  /** Açık kalma süresi (ms). */
  acikMs: 10 * 60_000,
  /** Yanıt vermeyen yoklama bu süreden sonra bırakılır; sıradaki çağrı yeniden yoklar. */
  yoklamaZamanAsimiMs: 2 * 60_000,
}

/** Enjekte edilebilir saat (testler). */
export const DEVRE_SAAT = { simdi: (): number => Date.now() }

export type DevreHali = 'kapali' | 'acik' | 'yari-acik'

type Kayit = { hatalar: number[]; acikBitis: number | null; yoklamaBasladi: number | null }

const kayitlar = new Map<string, Kayit>()

function kayit(model: string): Kayit {
  let k = kayitlar.get(model)
  if (!k) { k = { hatalar: [], acikBitis: null, yoklamaBasladi: null }; kayitlar.set(model, k) }
  return k
}

/** Modelin devre hali (testler ve gözlem). */
export function devreDurumu(model: string): DevreHali {
  if (!devreEtkinMi()) return 'kapali'
  const k = kayitlar.get(model)
  if (!k || k.acikBitis === null) return 'kapali'
  return DEVRE_SAAT.simdi() < k.acikBitis ? 'acik' : 'yari-acik'
}

/** Bütün devreleri kapatır (testler). */
export function devreSifirla(): void {
  kayitlar.clear()
}

/**
 * Bu çağrı birincil modele gidebilir mi? Kapalı → evet. Açık → hayır. Yarı açık → yalnız tek yoklama çağrısı
 * (bu çağrı yoklamayı üstlenir; sonucu devreBasari / devreHata / devreNotr ile bildirilmelidir).
 */
export function devreBirincilIzinli(model: string): boolean {
  const hal = devreDurumu(model)
  if (hal === 'kapali') return true
  if (hal === 'acik') return false
  const k = kayit(model)
  const simdi = DEVRE_SAAT.simdi()
  if (k.yoklamaBasladi !== null && simdi - k.yoklamaBasladi < DEVRE_AYAR.yoklamaZamanAsimiMs) return false
  k.yoklamaBasladi = simdi
  return true
}

/** Birincil model kullanılabilir cevap verdi. Yoklamaysa devre kapanır. */
export function devreBasari(model: string): void {
  const k = kayitlar.get(model)
  if (!k || k.acikBitis === null) return
  if (k.yoklamaBasladi !== null) kayitlar.delete(model)
}

/** Birincil model G1/G2 hatası verdi. Yoklamaysa devre yeniden açılır; değilse pencereye yazılır, eşikte açılır. */
export function devreHata(model: string): void {
  const k = kayit(model)
  const simdi = DEVRE_SAAT.simdi()
  if (k.acikBitis !== null) {
    // Yarı açıkta yoklama düştü → yeniden aç. (Açıkken birincile çağrı gitmez; gelirse de süre uzar.)
    k.acikBitis = simdi + DEVRE_AYAR.acikMs
    k.yoklamaBasladi = null
    k.hatalar = []
    return
  }
  k.hatalar = k.hatalar.filter((t) => simdi - t < DEVRE_AYAR.pencereMs)
  k.hatalar.push(simdi)
  if (k.hatalar.length >= DEVRE_AYAR.esik) {
    k.acikBitis = simdi + DEVRE_AYAR.acikMs
    k.yoklamaBasladi = null
    k.hatalar = []
  }
}

/** Yoklama ne başarı ne G1/G2 hatası ile bitti (ör. 4xx istek hatası) — yoklama hakkı serbest kalır. */
export function devreNotr(model: string): void {
  const k = kayitlar.get(model)
  if (k && k.acikBitis !== null) k.yoklamaBasladi = null
}
