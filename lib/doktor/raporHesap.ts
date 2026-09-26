/**
 * NOTYA-RAPORLAR-01 (Kaan, 2026-09-26) — kilitli raporun saf hesabı.
 * Gün sınırı Europe/Istanbul (Türkiye sabit UTC+3). Hasta adı, telefon ve kimlik yok.
 * Süre yazılmamış seans ortalamaya girmez. Koltuk süresi = o günün muayene sayısı × ortalama dakika.
 */

export type RaporAralik = 'hafta' | 'ay' | '3ay' | 'yil'

export const RAPOR_ARALIKLARI: readonly { id: RaporAralik; etiket: string }[] = [
  { id: 'hafta', etiket: 'Bu hafta' },
  { id: 'ay', etiket: 'Bu ay' },
  { id: '3ay', etiket: 'Son 3 ay' },
  { id: 'yil', etiket: 'Bu yıl' },
]

const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const AY_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const GUN_UZUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

const TIPLER: { id: string; ad: string }[] = [
  { id: 'muayene', ad: 'Muayene' },
  { id: 'kontrol', ad: 'Kontrol' },
  { id: 'konsültasyon', ad: 'Konsültasyon' },
  { id: 'telesağlık', ad: 'Telesağlık' },
]

const NOT_TURLERI: { id: string; ad: string }[] = [
  { id: 'soap', ad: 'SOAP' },
  { id: 'anamnez', ad: 'Anamnez' },
  { id: 'epikriz', ad: 'Epikriz' },
  { id: 'konsültan', ad: 'Konsültasyon' },
  { id: 'ameliyat', ad: 'Ameliyat' },
]

export interface SeansSatiri {
  started_at?: string | null
  session_type?: string | null
  duration_seconds?: number | null
  specialty?: string | null
}

export interface NotSatiri {
  created_at?: string | null
  note_type?: string | null
  approved_at?: string | null
  basvuru_yakinmasi?: string | null
  icd10_codes?: unknown
  content_ilaclar?: unknown
}

export interface GunOlcu {
  etiket: string
  ad: string
  sayi: number
  ortalamaDk: number | null
  koltukDk: number | null
}

export interface Adet { ad: string; sayi: number }
export interface TaniSatiri { kod: string; ad: string; sayi: number }

export interface AralikHesap {
  aralik: RaporAralik
  aralikEtiket: string
  gunler: GunOlcu[]
  enCok: { ad: string; sayi: number } | null
  enUzun: { ad: string; koltukDk: number } | null
  tartiliOrtalamaDk: number | null
  okuma: string
  tipler: Adet[]
  yakinmalar: Adet[]
  tanilar: TaniSatiri[]
  notTurleri: Adet[]
  onaylanan: number
  bekleyen: number
  ilaclar: Adet[]
  /** Yalnız branş değiştirebilen hesap. Başka doktorda null. */
  branslar: Adet[] | null
}

export interface TrtParca { y: number; m: number; d: number; haftaGunu: number }

export function trtParca(an: Date): TrtParca {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(an)
  const al = (t: string) => parts.find((p) => p.type === t)?.value || ''
  const hafta: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { y: Number(al('year')), m: Number(al('month')), d: Number(al('day')), haftaGunu: hafta[al('weekday')] ?? 0 }
}

export function trtAn(y: number, m: number, d: number, sa = 0, dk = 0): Date {
  const p = (n: number) => String(n).padStart(2, '0')
  return new Date(`${y}-${p(m)}-${p(d)}T${p(sa)}:${p(dk)}:00+03:00`)
}

export function gunEkle(y: number, m: number, d: number, n: number): TrtParca {
  return trtParca(new Date(trtAn(y, m, d, 12).getTime() + n * 86400000))
}

export function ayEkle(y: number, m: number, n: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + n
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
}

function iso(y: number, m: number, d: number): string {
  return trtAn(y, m, d).toISOString()
}

export interface Sinir { bas: string; son: string }

export interface RaporPencereleri {
  bugun: Sinir
  hafta: Sinir
  gecenHafta: Sinir
  ay: Sinir
  gecenAy: Sinir
  ucAy: Sinir
  oncekiUcAy: Sinir
}

