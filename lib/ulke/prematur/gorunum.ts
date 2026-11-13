/**
 * PREMATUR-ULKE-01 — what the two screens compose from the engine's codes and the pack's words, as PURE functions (no React, no
 * clock): the corrected age as a sentence, the plan as copyable text, the cohort rows, the sentence behind each flag.
 * No word is written here: every string comes from the pack (./metin.ts).
 */
import { bicimli } from '../araclar/paket'
import { yerine } from '../arayuz/yerTutucu'
import type { BebekKohortSatiri, GebelikKohortSatiri } from './apiTipleri'
import { erkenDogumDegerlendir, type Bayrak, type ErkenDogumProtokolu, type ErkenDogumSonuc, type Gerekce, type GebelikOzetiGirdisi } from './erkenDogum'
import type { PrematurMetni } from './metin'
import { profildenPlan, planGirdisiProfilden, siradakiOge, type OgeGorunum, type TakipOgesi, type TakipPlani } from './plan'
import type { PrematurProtokol } from './tipler'
import { gestasyonMetni, duzeltilmisYasBicimi, postmenstrualMetni, type YasBicimi } from './yas'

export function yasMetni(b: YasBicimi, m: PrematurMetni['bebek']): string {
  switch (b.tur) {
    case 'yok': return ''
    case 'term-oncesi': return yerine(m.yasTermOncesi, b.hafta, b.gun)
    case 'gun': return yerine(m.yasGun, b.gun)
    case 'ay': return yerine(m.yasAy, b.ay)
    case 'yil': return yerine(m.yasYilAy, b.yil, b.ay)
  }
}

export const DURUM_ANAHTARI: Record<OgeGorunum, keyof PrematurMetni['bebek']['durum']> = {
  gecikti: 'gecikti', 'zamani-geldi': 'zamaniGeldi', yaklasiyor: 'yaklasiyor', planli: 'planli', 'kayit-eksik': 'kayitEksik', yapildi: 'yapildi',
  uygulanmaz: 'uygulanmaz', 'kriter-disi': 'kriterDisi', bilgi: 'bilgi', 'veri-eksik': 'veriEksik', yerel: 'yerel',
}

/** The corrected age and the figures of a plan, as the card shows them. */
export function yasSatirlari(plan: TakipPlani, bugun: string, m: PrematurMetni['bebek']) {
  const y = plan.yas
  return {
    kronolojik: y.gecerli ? yerine(m.yasAy, y.kronolojikAy) : '—',
    duzeltilmis: y.prematur && y.gecerli ? (y.buyume.duzeltilmis ? yasMetni(duzeltilmisYasBicimi(y, bugun), m) : m.duzeltmeUygulanmaz) : null,
    postmenstruel: y.postmenstrualGun != null ? postmenstrualMetni(y) : null,
  }
}

/** The plan as text to copy: the items whose criterion is met, and the items to follow the local protocol on. */
export function planMetni(plan: TakipPlani, g: { protokol: PrematurProtokol; dil: string; bugun: string; gestasyon: string; dogumKiloGr: number | null; tarih: (iso: string) => string }, m: PrematurMetni): string {
  const b = m.bebek
  const satir: string[] = [yerine(b.kopyaBaslik, bicimli(g.protokol.ad, g.dil), g.protokol.surum), yerine(b.kopyaGestasyon, g.gestasyon, g.dogumKiloGr ?? '—')]
  const y = plan.yas
  if (y.prematur) satir.push(yerine(b.kopyaYas, y.kronolojikAy, y.buyume.duzeltilmis ? yasMetni(duzeltilmisYasBicimi(y, g.bugun), b) : b.duzeltmeUygulanmaz, postmenstrualMetni(y)))
  for (const o of plan.ogeler.filter((x) => x.kriter.durum === 'karsilandi' || x.durum === 'yerel')) {
    satir.push(yerine(b.kopyaSatir, bicimli(o.baslik, g.dil), bicimli(o.etiket, g.dil), o.hedef ? g.tarih(o.hedef) : '—', b.durum[DURUM_ANAHTARI[o.durum]]))
  }
  return satir.join('\n')
}

// ───────────────────────────── the cohort of babies ─────────────────────────────

export interface BebekKohortu {
  satir: BebekKohortSatiri
  plan: TakipPlani
  gestasyon: string
  dogumKiloGr: number | null
  duzeltilmis: string
  siradaki: TakipOgesi | null
}

