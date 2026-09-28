/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın kulağı: Deepgram Live, konuşma turu ayarı.
 *
 * Dikte ayarından (lib/transcription/deepgramClient.ts DEEPGRAM_OPTIONS — bütün muayeneyi kaydeder, diarize,
 * utterance_end_ms 1500) AYRI: tek konuşmacı (doktor), diarize yok, doğal konuşma duraklamasında tur biter.
 *
 * Model: nova-3 + language=tr. Deepgram'ın dil tablosunda Türkçe Nova-3 ve Nova-2'de var; tıbbi modeller
 * (nova-2-medical / nova-3-medical) yalnız İngilizce — Türkçe tıbbi model yok
 * (developers.deepgram.com/docs/models-languages-overview, 2026-09-28'de bakıldı).
 *
 * Tur (TurAlgilayici) — Deepgram'ın belgelediği biçim (docs/understand-endpointing-interim-results,
 * docs/understanding-end-of-speech-detection):
 *   - is_final:false → ara sonuç, değişebilir. ASLA tur açmaz.
 *   - is_final:true  → o ses parçasının kesin metni; tampona eklenir. Uzun bir söz birden çok is_final taşır.
 *   - speech_final:true → söz bitti (endpointing sessizliği). Tampon = tam söz → BİR tur.
 *   - UtteranceEnd → speech_final gelmeden biten söz için yedek (gürültüde VAD endpoint'i kaçırabilir). Tampon
 *     boşsa (speech_final zaten turu açtıysa) hiçbir şey yapmaz — aynı söz iki kez gönderilmez.
 */

/** Doğal konuşma duraklaması (ms). Dr. Gökhan'ın testinden sonra ayarlanacak — tek yerde. */
export const DG_SESSIZLIK_MS = 400
/** UtteranceEnd yedeği (ms). Deepgram: ara sonuçlar ~1 sn'de bir geldiği için 1000'in altı fayda vermez. */
export const DG_SOZ_SONU_MS = 1000
export const DG_MODEL = 'nova-3'
export const DG_DIL = 'tr'
/** Mikrofon işlemcisinin (public/ses/mikrofon-islemcisi.js) çıkış biçimi. */
export const DG_ORNEK_HZ = 16_000
/** 16 kHz, 16 bit, tek kanal: saniyede bayt. Gönderilen ses süresi = bayt / bu. */
export const DG_SANIYE_BAYT = DG_ORNEK_HZ * 2
export const DEEPGRAM_CANLI_URL = 'wss://api.deepgram.com/v1/listen'
/** Deepgram 10 sn ses / KeepAlive görmezse bağlantıyı kapatır (NET-0001); ses kapısı kapalıyken bu aralıkla yollanır. */
export const DG_CANLI_TUT_MS = 4_000

export function deepgramCanliParametreleri(): Record<string, string> {
  return {
    model: DG_MODEL,
    language: DG_DIL,
    encoding: 'linear16',
    sample_rate: String(DG_ORNEK_HZ),
    channels: '1',
    interim_results: 'true',
    endpointing: String(DG_SESSIZLIK_MS),
    utterance_end_ms: String(DG_SOZ_SONU_MS),
    vad_events: 'true',
    smart_format: 'true',
    punctuate: 'true',
  }
}

export function deepgramCanliUrl(): string {
  return `${DEEPGRAM_CANLI_URL}?${new URLSearchParams(deepgramCanliParametreleri()).toString()}`
}

type DgSonuc = {
  type?: string
  is_final?: boolean
  speech_final?: boolean
  channel?: { alternatives?: { transcript?: string }[] }
}

function sozMetni(m: DgSonuc): string {
  return String(m.channel?.alternatives?.[0]?.transcript || '').replace(/\s+/g, ' ').trim()
}

export class TurAlgilayici {
  private parcalar: string[] = []

  constructor(private readonly cb: {
    /** Bitmiş söz — tam bir kez. */
    tur: (metin: string) => void
    /** Doktor konuşuyor (ara ya da kesin metin geldi, söz henüz bitmedi). */
    konusuyor?: (metinSimdiye: string) => void
  }) {}

  /** Deepgram'dan gelen bir mesaj (JSON metni ya da ayrıştırılmış nesne). */
  isle(ham: unknown): void {
    let m: DgSonuc | null = null
    if (typeof ham === 'string') {
      try { m = JSON.parse(ham) as DgSonuc } catch { return }
    } else if (ham && typeof ham === 'object') m = ham as DgSonuc
    if (!m) return
    if (m.type === 'Results') {
      const t = sozMetni(m)
      if (m.is_final !== true) {
        if (t) this.cb.konusuyor?.([...this.parcalar, t].join(' '))
        return
      }
      if (t) {
        this.parcalar.push(t)
        this.cb.konusuyor?.(this.parcalar.join(' '))
      }
      if (m.speech_final === true) this.bitir()
      return
    }
    if (m.type === 'UtteranceEnd') this.bitir()
  }

  /** Yarım kalmış söz (bağlantı koptu, oturum kapandı) atılır — tur açılmaz. */
  sifirla(): void {
    this.parcalar = []
  }

  private bitir(): void {
    if (!this.parcalar.length) return
    const metin = this.parcalar.join(' ').replace(/\s+/g, ' ').trim()
    this.parcalar = []
    if (metin) this.cb.tur(metin)
  }
}