export function raporPencereleri(simdi: Date): RaporPencereleri {
  const p = trtParca(simdi)
  const yarin = gunEkle(p.y, p.m, p.d, 1)
  const geri = p.haftaGunu === 0 ? 6 : p.haftaGunu - 1
  const pzt = gunEkle(p.y, p.m, p.d, -geri)
  const pztSon = gunEkle(pzt.y, pzt.m, pzt.d, 7)
  const gecenPzt = gunEkle(pzt.y, pzt.m, pzt.d, -7)
  const ayBas = { y: p.y, m: p.m }
  const aySon = ayEkle(p.y, p.m, 1)
  const gecenAyBas = ayEkle(p.y, p.m, -1)
  const ucBas = ayEkle(p.y, p.m, -2)
  const oncekiUcBas = ayEkle(ucBas.y, ucBas.m, -3)
  return {
    bugun: { bas: iso(p.y, p.m, p.d), son: iso(yarin.y, yarin.m, yarin.d) },
    hafta: { bas: iso(pzt.y, pzt.m, pzt.d), son: iso(pztSon.y, pztSon.m, pztSon.d) },
    gecenHafta: { bas: iso(gecenPzt.y, gecenPzt.m, gecenPzt.d), son: iso(pzt.y, pzt.m, pzt.d) },
    ay: { bas: iso(ayBas.y, ayBas.m, 1), son: iso(aySon.y, aySon.m, 1) },
    gecenAy: { bas: iso(gecenAyBas.y, gecenAyBas.m, 1), son: iso(ayBas.y, ayBas.m, 1) },
    ucAy: { bas: iso(ucBas.y, ucBas.m, 1), son: iso(aySon.y, aySon.m, 1) },
    oncekiUcAy: { bas: iso(oncekiUcBas.y, oncekiUcBas.m, 1), son: iso(ucBas.y, ucBas.m, 1) },
  }
}

export function aralikSiniri(aralik: RaporAralik, simdi: Date): Sinir {
  const pencere = raporPencereleri(simdi)
  if (aralik === 'hafta') return pencere.hafta
  if (aralik === '3ay') return pencere.ucAy
  if (aralik === 'yil') {
    const p = trtParca(simdi)
    const son = ayEkle(p.y, p.m, 1)
    return { bas: iso(p.y, 1, 1), son: iso(son.y, son.m, 1) }
  }
  return pencere.ay
}

export function gecerliAralik(ham: string | null | undefined): RaporAralik {
  if (ham === 'hafta' || ham === 'ay' || ham === '3ay' || ham === 'yil') return ham
  return 'ay'
}

interface Kova { etiket: string; ad: string; bas: number; son: number }

function kovalar(aralik: RaporAralik, simdi: Date): Kova[] {
  const p = trtParca(simdi)
  const yarin = gunEkle(p.y, p.m, p.d, 1)
  const bugunSon = trtAn(yarin.y, yarin.m, yarin.d).getTime()
  if (aralik === 'hafta') {
    const geri = p.haftaGunu === 0 ? 6 : p.haftaGunu - 1
    const pzt = gunEkle(p.y, p.m, p.d, -geri)
    return Array.from({ length: 7 }, (_, i) => {
      const g = gunEkle(pzt.y, pzt.m, pzt.d, i)
      const gn = gunEkle(g.y, g.m, g.d, 1)
      const h = trtParca(trtAn(g.y, g.m, g.d, 12)).haftaGunu
      return { etiket: GUN_KISA[h], ad: GUN_UZUN[h], bas: trtAn(g.y, g.m, g.d).getTime(), son: trtAn(gn.y, gn.m, gn.d).getTime() }
    })
  }
  if (aralik === 'ay') {
    const out: Kova[] = []
    for (let gun = 1; gun <= p.d; gun++) {
      const gn = gunEkle(p.y, p.m, gun, 1)
      out.push({
        etiket: String(gun),
        ad: `${gun} ${AY_UZUN[p.m - 1]}`,
        bas: trtAn(p.y, p.m, gun).getTime(),
        son: trtAn(gn.y, gn.m, gn.d).getTime(),
      })
    }
    return out
  }
  if (aralik === 'yil') {
    return Array.from({ length: p.m }, (_, i) => {
      const bas = ayEkle(p.y, 1, i)
      const son = ayEkle(bas.y, bas.m, 1)
      return {
        etiket: AY_KISA[bas.m - 1],
        ad: AY_UZUN[bas.m - 1],
        bas: trtAn(bas.y, bas.m, 1).getTime(),
        son: trtAn(son.y, son.m, 1).getTime(),
      }
    })
  }
  const basAy = ayEkle(p.y, p.m, -2)
  const basMs = trtAn(basAy.y, basAy.m, 1).getTime()
  const out: Kova[] = []
  let imlec = basMs
  while (imlec < bugunSon && out.length < 20) {
    const g = trtParca(new Date(imlec + 12 * 3600000))
    const sonGun = gunEkle(g.y, g.m, g.d, 7)
    const son = trtAn(sonGun.y, sonGun.m, sonGun.d).getTime()
    out.push({
      etiket: `${g.d} ${AY_KISA[g.m - 1]}`,
      ad: `${g.d} ${AY_UZUN[g.m - 1]} haftası`,
      bas: imlec,
      son,
    })
    imlec = son
  }
  return out
}

