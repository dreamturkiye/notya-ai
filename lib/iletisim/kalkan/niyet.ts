/**
 * NOTYA-KALKAN-01 — hekimin kendi yazdığı cümleden taslak niyet.
 * Kartı değiştirmez. Emin değilsek Düzelt’e bırakır; ilaç adı uydurmaz.
 */

export type KalkanEylem = 'ilac_durdur' | 'son_doz' | 'ev_talimati' | 'kontrol_randevu'
export type KalkanKapsam = 'bu_gece' | 'kalan_kur'

export interface HekimNiyeti {
  eylem: KalkanEylem
  kapsam: KalkanKapsam | null
  /** false → Onayla kartı değiştirmez, önce Düzelt. */
  emin: boolean
}

const DUR = /devam etmeye gerek yok|devam etmesin|keselim|kesilsin|kesin\b|(^|\s)kes(\s|$)|durdur|verme|vermeyin|bırakın|birakin/
const GECE = /bu gece|bu akşam|bu aksam|geceyi/
const KUR = /kalan kür|kalan kur|kürü bitir|kuru bitir|tamamen/
const SON = /yarın sabah tek doz|yarin sabah tek doz|tek doz daha/
const EV = /olursa yaz|ateş\s*[\d,.]|ates\s*[\d,.]/
const GEL = /yarın gelin|yarin gelin|kontrole gel/

export function hekimNiyeti(metin: string): HekimNiyeti | null {
  const k = metin.toLocaleLowerCase('tr-TR')
  if (DUR.test(k)) {
    const gece = GECE.test(k)
    const kur = KUR.test(k)
    return { eylem: 'ilac_durdur', kapsam: gece && !kur ? 'bu_gece' : kur && !gece ? 'kalan_kur' : null, emin: gece !== kur }
  }
  if (SON.test(k)) return { eylem: 'son_doz', kapsam: null, emin: true }
  if (EV.test(k)) return { eylem: 'ev_talimati', kapsam: null, emin: true }
  if (GEL.test(k)) return { eylem: 'kontrol_randevu', kapsam: null, emin: true }
  return null
}

export function kapsamYaz(kapsam: KalkanKapsam | null): string {
  if (kapsam === 'bu_gece') return 'bu gece'
  if (kapsam === 'kalan_kur') return 'kalan kür'
  return 'bu gece / kalan kür'
}

export function taslakSatiri(g: { hastaAd: string; ilacAd: string | null; eylem: KalkanEylem; kapsam: KalkanKapsam | null; zamanIso: string }): string {
  const saat = new Date(g.zamanIso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).replace(',', '').replace(/\s+/g, ' ').trim()
  const is = g.eylem === 'ilac_durdur'
    ? `${g.ilacAd || 'Hangi ilaç?'} — durduruldu (${kapsamYaz(g.kapsam)})`
    : g.eylem === 'son_doz'
      ? `${g.ilacAd || 'Hangi ilaç?'} — yarın sabah tek doz`
      : g.eylem === 'ev_talimati'
        ? 'Ev talimatı — onay bekliyor'
        : 'Kontrol randevusu önerisi'
  return `${g.hastaAd}\n${is}\nKaynak: WhatsApp, ${saat}\nHekim onayı bekliyor`
}
