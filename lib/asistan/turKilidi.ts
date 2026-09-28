/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — bir doktor sözü = EN FAZLA bir model turu.
 *
 * Anahtar: (doktor, asistan oturumu, istemcinin söz başına ürettiği nonce). Aynı anahtarla gelen ikinci istek
 * (istemcinin ağ katmanı yeniden denedi, çift dokunuş…) turu YENİDEN BAŞLATMAZ: çalışan ya da bitmiş turun
 * yayınına abone olur; o ana kadar çıkan cümleleri baştan, sonrakileri canlı alır. İş fonksiyonu anahtar başına
 * bir kez çağrılır. Bitmiş tur KILIT_OMRU_MS boyunca hatırlanır (geç gelen tekrar yine modeli çağırmaz).
 *
 * İptal (doktor sözü kesti): yayına bağlı son dinleyici ayrılınca ya da aynı oturumda YENİ bir nonce gelince,
 * sesi henüz kapanmamış tur iptal edilir (model akışı durur). Ses turu kapandıktan sonra (ekran cevabı arka planda
 * tamamlanıyor, NOTYA-SES-ERKEN-01) iptal edilmez — ekran cevabı ve [devam] kalanı yarım kalmasın.
 *
 * Süreç içidir (lib/ai/devre.ts gibi): Vercel örnekleri ayrı haritalar tutar. Aynı tur iki ayrı örneğe düşerse bu
 * kilit onu göremez — istemci zaten kendiliğinden yeniden denemez (lib/asistan/fishOturumu.ts); sınır
 * docs/SES-FISH-UCTAN-UCA.md'de yazılı.
 */

export type TurOlayi =
  | { t: 'soz'; metin: string }
  | { t: 'veda' }
  | { t: 'bitti'; iptal: boolean }
  | { t: 'hata'; soz: string }

export const KILIT_OMRU_MS = 60_000

type Dinleyici = (o: TurOlayi) => void

export class TurYayini {
  readonly olaylar: TurOlayi[] = []
  private dinleyiciler = new Set<Dinleyici>()
  private kapandi = false

  get bittiMi(): boolean { return this.kapandi }

  yayinla(o: TurOlayi): void {
    if (this.kapandi) return
    this.olaylar.push(o)
    if (o.t === 'bitti' || o.t === 'hata') this.kapandi = true
    for (const d of [...this.dinleyiciler]) {
      try { d(o) } catch { /* bir dinleyicinin hatası diğerini düşürmez */ }
    }
    if (this.kapandi) this.dinleyiciler.clear()
  }

  /** Geçmişi baştan verir, sonra canlı. Dönen fonksiyon aboneliği bırakır. */
  dinle(d: Dinleyici): () => void {
    for (const o of this.olaylar) d(o)
    if (this.kapandi) return () => {}
    this.dinleyiciler.add(d)
    return () => { this.dinleyiciler.delete(d) }
  }
}

type Kayit = {
  oturum: string
  yayin: TurYayini
  kontrol: AbortController
  abone: number
  bitis: number | null
}

export class TurKilidi {
  private kayitlar = new Map<string, Kayit>()
  private readonly omurMs: number
  private readonly simdi: () => number

  constructor(o: { omurMs?: number; simdi?: () => number } = {}) {
    this.omurMs = o.omurMs ?? KILIT_OMRU_MS
    this.simdi = o.simdi ?? Date.now
  }

  static anahtar(doktorId: string, oturumId: string, nonce: string): string {
    return `${doktorId}\u0000${oturumId}\u0000${nonce}`
  }

  private temizle(): void {
    const t = this.simdi()
    for (const [k, v] of this.kayitlar) if (v.bitis !== null && t - v.bitis > this.omurMs) this.kayitlar.delete(k)
  }

  /**
   * `is` yalnız bu anahtar ilk kez görüldüğünde çağrılır. `birak` bu isteğin aboneliğini bırakır (istemci
   * bağlantıyı kapattı); son abone ayrılınca ses turu sürüyorsa iptal edilir.
   */
  al(anahtar: string, oturum: string, is: (yayin: TurYayini, iptal: AbortSignal) => Promise<void>): { yayin: TurYayini; yeni: boolean; birak: () => void } {
    this.temizle()
    let k = this.kayitlar.get(anahtar)
    const yeni = !k
    if (!k) {
      // Aynı oturumda yeni söz: sesi hâlâ akan eski tur(lar) bırakılır — doktor konuyu değiştirdi.
      for (const [ak, eski] of this.kayitlar) {
        if (ak !== anahtar && eski.oturum === oturum && !eski.yayin.bittiMi) eski.kontrol.abort()
      }
      const kayit: Kayit = { oturum, yayin: new TurYayini(), kontrol: new AbortController(), abone: 0, bitis: null }
      this.kayitlar.set(anahtar, kayit)
      k = kayit
      void Promise.resolve()
        .then(() => is(kayit.yayin, kayit.kontrol.signal))
        .catch(() => { kayit.yayin.yayinla({ t: 'hata', soz: 'Şu an cevap veremiyorum Hocam, bir daha söyler misiniz?' }) })
        .finally(() => {
          if (!kayit.yayin.bittiMi) kayit.yayin.yayinla({ t: 'bitti', iptal: kayit.kontrol.signal.aborted })
          kayit.bitis = this.simdi()
        })
    }
    const kayit = k
    kayit.abone += 1
    let birakti = false
    return {
      yayin: kayit.yayin,
      yeni,
      birak: () => {
        if (birakti) return
        birakti = true
        kayit.abone = Math.max(0, kayit.abone - 1)
        if (kayit.abone === 0 && !kayit.yayin.bittiMi) kayit.kontrol.abort()
      },
    }
  }

  /** Test / gözlem: bu anahtar kilitte mi. */
  var(anahtar: string): boolean {
    this.temizle()
    return this.kayitlar.has(anahtar)
  }
}

/** Süreç başına tek kilit (fish-tur rotası). */
export const FISH_TUR_KILIDI = new TurKilidi()
