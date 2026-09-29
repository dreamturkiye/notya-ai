/**
 * NOTYA-SES-FISH-SADECE-01 — FishOturumu'nun tarayıcı uyarlayıcıları (mikrofon, Fish ASR isteği, tur isteği).
 * Yalnız istemci bileşeninden (AsistanOturumContext) çağrılır; kurallar lib/asistan/fishOturumu.ts'te.
 * Fish anahtarı tarayıcıya hiç inmez: ASR ve TTS kendi sunucu rotalarımızdan geçer.
 */
import { ndjsonOku, type DinlemeIstegi, type MikrofonKaynagi, type TurIstegi } from '@/lib/asistan/fishOturumu'

/** Çerçeve süresi: public/ses/mikrofon-islemcisi.js 320 örnek @ 16 kHz. */
const CERCEVE_MS = 20

/**
 * Mikrofon: yankı giderme ve gürültü bastırma bizim sorumluluğumuzda (eskiden ElevenLabs'in SDK'sı açıyordu).
 * `dokunusBaglami`: mikrofon düğmesine dokunuşta açılmış bağlam (sesiDokunustaAc). iOS Safari dokunuş dışında kurulan
 * AudioContext'i askıda başlatır ve resume()'u reddedebilir — işlemci hiç ses görmez. Verilirse o kullanılır ve
 * burada KAPATILMAZ (sahibi Fish çaları); verilmezse kendi bağlamını kurar ve kapatır.
 */
export function tarayiciMikrofonu(dokunusBaglami?: AudioContext | null): MikrofonKaynagi {
  let akim: MediaStream | null = null
  let ctx: AudioContext | null = null
  let bizim = false
  let kaynak: MediaStreamAudioSourceNode | null = null
  let dugum: AudioWorkletNode | null = null
  let sessiz: GainNode | null = null
  return {
    async baslat(cerceve) {
      akim = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      })
      if (dokunusBaglami && dokunusBaglami.state !== 'closed') {
        ctx = dokunusBaglami
      } else {
        const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
        const Kur = window.AudioContext || Pencere.webkitAudioContext
        if (!Kur) throw new Error('Bu tarayıcıda ses desteklenmiyor')
        ctx = new Kur()
        bizim = true
      }
      await ctx.audioWorklet.addModule('/ses/mikrofon-islemcisi.js')
      kaynak = ctx.createMediaStreamSource(akim)
      dugum = new AudioWorkletNode(ctx, 'mikrofonIslemcisi', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 })
      dugum.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
        if (e.data?.pcm) cerceve(e.data.pcm, Number(e.data.rms) || 0, CERCEVE_MS)
      }
      // Düğüm grafikte çekilsin diye sessiz bir çıkışa bağlanır (hoparlöre ses gitmez).
      sessiz = ctx.createGain()
      sessiz.gain.value = 0
      kaynak.connect(dugum)
      dugum.connect(sessiz).connect(ctx.destination)
      if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined)
    },
    durdur() {
      try { akim?.getTracks().forEach((t) => t.stop()) } catch { /* zaten durdu */ }
      try { kaynak?.disconnect(); dugum?.disconnect(); sessiz?.disconnect() } catch { /* bağlı değil */ }
      if (dugum) dugum.port.onmessage = null
      const kapanan = bizim ? ctx : null
      akim = null; ctx = null; kaynak = null; dugum = null; sessiz = null; bizim = false
      if (kapanan && kapanan.state !== 'closed') void kapanan.close().catch(() => undefined)
    },
  }
}

/**
 * Bitmiş bir söz → /api/asistan/fish-dinle (sunucu Fish /v1/asr'ye iletir). Gövde ham WAV. Söz başına tek çağrı;
 * kendiliğinden yeniden denemez — hata FishOturumu'nda görünür olur, doktor tekrar söyler.
 */
export function fishDinleIstegi(jeton: () => Promise<string | null>, oturumId: () => string | null): DinlemeIstegi {
  return async (g) => {
    const t = await jeton()
    const o = oturumId()
    // NOTYA-SES-FISH-SADECE-01 canlı bulgu (Kaan, 2026-09-28): "Sizi duyamadım" ile ilk konuşma başarısız oldu;
    // sunucu loglarında fish-dinle'ye hiç istek düşmemişti — throw ağa hiç çıkmadan burada oluyordu. `oturumId` bu
    // çağrıda zaten atanmış bir `const`'tan geliyor, boş olması yapısal olarak beklenmez; asıl şüpheli jeton. İkisini
    // ayırt eden ayrı hata, bir sonraki canlı denemede kesin sebebi verir.
    if (!t) throw new Error('Jeton yok')
    if (!o) throw new Error('Oturum yok')
    const r = await fetch(`/api/asistan/fish-dinle?asistanSessionId=${encodeURIComponent(o)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav', Authorization: `Bearer ${t}` },
      body: g.wav,
      signal: g.sinyal,
    })
    if (!r.ok) throw new Error(`Dinleme ${r.status}`)
    const j = (await r.json().catch(() => null)) as { metin?: unknown } | null
    return { metin: typeof j?.metin === 'string' ? j.metin : '' }
  }
}

/** Tek tur isteği — kendiliğinden yeniden denemez (aynı söz iki kez modele gitmesin). */
export function fishTurIstegi(jeton: () => Promise<string | null>, oturumId: () => string | null): TurIstegi {
  return (g) => ({
    async *[Symbol.asyncIterator]() {
      const t = await jeton()
      const o = oturumId()
      if (!t || !o) throw new Error('Oturum yok')
      const r = await fetch('/api/asistan/fish-tur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ asistanSessionId: o, nonce: g.nonce, metin: g.metin }),
        signal: g.sinyal,
      })
      if (!r.ok || !r.body) throw new Error(`Tur ${r.status}`)
      yield* ndjsonOku(r.body)
    },
  })
}
