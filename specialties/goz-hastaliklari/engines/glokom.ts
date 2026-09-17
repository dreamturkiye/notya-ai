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
