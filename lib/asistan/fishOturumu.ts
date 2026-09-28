/**
 * NOTYA-SES-FISH-SADECE-01 — Ayşe Kaya'nın sesli görüşmesi, uçtan uca Fish Audio (tarayıcı orkestrası).
 * ElevenLabs YOK, başka satıcı YOK: Fish dinler (/v1/asr), Fish konuşur (/v1/tts).
 *
 *   mikrofon (echoCancellation + noiseSuppression) → 16 kHz PCM → SozAlgilayici (yerel VAD, bitmiş söz)
 *   → WAV → TEK /api/asistan/fish-dinle isteği (Fish ASR) → metin
 *   → TEK /api/asistan/fish-tur isteği (söz başına nonce) → NDJSON cümleler → Fish (fishCalar) → hoparlör
 *
 * Bağımlılıklar dışarıdan verilir (tarayıcı uyarlayıcıları: lib/asistan/fishTarayici.ts) — kurallar Node testinde
 * sahte mikrofon / ASR / Fish ile sınanır (lib/asistan/fishUctanUca.test.ts).
 *
 * YANKI (docs/SES-FISH-UCTAN-UCA.md): Fish aynı hoparlörden çalıyor. Tarayıcının yankı giderici (AEC) kısıtı açık,
 * AMA ona güvenilmez: Fish sesi duyulabilir olduğu sürece (çalıyor / kuyrukta + YANKI_KUYRUK_MS oda yankısı)
 * mikrofon söz algılayıcıya VERİLMEZ — Ayşe'nin kendi sesi hiç WAV'a girmez, hiç yazıya dökülmez.
 *
 * SÖZ KESME (barge-in): kapı kapalıyken mikrofon yerelde dinlenir — AEC sonrası sinyal KESME_ESIGI_RMS'in üstünde
 * KESME_SURE_MS kalırsa doktor konuşuyordur: Fish anında susar, sesi hâlâ akan tur iptal edilir (fetch bırakılır →
 * sunucuda model akışı durur, AiIptalHatasi), kapı açılır ve son ON_KAYIT_MS'lik ses söz algılayıcıya verilir
 * (sözün başı kaybolmaz).
 *
 * TEK TUR: yalnız VAD'ın bitirdiği söz Fish ASR'ye gider — büyüyen tampon için ara çağrı yok. Söz başına bir ASR,
 * bir nonce, bir model çağrısı. Ayşe henüz tek kelime söylemeden doktor sözüne devam ederse (duraklayıp sürdürdü)
 * önceki istek bırakılır ve iki parça TEK sözde birleşir. İstemci bir ASR'yi ya da turu kendiliğinden yeniden
 * denemez; Fish hatasında başka satıcıya düşülmez — hata görünür, doktor tekrar söyler.
 */
import { SozAlgilayici, wavKodla, type BitenSoz } from '@/lib/asistan/sozAlgilayici'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import type { TurOlayi } from '@/lib/asistan/turKilidi'

/** Fish sustuktan sonra oda yankısı sönene kadar kapı kapalı kalır (ms). */
export const YANKI_KUYRUK_MS = 300
/** Söz kesme eşiği: AEC sonrası mikrofon RMS'i (0–1). Canlı dinleme testinde ayarlanacak. */
export const KESME_ESIGI_RMS = 0.06
/** Eşik üstünde bu kadar süre (ms) kalan ses söz kesmedir — tek bir tık / öksürük değil. */
export const KESME_SURE_MS = 180
/** Söz kesilince söz algılayıcıya geriye dönük verilen ses (ms). */
export const ON_KAYIT_MS = 500
/** Kullanım sayacı bu aralıkla sunucuya yollanır (tarayıcı çökerse kayıp en çok bu kadar). */
export const KULLANIM_ARALIGI_MS = 60_000

export const DINLEME_HATASI = 'Sizi duyamadım — bir daha söyler misiniz?'
export const TUR_HATASI = 'Bağlantıda bir sorun oldu — bir daha söyler misiniz?'

