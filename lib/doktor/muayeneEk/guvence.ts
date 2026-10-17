/**
 * MUAYENE-EKLERI-01 — "uydurma yok" güvenceleri. Saf + istemci-güvenli.
 *
 *  1) sayisalGuvence: değerlendirme metnindeki bir sayı, belgeden çıkarılan değerler / referanslar / sistem hesapları
 *     kümesinde yoksa o cümle ATILIR (uyarı eklenir). Model tablodaki bir değeri yanlış yazdıysa ya da hiç olmayan bir
 *     değer uydurduysa hekimin önüne gitmez.
 *  2) atifKontrol: SOAP gövdesindeki `[EK-n]` atıfları. Bilinmeyen atıf kaldırılır; atıflı cümledeki sayı ilgili ekin
 *     doğrulanmış sayı kümesinde yoksa cümleye "doğrulanamadı" notu düşülür. Atıfsız cümle hekimin sözü sayılır.
 *  3) sonucuDogrula: istemciden gelen/DB'den okunan serbest JSON'u EkSonuc şemasına zorlar (boyut ve tür sınırları).
 */
import type { EkAsiSatiri, EkBulgu, EkLabDegeri, EkSonuc, EkTuru, EkDegerlendirme } from './tipler'
import { AZAMI_BULGU, AZAMI_METIN, EK_DEGERLENDIRME_SURUMU, ekTuruMu } from './tipler'

// ─── Sayı çıkarma ────────────────────────────────────────────────────────────────────────────────────────
const TARIH_RE = /\b(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])[./-](?:19|20)\d{2}\b|\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g
const SAYI_RE = /\d+(?:[.,]\d+)?/g

/** "12,10" ve "12.1" aynı sayı sayılır. */
export function sayiNormalize(ham: string): string {
  let s = ham.replace(',', '.')
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s.replace(/^0+(?=\d)/, '')
}

/** "3 değer", "2 doz", "10 gün" gibi adet ifadeleri bir ölçüm değeri değildir. */
const ADET_RE = /(?<![\p{L}\p{N}.,])\d{1,2}\s+(?:değer|test|parametre|adet|doz|gün|ay|hafta|kez|madde|sonuç|satır|ek|belge)(?![\p{L}])/giu

export function sayilariCikar(metin: string): string[] {
  const temiz = String(metin || '').replace(TARIH_RE, ' ').replace(ADET_RE, ' ')
  return (temiz.match(SAYI_RE) || []).map(sayiNormalize)
}

/** Yıllar serbesttir. Tek haneli sayılar DAHİL değildir: "Hb 9" gibi uydurma bir değer geçmesin. */
function serbestSayiMi(n: string): boolean {
  return /^(19|20)\d{2}$/.test(n)
}

export function izinliKume(kaynaklar: Array<string | number | null | undefined>): Set<string> {
  const k = new Set<string>()
  for (const x of kaynaklar) {
    if (x == null) continue
    for (const n of sayilariCikar(String(x))) k.add(n)
  }
  return k
}

export function desteklenmeyenSayilar(metin: string, izinli: Set<string>): string[] {
  return sayilariCikar(metin).filter((n) => !serbestSayiMi(n) && !izinli.has(n))
}

export interface SayisalSonuc {
  tutulan: string[]
  atilan: string[]
}

/** Her cümlede desteklenmeyen sayı varsa cümleyi atar. Cümle sınırı: . ! ? ; ve satır sonu. */
export function sayisalGuvence(metinler: string[], izinli: Set<string>): SayisalSonuc {
  const tutulan: string[] = []
  const atilan: string[] = []
  for (const m of metinler) {
    const cumleler = String(m || '').split(/(?<=[.!?;])\s+|\n+/).map((c) => c.trim()).filter(Boolean)
    const kalan: string[] = []
    for (const c of cumleler) {
      if (desteklenmeyenSayilar(c, izinli).length) atilan.push(c)
      else kalan.push(c)
    }
    if (kalan.length) tutulan.push(kalan.join(' '))
  }
  return { tutulan, atilan }
}

// ─── SOAP atıf kontrolü ──────────────────────────────────────────────────────────────────────────────────
const ATIF_RE = /\[(EK-\d{1,2}(?:\.\d{1,2})?)\]/g

export interface AtifSonucu {
  metin: string
  /** Kaldırılan (bilinmeyen) atıflar. */
  bilinmeyen: string[]
  /** Sayısı doğrulanamayan cümleler (kısaltılmış). */
  dogrulanamayan: string[]
}

export const ATIF_DOGRULANAMADI = '(kaynak ekte doğrulanamadı — lütfen kontrol edin)'

export function atifKontrol(metin: string | null | undefined, ekler: Pick<EkDegerlendirme, 'etiket' | 'sonuc'>[]): AtifSonucu {
  const ham = String(metin || '')
  if (!ham) return { metin: '', bilinmeyen: [], dogrulanamayan: [] }
  const izinli = new Map<string, Set<string>>()
  for (const e of ekler) izinli.set(e.etiket, izinliKume(e.sonuc.izinliSayilar))
  const bilinmeyen: string[] = []
  const dogrulanamayan: string[] = []

  const satirlar = ham.split('\n').map((satir) => {
    const parcalar = satir.split(/(?<=[.!?;])\s+/)
    return parcalar.map((cumle) => {
      const etiketler = Array.from(cumle.matchAll(ATIF_RE)).map((m) => m[1])
      if (!etiketler.length) return cumle
      let c = cumle
      const gecerli: string[] = []
      for (const e of etiketler) {
        const ana = e.split('.')[0]
        if (izinli.has(ana)) gecerli.push(ana)
        else { bilinmeyen.push(e); c = c.split(`[${e}]`).join('') }
      }
      c = c.replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1').trim()
      if (!gecerli.length) return c
      const kume = new Set<string>()
      for (const g of gecerli) for (const n of izinli.get(g)!) kume.add(n)
      const bos = c.replace(ATIF_RE, ' ')
      if (desteklenmeyenSayilar(bos, kume).length) {
        dogrulanamayan.push(bos.trim().slice(0, 120))
        return `${c} ${ATIF_DOGRULANAMADI}`
      }
      return c
    }).join(' ')
  })
  return { metin: satirlar.join('\n'), bilinmeyen, dogrulanamayan }
}

