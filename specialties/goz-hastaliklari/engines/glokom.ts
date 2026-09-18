/**
 * GOZ-CHAPTER — Glokom döngüsü. Pure. Hekim kararları: tanı, hedef GİB (göz başına), damla rejimi, görme alanı /
 * OCT aralığı. Motor yalnız ölçüm serisini hedefle karşılaştırır, geciken tetkiki görev yapar, rejimi özetler.
 * Titrasyon önermez ("damla ekle / değiştir" yazmaz); hedef üstü = "hekim kararı" bayrağı.
 * Aralık girilmemişse motor sayı uydurmaz: "aralığı hekim belirlesin" görevi döner.
 */
import type { Dipnot } from '../protocols/sources'

export type Goz = 'sag' | 'sol'
export interface GibOlcum { tarih: string; sag: number | null; sol: number | null; yontem?: string | null }
export interface Damla { ad: string; goz: 'sag' | 'sol' | 'iki'; siklik: string; baslangic?: string | null }
export interface GlokomKart {
  taniHekim: string | null
  goz: 'sag' | 'sol' | 'iki' | null
  hedefSag: number | null
  hedefSol: number | null
  damlalar: Damla[]
  sonGormeAlani: string | null
  sonOctRnfl: string | null
  gaAralikAy: number | null
  octAralikAy: number | null
}

const ayEkle = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export interface GozGibOzeti { goz: Goz; son: number | null; sonTarih: string | null; onceki: number | null; delta: number | null; hedef: number | null; hedefUstu: boolean | null; seri: { tarih: string; deger: number }[] }

export function gibOzeti(olcumler: GibOlcum[], goz: Goz, hedef: number | null): GozGibOzeti {
  const seri = olcumler.filter((o) => o[goz] != null).map((o) => ({ tarih: o.tarih, deger: Number(o[goz]) })).sort((a, b) => (a.tarih < b.tarih ? -1 : 1))
  const son = seri.at(-1) ?? null, onceki = seri.at(-2) ?? null
  return {
    goz, seri,
    son: son?.deger ?? null, sonTarih: son?.tarih ?? null, onceki: onceki?.deger ?? null,
    delta: son && onceki ? Math.round((son.deger - onceki.deger) * 10) / 10 : null,
    hedef, hedefUstu: son && hedef != null ? son.deger > hedef : null,
  }
}

export interface GlokomDegerlendirme { gozler: GozGibOzeti[]; gorevler: { kod: string; ad: string; due: string | null }[]; bayraklar: string[]; rejim: string[]; dipnotlar: Dipnot[] }

export function glokomDegerlendir(kart: GlokomKart, olcumler: GibOlcum[], bugun: string): GlokomDegerlendirme {
  const takipli: Goz[] = kart.goz === 'sag' ? ['sag'] : kart.goz === 'sol' ? ['sol'] : ['sag', 'sol']
  const gozler = takipli.map((g) => gibOzeti(olcumler, g, g === 'sag' ? kart.hedefSag : kart.hedefSol))
  const bayraklar: string[] = [], gorevler: GlokomDegerlendirme['gorevler'] = []
  const ad = (g: Goz) => (g === 'sag' ? 'Sağ göz' : 'Sol göz')
  for (const o of gozler) {
    if (o.hedef == null) bayraklar.push(`${ad(o.goz)}: hedef GİB girilmedi — hekim belirler`)
    else if (o.hedefUstu) bayraklar.push(`${ad(o.goz)}: son GİB ${o.son} mmHg, hedef ${o.hedef} mmHg üstünde — hekim kararı (motor tedavi önermez)`)
    if (o.sonTarih && o.sonTarih < ayEkle(bugun, -12)) bayraklar.push(`${ad(o.goz)}: son GİB ölçümü 12 aydan eski (${o.sonTarih})`)
  }
  const tetkik = (kod: string, adi: string, son: string | null, aralik: number | null) => {
    if (aralik == null) { gorevler.push({ kod: `${kod}_aralik`, ad: `${adi} aralığını hekim belirlesin`, due: null }); return }
    const due = son ? ayEkle(son, aralik) : bugun
    if (due <= ayEkle(bugun, 1)) gorevler.push({ kod, ad: `${adi}${son ? ` (son ${son}, ${aralik} ayda bir)` : ' — kayıt yok'}`, due })
  }
  tetkik('glokom_ga', 'Görme alanı', kart.sonGormeAlani, kart.gaAralikAy)
  tetkik('glokom_oct', 'OCT RNFL / GCL', kart.sonOctRnfl, kart.octAralikAy)
  const rejim = kart.damlalar.map((d) => `${d.ad} — ${d.goz === 'iki' ? 'iki göz' : d.goz === 'sag' ? 'sağ göz' : 'sol göz'}, ${d.siklik}${d.baslangic ? ` (başlangıç ${d.baslangic})` : ''}`)
  if (!kart.damlalar.length) bayraklar.push('Damla rejimi kayıtlı değil')
  return {
    gozler, gorevler, bayraklar, rejim,
    dipnotlar: [
      { ref: 'TOD', not: 'Hedef GİB ve izlem aralıkları hastaya özgüdür; hekim belirler (TOD Glokom birimi yaklaşımı — güncel doküman hekim teyit eder)' },
      { ref: 'EGS_5', not: 'Hedef basınç kavramı ve GA/OCT ile progresyon izlemi — uluslararası derinlik' },
      { ref: 'SUT_4211', not: 'Glokom ilacını göz uzmanı başlatır; uzman raporuyla diğer hekimler yazabilir' },
    ],
  }
}