/** The doctor's own babies whose plan applies, the most urgent first. Babies out of scope (term, past the plan's last month) are left out. */
export function bebekKohortu(satirlar: readonly BebekKohortSatiri[], bugun: string, protokol: PrematurProtokol, m: PrematurMetni['bebek']): BebekKohortu[] {
  const out: BebekKohortu[] = []
  for (const s of satirlar) {
    const plan = profildenPlan({ dogumIso: s.dogumTarihi, profil: s.profil, durumlar: s.durumlar }, bugun, protokol)
    if (!plan.kapsamda) continue
    const { gestasyonGun, dogumKiloGr } = planGirdisiProfilden(s.profil)
    out.push({
      satir: s, plan, gestasyon: gestasyonMetni(gestasyonGun), dogumKiloGr,
      duzeltilmis: plan.yas.buyume.duzeltilmis ? yasMetni(duzeltilmisYasBicimi(plan.yas, bugun), m) : '',
      siradaki: siradakiOge(plan),
    })
  }
  return out.sort((a, b) => b.plan.ozet.gecikti - a.plan.ozet.gecikti || b.plan.ozet.zamaniGeldi - a.plan.ozet.zamaniGeldi
    || String(a.siradaki?.hedef || '9999').localeCompare(String(b.siradaki?.hedef || '9999')) || a.satir.ad.localeCompare(b.satir.ad))
}

// ───────────────────────────── the early-birth record ─────────────────────────────

/** The sentence behind one reason of a flag: the pack's sentence for the code, the engine's numbers put in. */
export function gerekceMetni(g: Gerekce, m: PrematurMetni['gebelik'], tarih: (iso: string) => string): string {
  const s = m.gerekce[g.kod] ?? ''
  const p = g.p ?? {}
  // Values are put in by name (a code's sentence names them with %1, %2 … in the order below).
  const sira: Record<string, string[]> = {
    'oyku-var': ['adet'], 'en-kisa': ['mm', 'gestasyon', 'tarih'], tanimlar: ['birinci', 'diger'], 'tanim-siniri': ['mm'], cogul: ['tip'],
    'prog-gec': ['gestasyon'], 'prog-esik': ['mm', 'esik'], 'prog-aralik': ['mm', 'alt', 'ust'], 'prog-ustunde': ['mm', 'ust'],
    'cok-kisa': ['mm', 'esik'], 'cok-kisa-degil': ['mm', 'esik'], 'pprom-kayit': ['tarih', 'gestasyon', 'gunOnce'],
  }
  const adlar = sira[g.kod] ?? []
  const deger = adlar.map((a) => {
    const v = p[a]
    if (g.kod === 'tanimlar') return v === 1 ? m.tanimSonuc.evet : v === 0 ? m.tanimSonuc.hayir : m.tanimSonuc.yok
    return a === 'tarih' && typeof v === 'string' && v ? tarih(v) : v === undefined ? '' : String(v)
  })
  return adlar.length ? yerine(s, ...deger) : s
}

export function bayrakSatirlari(b: Bayrak, m: PrematurMetni['gebelik'], tarih: (iso: string) => string): string[] {
  return b.gerekce.map((g) => gerekceMetni(g, m, tarih)).filter(Boolean)
}

export interface GebelikKohortu { satir: GebelikKohortSatiri; sonuc: ErkenDogumSonuc }

/** The doctor's own ACTIVE pregnancies that have a reason to be on the list, the shortest cervix first. */
export function gebelikKohortu(satirlar: readonly GebelikKohortSatiri[], bugun: string, protokol: ErkenDogumProtokolu): GebelikKohortu[] {
  const out: GebelikKohortu[] = []
  for (const s of satirlar) {
    if (s.e.durum !== 'aktif') continue
    const sonuc = erkenDogumDegerlendir({ sat: s.e.sat, tdt: s.e.tdt, cogulTipi: s.e.cogulTipi, durum: s.e.durum, kayit: s.e.kayit } satisfies GebelikOzetiGirdisi, bugun, protokol)
    if (sonuc.kohortNedenleri.length) out.push({ satir: s, sonuc })
  }
  const enKisa = (k: GebelikKohortu) => Math.min(...k.satir.e.kayit.serviks.map((o) => o.mm), 999)
  return out.sort((a, b) => enKisa(a) - enKisa(b) || a.satir.ad.localeCompare(b.satir.ad))
}