export function sureYazi(dk: number): string {
  if (dk < 60) return `${dk} dk`
  const sa = Math.floor(dk / 60)
  const kalan = dk % 60
  return kalan ? `${sa} sa ${kalan} dk` : `${sa} sa`
}

function dakika(saniye: number): number {
  return Math.max(1, Math.round(saniye / 60))
}

function dizi(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

function yakinmaTemiz(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

function tipAnahtar(ham: string | null | undefined): string {
  const s = (ham || 'muayene').toLocaleLowerCase('tr-TR')
  if (s === 'telesaglik' || s === 'telesağlık') return 'telesağlık'
  if (s === 'kontrol' || s === 'konsültasyon' || s === 'muayene') return s
  return 'diger'
}

function taniParcalari(ham: unknown): { kod: string; ad: string }[] {
  const out: { kod: string; ad: string }[] = []
  for (const oge of dizi(ham)) {
    if (typeof oge === 'string') {
      const kod = oge.trim()
      if (kod) out.push({ kod, ad: '' })
      continue
    }
    if (!oge || typeof oge !== 'object') continue
    const k = oge as Record<string, unknown>
    const kod = String(k.code || k.kod || '').trim()
    const ad = String(k.description_tr || k.description || k.aciklama || k.name || '').trim()
    if (kod) out.push({ kod, ad: ad && ad !== kod ? ad : '' })
  }
  return out
}

function ilacAdlari(ham: unknown): string[] {
  const out: string[] = []
  for (const oge of dizi(ham)) {
    if (typeof oge === 'string') {
      const ad = oge.trim()
      if (ad) out.push(ad)
      continue
    }
    if (!oge || typeof oge !== 'object') continue
    const ad = String((oge as { ad?: unknown }).ad || '').trim()
    if (ad) out.push(ad)
  }
  return out
}

function siralaAdet(map: Map<string, { ad: string; sayi: number }>, n: number): Adet[] {
  return [...map.values()].sort((a, b) => b.sayi - a.sayi || a.ad.localeCompare(b.ad, 'tr')).slice(0, n)
}

export function aralikHesapla(
  aralikHam: string | null | undefined,
  simdi: Date,
  seanslar: SeansSatiri[],
  notlar: NotSatiri[],
  bransIzni: boolean,
  bransAdi: (anahtar: string | null) => string,
): AralikHesap {
  const aralik = gecerliAralik(aralikHam)
  const kova = kovalar(aralik, simdi)
  const gunler: GunOlcu[] = kova.map((k) => {
    const gunun = seanslar.filter((s) => {
      const t = s.started_at ? new Date(s.started_at).getTime() : NaN
      return t >= k.bas && t < k.son
    })
    const sureli = gunun
      .map((s) => Number(s.duration_seconds))
      .filter((n) => Number.isFinite(n) && n > 0)
    const ortalamaDk = sureli.length ? dakika(sureli.reduce((a, b) => a + b, 0) / sureli.length) : null
    return {
      etiket: k.etiket,
      ad: k.ad,
      sayi: gunun.length,
      ortalamaDk,
      koltukDk: ortalamaDk == null ? null : gunun.length * ortalamaDk,
    }
  })

  const dolu = gunler.filter((g) => g.sayi > 0)
  const enCok = dolu.reduce<GunOlcu | null>((a, g) => (!a || g.sayi > a.sayi ? g : a), null)
  const uzunAday = gunler.filter((g) => g.koltukDk != null)
  const enUzun = uzunAday.reduce<GunOlcu | null>((a, g) => (!a || (g.koltukDk || 0) > (a.koltukDk || 0) ? g : a), null)

  const sureliHepsi = seanslar
    .map((s) => Number(s.duration_seconds))
    .filter((n) => Number.isFinite(n) && n > 0)
  const tartiliOrtalamaDk = sureliHepsi.length
    ? dakika(sureliHepsi.reduce((a, b) => a + b, 0) / sureliHepsi.length)
    : null

  let okuma = 'Bu aralıkta muayene yok.'
  if (enCok && enUzun && enCok.ad === enUzun.ad) {
    okuma = `En çok muayene ve en uzun koltuk ${enCok.ad}: ${enCok.sayi} muayene, ${sureYazi(enUzun.koltukDk || 0)}.`
  } else if (enCok && enUzun) {
    okuma = `En çok muayene ${enCok.ad}, ${enCok.sayi}. En uzun koltuk ${enUzun.ad}, ${sureYazi(enUzun.koltukDk || 0)}.`
  } else if (enCok) {
    okuma = `En çok muayene ${enCok.ad}, ${enCok.sayi}. Süresi yazılmış seans yok.`
  }
  if (tartiliOrtalamaDk != null) okuma += ` Tartılı ortalama ${tartiliOrtalamaDk} dakika.`

  const tipSay = new Map(TIPLER.map((t) => [t.id, 0]))
  let digerTip = 0
  for (const s of seanslar) {
    const k = tipAnahtar(s.session_type)
    if (tipSay.has(k)) tipSay.set(k, (tipSay.get(k) || 0) + 1)
    else digerTip += 1
  }
  const tipler: Adet[] = TIPLER.map((t) => ({ ad: t.ad, sayi: tipSay.get(t.id) || 0 }))
  if (digerTip) tipler.push({ ad: 'Diğer', sayi: digerTip })

  const yakinma = new Map<string, { ad: string; sayi: number }>()
  for (const n of notlar) {
    const ad = yakinmaTemiz(String(n.basvuru_yakinmasi || ''))
    if (!ad) continue
    const anahtar = ad.toLocaleLowerCase('tr-TR')
    const eski = yakinma.get(anahtar)
    if (eski) eski.sayi += 1
    else yakinma.set(anahtar, { ad: ad.length > 80 ? `${ad.slice(0, 79)}…` : ad, sayi: 1 })
  }

  const tani = new Map<string, { kod: string; ad: string; sayi: number }>()
  for (const n of notlar) {
    const gorulen = new Set<string>()
    for (const parca of taniParcalari(n.icd10_codes)) {
      const kod = parca.kod.toLocaleUpperCase('tr-TR')
      if (gorulen.has(kod)) continue
      gorulen.add(kod)
      const eski = tani.get(kod)
      if (eski) {
        eski.sayi += 1
        if (parca.ad && parca.ad.length > eski.ad.length) eski.ad = parca.ad
      } else tani.set(kod, { kod, ad: parca.ad, sayi: 1 })
    }
  }

  const notSay = new Map(NOT_TURLERI.map((t) => [t.id, 0]))
  let digerNot = 0
  let onaylanan = 0
  let bekleyen = 0
  const ilac = new Map<string, { ad: string; sayi: number }>()
  for (const n of notlar) {
    const tur = String(n.note_type || 'soap')
    if (notSay.has(tur)) notSay.set(tur, (notSay.get(tur) || 0) + 1)
    else digerNot += 1
    if (n.approved_at) {
      onaylanan += 1
      const gorulen = new Set<string>()
      for (const ad of ilacAdlari(n.content_ilaclar)) {
        const anahtar = ad.toLocaleLowerCase('tr-TR')
        if (gorulen.has(anahtar)) continue
        gorulen.add(anahtar)
        const eski = ilac.get(anahtar)
        if (eski) eski.sayi += 1
        else ilac.set(anahtar, { ad, sayi: 1 })
      }
    } else bekleyen += 1
  }
  const notTurleri = NOT_TURLERI.filter((t) => (notSay.get(t.id) || 0) > 0).map((t) => ({ ad: t.ad, sayi: notSay.get(t.id) || 0 }))
  if (digerNot) notTurleri.push({ ad: 'Diğer', sayi: digerNot })

  let branslar: Adet[] | null = null
  if (bransIzni) {
    const brans = new Map<string, { ad: string; sayi: number }>()
    for (const s of seanslar) {
      const ad = bransAdi(s.specialty ?? null)
      const eski = brans.get(ad)
      if (eski) eski.sayi += 1
      else brans.set(ad, { ad, sayi: 1 })
    }
    branslar = siralaAdet(brans, 8)
  }

  return {
    aralik,
    aralikEtiket: RAPOR_ARALIKLARI.find((a) => a.id === aralik)?.etiket || 'Bu ay',
    gunler,
    enCok: enCok ? { ad: enCok.ad, sayi: enCok.sayi } : null,
    enUzun: enUzun ? { ad: enUzun.ad, koltukDk: enUzun.koltukDk || 0 } : null,
    tartiliOrtalamaDk,
    okuma,
    tipler,
    yakinmalar: siralaAdet(yakinma, 8),
    tanilar: [...tani.values()]
      .sort((a, b) => b.sayi - a.sayi || a.kod.localeCompare(b.kod, 'tr'))
      .slice(0, 8)
      .map((t) => ({ kod: t.kod, ad: t.ad || '—', sayi: t.sayi })),
    notTurleri,
    onaylanan,
    bekleyen,
    ilaclar: siralaAdet(ilac, 5),
    branslar,
  }
}
