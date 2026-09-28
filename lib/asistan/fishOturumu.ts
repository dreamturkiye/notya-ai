/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın ElevenLabs'siz sesli görüşmesi (tarayıcı orkestrası).
 *
 *   mikrofon (echoCancellation + noiseSuppression) → 16 kHz PCM → Deepgram Live → TurAlgilayici (bitmiş söz)
 *   → TEK /api/asistan/fish-tur isteği (söz başına nonce) → NDJSON cümleler → Fish (fishCalar) → hoparlör
 *
 * Bağımlılıklar dışarıdan verilir (tarayıcı uyarlayıcıları: lib/asistan/fishTarayici.ts) — kurallar Node testinde
 * sahte mikrofon / soket / Fish ile sınanır (lib/asistan/fishUctanUca.test.ts).
 *
 * YANKI (seçilen yol — docs/SES-FISH-UCTAN-UCA.md): ElevenLabs kendi sesini duymamayı içeride çözüyordu; artık Fish
 * aynı hoparlörden çalıyor. Tarayıcının yankı giderici (AEC) kısıtı açık, AMA ona güvenilmez: Fish sesi duyulabilir
 * olduğu sürece (çalıyor / kuyrukta + YANKI_KUYRUK_MS oda yankısı) mikrofon Deepgram'a GÖNDERİLMEZ — Ayşe'nin kendi
 * sözü hiç yazıya dökülemez (kendiSelamiMi hatasının daha kötüsü yapısal olarak kapanır). Kapı kapalıyken Deepgram'a
 * KeepAlive gider (10 sn sessiz kalan bağlantı kapanır).
 *
 * SÖZ KESME (barge-in): kapı kapalıyken mikrofon yerelde dinlenir — AEC sonrası sinyal KESME_ESIGI_RMS'in üstünde
 * KESME_SURE_MS kalırsa doktor konuşuyordur: Fish anında susar, sesi hâlâ akan tur iptal edilir (fetch bırakılır →
 * sunucuda model akışı durur), kapı açılır ve son ON_KAYIT_MS'lik ses Deepgram'a verilir (sözün başı kaybolmaz).
 *
 * TEK TUR: Deepgram ara sonuçları tur açmaz; bitmiş söz bir kez gelir (TurAlgilayici). Ayşe henüz tek kelime
 * söylemeden doktor sözüne devam ederse (duraklayıp sürdürdü) önceki istek bırakılır ve iki parça TEK sözde birleşir —
 * aynı doktor cümlesi için iki cevap yoktur. İstemci bir turu kendiliğinden yeniden denemez.
 */
import { DG_CANLI_TUT_MS, DG_SANIYE_BAYT, TurAlgilayici } from '@/lib/asistan/canliDinleme'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import type { TurOlayi } from '@/lib/asistan/turKilidi'

/** Fish sustuktan sonra oda yankısı sönene kadar kapı kapalı kalır (ms). */
export const YANKI_KUYRUK_MS = 300
/** Söz kesme eşiği: AEC sonrası mikrofon RMS'i (0–1). Canlı dinleme testinde ayarlanacak. */
export const KESME_ESIGI_RMS = 0.06
/** Eşik üstünde bu kadar süre (ms) kalan ses söz kesmedir — tek bir tık / öksürük değil. */
export const KESME_SURE_MS = 180
/** Söz kesilince Deepgram'a geriye dönük verilen ses (ms). */
export const ON_KAYIT_MS = 500
/** Kopan Deepgram bağlantısı en çok bu kadar kez taze anahtarla yeniden kurulur. */
export const YENIDEN_BAGLANMA = 3
/** Kullanım sayacı bu aralıkla sunucuya yollanır (tarayıcı çökerse kayıp en çok bu kadar). */
export const KULLANIM_ARALIGI_MS = 60_000

