/**
 * NOTYA-SES-FISH-SADECE-01 — Ayşe Kaya'nın kulağı, satıcısız: yerel söz algılama (VAD) + WAV.
 *
 * Fish Audio'nun canlı akışlı ASR'si yok; /v1/asr dosya alır (docs.fish.audio/features/speech-to-text, 2026-09-28'de
 * bakıldı). Bu yüzden sıra alma tarayıcıda yapılır: mikrofon çerçevesinin RMS'i (public/ses/mikrofon-islemcisi.js —
 * söz kesmenin kullandığı aynı ölçü) SOZ_ESIGI_RMS üstünde SOZ_BASLAMA_MS kalırsa söz başlar; söz sürerken ses
 * SOZ_SONU_SESSIZLIK_MS boyunca eşik altında kalırsa söz BİTER. Bu, akışlı ASR satıcılarının `endpointing` ayarının istemcide
 * hesaplanan karşılığıdır. Biten söz TEK bir WAV olur → TEK Fish ASR çağrısı → TEK tur. Büyüyen tampon için ara
 * ASR çağrısı YOKTUR (ara + kesin döküm çift dağıtımının bir türü geri gelmesin).
 *
 * Sabitler masa başında seçildi; Dr. Gökhan / Kaan'ın ilk canlı dinlemesinden sonra ayarlanacak — tek yerde.
 */

/** Söz eşiği: AEC + gürültü bastırma + AGC sonrası mikrofon RMS'i (0–1, ~−34 dBFS). Oda tabanı genelde 0,001–0,005,
 *  dizüstü mikrofonunda normal konuşma 0,03–0,2. Söz kesme eşiği (KESME_ESIGI_RMS 0,06) bundan yüksektir çünkü o,
 *  Fish'in yankı artığının üstünde kalmak zorunda; burada Fish susmuştur. */
export const SOZ_ESIGI_RMS = 0.02
/** Eşik üstünde bu kadar kesintisiz ses söz başlatır (ms) — masaya vuruş / tık söz sayılmaz. */
export const SOZ_BASLAMA_MS = 100
/** Söz sonu: sözden sonra bu kadar sessizlik (ms). Brief aralığı 400–600; 500 = ortası. Düşürmek cevabı hızlandırır
 *  ama cümle içi duraklamada sözü böler (bölünen söz FishOturumu'nda birleşir, ama bir ASR + bir iptal edilmiş model
 *  çağrısı boşa gider); yükseltmek her tura doğrudan gecikme ekler. */
export const SOZ_SONU_SESSIZLIK_MS = 500
/** Söz başlamadan önceki bu kadar ses de WAV'a girer (ms) — yumuşak ilk hece kesilmesin. */
export const SOZ_ON_KAYIT_MS = 300
/** Sözün sonunda bırakılan sessizlik (ms); kalanı yüklenmez (Fish ASR saniye başına ücretlendirir). */
export const SOZ_KUYRUK_MS = 150
/** Bundan az SESLİ süre (ms) söz sayılmaz — öksürük, "hı", tık; Fish'e hiç gitmez. */
export const EN_KISA_SOZ_MS = 250
/** Tek söz en çok bu kadar sürer (ms); aşarsa kapatılır (sonraki parça FishOturumu'nda birleşir). 16 kHz × 16 bit ×
 *  30 sn ≈ 960 KB — Fish'in 20 MB istek sınırının çok altında, fish-dinle rotasının üst sınırının da altında. */
export const EN_UZUN_SOZ_MS = 30_000

export const SOZ_ORNEK_HZ = 16_000
/** 16 kHz, 16 bit, tek kanal: saniyede bayt. */
export const SOZ_SANIYE_BAYT = SOZ_ORNEK_HZ * 2

type Cerceve = { pcm: ArrayBuffer; ms: number }

export type BitenSoz = {
  /** Sözün PCM çerçeveleri (16 kHz linear16), ön kayıt dahil, uzun kuyruk kırpılmış. */
  pcm: ArrayBuffer[]
  /** WAV'a giren toplam süre (ms). */
  sureMs: number
  /** Eşik üstündeki süre (ms). */
  sesliMs: number
  /** Son sesli çerçevenin zamanı — doktorun sözü burada bitti (gecikme ölçümünün başlangıcı). */
  sonSes: number
  /** Sözün bittiğine karar verilen an (sonSes + ~SOZ_SONU_SESSIZLIK_MS). */
  ilan: number
  /** EN_UZUN_SOZ_MS'ye çarpıp kapatıldı. */
  kesildi: boolean
}

