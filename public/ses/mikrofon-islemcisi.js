/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın kulağı: mikrofon → 16 kHz linear16 (Deepgram Live).
 *
 * ses-calar-islemcisi.js OYNATMA yönündedir (Int16 → Float, parça başına durumsuz oranlama). Yakalamada ters yön
 * gerekir ve 128 örneklik her render parçası 48 kHz → 16 kHz'de tam sayıya bölünmez (42,67 örnek): parça başına
 * oranlama her sınırda kayar. Burada konum parçalar arasında taşınır (durumlu doğrusal oranlama), önünde tek kutuplu
 * alçak geçiren süzgeç (~7 kHz, örtüşme) vardır. Çıkış: 20 ms'lik (320 örnek) Int16 çerçeve + çerçevenin RMS'i
 * (söz kesme eşiği için — lib/asistan/fishOturumu.ts).
 */
const HEDEF_HZ = 16000
const CERCEVE = 320
const KESIM_HZ = 7000

class MikrofonIslemcisi extends AudioWorkletProcessor {
  constructor() {
    super()
    this.oran = sampleRate / HEDEF_HZ
    this.alfa = 1 - Math.exp((-2 * Math.PI * KESIM_HZ) / sampleRate)
    this.suzulmus = 0
    this.onceki = 0
    this.konum = 1
    this.cerceve = new Int16Array(CERCEVE)
    this.dolu = 0
    this.karelerToplami = 0
  }

  cikar(deger) {
    const v = Math.max(-1, Math.min(1, deger))
    this.cerceve[this.dolu++] = v < 0 ? v * 0x8000 : v * 0x7fff
    this.karelerToplami += v * v
    if (this.dolu === CERCEVE) {
      const pcm = this.cerceve.buffer
      const rms = Math.sqrt(this.karelerToplami / CERCEVE)
      this.port.postMessage({ pcm, rms }, [pcm])
      this.cerceve = new Int16Array(CERCEVE)
      this.dolu = 0
      this.karelerToplami = 0
    }
  }

  process(inputs) {
    const girdi = inputs[0] && inputs[0][0]
    if (!girdi || girdi.length === 0) return true
    const n = girdi.length
    const x = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      this.suzulmus += this.alfa * (girdi[i] - this.suzulmus)
      x[i] = this.suzulmus
    }
    // s[0] = önceki parçanın son örneği, s[k] = x[k-1]; konum s üzerinde.
    while (this.konum < n) {
      const i = Math.floor(this.konum)
      const f = this.konum - i
      const a = i === 0 ? this.onceki : x[i - 1]
      const b = x[i]
      this.cikar(a + (b - a) * f)
      this.konum += this.oran
    }
    this.konum -= n
    this.onceki = x[n - 1]
    return true
  }
}

registerProcessor('mikrofonIslemcisi', MikrofonIslemcisi)
