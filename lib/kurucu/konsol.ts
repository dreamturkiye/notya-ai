/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — everything the founder console shows, gathered in one call:
 *   Türkiye   from its own database (trVeri.ts)
 *   US … UZ   from each country build's /api/internal/founder-stats, signed (imza.ts), all six IN PARALLEL with a short
 *             timeout each; a country that fails or times out is "unavailable" and the page still renders
 *   Stripe    trial → paid counts, read-only (stripeDonusum.ts)
 *   Visitors  ZIYARET-SAYACI-01 (2026-11-10): each build's answer carries its own SQL-aggregated visit summary
 *             (`veri.ziyaret`); signups and trials per day (`kayitlar`) are counted here from the account rows the
 *             console already loads, so no new raw rows travel.
 * Runs only behind the founder check of GET /api/kurucu/ozet. No doctor-facing path calls any of this.
 */
import { imzaUret, IMZA_BASLIGI } from './imza'
import { KURUCU_ISTATISTIK_YOLU, KURUCU_ULKELERI, ozetHesapla, ulkeYanitiTemizle, type KurucuHesap, type KurucuOzet, type KurucuUlkeYaniti } from './tipler'
import type { StripeDonusumu } from './stripeDonusum'
import { kayitGunlugu, type KayitGunu } from '@/lib/ziyaret/grafik'

export type KonsolUlkesi =
  | { ulke: string; ad: string; durum: 'tamam'; veri: KurucuUlkeYaniti; ozet: KurucuOzet; kayitlar: KayitGunu[] }
  | { ulke: string; ad: string; durum: 'erisilemez'; neden: string }

export type KurucuKonsolVerisi = {
  uretildi: string
  ulkeler: KonsolUlkesi[]
  toplam: KurucuOzet
  stripe: StripeDonusumu
  testHesaplari: string[]
}

export const ULKE_ZAMAN_ASIMI_MS = 4000

export async function ulkeIstatistigiCek(
  ulke: string,
  taban: string,
  ayar: { gizli?: string; fetchFn?: typeof fetch; zamanAsimiMs?: number; simdi?: number } = {},
): Promise<{ ok: true; veri: KurucuUlkeYaniti } | { ok: false; neden: string }> {
  const gizli = ayar.gizli ?? process.env.FOUNDER_STATS_SECRET
  if (!gizli) return { ok: false, neden: 'FOUNDER_STATS_SECRET not set' }
  const f = ayar.fetchFn ?? fetch
  try {
    const r = await f(`${taban}${KURUCU_ISTATISTIK_YOLU}`, {
      method: 'GET',
      headers: { [IMZA_BASLIGI]: imzaUret(gizli, ulke, ayar.simdi), Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(ayar.zamanAsimiMs ?? ULKE_ZAMAN_ASIMI_MS),
    })
    if (!r.ok) return { ok: false, neden: `http ${r.status}` }
    const veri = ulkeYanitiTemizle(ulke, await r.json().catch(() => null))
    return veri ? { ok: true, veri } : { ok: false, neden: 'unreadable answer' }
  } catch (e) {
    return { ok: false, neden: e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'network' }
  }
}

export async function konsolVerisiTopla(d: {
  tr: () => Promise<KurucuUlkeYaniti>
  ulke: (ulke: string, taban: string) => Promise<{ ok: true; veri: KurucuUlkeYaniti } | { ok: false; neden: string }>
  stripe: () => Promise<StripeDonusumu>
  simdi?: number
}): Promise<KurucuKonsolVerisi> {
  const simdi = d.simdi ?? Date.now()
  const [tr, stripe, ...digerleri] = await Promise.all([
    d.tr().then((veri) => ({ ok: true as const, veri })).catch((e) => ({ ok: false as const, neden: e instanceof Error ? e.message.slice(0, 120) : 'error' })),
    d.stripe().catch((e): StripeDonusumu => ({ durum: 'hata', ayrinti: e instanceof Error ? e.message.slice(0, 120) : 'error' })),
    ...KURUCU_ULKELERI.map((u) => d.ulke(u.ulke, u.taban).catch(() => ({ ok: false as const, neden: 'error' }))),
  ])
  const kalemler = [{ ulke: 'tr', ad: 'TR', sonuc: tr }, ...KURUCU_ULKELERI.map((u, i) => ({ ulke: u.ulke, ad: u.ad, sonuc: digerleri[i] }))]
  const ulkeler: KonsolUlkesi[] = kalemler.map(({ ulke, ad, sonuc }) =>
    sonuc.ok
      ? { ulke, ad, durum: 'tamam', veri: sonuc.veri, ozet: ozetHesapla(sonuc.veri.hesaplar, simdi), kayitlar: kayitGunlugu(sonuc.veri.hesaplar) }
      : { ulke, ad, durum: 'erisilemez', neden: sonuc.neden })
  const hepsi: KurucuHesap[] = ulkeler.flatMap((u) => (u.durum === 'tamam' ? u.veri.hesaplar : []))
  const testHesaplari = [...new Set(ulkeler.flatMap((u) => (u.durum === 'tamam' ? u.veri.testHesaplari.map((e) => `${e} (${u.ad})`) : [])))]
  return { uretildi: new Date(simdi).toISOString(), ulkeler, toplam: ozetHesapla(hepsi, simdi), stripe, testHesaplari }
}