export class SozAlgilayici {
  private konusuyor = false
  private onKayit: Cerceve[] = []
  private onKayitMs = 0
  private aday = 0
  private parcalar: Cerceve[] = []
  private sureMs = 0
  private sesliMs = 0
  private sessizMs = 0
  private sonSes = 0

  constructor(private readonly cb: {
    /** Biten söz — tam bir kez. */
    soz: (s: BitenSoz) => void
    /** Söz başladı (doktor konuşuyor). */
    basladi?: () => void
    /** Söz sayılmayacak kadar kısa ses atıldı. */
    atildi?: (sesliMs: number) => void
  }) {}

  konusuyorMu(): boolean { return this.konusuyor }

  /** Bir mikrofon çerçevesi. `simdi`: çerçevenin geliş zamanı (ms). */
  cerceve(pcm: ArrayBuffer, rms: number, ms: number, simdi: number): void {
    const sesli = rms >= SOZ_ESIGI_RMS
    if (!this.konusuyor) {
      this.onKayit.push({ pcm, ms })
      this.onKayitMs += ms
      while (this.onKayit.length > 1 && this.onKayitMs - this.onKayit[0].ms >= SOZ_ON_KAYIT_MS) this.onKayitMs -= this.onKayit.shift()!.ms
      this.aday = sesli ? this.aday + ms : 0
      if (this.aday < SOZ_BASLAMA_MS) return
      this.konusuyor = true
      this.parcalar = this.onKayit
      this.sureMs = this.onKayitMs
      this.sesliMs = this.aday
      this.sessizMs = 0
      this.sonSes = simdi
      this.onKayit = []
      this.onKayitMs = 0
      this.aday = 0
      this.cb.basladi?.()
      return
    }
    this.parcalar.push({ pcm, ms })
    this.sureMs += ms
    if (sesli) {
      this.sesliMs += ms
      this.sessizMs = 0
      this.sonSes = simdi
    } else {
      this.sessizMs += ms
    }
    if (this.sessizMs >= SOZ_SONU_SESSIZLIK_MS) this.bitir(simdi, false)
    else if (this.sureMs >= EN_UZUN_SOZ_MS) this.bitir(simdi, true)
  }

  /** Yarım söz atılır (oturum kapandı, söz kesildi) — tur açılmaz. */
  sifirla(): void {
    this.konusuyor = false
    this.onKayit = []
    this.onKayitMs = 0
    this.aday = 0
    this.parcalar = []
    this.sureMs = this.sesliMs = this.sessizMs = 0
  }

  private bitir(simdi: number, kesildi: boolean): void {
    let parcalar = this.parcalar
    let sureMs = this.sureMs
    // Uzun sessiz kuyruk yüklenmez — SOZ_KUYRUK_MS kalır.
    let fazla = this.sessizMs - SOZ_KUYRUK_MS
    while (fazla > 0 && parcalar.length > 1 && parcalar[parcalar.length - 1].ms <= fazla) {
      const son = parcalar[parcalar.length - 1]
      parcalar = parcalar.slice(0, -1)
      fazla -= son.ms
      sureMs -= son.ms
    }
    const sesliMs = this.sesliMs
    const sonSes = this.sonSes
    this.sifirla()
    if (sesliMs < EN_KISA_SOZ_MS) { this.cb.atildi?.(sesliMs); return }
    this.cb.soz({ pcm: parcalar.map((c) => c.pcm), sureMs, sesliMs, sonSes, ilan: simdi, kesildi })
  }
}

/** PCM16 mono çerçeveler → tek WAV dosyası (44 baytlık RIFF başlığı). Fish /v1/asr wav kabul eder. */
export function wavKodla(parcalar: ArrayBuffer[], hz: number = SOZ_ORNEK_HZ): ArrayBuffer {
  const veri = parcalar.reduce((a, p) => a + p.byteLength, 0)
  const out = new ArrayBuffer(44 + veri)
  const v = new DataView(out)
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  yaz(0, 'RIFF')
  v.setUint32(4, 36 + veri, true)
  yaz(8, 'WAVE')
  yaz(12, 'fmt ')
  v.setUint32(16, 16, true) // fmt parçası boyu
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // tek kanal
  v.setUint32(24, hz, true)
  v.setUint32(28, hz * 2, true) // bayt / sn
  v.setUint16(32, 2, true) // blok hizası
  v.setUint16(34, 16, true) // örnek başına bit
  yaz(36, 'data')
  v.setUint32(40, veri, true)
  const hedef = new Uint8Array(out)
  let o = 44
  for (const p of parcalar) { hedef.set(new Uint8Array(p), o); o += p.byteLength }
  return out
}