export interface MikrofonKaynagi {
  /** Her çerçeve: 16 kHz linear16 PCM, çerçevenin RMS'i (0–1), süresi (ms). */
  baslat(cerceve: (pcm: ArrayBuffer, rms: number, sureMs: number) => void): Promise<void>
  durdur(): void
}
export interface CanliSoket {
  gonder(veri: ArrayBuffer | string): void
  kapat(): void
}
export type SoketAc = (url: string, anahtar: string, olay: { acildi: () => void; mesaj: (veri: string) => void; kapandi: () => void }) => CanliSoket
export type TurIstegi = (g: { metin: string; nonce: string; sinyal: AbortSignal }) => AsyncIterable<TurOlayi>
export interface FishSesi {
  soyle(metin: string): void
  kes(): void
  caliyorMu(): boolean
  kapat(): void
}
export type FishDurum = 'connecting' | 'listening' | 'speaking'
export type FishKullanim = { sesSaniye: number; baglantiSaniye: number; oturumSaniye: number }

export interface FishOturumuOlaylari {
  durum(d: FishDurum): void
  /** Doktorun bitmiş sözü (balon). `yerine`: aynı sözün önceki yarısı — balon güncellenir, ikinci balon açılmaz. */
  doktorSozu(metin: string, yerine?: string): void
  /** "Asistanı kapat" ya da veda cümlesinden sonra Ayşe sustu. */
  kapatIstendi(): void
  hata(mesaj: string): void
  kullanim?(k: FishKullanim): void
}

export interface FishOturumuBagimliliklari {
  mikrofon: MikrofonKaynagi
  soketAc: SoketAc
  deepgram: { url: string; anahtar: string }
  /** Kopan bağlantı için taze anahtar (yoksa yeniden bağlanılmaz). */
  deepgramYenile?: () => Promise<{ url: string; anahtar: string } | null>
  turIstegi: TurIstegi
  fish: FishSesi
  olay: FishOturumuOlaylari
  nonceUret?: () => string
  simdi?: () => number
}

type Tur = { metin: string; nonce: string; kontrol: AbortController; sesBasladi: boolean; gizli: boolean; veda: boolean }

