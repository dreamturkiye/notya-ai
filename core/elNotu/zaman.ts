/**
 * ESNEK-MUAYENE-A — time meter (pure). Real, honest numbers only: documentation time is what Notya measured on its own
 * screens (capture, reading confirmation, editing, approval) — never an estimate. The gain is shown only against the
 * baseline the doctor entered himself (minutes per note before Notya); without a baseline, no gain is claimed.
 */
export type SureKaydi = { sure_ms: number; note_id?: string | null; session_id?: string | null; patient_id?: string | null }

export type GunlukOzet = { hasta: number; dokumantasyonDk: number; kazancDk: number | null; tabanDk: number | null }

export function gunlukOzet(kayitlar: SureKaydi[], tabanDk: number | null): GunlukOzet {
  const anahtarlar = new Set<string>()
  let ms = 0
  for (const k of kayitlar) {
    ms += Math.max(0, Math.min(3600000, Number(k.sure_ms) || 0))
    const a = k.patient_id || k.session_id || k.note_id
    if (a) anahtarlar.add(String(a))
  }
  const dk = Math.round(ms / 6000) / 10
  const hasta = anahtarlar.size
  const taban = tabanDk && tabanDk > 0 ? tabanDk : null
  const kazanc = taban && hasta ? Math.round((taban * hasta - dk) * 10) / 10 : null
  return { hasta, dokumantasyonDk: dk, kazancDk: kazanc, tabanDk: taban }
}

/** "Bugün N hasta · dokümantasyon X dk · kazanç Y dk" with words injected by the build. */
export function gunlukSatir(o: GunlukOzet, k: { bugun: string; hasta: string; dokumantasyon: string; kazanc: string; dk: string; ondalik: string }): string | null {
  if (!o.hasta) return null
  const sayi = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', k.ondalik))
  const parcalar = [`${k.bugun} ${o.hasta} ${k.hasta}`, `${k.dokumantasyon} ${sayi(o.dokumantasyonDk)} ${k.dk}`]
  if (o.kazancDk !== null) parcalar.push(`${k.kazanc} ${sayi(o.kazancDk)} ${k.dk}`)
  return parcalar.join(' · ')
}

/**
 * Active-time stopwatch for a screen: counts only while the page is visible and the user interacted in the last 60 s
 * (an open tab left alone is not documentation time).
 */
export class AktifSure {
  private toplam = 0
  private bas: number | null = null
  private sonEtkilesim = 0
  constructor(private simdi: () => number = () => Date.now(), private bosEsigiMs = 60000) {}
  etkilesim(): void {
    const t = this.simdi()
    if (this.bas !== null && t - this.sonEtkilesim > this.bosEsigiMs) { this.toplam += Math.max(0, this.sonEtkilesim + this.bosEsigiMs - this.bas); this.bas = t }
    if (this.bas === null) this.bas = t
    this.sonEtkilesim = t
  }
  durdur(): void {
    if (this.bas === null) return
    const t = this.simdi()
    const bitis = Math.min(t, this.sonEtkilesim + this.bosEsigiMs)
    this.toplam += Math.max(0, bitis - this.bas)
    this.bas = null
  }
  /** Milliseconds measured so far (and resets). */
  al(): number { this.durdur(); const t = this.toplam; this.toplam = 0; return Math.round(t) }
}
