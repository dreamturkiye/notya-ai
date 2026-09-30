/**
 * NOTYA-FISH-HAVUZ-01 — one pre-opened Fish live socket per Node instance.
 *
 * The per-turn socket in fish-tur is opened while Transcribe-1 runs, so its handshake is
 * already off the critical path; what this pool removes is the socket-open + `start` cost on
 * turns where ASR is faster than the handshake, and it lets the session warm-up (mic granted)
 * leave a socket ready for the doctor's first sentence. A pooled socket is used for exactly
 * one turn (Fish closes it after `stop`/`finish`); the route asks for the next one as soon as
 * a turn ends, so the doctor's next sentence finds a warm socket. Sockets older than
 * FISH_WS_HAVUZ_YAS_MS are dropped unused (measured idle survival — docs/ARCH-FISH-TTS-LATENCY.md).
 */
import { fishWsAc, type FishWsGirdi, type FishWsOturumu } from '@/lib/asistan/fishWsSunucu'

/** Longest a pre-opened socket may sit idle before the pool replaces it. */
export const FISH_WS_HAVUZ_YAS_MS = 120_000

export type FishWsAcici = (g: FishWsGirdi) => Promise<FishWsOturumu>

type Bekleyen = { soz: Promise<FishWsOturumu | null>; acilis: number }

/** Pool logic with an injected opener so it can be unit-tested without a socket. */
export class FishWsHavuz {
  private bekleyen: Bekleyen | null = null
  constructor(private ac: FishWsAcici, private azamiYasMs = FISH_WS_HAVUZ_YAS_MS, private simdi: () => number = Date.now) {}

  /** Open the next socket now unless one is already waiting and still fresh. */
  hazirla(anahtar: string): void {
    if (this.bekleyen && this.simdi() - this.bekleyen.acilis < this.azamiYasMs) return
    this.bekleyen?.soz.then((o) => o?.kapat()).catch(() => {})
    const acilis = this.simdi()
    const soz = this.ac({ anahtar }).catch(() => null)
    this.bekleyen = { soz, acilis }
  }

  /** Take the pooled socket if it is open and fresh; otherwise open a new one for this turn. */
  async al(anahtar: string): Promise<{ oturum: FishWsOturumu; havuzdan: boolean }> {
    const b = this.bekleyen
    this.bekleyen = null
    if (b && this.simdi() - b.acilis < this.azamiYasMs) {
      const o = await b.soz
      if (o && o.acik() && o.yas() < this.azamiYasMs) return { oturum: o, havuzdan: true }
      o?.kapat()
    } else if (b) {
      b.soz.then((o) => o?.kapat()).catch(() => {})
    }
    return { oturum: await this.ac({ anahtar }), havuzdan: false }
  }

  bekleyenVarMi(): boolean { return this.bekleyen !== null }
}

let havuz: FishWsHavuz | null = null
export function fishWsHavuzu(): FishWsHavuz {
  if (!havuz) havuz = new FishWsHavuz(fishWsAc)
  return havuz
}