function varsayilanNonce(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export class FishOturumu {
  private readonly d: FishOturumuBagimliliklari
  private readonly simdi: () => number
  private readonly algilayici: TurAlgilayici
  private kapali = false
  private soket: CanliSoket | null = null
  private soketAcik = false
  private yenidenDeneme = 0
  private aktif: Tur | null = null
  private fishDuyuluyor = false
  private sonSusma = 0
  private kesmeMs = 0
  private onKayit: { pcm: ArrayBuffer; ms: number }[] = []
  private onKayitMs = 0
  private sonGonderim = 0
  private canliTut: ReturnType<typeof setInterval> | null = null
  private kullanimZamani: ReturnType<typeof setInterval> | null = null
  private vedaZamani: ReturnType<typeof setInterval> | null = null
  private readonly baslangic: number
  private gonderilenBayt = 0
  private baglantiMs = 0
  private acilis = 0
  private raporlanan: FishKullanim = { sesSaniye: 0, baglantiSaniye: 0, oturumSaniye: 0 }

  constructor(d: FishOturumuBagimliliklari) {
    this.d = d
    this.simdi = d.simdi ?? Date.now
    this.baslangic = this.simdi()
    this.algilayici = new TurAlgilayici({ tur: (m) => this.sozGeldi(m) })
  }

  /** Mikrofon izni burada istenir (reddedilirse hata fırlar — çağıran izin yardımını gösterir). */
  async baslat(): Promise<void> {
    this.d.olay.durum('connecting')
    await this.d.mikrofon.baslat((pcm, rms, ms) => this.cerceve(pcm, rms, ms))
    if (this.kapali) { this.d.mikrofon.durdur(); return }
    this.soketiAc(this.d.deepgram)
    this.canliTut = setInterval(() => this.canliTutGonder(), 1000)
    if (this.d.olay.kullanim) this.kullanimZamani = setInterval(() => this.kullanimRaporla(), KULLANIM_ARALIGI_MS)
  }

  /** Görüşme kapanır: mikrofon, soket, Fish, sürmekte olan tur — hepsi bir kez, sırayla. Tekrar çağrılabilir. */
  kapat(): void {
    if (this.kapali) return
    this.kapali = true
    for (const z of [this.canliTut, this.kullanimZamani, this.vedaZamani]) if (z) clearInterval(z)
    this.canliTut = this.kullanimZamani = this.vedaZamani = null
    this.aktif?.kontrol.abort()
    this.aktif = null
    this.algilayici.sifirla()
    try { this.d.mikrofon.durdur() } catch { /* zaten durdu */ }
    if (this.soketAcik) {
      this.baglantiMs += this.simdi() - this.acilis
      try { this.soket?.gonder(JSON.stringify({ type: 'CloseStream' })) } catch { /* kapanıyor */ }
    }
    this.soketAcik = false
    try { this.soket?.kapat() } catch { /* zaten kapandı */ }
    this.soket = null
    try { this.d.fish.kapat() } catch { /* zaten kapandı */ }
    this.kullanimRaporla()
  }

  kapaliMi(): boolean { return this.kapali }

  /** Ayşe'nin sesi duyuluyor mu (çalıyor / kuyrukta / yankı kuyruğu) — mikrofon Deepgram'a gitmez. */
  yankiKapisiKapali(): boolean {
    if (this.fishDuyuluyor || this.d.fish.caliyorMu()) return true
    return this.sonSusma > 0 && this.simdi() - this.sonSusma < YANKI_KUYRUK_MS
  }

  /** Bir tur sürüyor mu (sesi henüz kapanmamış). */
  turSuruyor(): boolean { return this.aktif !== null }

  /** fishCalar onBasladi. */
  fishBasladi(): void {
    if (this.kapali) return
    this.fishDuyuluyor = true
    this.d.olay.durum('speaking')
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

  /** NOTYA-SES-DEVAM-01: gizli `[devam]` turu — balon yok, birleştirme yok; tur sürerken gönderilmez. */
  gizliTur(metin: string): boolean {
    if (this.kapali || this.aktif || this.yankiKapisiKapali()) return false
    this.turBaslat(metin, true)
    return true
  }

  /** Deepgram mesajı (test ve soket uyarlayıcısı buradan besler). */
  deepgramMesaji(veri: string): void {
    if (!this.kapali) this.algilayici.isle(veri)
  }

  /** Söz kesme: Fish susar, sesi akan tur bırakılır, kapı hemen açılır, ön kayıt Deepgram'a verilir. */
  sozKes(): void {
    if (this.kapali) return
    this.d.fish.kes()
    this.fishDuyuluyor = false
    this.sonSusma = 0 // söz kesmede yankı kuyruğu beklenmez — doktor zaten konuşuyor
    if (this.aktif) {
      this.aktif.kontrol.abort()
      this.aktif = null
    }
    this.kesmeMs = 0
    const kayit = this.onKayit
    this.onKayit = []
    this.onKayitMs = 0
    for (const c of kayit) this.sesGonder(c.pcm)
  }

  private cerceve(pcm: ArrayBuffer, rms: number, ms: number): void {
    if (this.kapali) return
    if (this.yankiKapisiKapali()) {
      this.onKayit.push({ pcm, ms })
      this.onKayitMs += ms
      while (this.onKayit.length > 1 && this.onKayitMs - this.onKayit[0].ms >= ON_KAYIT_MS) this.onKayitMs -= this.onKayit.shift()!.ms
      this.kesmeMs = rms >= KESME_ESIGI_RMS ? this.kesmeMs + ms : 0
      if (this.kesmeMs >= KESME_SURE_MS) this.sozKes()
      return
    }
    // Kapı kendiliğinden açıldı (Ayşe sözünü bitirdi): ön kayıt onun yankısıdır — atılır.
    if (this.onKayit.length) { this.onKayit = []; this.onKayitMs = 0 }
    this.kesmeMs = 0
    this.sesGonder(pcm)
  }

  private sesGonder(pcm: ArrayBuffer): void {
    if (!this.soketAcik || !this.soket) return
    try {
      this.soket.gonder(pcm)
      this.gonderilenBayt += pcm.byteLength
      this.sonGonderim = this.simdi()
    } catch { /* kapanan soket: kapandi olayı yeniden bağlar */ }
  }

  private canliTutGonder(): void {
    if (this.kapali || !this.soketAcik || !this.soket) return
    if (this.simdi() - this.sonGonderim < DG_CANLI_TUT_MS) return
    try {
      this.soket.gonder(JSON.stringify({ type: 'KeepAlive' }))
      this.sonGonderim = this.simdi()
    } catch { /* kapanıyor */ }
  }

  private soketiAc(dg: { url: string; anahtar: string }): void {
    const soket = this.d.soketAc(dg.url, dg.anahtar, {
      acildi: () => {
        if (this.kapali || this.soket !== soket) return
        this.soketAcik = true
        this.acilis = this.simdi()
        this.sonGonderim = this.acilis
        this.yenidenDeneme = 0
        if (!this.fishDuyuluyor) this.d.olay.durum('listening')
      },
      mesaj: (veri) => { if (this.soket === soket) this.deepgramMesaji(veri) },
      kapandi: () => {
        if (this.soket !== soket) return
        if (this.soketAcik) this.baglantiMs += this.simdi() - this.acilis
        this.soketAcik = false
        this.soket = null
        if (this.kapali) return
        // Yarım söz atılır: yeni bağlantı onu tamamlayamaz, parçası da tur açmamalı.
        this.algilayici.sifirla()
        void this.yenidenBaglan()
      },
    })
    this.soket = soket
  }

  private async yenidenBaglan(): Promise<void> {
    if (this.kapali) return
    if (!this.d.deepgramYenile || this.yenidenDeneme >= YENIDEN_BAGLANMA) {
      this.d.olay.hata('Dinleme bağlantısı koptu. Mikrofona tekrar basın.')
      return
    }
    const bekle = 500 * 2 ** this.yenidenDeneme
    this.yenidenDeneme += 1
    await new Promise((r) => setTimeout(r, bekle))
    if (this.kapali) return
    const taze = await this.d.deepgramYenile().catch(() => null)
    if (this.kapali) return
    if (!taze) { void this.yenidenBaglan(); return }
    this.soketiAc(taze)
  }

  private sozGeldi(ham: string): void {
    if (this.kapali) return
    let metin = ham.trim()
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
    this.turBaslat(metin, false)
  }

  private turBaslat(metin: string, gizli: boolean): void {
    const tur: Tur = { metin, nonce: (this.d.nonceUret ?? varsayilanNonce)(), kontrol: new AbortController(), sesBasladi: false, gizli, veda: false }
    this.aktif = tur
    void (async () => {
      try {
        for await (const o of this.d.turIstegi({ metin, nonce: tur.nonce, sinyal: tur.kontrol.signal })) {
          if (tur.kontrol.signal.aborted || this.kapali) break
          if (o.t === 'soz' && o.metin) { tur.sesBasladi = true; this.d.fish.soyle(o.metin) }
          else if (o.t === 'hata' && o.soz) { tur.sesBasladi = true; this.d.fish.soyle(o.soz) }
          else if (o.t === 'veda') tur.veda = true
        }
      } catch {
        if (!tur.kontrol.signal.aborted && !this.kapali) this.d.olay.hata('Bağlantıda bir sorun oldu — bir daha söyler misiniz?')
      } finally {
        if (this.aktif === tur) this.aktif = null
        if (tur.veda && !tur.kontrol.signal.aborted && !this.kapali) this.vedaBekle()
      }
    })()
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

  /** Son rapordan bu yana kullanım (saniye). */
  private kullanimRaporla(): void {
    if (!this.d.olay.kullanim) return
    const acik = this.soketAcik ? this.simdi() - this.acilis : 0
    const simdi: FishKullanim = {
      sesSaniye: this.gonderilenBayt / DG_SANIYE_BAYT,
      baglantiSaniye: (this.baglantiMs + acik) / 1000,
      oturumSaniye: (this.simdi() - this.baslangic) / 1000,
    }
    const fark: FishKullanim = {
      sesSaniye: simdi.sesSaniye - this.raporlanan.sesSaniye,
      baglantiSaniye: simdi.baglantiSaniye - this.raporlanan.baglantiSaniye,
      oturumSaniye: simdi.oturumSaniye - this.raporlanan.oturumSaniye,
    }
    this.raporlanan = simdi
    if (fark.sesSaniye <= 0 && fark.baglantiSaniye <= 0 && fark.oturumSaniye <= 0) return
    try { this.d.olay.kullanim(fark) } catch { /* sayaç kritik değil */ }
  }
}

/** Hangi ses hattı: yalnız Ayşe Kaya ve sunucu Fish yolunu açtıysa Fish; aksi her durumda ElevenLabs. */
export function sesHattiSec(personaId: string, sunucu: { fish?: unknown } | null | undefined): 'fish' | 'elevenlabs' {
  return personaId === 'aysekaya' && sunucu?.fish === true ? 'fish' : 'elevenlabs'
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
