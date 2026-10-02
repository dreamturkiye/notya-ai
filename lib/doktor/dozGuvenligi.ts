/**
 * NOTYA-ILK10-DOZ-01 (Dr. Gökhan, "İlk 10" standardı, 2026-10-02) — kiloya göre dozlanan ilaçta DOZ GÜVENLİĞİ denetimi.
 * Deterministik, LLM'siz, saf.
 *
 * Gerçek hasta testinde Soru 6 ürün adı uyuşmazlığını buldu ama dozu denetlemedi: notta 13 kg'lık çocuğa bir
 * amoksisilin-klavulanat süspansiyonundan günde iki kez mL dozu yazılıydı ve günlük mg/kg hesaplanmamıştı.
 *
 * Bu modül yeni bir doz tablosu DEĞİLDİR ve hiçbir referans sayısı içermez. Bağladığı yerler:
 *   - referans: Notya ilaç tablosu (lib/asistan/turkishDrugs.ts — her satırı kaynaklı, TİTCK KÜB) `pediatrik` alanı;
 *   - günlük mg okuma: core/eylemler/ilacUyari.ts gunlukMgOku (ilaç kartıyla aynı okuyucu);
 *   - süspansiyon konsantrasyonu: specialties/pediatri/engines/doz.ts konsantrasyonCoz (doz hesaplayıcıyla aynı);
 *   - kilo: olayın `kilo` / `kiloTarihi` alanı — reçete tarihindeki vizit ölçümü, yoksa öncesindeki en yakın ölçüm
 *     (lib/doktor/dosyaOlaylari.ts tarihtekiKilo). Güncel kilo KULLANILMAZ.
 *
 * Kurallar:
 *   - Tabloda olmayan ilaç ya da pediatrik referansı olmayan molekül → "referans yok"; referans UYDURULMAZ.
 *   - Kilo yoksa, kilo kayıtları çelişiyorsa, konsantrasyon ya da sıklık okunamıyorsa → "hesaplanamadı" ve nedeni.
 *   - Referans kaynağı tek bir formülasyona aitse (PediatrikDoz.kapsam) bu, bayrağın içinde söylenir.
 *   - Karar hekimindir: bayrak "doğrulayın" der, doz önermez.
 *
 * Kapsam: 18 yaşından küçük hasta (yaşa bağlı — branşa değil; ilaç kartındaki pediatrik denetimle aynı kapı).
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { AKUT_ILAC_AKTIF_GUN, gunEkleIso, gunFarkiIso, trGun } from '@/lib/doktor/dosyaOlaylari'
import { TURKISH_DRUGS, enIyiIlacAnahtari } from '@/lib/asistan/turkishDrugs'
import { gunlukMgOku, TEYIT_CUMLESI } from '@/core/eylemler/ilacUyari'
import { konsantrasyonCoz } from '@/specialties/pediatri/engines/doz'

export type DozDurumu = 'ust-sinir-ustu' | 'etkin-aralik-alti' | 'aralikta' | 'referans-yok' | 'hesaplanamadi' | 'kilo-bagimsiz'

export interface DozDegerlendirmesi {
  /** Olayın kaynakId'si — ilaç listesi satırında hasta_ilaclar.id. */
  kaynakId: string
  kaynak: 'liste' | 'recete'
  /** İlaç listesinde aktif / belirsiz ya da reçetenin süresi sürüyor. */
  devam: boolean
  ad: string
  tarih: string
  durum: DozDurumu
  /** Üst sınırın üzerinde ya da etkin aralığın altında. */
  bayrak: boolean
  /** Bayrak, ürünün formülasyonuna uyduğu bilinen bir referansla verildi (false: referans başka formülasyona ait olabilir). */
  kesin?: boolean
  mgKgGun?: number
  gunlukMg?: number
  kilo?: number
  kiloTarihi?: string
  /** Tablodaki molekül anahtarı (uyumsuzluk karşılaştırması için). */
  molekul?: string
  mgPerMl?: number
  /** Hekime tek cümle (Türkçe). */
  metin: string
}

export interface DozGuvenligi {
  ilaclar: DozDegerlendirmesi[]
  /** Reçetedeki ürün / konsantrasyon / doz ile ilaç listesindeki satır arasındaki fark. */
  uyumsuzluklar: { tarih: string; metin: string; /** İlaçlardan biri sürüyor. */ devam: boolean; /** İlaç listesi satırının id'si. */ listeId: string }[]
}