export interface MikrofonKaynagi {
  /** Her çerçeve: 16 kHz linear16 PCM, çerçevenin RMS'i (0–1), süresi (ms). */
  baslat(cerceve: (pcm: ArrayBuffer, rms: number, sureMs: number) => void): Promise<void>
  durdur(): void
}
/** Bitmiş bir sözün WAV'ı → Fish ASR metni. Söz başına TAM BİR çağrı; yeniden denemez. */
export type DinlemeIstegi = (g: { wav: ArrayBuffer; sureMs: number; sinyal: AbortSignal }) => Promise<{ metin: string }>
export type TurIstegi = (g: { metin: string; nonce: string; sinyal: AbortSignal }) => AsyncIterable<TurOlayi>
export interface FishSesi {
  soyle(metin: string): void
  kes(): void
  caliyorMu(): boolean
  kapat(): void
}
export type FishDurum = 'connecting' | 'listening' | 'speaking'
export type FishKullanim = { oturumSaniye: number }
/**
 * Bir turun aşama aşama gecikmesi (ms) — tarayıcıda ölçülür, sunucuya ses_kullanim 'gecikme' olarak yazılır.
 *   sozSonuMs: doktorun son sesli çerçevesi → VAD sözü bitirdi (tasarım gereği ~SOZ_SONU_SESSIZLIK_MS)
 *   dinleMs:   WAV yükleme + Fish ASR + dönüş (ağ dahil)
 *   ilkSozMs:  fish-tur isteği → ilk cümle satırı (model ilk cümlesi)
 *   ilkSesMs:  ilk cümle satırı → Fish sesi hoparlörde (fish-ses + ilk PCM)
 *   toplamMs:  doktorun son sesi → Ayşe'nin ilk sesi (BAŞLIK ölçü)
 */
export type TurGecikmesi = { sozSonuMs: number; dinleMs: number; ilkSozMs: number; ilkSesMs: number; toplamMs: number }

export interface FishOturumuOlaylari {
  durum(d: FishDurum): void
  /** Doktorun bitmiş sözü (balon). `yerine`: aynı sözün önceki yarısı — balon güncellenir, ikinci balon açılmaz. */
  doktorSozu(metin: string, yerine?: string): void
  /** "Asistanı kapat" ya da veda cümlesinden sonra Ayşe sustu. */
  kapatIstendi(): void
  hata(mesaj: string): void
  kullanim?(k: FishKullanim): void
  gecikme?(g: TurGecikmesi): void
}

export interface FishOturumuBagimliliklari {
  mikrofon: MikrofonKaynagi
  dinle: DinlemeIstegi
  turIstegi: TurIstegi
  fish: FishSesi
  olay: FishOturumuOlaylari
  nonceUret?: () => string
  simdi?: () => number
}

type Olcum = { sonSes: number; ilan: number; dinleBitti: number; gonderildi: number; ilkSoz: number }
type Tur = { metin: string; nonce: string; kontrol: AbortController; sesBasladi: boolean; gizli: boolean; veda: boolean; olcum: Olcum | null }
type Cerceve = { pcm: ArrayBuffer; rms: number; ms: number }