// ─── Şema zorlama ────────────────────────────────────────────────────────────────────────────────────────
const kisalt = (x: unknown, n = AZAMI_METIN): string => (typeof x === 'string' ? x.replace(/\u0000/g, '').trim().slice(0, n) : '')
const dizi = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])

function bulguDogrula(x: unknown, etiket: string, sira: number): EkBulgu | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const metin = kisalt(r.metin, 600)
  if (!metin) return null
  const duzey = r.duzey === 'kritik' || r.duzey === 'uyari' ? r.duzey : 'bilgi'
  return { id: `${etiket}.${sira}`, metin, kaynak: r.kaynak === 'belge' ? 'belge' : 'yorum', duzey }
}

function labDegeriDogrula(x: unknown): EkLabDegeri | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const test = kisalt(r.test, 80)
  const deger = kisalt(r.deger, 40)
  if (!test || !deger) return null
  const bayrak = (['H', 'L', 'critical', 'normal', 'unknown'] as const).find((b) => b === r.bayrak) || 'unknown'
  return { test, deger, birim: kisalt(r.birim, 24) || null, referans: kisalt(r.referans, 40) || null, bayrak, dogrulanacak: r.dogrulanacak === true }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
function asiSatiriDogrula(x: unknown, i: number): EkAsiSatiri | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const asiAdi = kisalt(r.asiAdi, 120)
  const doz = typeof r.dozNo === 'number' && Number.isInteger(r.dozNo) && r.dozNo >= 1 && r.dozNo <= 10 ? r.dozNo : null
  const tarih = typeof r.uygulamaTarihi === 'string' && ISO.test(r.uygulamaTarihi) ? r.uygulamaTarihi : null
  const skt = typeof r.skt === 'string' && ISO.test(r.skt) ? r.skt : null
  if (!asiAdi && !tarih && !kisalt(r.hamMetin, 200)) return null
  return {
    anahtar: kisalt(r.anahtar, 20) || `a${i + 1}`,
    asiAdi,
    dozNo: doz,
    uygulamaTarihi: tarih,
    lotNo: kisalt(r.lotNo, 60) || null,
    skt,
    okunamadi: r.okunamadi === true || !asiAdi,
    neden: kisalt(r.neden, 160) || null,
    hamMetin: kisalt(r.hamMetin, 200) || null,
    eslesme: kisalt(r.eslesme, 120) || 'Takvim dışı aşı',
    kaynakTuru: r.kaynakTuru === 'bu_muayene' ? 'bu_muayene' : 'karne',
  }
}

/** Serbest JSON → güvenli EkSonuc (etiket: bulgu kimliklerinin ön eki, örn. `EK-2`). Geçersizse null. */
export function sonucuDogrula(x: unknown, etiket: string): EkSonuc | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (!ekTuruMu(r.tur)) return null
  const durum = r.durum === 'hata' || r.durum === 'atlandi' ? r.durum : r.durum === 'tamam' ? 'tamam' : null
  if (!durum) return null
  const bulgular = dizi(r.bulgular).slice(0, AZAMI_BULGU).map((b, i) => bulguDogrula(b, etiket, i + 1)).filter((b): b is EkBulgu => !!b)
  const sonuc: EkSonuc = {
    tur: r.tur as EkTuru,
    durum,
    baslik: kisalt(r.baslik, 120),
    ozet: kisalt(r.ozet),
    bulgular,
    uyarilar: dizi(r.uyarilar).map((u) => kisalt(u, 300)).filter(Boolean).slice(0, 10),
    sinirlar: dizi(r.sinirlar).map((u) => kisalt(u, 300)).filter(Boolean).slice(0, 10),
    izinliSayilar: dizi(r.izinliSayilar).map((n) => kisalt(n, 20)).filter(Boolean).slice(0, 400),
    surum: kisalt(r.surum, 24) || EK_DEGERLENDIRME_SURUMU,
  }
  const lab = dizi(r.labDegerleri).slice(0, 120).map(labDegeriDogrula).filter((v): v is EkLabDegeri => !!v)
  if (lab.length) sonuc.labDegerleri = lab
  const asi = dizi(r.asiSatirlari).slice(0, 40).map((a, i) => asiSatiriDogrula(a, i)).filter((a): a is EkAsiSatiri => !!a)
  if (asi.length) sonuc.asiSatirlari = asi
  if (durum === 'hata') sonuc.hataNedeni = kisalt(r.hataNedeni, 200) || 'Değerlendirilemedi.'
  if (r.turKaynagi === 'hekim' || r.turKaynagi === 'ogrenilen' || r.turKaynagi === 'otomatik') sonuc.turKaynagi = r.turKaynagi
  // Bir değerlendirmenin izinli sayılarına yalnız kendi içeriğinden gelen sayılar eklenir (istemci genişletemez).
  const kume = izinliKume([...sonuc.izinliSayilar, ...(sonuc.labDegerleri || []).flatMap((v) => [v.deger, v.referans])])
  sonuc.izinliSayilar = Array.from(kume).slice(0, 400)
  return sonuc
}