const ON_SEKIZ_YAS_AY = 18 * 12
const trS = (n: number, b = 1) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })
const sayi = (s: string) => Number(s.replace(',', '.'))

const KONSANTRASYON = /(\d+(?:[.,]\d+)?)\s*mg\s*(?:[/+]\s*\d+(?:[.,]\d+)?\s*mg\s*)?\/\s*(\d+(?:[.,]\d+)?)?\s*(?:ml|cc)\b/i
const ML_DOZ = /(\d+(?:[.,]\d+)?)\s*(?:ml|cc)\b/i
const MG_KG = /(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*kg(?:\s*\/\s*(gün|gun|doz))?/i
const FREKANS = /\d\s*[xX×]\s*\d|günde|gunde|\b(kez|defa|kere)\b|saatte\s*bir|sabah|akşam|öğle|gece/i
const GEREKTIGINDE = /ateşte|ağrıda|ağrı olursa|gerekti|gerekirse|lüzum|\bprn\b/i

/** Yaş (ay) — doğum tarihi yoksa null. */
function yasAy(dogumIso: string | null, bugunIso: string): number | null {
  if (!dogumIso) return null
  const [y1, m1, d1] = dogumIso.split('-').map(Number)
  const [y2, m2, d2] = bugunIso.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

/** O tarihte aynı gün birbirinden farklı kilo kayıtları (muayene alanı / cihaz) varsa değerleri; yoksa null. */
function kiloCeliskisi(olaylar: DosyaOlayi[], tarih: string | undefined): number[] | null {
  if (!tarih) return null
  const degerler = [...new Set(olaylar.filter((o) => o.tur === 'kilo' && o.deger != null && o.tarih === tarih && (o.kaynak === 'olcum' || o.kaynak === 'cihaz')).map((o) => o.deger!))]
  return degerler.length > 1 ? degerler.sort((a, b) => a - b) : null
}

function degerlendir(o: DosyaOlayi, olaylar: DosyaOlayi[], bugunIso: string): DozDegerlendirmesi {
  const parcalar = o.metin.replace(/\s*\[[^\]]*\]\s*$/, '').split(' — ')
  const ad = parcalar[0].trim()
  const yazilan = parcalar.slice(1).join(' — ').trim()
  const kaynak = o.tur === 'recete' ? 'recete' as const : 'liste' as const
  const bitis = o.sureGun ? gunEkleIso(o.tarih, o.sureGun) : null
  const devam = kaynak === 'liste' ? o.durum === 'aktif' || o.durum === 'belirsiz' : bitis ? bitis > bugunIso : gunFarkiIso(o.tarih, bugunIso) <= AKUT_ILAC_AKTIF_GUN
  const temel = { kaynakId: o.kaynakId, kaynak, devam, ad, tarih: o.tarih, bayrak: false }
  const yazim = yazilan ? `yazılan: ${yazilan}` : 'doz yazılmamış'

  const molekul = enIyiIlacAnahtari([ad, o.etken].filter(Boolean).join(' '))
  const ilac = molekul ? TURKISH_DRUGS[molekul] : null
  if (!ilac || !molekul) return { ...temel, durum: 'referans-yok', metin: `${ad} (${yazim}): Notya ilaç tablosunda yok — referans yok; doz denetlenmedi.` }
  const p = ilac.pediatrik
  const k = KONSANTRASYON.exec(ad) || KONSANTRASYON.exec(yazilan)
  const kons = k ? konsantrasyonCoz(`${k[1]} mg/${k[2] || '1'} mL`) : null
  const ortak = { ...temel, molekul, ...(kons ? { mgPerMl: kons.mgPerMl } : {}) }
  if (!p) return { ...ortak, durum: 'referans-yok', metin: `${ad} (${yazim}): Notya ilaç tablosunda bu ilaç için pediatrik doz referansı yok — referans yok; doz denetlenmedi.` }
  if (p.sabitDoz || (p.birim !== 'mg/kg/gün' && p.birim !== 'mg/kg/doz')) return { ...ortak, durum: 'kilo-bagimsiz', metin: `${ad} (${yazim}): tablodaki referans kiloya göre değil (${p.birim}${p.sabitDoz ? ', sabit doz' : ''}); mg/kg/gün karşılaştırması bu ilaçta kullanılmaz.` }

  const hesaplanamadi = (neden: string): DozDegerlendirmesi => ({ ...ortak, durum: 'hesaplanamadi', metin: `${ad} (${yazim}): mg/kg/gün hesaplanamadı — ${neden}.` })
  const sikliksiz = yazilan.replace(KONSANTRASYON, ' ')
  const frekansVar = FREKANS.test(sikliksiz)
  const gerektiginde = GEREKTIGINDE.test(sikliksiz)
  if (gerektiginde && !frekansVar) return hesaplanamadi('gerektiğinde kullanım yazılmış, günlük sıklık yazılmamış')

  // Günlük toplam (mg) ve doz sayısı — üç yazım: mg/kg, mL (konsantrasyonla), mg.
  let gunlukMg: number | null = null
  let mgKgGun: number | null = null
  let hesap = ''
  const dozSayisi = frekansVar ? gunlukMgOku('1 mg', sikliksiz.replace(MG_KG, ' ').replace(ML_DOZ, ' ')) : null
  const mgKg = MG_KG.exec(yazilan)
  const ml = ML_DOZ.exec(sikliksiz)
  if (mgKg) {
    const birim = (mgKg[2] || '').toLocaleLowerCase('tr-TR')
    if (!birim) return hesaplanamadi('mg/kg yazılmış ama gün başına mı doz başına mı olduğu yazılmamış')
    if (birim === 'doz' && !dozSayisi) return hesaplanamadi('mg/kg/doz yazılmış, günlük sıklık okunamadı')
    mgKgGun = sayi(mgKg[1]) * (birim === 'doz' ? dozSayisi! : 1)
    hesap = `${mgKg[0]}${birim === 'doz' ? ` × günde ${dozSayisi} doz` : ''}`
  } else if (ml) {
    if (!kons) return hesaplanamadi('doz mL olarak yazılmış, ürünün konsantrasyonu (mg/mL) kayıtta yok; konsantrasyon varsayılmadı')
    if (!frekansVar || !dozSayisi) return hesaplanamadi('günlük sıklık yazılmamış')
    const dozMg = sayi(ml[1]) * kons.mgPerMl
    gunlukMg = dozMg * dozSayisi
    hesap = `${trS(sayi(ml[1]), 2)} mL × ${kons.metin} = ${trS(dozMg)} mg/doz × günde ${dozSayisi} = ${trS(gunlukMg)} mg/gün`
  } else {
    const okunan = gunlukMgOku(sikliksiz)
    if (okunan == null) return hesaplanamadi('yazılan doz günlük miligram olarak okunamadı')
    if (!frekansVar) return hesaplanamadi('günlük sıklık yazılmamış')
    gunlukMg = okunan
    hesap = `${trS(gunlukMg)} mg/gün`
  }

  let kiloSoz = ''
  if (mgKgGun == null) {
    if (o.kilo == null) return hesaplanamadi(`${kaynak === 'recete' ? 'reçete' : 'başlangıç'} tarihinde (${trGun(o.tarih)}) ya da öncesinde kilo kaydı yok; kilo bilinmiyor (güncel kilo kullanılmaz)`)
    const celiski = kiloCeliskisi(olaylar, o.kiloTarihi)
    if (celiski) return hesaplanamadi(`${trGun(o.kiloTarihi)} tarihinde çelişen kilo kayıtları var (${celiski.map((d) => `${trS(d, 2)} kg`).join(' / ')}); hangisinin doğru olduğu bilinmeden hesaplanmadı`)
    mgKgGun = gunlukMg! / o.kilo
    kiloSoz = `; ${kaynak === 'recete' ? 'reçete' : 'başlangıç'} tarihindeki kilo ${trS(o.kilo, 2)} kg (${trGun(o.kiloTarihi)}${o.kiloTarihi !== o.tarih ? ' — o tarihten önceki en yakın ölçüm' : ''})`
  }

  // Referans: tablodaki aralık. mg/kg/doz ise doz başı aralık günlük doz sayısıyla çarpılır; günlük tavan ayrıca.
  const n = dozSayisi || 1
  const alt = p.min != null ? (p.birim === 'mg/kg/doz' ? p.min * n : p.min) : null
  const ustAralik = p.max != null ? (p.birim === 'mg/kg/doz' ? p.max * n : p.max) : null
  const ust = p.maxMgKgGun != null ? (ustAralik != null && p.birim === 'mg/kg/doz' ? Math.min(ustAralik, p.maxMgKgGun) : p.maxMgKgGun) : ustAralik
  if (alt == null && ust == null) return { ...ortak, durum: 'referans-yok', metin: `${ad} (${yazim}): tabloda ${ilac.name} için sayısal pediatrik aralık yok — referans yok.` }
  const aralik = `${alt != null && ust != null && alt !== ust ? `${trS(alt)}–${trS(ust)}` : trS((ust ?? alt)!)} mg/kg/gün${p.birim === 'mg/kg/doz' ? ` (${trS(p.min!)}${p.max != null && p.max !== p.min ? `–${trS(p.max)}` : ''} mg/kg/doz × günde ${n})` : ''}`
  // Referans tek bir formülasyona aitse (kapsam) ve ürünün o formülasyon olduğu addan doğrulanamıyorsa hüküm KESİN
  // değildir: sayı gösterilir, "kendi KÜB'ünden teyit edin" denir, hasta güvenliği alarmı olarak sunulmaz. Başka bir
  // formülasyonun aralığı varsayılmaz.
  const urunOrani = /(\d+(?:[.,]\d+)?)\s*mg\s*[/+]\s*(\d+(?:[.,]\d+)?)\s*mg/i.exec(ad)
  const kapsamOrani = p.kapsam ? /(\d+)\s*:\s*(\d+)/.exec(p.kapsam) : null
  const oran = urunOrani ? sayi(urunOrani[1]) / sayi(urunOrani[2]) : null
  const kesin = !p.kapsam || Boolean(oran != null && kapsamOrani && Math.abs(oran - Number(kapsamOrani[1]) / Number(kapsamOrani[2])) / (Number(kapsamOrani[1]) / Number(kapsamOrani[2])) < 0.05)
  const kapsam = kesin ? '' : ` Tablodaki referans ${p.kapsam} içindir; ${oran != null ? `bu ürün farklı bir formülasyon (yaklaşık ${trS(oran, 0)}:1)` : 'bu ürünün formülasyonu kayıttan doğrulanamadı'} — bu formülasyon için tabloda referans yok, ürünün kendi KÜB'ünden teyit edin.`
  const kaynakSoz = `kaynak: ${ilac.kaynak.belge}`
  // Karşılaştırma tam sayıya yuvarlanmış mg/kg/gün ile: mL yuvarlamasından gelen küsurat bayrak üretmez.
  const v = Math.round(mgKgGun)
  const mutlakAsim = gunlukMg != null && p.mutlakMaxMgGun != null && gunlukMg > p.mutlakMaxMgGun
  const deger = `${hesap}${kiloSoz} → ${trS(mgKgGun)} mg/kg/gün`
  const sonuc = { ...ortak, mgKgGun: Math.round(mgKgGun * 10) / 10, ...(gunlukMg != null ? { gunlukMg: Math.round(gunlukMg * 10) / 10 } : {}), ...(o.kilo != null ? { kilo: o.kilo, kiloTarihi: o.kiloTarihi } : {}) }
  if ((ust != null && v > ust) || mutlakAsim) {
    const neden = ust != null && v > ust ? `tablodaki olağan üst sınırın (${trS(ust)} mg/kg/gün) ÜZERİNDE` : `tablodaki mutlak günlük tavanın (${trS(p.mutlakMaxMgGun!)} mg/gün) ÜZERİNDE`
    return { ...sonuc, durum: 'ust-sinir-ustu', bayrak: true, kesin, metin: `${ad}: ${deger} — ${neden} (${ilac.name}; ${kaynakSoz}).${kapsam} Dozu ve ürün konsantrasyonunu doğrulayın. ${TEYIT_CUMLESI}` }
  }
  if (alt != null && v < alt && !gerektiginde) {
    return { ...sonuc, durum: 'etkin-aralik-alti', bayrak: true, kesin, metin: `${ad}: ${deger} — tablodaki etkin aralığın (${aralik}) ALTINDA (${ilac.name}; ${kaynakSoz}).${kapsam} Dozu ve ürün konsantrasyonunu doğrulayın. ${TEYIT_CUMLESI}` }
  }
  return { ...sonuc, durum: 'aralikta', metin: `${ad}: ${deger} — tablodaki aralıkta (${aralik}; ${ilac.name}; ${kaynakSoz}).${gerektiginde ? ' Gerektiğinde kullanım: yazılan en yüksek sıklıkla hesaplandı.' : ''}` }
}

/** Ürün adı: konsantrasyon ve form sözcükleri atılmış, katlanmış ("Augmentin ES 600 mg/5 ml süspansiyon" → "augmentin es"). */
function urunAdi(ad: string): string {
  return ad.replace(KONSANTRASYON, ' ').replace(/\d+(?:[.,]\d+)?\s*(mg|ml|mcg|iu|g)\b/gi, ' ')
    .toLocaleLowerCase('tr-TR').replace(/\b(süspansiyon|suspansiyon|şurup|surup|damla|tablet|film|kapsül|oral|pediatrik|toz|çözelti|için|hazırlamak)\b/g, ' ').replace(/[^a-zçğıöşü0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Hastanın ilaç kayıtlarının doz güvenliği: ilaç listesindeki aktif / belirsiz satırlar ve son 90 günün reçeteleri.
 * 18 yaş ve üstünde ya da doğum tarihi bilinmiyorsa boş döner (kiloya göre denetim uygulanmaz).
 */
export function dozGuvenligi(olaylar: DosyaOlayi[], hasta: Pick<DosyaHastasi, 'dogumIso' | 'bugunIso'>): DozGuvenligi {
  const yas = yasAy(hasta.dogumIso, hasta.bugunIso)
  if (yas == null || yas >= ON_SEKIZ_YAS_AY) return { ilaclar: [], uyumsuzluklar: [] }
  const sinir = gunEkleIso(hasta.bugunIso, -90)
  const liste = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && (o.durum === 'aktif' || o.durum === 'belirsiz'))
  const receteler = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'recete' && o.tarih >= sinir)
  const ilaclar = [...liste, ...receteler].map((o) => degerlendir(o, olaylar, hasta.bugunIso))

  const uyumsuzluklar: DozGuvenligi['uyumsuzluklar'] = []
  for (const r of ilaclar.filter((x) => x.kaynak === 'recete' && x.molekul)) {
    for (const l of ilaclar.filter((x) => x.kaynak === 'liste' && x.molekul === r.molekul && Math.abs(gunFarkiIso(r.tarih, x.tarih)) <= 3)) {
      const fark: string[] = []
      if (urunAdi(r.ad) !== urunAdi(l.ad)) fark.push('ürün adı')
      if (r.mgPerMl != null && l.mgPerMl != null && Math.abs(r.mgPerMl - l.mgPerMl) > 1e-6) fark.push('konsantrasyon')
      if (!fark.length) continue
      uyumsuzluklar.push({ tarih: r.tarih, devam: r.devam || l.devam, listeId: l.kaynakId, metin: `Ürün / konsantrasyon uyuşmazlığı: ${trGun(r.tarih)} vizit reçetesinde "${r.ad}", ilaç listesinde "${l.ad}" — aynı etken madde, ${fark.join(' ve ')} farklı; hangi ürünün verildiği doğrulanmalı (mg/kg/gün her biri için ayrı hesaplandı).` })
    }
  }
  return { ilaclar, uyumsuzluklar }
}

/**
 * Soru 9 / 10 ve ilaç kartı için BAYRAKLAR: süren ilaçta (ilaç listesinde aktif / belirsiz ya da süresi dolmamış
 * reçete) aralık dışı doz ve ürün uyuşmazlığı. Aynı kürün liste satırı ve reçetesi aynı değeri veriyorsa bir kez.
 */
export function dozBayraklari(g: DozGuvenligi): DozDegerlendirmesi[] {
  const gorulen = new Set<string>()
  return g.ilaclar.filter((i) => i.bayrak && i.devam).filter((i) => {
    const anahtar = `${i.molekul}|${i.tarih}|${Math.round(i.mgKgGun ?? 0)}`
    if (gorulen.has(anahtar)) return false
    gorulen.add(anahtar)
    return true
  })
}

/** Soru 6 kanıtı: her ilacın doz satırı, bayraklılar önce. Boşsa (erişkin) boş dizi. */
export function dozGuvenligiSatirlari(g: DozGuvenligi): string[] {
  if (!g.ilaclar.length) return []
  const out = ['DOZ GÜVENLİĞİ (mg/kg/gün — reçete / başlangıç tarihindeki kiloyla; referans: Notya ilaç tablosu, TİTCK KÜB):']
  const sira = [...g.ilaclar].sort((a, b) => Number(b.bayrak) - Number(a.bayrak))
  for (const i of sira) out.push(`- ${i.bayrak ? '⚠ ' : ''}${i.metin}${i.kaynak === 'recete' ? ` [vizit reçetesi ${trGun(i.tarih)}${i.devam ? '' : ', süresi dolmuş'}]` : ' [ilaç listesi]'}`)
  for (const u of g.uyumsuzluklar) out.push(`- ⚠ ${u.metin}`)
  out.push('[KURAL] mg/kg/gün değerini ve referansı buradan AYNEN al; kendin hesaplama, referans sayısı ekleme. "referans yok" yazan ilaç için doz yorumu yapma; "hesaplanamadı" yazanın nedenini söyle.')
  return out
}