function varsayilanNonce(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export class FishOturumu {
  private readonly d: FishOturumuBagimliliklari
  private readonly simdi: () => number
  private readonly algilayici: SozAlgilayici
  private kapali = false
  private aktif: Tur | null = null
  private fishDuyuluyor = false
  private sonSusma = 0
  private kesmeMs = 0
  private onKayit: Cerceve[] = []
  private onKayitMs = 0
  /** Sürmekte olan ASR istekleri (kapanışta bırakılır). */
  private readonly dinlemeler = new Set<AbortController>()
  /** ASR sonuçları sözlerin sırasıyla işlenir (B'nin cevabı A'dan önce dönse de). */
  private dinleZinciri: Promise<void> = Promise.resolve()
  private kullanimZamani: ReturnType<typeof setInterval> | null = null
  private vedaZamani: ReturnType<typeof setInterval> | null = null
  private readonly baslangic: number
  private raporlananSaniye = 0
  /** Sesi henüz duyulmamış son turun ölçümü (tur akışı Fish'in ilk sesinden önce bitebilir). */
  private olcumBekleyen: Olcum | null = null

  constructor(d: FishOturumuBagimliliklari) {
    this.d = d
    this.simdi = d.simdi ?? Date.now
    this.baslangic = this.simdi()
    this.algilayici = new SozAlgilayici({ soz: (s) => this.sozBitti(s) })
  }

  /** Mikrofon izni burada istenir (reddedilirse hata fırlar — çağıran izin yardımını gösterir). */
  async baslat(): Promise<void> {
    this.d.olay.durum('connecting')
    await this.d.mikrofon.baslat((pcm, rms, ms) => this.cerceve(pcm, rms, ms))
    if (this.kapali) { this.d.mikrofon.durdur(); return }
    if (!this.fishDuyuluyor) this.d.olay.durum('listening')
    if (this.d.olay.kullanim) this.kullanimZamani = setInterval(() => this.kullanimRaporla(), KULLANIM_ARALIGI_MS)
  }

  /** Görüşme kapanır: mikrofon, ASR istekleri, Fish, sürmekte olan tur — hepsi bir kez, sırayla. Tekrar çağrılabilir. */
  kapat(): void {
    if (this.kapali) return
    this.kapali = true
    for (const z of [this.kullanimZamani, this.vedaZamani]) if (z) clearInterval(z)
    this.kullanimZamani = this.vedaZamani = null
    this.aktif?.kontrol.abort()
    this.aktif = null
    for (const k of this.dinlemeler) k.abort()
    this.dinlemeler.clear()
    this.algilayici.sifirla()
    try { this.d.mikrofon.durdur() } catch { /* zaten durdu */ }
    try { this.d.fish.kapat() } catch { /* zaten kapandı */ }
    this.kullanimRaporla()
  }

  kapaliMi(): boolean { return this.kapali }

  /** Ayşe'nin sesi duyuluyor mu (çalıyor / kuyrukta / yankı kuyruğu) — mikrofon söz algılayıcıya gitmez. */
  yankiKapisiKapali(): boolean {
    if (this.fishDuyuluyor || this.d.fish.caliyorMu()) return true
    return this.sonSusma > 0 && this.simdi() - this.sonSusma < YANKI_KUYRUK_MS
  }

  /** Bir tur sürüyor mu (sesi henüz kapanmamış). */
  turSuruyor(): boolean { return this.aktif !== null }

  /** Doktor konuşuyor ya da sözü henüz yazıya dökülüyor — gizli tur beklemeli. */
  dinlemeSuruyor(): boolean { return this.algilayici.konusuyorMu() || this.dinlemeler.size > 0 }

  /** fishCalar onBasladi. */
  fishBasladi(): void {
    if (this.kapali) return
    this.fishDuyuluyor = true
    this.d.olay.durum('speaking')
    this.gecikmeRaporla()
  }

  /** fishCalar onDurdu (bitti ya da kesildi). */
  fishDurdu(): void {
    if (this.kapali) return
    this.fishDuyuluyor = false
    this.sonSusma = this.simdi()
    this.d.olay.durum('listening')
  }

  /** Ayşe'nin açılış sözü (istemcide kurulur, modelsiz). */
  soyle(metin: string): void {
    if (!this.kapali && metin.trim()) this.d.fish.soyle(metin)
  }

  /** NOTYA-SES-DEVAM-01: gizli `[devam]` turu — balon yok, birleştirme yok; tur / dinleme sürerken gönderilmez. */
  gizliTur(metin: string): boolean {
    if (this.kapali || this.aktif || this.yankiKapisiKapali() || this.dinlemeSuruyor()) return false
    this.turBaslat(metin, true, null)
    return true
  }

  /** Söz kesme: Fish susar, sesi akan tur bırakılır, kapı hemen açılır, ön kayıt söz algılayıcıya verilir. */
  sozKes(): void {
    if (this.kapali) return
    this.d.fish.kes()
    this.fishDuyuluyor = false
    this.sonSusma = 0 // söz kesmede yankı kuyruğu beklenmez — doktor zaten konuşuyor
    if (this.aktif) {
      this.aktif.kontrol.abort()
      this.aktif = null
    }
    this.olcumBekleyen = null
    this.kesmeMs = 0
    const kayit = this.onKayit
    this.onKayit = []
    this.onKayitMs = 0
    for (const c of kayit) this.algilayici.cerceve(c.pcm, c.rms, c.ms, this.simdi())
  }

  private cerceve(pcm: ArrayBuffer, rms: number, ms: number): void {
    if (this.kapali) return
    if (this.yankiKapisiKapali()) {
      this.onKayit.push({ pcm, rms, ms })
      this.onKayitMs += ms
      while (this.onKayit.length > 1 && this.onKayitMs - this.onKayit[0].ms >= ON_KAYIT_MS) this.onKayitMs -= this.onKayit.shift()!.ms
      this.kesmeMs = rms >= KESME_ESIGI_RMS ? this.kesmeMs + ms : 0
      if (this.kesmeMs >= KESME_SURE_MS) this.sozKes()
      return
    }
    // Kapı kendiliğinden açıldı (Ayşe sözünü bitirdi): ön kayıt onun yankısıdır — atılır.
    if (this.onKayit.length) { this.onKayit = []; this.onKayitMs = 0 }
    this.kesmeMs = 0
    this.algilayici.cerceve(pcm, rms, ms, this.simdi())
  }

  /** VAD bir sözü bitirdi → TEK Fish ASR çağrısı. Sonuç, önceki sözlerin sonucundan sonra işlenir. */
  private sozBitti(s: BitenSoz): void {
    if (this.kapali) return
    const kontrol = new AbortController()
    this.dinlemeler.add(kontrol)
    const istek = this.d.dinle({ wav: wavKodla(s.pcm), sureMs: s.sureMs, sinyal: kontrol.signal })
      .then((r) => ({ ok: true as const, metin: String(r?.metin || ''), bitti: this.simdi() }))
      .catch(() => ({ ok: false as const, metin: '', bitti: this.simdi() }))
    this.dinleZinciri = this.dinleZinciri.then(async () => {
      const r = await istek
      this.dinlemeler.delete(kontrol)
      if (this.kapali || kontrol.signal.aborted) return
      if (!r.ok) { this.d.olay.hata(DINLEME_HATASI); return }
      this.sozGeldi(r.metin, { sonSes: s.sonSes, ilan: s.ilan, dinleBitti: r.bitti, gonderildi: 0, ilkSoz: 0 })
    })
  }

  private sozGeldi(ham: string, olcum: Olcum | null): void {
    if (this.kapali) return
    let metin = ham.replace(/\s+/g, ' ').trim()
    if (!metin || kendiSelamiMi(metin)) return
    if (asistaniKapatMi(metin)) {
      this.d.olay.doktorSozu(metin)
      this.d.olay.kapatIstendi()
      return
    }
    let yerine: string | undefined
    const onceki = this.aktif
    if (onceki) {
      onceki.kontrol.abort()
      this.aktif = null
      if (!onceki.gizli && !onceki.sesBasladi) {
        // Ayşe daha bir şey söylemeden doktor sözüne devam etti — iki parça tek söz.
        yerine = onceki.metin
        metin = `${onceki.metin} ${metin}`
      } else {
        this.d.fish.kes()
      }
    }
    this.d.olay.doktorSozu(metin, yerine)
    this.turBaslat(metin, false, olcum)
  }

  private turBaslat(metin: string, gizli: boolean, olcum: Olcum | null): void {
    const tur: Tur = { metin, nonce: (this.d.nonceUret ?? varsayilanNonce)(), kontrol: new AbortController(), sesBasladi: false, gizli, veda: false, olcum }
    if (olcum) olcum.gonderildi = this.simdi()
    this.olcumBekleyen = olcum
    this.aktif = tur
    void (async () => {
      try {
        for await (const o of this.d.turIstegi({ metin, nonce: tur.nonce, sinyal: tur.kontrol.signal })) {
          if (tur.kontrol.signal.aborted || this.kapali) break
          const soz = o.t === 'soz' ? o.metin : o.t === 'hata' ? o.soz : ''
          if (soz) {
            if (tur.olcum && !tur.olcum.ilkSoz) tur.olcum.ilkSoz = this.simdi()
            tur.sesBasladi = true
            this.d.fish.soyle(soz)
          } else if (o.t === 'veda') tur.veda = true
        }
      } catch {
        if (!tur.kontrol.signal.aborted && !this.kapali) this.d.olay.hata(TUR_HATASI)
      } finally {
        if (this.aktif === tur) this.aktif = null
        if (tur.veda && !tur.kontrol.signal.aborted && !this.kapali) this.vedaBekle()
      }
    })()
  }

  /** Fish'in ilk sesi duyuldu: bu turun aşama gecikmeleri bir kez raporlanır. */
  private gecikmeRaporla(): void {
    const o = this.olcumBekleyen
    if (!o || !o.ilkSoz || !this.d.olay.gecikme) return
    this.olcumBekleyen = null // tur başına bir rapor
    const simdi = this.simdi()
    try {
      this.d.olay.gecikme({
        sozSonuMs: Math.max(0, o.ilan - o.sonSes),
        dinleMs: Math.max(0, o.dinleBitti - o.ilan),
        ilkSozMs: Math.max(0, o.ilkSoz - o.gonderildi),
        ilkSesMs: Math.max(0, simdi - o.ilkSoz),
        toplamMs: Math.max(0, simdi - o.sonSes),
      })
    } catch { /* ölçüm kritik değil */ }
  }

  private vedaBekle(): void {
    if (this.vedaZamani) return
    this.vedaZamani = setInterval(() => {
      if (this.kapali) return
      if (this.d.fish.caliyorMu() || this.fishDuyuluyor) return
      if (this.vedaZamani) clearInterval(this.vedaZamani)
      this.vedaZamani = null
      this.d.olay.kapatIstendi()
    }, 150)
  }

  /** Son rapordan bu yana görüşme süresi (saniye) — dakika başı maliyetin böleni. */
  private kullanimRaporla(): void {
    if (!this.d.olay.kullanim) return
    const toplam = (this.simdi() - this.baslangic) / 1000
    const fark = toplam - this.raporlananSaniye
    this.raporlananSaniye = toplam
    if (fark <= 0) return
    try { this.d.olay.kullanim({ oturumSaniye: fark }) } catch { /* sayaç kritik değil */ }
  }
}

/** Hangi ses hattı: Ayşe Kaya yalnız Fish (ElevenLabs'e hiç düşmez); diğer her persona ElevenLabs. */
export function sesHattiSec(personaId: string): 'fish' | 'elevenlabs' {
  return personaId === 'aysekaya' ? 'fish' : 'elevenlabs'
}

/** /api/asistan/fish-tur NDJSON gövdesi → tur olayları (satır yarıda bölünse de). Bozuk satır atlanır. */
export async function* ndjsonOku(govde: ReadableStream<Uint8Array>): AsyncGenerator<TurOlayi> {
  const okuyucu = govde.getReader()
  const coz = new TextDecoder()
  let tampon = ''
  const satir = (s: string): TurOlayi | null => {
    const t = s.trim()
    if (!t) return null
    try { return JSON.parse(t) as TurOlayi } catch { return null }
  }
  try {
    for (;;) {
      const { done, value } = await okuyucu.read()
      if (done) break
      tampon += coz.decode(value, { stream: true })
      let n: number
      while ((n = tampon.indexOf('\n')) >= 0) {
        const o = satir(tampon.slice(0, n))
        tampon = tampon.slice(n + 1)
        if (o) yield o
      }
    }
    const son = satir(tampon + coz.decode())
    if (son) yield son
  } finally {
    // for-await'ten erken çıkış (söz kesme) gövdeyi bırakır → sunucuda akış iptal edilir.
    try { await okuyucu.cancel() } catch { /* zaten kapandı */ }
  }
}