// ---------- GOZ-EXCEPTIONAL-01: aralık önerileri (TOD birim PDF'i üye erişimli → EGS 5 birincil metin) ----------
/**
 * Hekim-düzenlenebilir ön ayarlar — "öneri — hekim kilitler". Motor sessizce uygulamaz: hekim seçer, alan dolar, Kaydet ile kilitler.
 * Kaynak: EGS Terminology and Guidelines for Glaucoma 5th ed. (2020), birincil PDF okundu 2026-09-18:
 *  - II.1.4.2.7 (s.84) + II.3.3 (s.128): yeni tanılı hastada ilk 2 yıl yılda 3 GA (SAP); ilerleme yoksa sıklık azaltılabilir.
 *  - FC V (s.98) "Assessment and follow-up intervals — follow-up intervals are just recommendations":
 *    POAG ideal 6 güvenilir GA / 2 yıl; stabil (tedavi altında) 6–12 ay; progresyon <6 ay; OHT düşük risk 12–24 ay, yüksek risk 6–12 ay.
 * FC V aralıkları yeniden değerlendirme (vizit) aralığıdır; GA alanına alt sınır yazılır, uygulanması hekim kararıdır.
 * EGS OCT için sayısal aralık vermez → OCT aralığı hiçbir ön ayarda doldurulmaz. TOD birim metni doğrulanınca TR sütunu eklenecek.
 */
export type GlokomOneriKod = 'egs_yeni_tani' | 'egs_stabil' | 'egs_progresyon' | 'egs_oht_dusuk' | 'egs_oht_yuksek'
export interface GlokomOneri { kod: GlokomOneriKod; ad: string; aralikMetni: string; gaAralikAy: number | null; octAralikAy: null; not: string; dipnot: Dipnot }
const EGS = (not: string): Dipnot => ({ ref: 'EGS_5', not })
export const GLOKOM_ARALIK_ONERILERI: GlokomOneri[] = [
  { kod: 'egs_yeni_tani', ad: 'Yeni tanı (ilk 2 yıl)', aralikMetni: 'GA yılda 3 (≈4 ayda bir)', gaAralikAy: 4, octAralikAy: null, not: 'Hızlı ilerlemeyi erken görmek için; ilerleme yoksa sıklık azaltılabilir.', dipnot: EGS('II.1.4.2.7 / FC V: yeni tanıda ilk 2 yıl yılda 3 GA, ideal 6 güvenilir GA') },
  { kod: 'egs_stabil', ad: 'Stabil (tedavi altında)', aralikMetni: 'yeniden değerlendirme 6–12 ay', gaAralikAy: 6, octAralikAy: null, not: 'Alt sınır (6 ay) yazıldı; 12 aya kadar hekim uzatabilir.', dipnot: EGS('FC V: stabil, tedavi altında 6–12 ayda yeniden değerlendirme') },
  { kod: 'egs_progresyon', ad: 'Progresyon', aralikMetni: 'yeniden değerlendirme <6 ay', gaAralikAy: null, octAralikAy: null, not: 'EGS yalnız üst sınır verir (<6 ay) — ayı hekim girer.', dipnot: EGS('FC V: progresyonda yeni bazal, <6 ayda yeniden değerlendirme, hedef GİB yeniden düşünülür') },
  { kod: 'egs_oht_dusuk', ad: 'OHT — düşük risk', aralikMetni: 'yeniden değerlendirme 12–24 ay', gaAralikAy: 12, octAralikAy: null, not: 'Alt sınır (12 ay) yazıldı.', dipnot: EGS('FC V: OHT düşük risk 12–24 ay') },
  { kod: 'egs_oht_yuksek', ad: 'OHT — yüksek risk', aralikMetni: 'yeniden değerlendirme 6–12 ay', gaAralikAy: 6, octAralikAy: null, not: 'Alt sınır (6 ay) yazıldı.', dipnot: EGS('FC V: OHT yüksek risk 6–12 ay; tedavi düşünülür') },
]
export const GLOKOM_ONERI_ETIKETI = 'öneri — hekim kilitler'

// ---------- Gonyoskopi / pakimetri / GA-OCT cihaz meta (hekim girişi; yorum yok) ----------
export interface GlokomMeta { shafferSag: number | null; shafferSol: number | null; gonyoSag: string | null; gonyoSol: string | null; pakiSag: number | null; pakiSol: number | null; gormeAlaniCihaz: string | null; octCihaz: string | null }
export const SHAFFER_AD: Record<number, string> = { 0: '0 — kapalı', 1: '1 — çok dar', 2: '2 — dar', 3: '3 — açık', 4: '4 — geniş açık' }

export function glokomMetaNormalize(g: Record<string, unknown>): { meta: GlokomMeta; hatalar: string[] } {
  const hatalar: string[] = []
  const tam = (v: unknown, ad: string, alt: number, ust: number) => {
    if (v == null || v === '') return null
    const n = Number(String(v).replace(',', '.'))
    if (!Number.isInteger(n) || n < alt || n > ust) { hatalar.push(`${ad} ${alt}–${ust} aralığında tam sayı olmalı`); return null }
    return n
  }
  const metin = (v: unknown, n = 120) => (v == null ? null : String(v).trim().slice(0, n) || null)
  return {
    meta: {
      shafferSag: tam(g.shafferSag, 'Shaffer OD', 0, 4), shafferSol: tam(g.shafferSol, 'Shaffer OS', 0, 4),
      gonyoSag: metin(g.gonyoSag), gonyoSol: metin(g.gonyoSol),
      pakiSag: tam(g.pakiSag, 'Pakimetri OD (µm)', 300, 900), pakiSol: tam(g.pakiSol, 'Pakimetri OS (µm)', 300, 900),
      gormeAlaniCihaz: metin(g.gormeAlaniCihaz, 80), octCihaz: metin(g.octCihaz, 80),
    },
    hatalar,
  }
}

export function glokomMetaMetni(m: GlokomMeta, sonGa: string | null, sonOct: string | null): string | null {
  const goz = (ad: string, sh: number | null, t: string | null, p: number | null) => {
    const x = [sh != null ? `Shaffer ${sh}` : null, t, p != null ? `SKK ${p} µm` : null].filter(Boolean)
    return x.length ? `${ad}: ${x.join(', ')}` : null
  }
  const p = [goz('OD', m.shafferSag, m.gonyoSag, m.pakiSag), goz('OS', m.shafferSol, m.gonyoSol, m.pakiSol),
    sonGa ? `son GA ${sonGa}${m.gormeAlaniCihaz ? ` (${m.gormeAlaniCihaz})` : ''}` : null, sonOct ? `son OCT ${sonOct}${m.octCihaz ? ` (${m.octCihaz})` : ''}` : null].filter(Boolean)
  return p.length ? `Glokom — gonyoskopi / pakimetri: ${p.join('; ')}.` : null
}
