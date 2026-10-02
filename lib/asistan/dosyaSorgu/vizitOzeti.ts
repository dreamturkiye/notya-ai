/**
 * NOTYA-AYSE-OZET-01 (Dr. Gökhan, canlı, 2026-10-02) — BİR MUAYENENİN özeti, kayıttan. Deterministik, LLM'siz.
 *
 * "… 12 aylık sağlam çocuk muayenesinin özetini verir misin?" sorusuna Ayşe yalnız şikayet, değerlendirme ve planı
 * yazdı; aşıları ve temel verileri (kilo, boy, baş çevresi) hiç anmadı, sesli de söylemedi. Kök neden: adı geçen
 * muayenenin kanıtı (kanit.ts vizitTuruBolumu) yalnız not satırını ve ölçümleri taşıyordu.
 *
 * Bir muayene özeti SEKİZ bölümdür ve sırası değişmez (hekimin istediği sıra):
 *   1. Muayene            — tarih, muayene tarihindeki yaş
 *   2. Şikayet            — varsa, nottan
 *   3. Muayene bulgusu    — bulgu, değerlendirme, tanı (nottan)
 *   4. Laboratuvar        — o muayenede istenenler, muayeneye yakın tarihli sonuçlar, aynı testin önceki sonucu,
 *                           laboratuvarın kendi referansına göre işaret
 *   5. Aşı                — aynı günlü aşı kayıtları ve notta uygulandığı yazanlar (pediatrik parametrede)
 *   6. Büyüme ve gelişme  — o muayeneye bağlı ölçümler + büyüme motorunun satırı (pediatrik parametrede);
 *                           diğer branşlarda "Ölçümler": branşın kendi ölçümleri (kilo, boy, VKİ, tansiyon…)
 *   7. Tedavi             — o muayenenin reçeteleri, o gün başlayan ilaç kayıtları
 *   8. Plan               — plan metni, planlananların sonraki kayıttaki karşılığı
 *
 * Burada YENİ KLİNİK KURAL YOKTUR; her bölüm var olan bir okuyucuyu bağlar:
 *   muayene seçimi  → vizitOlcum.ts vizitleriSec (ölçüm sorgusuyla aynı fonksiyon)
 *   ölçümler        → vizitOlcum.ts vizitOlcumKaniti (alan → aynı günlü cihaz → not metni)
 *   büyüme          → branş parametresinin `buyume` fonksiyonu (pediatri: engines/buyume.ts Neyzi persentil / z,
 *                     persentilKaymalari, buyumeHizlari), o muayenenin tarihine kadar olan ölçümlerle çağrılır
 *   plan / karşılık → lib/doktor/planTakibi.ts
 * Kayıtta olmayan bölüm atlanmaz, birkaç kelimeyle söylenir ("aşı yapılmamış", "laboratuvar istenmemiş"). Değer
 * uydurulmaz, türetilmez: büyüme motorunun satırı yoksa "persentil hesaplanmadı" yazılır.
 *
 * KVKK: kanıt satırları hasta adını taşımaz; ad yalnız ekran cevabının ve sözlü anlatımın başındadır.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { gunEkleIso, trGun, VIZIT_BOLUM_SINIRI } from '@/lib/doktor/dosyaOlaylari'
import { asiPlanSatiri, durumAdi, labAdlari, planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { parametreSec } from '@/lib/asistan/dosyaSorgu/parametreler'
import { OLCUM_ADI, hedefEtiketi, vizitleriSec, vizitOlcumKaniti, type OlcumAnahtari, type OlcumKaydi, type VizitHedefi, type VizitSecimi } from '@/lib/asistan/dosyaSorgu/vizitOlcum'
import { vizitBolumleri } from '@/lib/asistan/kayitTablosu'
import { vizitTuruGruplariBul, vizitYasIfadesiCoz } from '@/lib/klinik/vizitTuruEsanlam'
import { tamAy, yasMetni } from '@/specialties/pediatri/engines/girdi'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type OzetBolumAnahtari = 'muayene' | 'sikayet' | 'bulgu' | 'lab' | 'asi' | 'olcum' | 'tedavi' | 'plan'

export interface OzetBolumu {
  anahtar: OzetBolumAnahtari
  /** Ekran cevabındaki kalın başlık ("Laboratuvar"). */
  baslik: string
  /** Kayıtta bu bölüm için veri var mı (false → `ekran` kısa "yok" ifadesidir). */
  var: boolean
  /** Modele giden kanıt satırları. */
  kanit: string[]
  /** Deterministik ekran paragrafı (başlıksız). */
  ekran: string
  /** Sözlü anlatımdaki tek kısa cümle (noktasız). */
  soz: string
}

export interface VizitOzeti {
  tarih: string
  /** "12 aylık" — doğum tarihi yoksa null. */
  yas: string | null
  /** Pediatrik parametre (aşı ve büyüme bölümleri bu parametrede kurulur). */
  pediatrik: boolean
  secim: VizitSecimi
  bolumler: OzetBolumu[]
  /** Bu muayenenin kayıtlı ölçüm ve lab değerlerinin sayı kısmı ("9,8") — cevapta bulunması gerekenler. */
  degerler: string[]
}

/** Laboratuvar sonucu muayeneden en çok bu kadar gün önce / sonra ise o muayenenin sonucu sayılır (komşu muayeneye kadar). */
export const LAB_PENCERE_GUN = 14
/** Kayıtta olmayan bölümlerin kısa ifadeleri (hekimin sözüyle). */
export const ASI_YOK = 'Bu muayenede aşı yapılmamış: aşı tablosunda bu tarihte kayıt yok, notta da uygulandığı yazmıyor.'
export const LAB_YOK = `Bu muayenede laboratuvar istenmemiş: notta tetkik istemi yok, muayeneye yakın tarihli (±${LAB_PENCERE_GUN} gün) lab sonucu kaydı da yok.`
export const PERSENTIL_YOK = 'persentil hesaplanmadı'

const MUAYENE = '(?:muayene|vizit|kontrol|ziyaret|basvuru|izlem)'
const ILK = new RegExp(`\\bilk ${MUAYENE}(?!ler)`)
const SON = new RegExp(`\\b(?:son|en son|gecen) ${MUAYENE}(?!ler)`)
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const sozTarih = (iso: string) => `${Number(iso.slice(8, 10))} ${AYLAR[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
const trS = (n: number, b = 2) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })
const vizitleri = (o: DosyaOlayi[]) => o.filter((x) => x.kaynak === 'not' && x.tur === 'vizit').sort((a, b) => a.tarih.localeCompare(b.tarih))
const noktali = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)
const noktasiz = (s: string) => s.trim().replace(/[.!?…;:,]+$/, '')
const birlestir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`)
const CUMLE = /(?<=[.!?…])\s+(?=["“(]?[A-ZÇĞİÖŞÜ])/
/** Not bölümünün sözlü biçimi: ilk `n` cümle, tek cümle olarak (araları noktalı virgül). */
function kisaSoz(metin: string, n = 2): string {
  return metin.split(CUMLE).slice(0, n).map(noktasiz).filter(Boolean).join('; ')
}
/** Dizin bölümü sınırında kestiyse söylenir (lib/doktor/dosyaOlaylari VIZIT_BOLUM_SINIRI). */
function bolumMetni(b: Record<string, string>, anahtar: keyof typeof VIZIT_BOLUM_SINIRI): string {
  const m = b[anahtar] || ''
  return m && m.length >= VIZIT_BOLUM_SINIRI[anahtar] ? `${m} … [bu bölüm kayıtta daha uzun]` : m
}

/**
 * Mesaj BİR muayeneyi mi anıyor: tür / yaş-dönümü ("12 aylık sağlam çocuk muayenesi"), "ilk muayene", "son muayene".
 * null → muayene adı geçmiyor (dosyanın genel özeti).
 */
export function vizitOzetHedefiBul(mesaj: string | null | undefined): VizitHedefi | null {
  const yas = vizitYasIfadesiCoz(mesaj), gruplar = vizitTuruGruplariBul(mesaj)
  if (yas || gruplar.length) return { tip: 'vizit', yas, gruplar }
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:'’"]+/g, ' ').replace(/\s+/g, ' ')
  if (ILK.test(n)) return { tip: 'ilk' }
  if (SON.test(n)) return { tip: 'son' }
  return null
}

/* ───────────────────────────── bölümler ───────────────────────────── */

function muayeneBolumu(v: DosyaOlayi, hasta: DosyaHastasi, secim: VizitSecimi): { bolum: OzetBolumu; yas: string | null } {
  const yas = hasta.dogumIso ? yasMetni(hasta.dogumIso, v.tarih) : null
  const tur = vizitTuruGruplariBul(v.metin.split(' | Plan:')[0]).map((g) => g.ad).join(', ')
  const yasSoz = yas ? `muayene tarihinde ${yas}` : 'muayene tarihindeki yaş hesaplanamadı (doğum tarihi kayıtlı değil)'
  const secimNotu = secim === 'yas-tarih' ? ' Notta bu yaş yazmıyor; muayene tarihindeki yaşa göre seçildi.' : ''
  const ekran = `${trGun(v.tarih)}; ${yasSoz}.${tur ? ` Tür: ${tur}.` : ''}${secimNotu}`
  return {
    yas,
    bolum: { anahtar: 'muayene', baslik: 'Muayene', var: true, kanit: [`Tarih ${trGun(v.tarih)}; ${yasSoz}.${tur ? ` Muayene türü (nottan): ${tur}.` : ''}${secimNotu}`], ekran, soz: `${sozTarih(v.tarih)} tarihli muayene${yas ? `, ${yas}` : ''}` },
  }
}

function sikayetBolumu(b: Record<string, string>): OzetBolumu {
  const m = bolumMetni(b, 'Şikayet')
  if (!m) return { anahtar: 'sikayet', baslik: 'Şikayet', var: false, kanit: ['Notta şikayet / öykü yazılmamış.'], ekran: 'Şikayet yazılmamış.', soz: 'Şikayet yazılmamış' }
  return { anahtar: 'sikayet', baslik: 'Şikayet', var: true, kanit: [`Şikayet / öykü (nottan): ${m}`], ekran: noktali(m), soz: `Şikayet ve öykü: ${kisaSoz(m)}` }
}

function bulguBolumu(b: Record<string, string>): OzetBolumu {
  const bulgu = bolumMetni(b, 'Bulgu'), deg = bolumMetni(b, 'Değerlendirme'), tani = bolumMetni(b, 'Tanı')
  if (!bulgu && !deg && !tani) return { anahtar: 'bulgu', baslik: 'Muayene bulgusu', var: false, kanit: ['Notta muayene bulgusu, değerlendirme ve tanı yazılmamış.'], ekran: 'Muayene bulgusu yazılmamış.', soz: 'Muayene bulgusu yazılmamış' }
  const kanit = [bulgu ? `Bulgu (nottan): ${bulgu}` : 'Notta muayene bulgusu yazılmamış.', ...(deg ? [`Değerlendirme (nottan): ${deg}`] : []), ...(tani ? [`Tanı (nottan): ${tani}`] : [])]
  const ekran = [bulgu ? noktali(bulgu) : 'Muayene bulgusu yazılmamış.', deg ? `Değerlendirme: ${noktali(deg)}` : '', tani ? `Tanı: ${noktali(tani)}` : ''].filter(Boolean).join(' ')
  const soz = [bulgu ? `Muayene bulgusu: ${kisaSoz(bulgu)}` : 'Muayene bulgusu yazılmamış', tani ? `tanı ${noktasiz(tani.split(' — ')[0])}` : ''].filter(Boolean).join('; ')
  return { anahtar: 'bulgu', baslik: 'Muayene bulgusu', var: true, kanit, ekran, soz }
}

type RefIsareti = 'alt' | 'ust' | 'ic' | null
/** Laboratuvarın KENDİ referansına göre (kayıttaki işaret) — yaşa uygunluğu doğrulanmaz, burada yorumlanmaz. */
function refIsareti(o: DosyaOlayi): RefIsareti {
  if (o.deger == null || (o.refAlt == null && o.refUst == null)) return null
  if (o.refAlt != null && o.deger < o.refAlt) return 'alt'
  if (o.refUst != null && o.deger > o.refUst) return 'ust'
  return 'ic'
}
const refAraligi = (o: DosyaOlayi) => `${o.refAlt ?? '—'}–${o.refUst ?? '—'}`
const refYazi = (o: DosyaOlayi) => {
  const i = refIsareti(o)
  return i === 'alt' ? `laboratuvar referansının altında (${refAraligi(o)})` : i === 'ust' ? `laboratuvar referansının üstünde (${refAraligi(o)})` : i === 'ic' ? `referans içinde (${refAraligi(o)})` : 'referans aralığı kayıtlı değil'
}
const labAdi = (o: DosyaOlayi) => o.metin.split(':')[0].trim()
const labDegeri = (o: DosyaOlayi) => (o.deger != null ? `${trS(o.deger)}${o.birim ? ` ${o.birim}` : ''}` : (o.metin.split(': ')[1] || '').trim())

function labBolumu(v: DosyaOlayi, olaylar: DosyaOlayi[], tum: DosyaOlayi[], degerler: string[]): OzetBolumu {
  const i = tum.indexOf(v)
  const onceki = tum[i - 1], sonraki = tum[i + 1]
  let alt = gunEkleIso(v.tarih, -LAB_PENCERE_GUN), ust = gunEkleIso(v.tarih, LAB_PENCERE_GUN)
  // Komşu muayenenin günü o muayenenindir.
  if (onceki && onceki.tarih >= alt) alt = onceki.tarih < v.tarih ? gunEkleIso(onceki.tarih, 1) : v.tarih
  if (sonraki && sonraki.tarih <= ust) ust = sonraki.tarih > v.tarih ? gunEkleIso(sonraki.tarih, -1) : v.tarih
  const sonuclar = olaylar.filter((o) => o.kaynak === 'lab' && o.tarih >= alt && o.tarih <= ust)

  // Bir cümle birden çok istem olayı taşıyabilir ("Hemogram ve ferritin istendi"): cümle başına tek satır.
  const istemler: { metin: string; durum: string; anahtarlar: string[]; karsilik: DosyaOlayi | null }[] = []
  for (const p of planOlaylari(olaylar).filter((x) => x.vizitId === v.vizitId && x.tur === 'lab')) {
    const k = planKarsiligi(p, olaylar)
    const var_ = istemler.find((x) => x.metin === p.metin)
    if (var_) { var_.anahtarlar.push(...(p.anahtarlar || []).filter((a) => !var_.anahtarlar.includes(a))); if (k && (!var_.karsilik || k.tarih < var_.karsilik.tarih)) var_.karsilik = k }
    else istemler.push({ metin: p.metin, durum: p.durum, anahtarlar: [...(p.anahtarlar || [])], karsilik: k })
  }
  if (!istemler.length && !sonuclar.length) return { anahtar: 'lab', baslik: 'Laboratuvar', var: false, kanit: [LAB_YOK], ekran: 'Laboratuvar istenmemiş; muayeneye yakın tarihli sonuç kaydı yok.', soz: 'Laboratuvar istenmemiş' }

  const kanit: string[] = [], ekran: string[] = []
  if (istemler.length) {
    for (const s of istemler) {
      const sonuc = s.karsilik ? `sonuç kaydı ${trGun(s.karsilik.tarih)}` : 'sonuç kaydı yok'
      kanit.push(`İstem (nottan): ${labAdlari(s.anahtarlar)} — ${durumAdi(s.durum)} ("${s.metin}") → ${sonuc}.`)
      ekran.push(`${labAdlari(s.anahtarlar)} ${durumAdi(s.durum)} (${sonuc}).`)
    }
  } else {
    kanit.push('Notta tetkik istemi yazmıyor; aşağıdakiler muayeneye yakın tarihli sonuç kayıtlarıdır.')
    ekran.push('Notta tetkik istemi yazmıyor.')
  }
  const disari: string[] = [], duzelen: string[] = [], bozulan: string[] = []
  if (sonuclar.length) {
    const tarihler = [...new Set(sonuclar.map((o) => o.tarih))]
    kanit.push(`Sonuçlar (${tarihler.map(trGun).join(', ')}; muayene ${trGun(v.tarih)}):`)
    const parca: string[] = []
    for (const o of sonuclar) {
      if (o.deger != null) degerler.push(trS(o.deger))
      const once = olaylar.filter((x) => x.kaynak === 'lab' && x.anahtar === o.anahtar && x.tarih < o.tarih).pop()
      const isaret = refIsareti(o), onceIsaret = once ? refIsareti(once) : null
      let karsilastirma = 'aynı testin önceki sonucu yok'
      if (once) {
        const yon = o.deger != null && once.deger != null ? (o.deger > once.deger ? 'yükselmiş' : o.deger < once.deger ? 'düşmüş' : 'değişmemiş') : ''
        const gecis = onceIsaret && isaret && onceIsaret !== 'ic' && isaret === 'ic' ? '; önceki referans dışıydı, şimdi referans içinde'
          : onceIsaret === 'ic' && isaret && isaret !== 'ic' ? '; önceki referans içindeydi, şimdi referans dışında' : ''
        karsilastirma = `önceki ${labDegeri(once)} (${trGun(once.tarih)}, ${refYazi(once)})${yon ? ` → ${yon}` : ''}${gecis}`
        if (onceIsaret && onceIsaret !== 'ic' && isaret === 'ic') duzelen.push(`${labAdi(o)} ${once.deger != null ? trS(once.deger) : ''} değerinden ${o.deger != null ? trS(o.deger) : ''} değerine gelmiş`.replace(/\s+/g, ' '))
        if (onceIsaret === 'ic' && isaret && isaret !== 'ic') bozulan.push(labAdi(o))
      }
      if (isaret === 'alt' || isaret === 'ust') disari.push(`${labAdi(o)} ${o.deger != null ? trS(o.deger) : ''} (referansın ${isaret === 'alt' ? 'altında' : 'üstünde'})`.replace(/\s+/g, ' '))
      kanit.push(`- ${labAdi(o)}: ${labDegeri(o)} (${trGun(o.tarih)}) — ${refYazi(o)}; ${karsilastirma}.`)
      parca.push(`${labAdi(o)} ${labDegeri(o)} — ${refYazi(o)}; ${karsilastirma}`)
    }
    kanit.push('Referanslar laboratuvarın verdiği aralıktır; yaşa / cinsiyete uygunluğu doğrulanmadı. Sonuçlar bu muayenenin gününden en çok ' + `${LAB_PENCERE_GUN} gün önce / sonra tarihli olanlardır.`)
    ekran.push(`Sonuçlar (${tarihler.map(trGun).join(', ')}): ${parca.join('. ')}. Referanslar laboratuvarın verdiği aralıktır; yaşa uygunluğu doğrulanmadı.`)
  }
  const istenen = istemler.length ? `${birlestir(istemler.map((s) => labAdlari(s.anahtarlar)))} istenmiş` : ''
  const soz = !sonuclar.length
    ? `Laboratuvar: ${istenen}; ${istemler.some((s) => s.karsilik) ? `sonuç ${birlestir([...new Set(istemler.filter((s) => s.karsilik).map((s) => sozTarih(s.karsilik!.tarih)))])} tarihli` : 'sonuç kaydı yok'}`
    : [`Laboratuvar: ${sonuclar.length} sonuç var`, disari.length ? `referans dışı ${birlestir(disari)}` : 'referans dışı değer yok', duzelen.length ? `öncekine göre düzelen ${birlestir(duzelen)}` : '', bozulan.length ? `öncekine göre referans dışına çıkan ${birlestir(bozulan)}` : ''].filter(Boolean).join('; ')
  return { anahtar: 'lab', baslik: 'Laboratuvar', var: true, kanit, ekran: ekran.join(' '), soz }
}

const asiAdi = (o: DosyaOlayi) => o.metin.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()

/** null → bu parametrede aşı bölümü yok ve kayıtta o güne ait aşı da yok (erişkin branşlar). */
function asiBolumu(v: DosyaOlayi, olaylar: DosyaOlayi[], pediatrik: boolean): OzetBolumu | null {
  const kayitlar = olaylar.filter((o) => o.kaynak === 'asi' && o.tarih === v.tarih)
  const nottaUygulandi = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'asi' && o.durum === 'uygulandi' && o.vizitId === v.vizitId)
  const planlar = planOlaylari(olaylar).filter((o) => o.vizitId === v.vizitId && o.tur === 'asi')
  if (!pediatrik && !kayitlar.length && !nottaUygulandi.length && !planlar.length) return null
  const kanit: string[] = [], ekran: string[] = [], soz: string[] = []
  if (kayitlar.length) {
    kanit.push(`Uygulandığı belgelenmiş (aşı tablosu, ${trGun(v.tarih)}): ${kayitlar.map((o) => o.metin).join('; ')}.`)
    ekran.push(`Yapılmış (aşı kaydı, ${trGun(v.tarih)}): ${kayitlar.map((o) => o.metin).join('; ')}.`)
    soz.push(`Aşı yapılmış: ${birlestir(kayitlar.map(asiAdi))}`)
    if (nottaUygulandi.length) kanit.push(`Notta: ${nottaUygulandi.map((o) => `"${o.metin}"`).join('; ')}.`)
  } else if (nottaUygulandi.length) {
    const alinti = nottaUygulandi.map((o) => `"${o.metin}"`).join('; ')
    kanit.push(`Notta uygulandığı yazıyor (${alinti}); aşı tablosunda bu tarihte satır yok — hangi aşıların yapıldığı kayıtta belli değil.`)
    ekran.push(`Notta uygulandığı yazıyor (${alinti}); aşı tablosunda bu tarihte kayıt yok.`)
    soz.push('Notta aşıların uygulandığı yazıyor; aşı tablosunda bu tarihte kayıt yok')
  } else {
    kanit.push(ASI_YOK)
    ekran.push('Aşı yapılmamış (aşı tablosunda bu tarihte kayıt yok, notta uygulama yazmıyor).')
    soz.push('Aşı yapılmamış')
  }
  for (const p of planlar) {
    const k = planKarsiligi(p, olaylar)
    const karsilik = k ? (k.guven === 'kayit' ? `aşı kaydı var (${trGun(k.tarih)})` : `sonraki notta uygulandığı yazıyor (${trGun(k.tarih)}); aşı tablosunda satır yok`) : 'uygulandığına dair kayıt yok'
    kanit.push(`Planlanan (uygulama DEĞİL): ${asiPlanSatiri(p)} → ${karsilik}.`)
    ekran.push(`Planlanan: ${asiPlanSatiri(p).split(' (')[0]} → ${karsilik}.`)
    soz.push(`${asiPlanSatiri(p).split(' — ')[0]} planlanmış`)
  }
  return { anahtar: 'asi', baslik: 'Aşı', var: Boolean(kayitlar.length || nottaUygulandi.length), kanit, ekran: ekran.join(' '), soz: soz.join('; ') }
}

const KAYNAK_NOTU: Record<OlcumKaydi['kaynak'], string> = { alan: '', cihaz: ' (cihaz ölçümü)', metin: ' (not metninden)', hesap: ' (kilo ve boydan hesaplandı)' }
/** Motor satırındaki "(p38, z −0,31)" → sözlü "persentil 38". */
const persentilSozu = (s: string) => s.replace(/\s*\(p([<>]?)(\d+), z [^)]*\)/g, (_, isaret: string, n: string) => `, persentil ${isaret === '<' ? `${n} altı` : isaret === '>' ? `${n} üstü` : n}`)

function olcumBolumu(v: DosyaOlayi, olaylar: DosyaOlayi[], hasta: DosyaHastasi, pediatrik: boolean, degerler: string[]): OzetBolumu {
  const baslik = pediatrik ? 'Büyüme ve gelişme' : 'Ölçümler'
  const temel: OlcumAnahtari[] = pediatrik ? ['kilo', 'boy', 'basCevresi'] : ['kilo', 'boy', 'tansiyon']
  const hepsi: OlcumAnahtari[] = pediatrik ? ['kilo', 'boy', 'basCevresi', 'ates', 'nabiz', 'spo2', 'tansiyon'] : ['kilo', 'boy', 'vki', 'tansiyon', 'nabiz', 'ates', 'spo2']
  const seri = (vizitOlcumKaniti({ olcumler: hepsi, genel: true, hedef: { tip: 'seri' }, degerlendirme: false, kesin: true }, olaylar, hasta).seri || []).filter((s) => s.tur === 'muayene')
  const kayitlar = hepsi.map((o) => seri.find((s) => s.tarih === v.tarih)?.kayitlar[o]).filter((k): k is OlcumKaydi => Boolean(k))
  const eksik = temel.filter((o) => !kayitlar.some((k) => k.olcum === o))
  for (const k of kayitlar) { const sayi = (k.metin.match(/\d+(?:,\d+)?(?:\/\d+)?/) || [''])[0]; if (sayi) degerler.push(sayi) }
  const olcumYazi = [...kayitlar.map((k) => `${OLCUM_ADI[k.olcum]} ${k.metin}${KAYNAK_NOTU[k.kaynak]}`), ...eksik.map((o) => `${OLCUM_ADI[o]}: kayıt yok`)].join('; ')
  const kanit: string[] = [`Bu muayenenin ölçümleri (yalnız kayıtlı değer): ${olcumYazi}.`]
  const ekran: string[] = [kayitlar.length ? `${olcumYazi}.` : `Bu muayenede kayıtlı ölçüm yok (${eksik.map((o) => OLCUM_ADI[o]).join(', ')}).`]
  const soz: string[] = []

  if (!pediatrik) {
    // Branşın kendi ölçümleri; karşılaştırma için bir önceki muayenenin aynı ölçümleri (kayıtlıysa).
    const onceKayit = kayitlar.filter((k) => k.kaynak !== 'hesap')
      .map((k) => seri.filter((s) => s.tarih < v.tarih && s.kayitlar[k.olcum]).pop()?.kayitlar[k.olcum]).filter((k): k is OlcumKaydi => Boolean(k))
    if (onceKayit.length) {
      const yazi = onceKayit.map((k) => `${OLCUM_ADI[k.olcum]} ${k.metin} (${trGun(k.tarih)})`).join('; ')
      kanit.push(`Aynı ölçümlerin önceki muayenelerdeki son kaydı: ${yazi}.`)
      ekran.push(`Önceki kayıt: ${yazi}.`)
    }
    if (hasta.dogumIso && tamAy(hasta.dogumIso, v.tarih) < 216) kanit.push(`Bu branş için büyüme eğrisi motoru tanımlı değil; ${PERSENTIL_YOK}, tahmin yürütülmez.`)
    soz.push(kayitlar.length ? `Ölçümler: ${kayitlar.map((k) => `${OLCUM_ADI[k.olcum]} ${k.metin}`).join(', ')}` : 'Bu muayenede kayıtlı ölçüm yok')
    return { anahtar: 'olcum', baslik, var: kayitlar.length > 0, kanit, ekran: ekran.join(' '), soz: soz.join('; ') }
  }

  // Büyüme: branş parametresinin kendi fonksiyonu, bu muayenenin tarihine kadar olan ölçümlerle — motor ne diyorsa o.
  const b = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso).buyume(olaylar.filter((o) => o.tarih <= v.tarih), { ...hasta, bugunIso: v.tarih })
  const olcumSatirlari = b.satirlar.filter((s) => /^- \d{2}\.\d{2}\.\d{4} \(/.test(s))
  const satir = olcumSatirlari.find((s) => s.startsWith(`- ${trGun(v.tarih)} (`))
  if (satir) {
    const motor = satir.replace(/^- \d{2}\.\d{2}\.\d{4} \([^)]*\):\s*/, '')
    const onceSatir = olcumSatirlari[olcumSatirlari.indexOf(satir) - 1]
    // Motorun kayma ve artış satırları "son ölçüm"e göredir; yalnız son ölçümü BU muayene olanlar bu muayenenindir.
    const buMuayene = (s: string) => s.includes(`→ ${trGun(v.tarih)}`)
    const kayma = b.satirlar.filter((s) => s.startsWith('- Kayma:') && buMuayene(s)).map((s) => s.replace(/^- /, ''))
    const artis = b.satirlar.filter((s) => / artışı: /.test(s) && buMuayene(s)).map((s) => s.replace(/^- /, ''))
    const diger = b.satirlar.filter((s) => /^Tek ölçüm|Kilo-boy orantısı/.test(s.replace(/^- /, ''))).map((s) => s.replace(/^- /, ''))
    kanit.push(`Büyüme motoru (${b.satirlar[0].replace(/\s*Ölçümler \(eskiden yeniye\):$/, '').replace(/^Referans:\s*/, 'referans ').replace(/\.$/, '')}) — bu muayene: ${motor}.`)
    if (onceSatir) kanit.push(`Büyüme motoru — önceki ölçüm: ${onceSatir.replace(/^- /, '')}.`)
    kanit.push(...artis, ...diger)
    const kaymaYazi = kayma.length ? kayma.join(' ') : olcumSatirlari.length > 1 ? 'Persentil kayması: motor bu muayenede kayma bildirmiyor (önceki ölçümlere göre 2 majör persentil çizgisi geçilmemiş).' : ''
    if (kaymaYazi) kanit.push(kaymaYazi)
    for (const f of b.bayraklar.filter((x) => x.tarih === v.tarih)) kanit.push(`DİKKAT (motor bayrağı): ${f.metin}`)
    ekran.push(`Büyüme motoru: ${motor}.`, ...(kaymaYazi ? [kaymaYazi] : []), ...artis, ...diger)
    soz.push(noktasiz(persentilSozu(motor)), kayma.length ? noktasiz(kayma.join('; ')).replace(/^Kayma: /, 'Persentil kayması var: ') : olcumSatirlari.length > 1 ? 'büyüme eğrisinde persentil kayması yok' : 'tek ölçüm, eğilim için yeterli veri yok')
  } else {
    // Motor yalnız yapılandırılmış ölçümü (muayene alanı / cihaz) kullanır; yoksa satır da yoktur — tahmin yok.
    const neden = !kayitlar.some((k) => ['kilo', 'boy', 'basCevresi'].includes(k.olcum)) ? 'bu muayenede kayıtlı kilo / boy / baş çevresi yok'
      : !hasta.dogumIso || !hasta.cinsiyet ? 'doğum tarihi veya cinsiyet kayıtlı değil'
      : 'bu muayenenin ölçümü yalnız not metninde, büyüme motoru yapılandırılmış ölçüm alanını kullanır'
    kanit.push(`Büyüme motoru: bu muayene için ${PERSENTIL_YOK} (${neden}); tahmin yürütülmez.`)
    ekran.push(`Büyüme motoru: ${PERSENTIL_YOK} (${neden}).`)
    soz.push(kayitlar.length ? kayitlar.map((k) => `${OLCUM_ADI[k.olcum]} ${k.metin}`).join(', ') : 'Bu muayenede kayıtlı ölçüm yok', PERSENTIL_YOK)
  }
  // Gelişim: aynı günlü tarama kayıtları (GİDR, M-CHAT-R/F…). Gelişim basamakları not metnindedir (2. ve 3. bölüm).
  const tarama = olaylar.filter((o) => o.kaynak === 'olcum' && o.tur === 'tarama' && o.tarih === v.tarih)
  if (tarama.length) {
    kanit.push(`Aynı günlü gelişim taraması kaydı: ${tarama.map((o) => o.metin).join('; ')}.`)
    ekran.push(`Gelişim taraması (aynı gün): ${tarama.map((o) => o.metin).join('; ')}.`)
  } else kanit.push('Aynı günlü gelişim taraması kaydı yok; gelişim basamakları not metninde yazıyorsa oradan aktarılır.')
  return { anahtar: 'olcum', baslik, var: kayitlar.length > 0, kanit, ekran: ekran.join(' '), soz: soz.join('; ') }
}

function tedaviBolumu(v: DosyaOlayi, olaylar: DosyaOlayi[]): OzetBolumu {
  const receteler = olaylar.filter((o) => o.tur === 'recete' && o.vizitId === v.vizitId).map((o) => o.metin)
  const ilkAd = (s: string) => s.split(' — ')[0].trim().toLocaleLowerCase('tr-TR')
  const ilaclar = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && o.tarih === v.tarih).map((o) => o.metin.replace(/\s*\[.*$/, ''))
    .filter((m) => !receteler.some((r) => ilkAd(r) === ilkAd(m)))
  if (!receteler.length && !ilaclar.length) {
    return { anahtar: 'tedavi', baslik: 'Tedavi', var: false, kanit: ['Bu muayenede reçete yazılmamış; bu tarihte başlayan ilaç kaydı yok. Tedaviye ilişkin not ifadeleri (başlandı / kesildi / devam) varsa plan metnindedir.'], ekran: 'Reçete yazılmamış; bu tarihte başlayan ilaç kaydı yok.', soz: 'Reçete yazılmamış' }
  }
  const kanit = [...(receteler.length ? [`Reçete (bu muayenenin notu): ${receteler.join('; ')}.`] : []), ...(ilaclar.length ? [`İlaç kaydı (başlangıcı bu tarih): ${ilaclar.join('; ')}.`] : []), 'Tedaviye ilişkin diğer not ifadeleri (başlandı / kesildi / devam) plan metnindedir.']
  const ekran = [...(receteler.length ? [`Reçete: ${receteler.join('; ')}.`] : []), ...(ilaclar.length ? [`İlaç kaydı (bu tarihte başlayan): ${ilaclar.join('; ')}.`] : [])].join(' ')
  return { anahtar: 'tedavi', baslik: 'Tedavi', var: true, kanit, ekran, soz: `Tedavi: ${birlestir([...receteler, ...ilaclar].map((m) => m.split(' — ')[0].trim()))}` }
}

function planBolumu(v: DosyaOlayi, b: Record<string, string>, olaylar: DosyaOlayi[]): OzetBolumu {
  const m = bolumMetni(b, 'Plan')
  if (!m) return { anahtar: 'plan', baslik: 'Plan', var: false, kanit: ['Notta plan yazılmamış.'], ekran: 'Plan yazılmamış.', soz: 'Plan yazılmamış' }
  // Aşı ve lab planları kendi bölümlerinde; burada kontrol, konsültasyon, tarama ve görüntüleme.
  const gorulen = new Set<string>()
  const karsiliklar: string[] = []
  for (const p of planOlaylari(olaylar).filter((x) => x.vizitId === v.vizitId && x.tur !== 'asi' && x.tur !== 'lab')) {
    if (gorulen.has(`${p.tur}:${p.metin}`)) continue
    gorulen.add(`${p.tur}:${p.metin}`)
    const k = planKarsiligi(p, olaylar)
    karsiliklar.push(`"${p.metin}" (${durumAdi(p.durum)}) → ${k ? `sonraki kayıt ${trGun(k.tarih)}` : 'sonraki kayıtta karşılığı yok'}`)
  }
  return {
    anahtar: 'plan', baslik: 'Plan', var: true,
    kanit: [`Plan (nottan): ${m}`, ...(karsiliklar.length ? [`Planlananların sonraki kayıttaki karşılığı: ${karsiliklar.join('; ')}.`] : [])],
    ekran: noktali(m), soz: `Plan: ${kisaSoz(m, 3)}`,
  }
}

/* ───────────────────────────── özet ───────────────────────────── */

/** Bir muayenenin sekiz bölümlük özeti — yalnız kayıttan. */
export function vizitOzetiKur(v: DosyaOlayi, olaylar: DosyaOlayi[], hasta: DosyaHastasi, secim: VizitSecimi = 'metin'): VizitOzeti {
  const pediatrik = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso).anahtar === 'pediatri'
  const b = vizitBolumleri(v.metin)
  const degerler: string[] = []
  const muayene = muayeneBolumu(v, hasta, secim)
  const bolumler = [
    muayene.bolum, sikayetBolumu(b), bulguBolumu(b),
    labBolumu(v, olaylar, vizitleri(olaylar), degerler),
    asiBolumu(v, olaylar, pediatrik),
    olcumBolumu(v, olaylar, hasta, pediatrik, degerler),
    tedaviBolumu(v, olaylar), planBolumu(v, b, olaylar),
  ].filter((x): x is OzetBolumu => Boolean(x))
  return { tarih: v.tarih, yas: muayene.yas, pediatrik, secim, bolumler, degerler: [...new Set(degerler)] }
}

export interface VizitOzetSecimi {
  hedef: VizitHedefi
  /** "12 aylık muayene", "son muayene", "sağlam çocuk muayenesi / rutin kontrol". */
  etiket: string
  secim: VizitSecimi
  vizitler: DosyaOlayi[]
  /** Tam olarak BİR muayene eşleştiyse onun özeti; yoksa null (eşleşme yok ya da birden fazla). */
  ozet: VizitOzeti | null
}

/** Mesajın andığı muayene(ler) ve — tek eşleşme varsa — özeti. null → mesaj bir muayene anmıyor. */
export function vizitOzetiSec(mesaj: string | null | undefined, olaylar: DosyaOlayi[], hasta: DosyaHastasi): VizitOzetSecimi | null {
  const hedef = vizitOzetHedefiBul(mesaj)
  if (!hedef) return null
  const { vizitler, secim } = vizitleriSec(olaylar, hasta, hedef)
  return { hedef, etiket: hedefEtiketi(hedef), secim, vizitler, ozet: vizitler.length === 1 ? vizitOzetiKur(vizitler[0], olaylar, hasta, secim) : null }
}

/* ───────────────────────────── cevap şablonu (modele giden kural) ───────────────────────────── */

const BOLUM_KURALI: Record<OzetBolumAnahtari, (pediatrik: boolean) => string> = {
  muayene: () => 'tarih ve muayene tarihindeki yaş',
  sikayet: () => 'şikayet varsa kısaca; yoksa ya da rutin kontrolse öyle söyle',
  bulgu: () => 'muayenede özellikli bir bulgu var mı, yok mu; nottaki değerlendirme ve tanı',
  lab: () => 'tetkik istendi mi; sonuçlar kısaca; aynı testin önceki sonucuna göre düzeldi mi; laboratuvar referansının dışındaki değer adıyla',
  asi: () => 'bu muayenede aşı yapıldı mı, hangileri; planlanan aşı yapılmış sayılmaz',
  olcum: (p) => (p
    ? 'kilo, boy, baş çevresi; büyüme motorunun persentil / z satırı ve kayma durumu; büyüme ve gelişme olağan seyrinde mi, dikkat gerektiren bir şey var mı'
    : 'bu muayenenin ölçümleri ve önceki kayda göre değişim'),
  tedavi: () => 'verilen tedavi: reçete ve plan metninde başlanan / kesilen / süren ilaçlar',
  plan: () => 'planlananlar',
}

/**
 * Tek muayenenin özeti için cevap şablonu (kanıt bloğunun sonuna yazılır; dosyanın genel özeti şablonunun yerine).
 * Bölüm listesi özetin kendi bölümlerinden kurulur: pediatri dışı parametrede aşı ve büyüme hiç anılmaz.
 */
export function vizitOzetSablonu(o: VizitOzeti): string {
  const liste = o.bolumler.map((b, i) => `${i + 1}) ${b.baslik} — ${BOLUM_KURALI[b.anahtar](o.pediatrik)}`).join('; ')
  return [
    `Tek muayenenin özeti. Bölümler ve sıraları SABİT: ${liste}.`,
    'Her bölüm bir KISA paragraf (1-3 cümle).',
    `Kayıtta olmayan bölümü ATLAMA; KANIT'taki kısa ifadeyi yaz (${o.pediatrik ? '"aşı yapılmamış", ' : ''}"laboratuvar istenmemiş", "reçete yazılmamış"). Bu kısa ifadeler o muayenenin kendi kaydını anlatır: GENEL KURALLAR'daki "yapılmadı deme" maddesi bunlara uygulanmaz.`,
    `Patoloji varsa (laboratuvar referansının dışındaki değer${o.pediatrik ? ', büyüme motorunun kayma satırı ya da bayrağı' : ''}, notta yazan anormal bulgu) ilgili bölümde kısaca tartış; kayıtta yazmayan bir TANI koyma, "normal" hükmünü yalnız kayıt destekliyorsa ver.`,
    ...(o.pediatrik ? [`Büyüme için yalnız motorun satırlarını aktar; motor satırı yoksa "${PERSENTIL_YOK}" de, persentil ya da değer tahmin etme.`] : []),
    'Yalnız BU muayeneyi anlat: başka muayenelerin şikayet, tanı ve ilaçlarını katma (KANIT\'ta verilen önceki ölçüm / önceki laboratuvar sonucuyla karşılaştırma dışında).',
    'KANIT\'ta olmayan sayı, tarih, doz ya da aşı adı yazma.',
  ].join(' ')
}

/* ───────────────────────────── ekran cevabı (kayıttan, modelsiz) ───────────────────────────── */

/**
 * Sekiz bölümlük özetin deterministik ekran biçimi: modelin cevabı kayıtla tutmadığında (olmayan başlık, eksik ya da
 * kayıt dışı değer) hekime giden cevap budur. İlk cümle hastanın adıyla başlar (NOTYA-HASTA-ODAK-01).
 */
export function vizitOzetEkrani(o: VizitOzeti, hastaAdi?: string | null): string {
  const ad = String(hastaAdi || '').trim() || 'Kayıt'
  return [
    `${ad} — ${trGun(o.tarih)} tarihli muayenenin özeti${o.yas ? ` (muayene tarihinde ${o.yas})` : ''}; yalnız kayıttaki bilgilerle.`,
    ...o.bolumler.map((b) => `**${b.baslik}:** ${b.ekran}`),
  ].join('\n\n')
}

/* ───────────────────────────── modelin cevabı kayıtla tutuyor mu ───────────────────────────── */

const TARIH = /\b\d{2}\.\d{2}\.\d{4}\b/g
const sayiDegeri = (s: string) => Number(s.replace(',', '.'))
/** dd.mm.yyyy tarihleri çıkarılmış metnin bütün sayıları. */
const sayiKumesi = (metin: string) => new Set([...metin.replace(TARIH, ' ').matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => sayiDegeri(m[0])))
/** Bir değerin (ölçüm, lab, persentil, z) parçası sayılan sayı: ondalıklı, birimli ya da persentil / z / tansiyon yazımında. */
const DEGER_ONU = /(?:%\s?|(?<!\p{L})p\s?|(?<!\p{L})z\s?[−+-]?\s?|\d\s?\/\s?)$/u
const DEGER_BIRIMI = /^\s?(?:kg|gr?|cm|mm|mg|ml|mcg|IU|ng|fL|mmHg)(?!\p{L})|^\s?(?:°|%|\/\s?dk|\/\s?\d)|^\.?\s?persentil/iu

export interface OzetGuvencesi { metin: string; degisti: boolean; neden: string | null }

/**
 * Model kanıtı gördükten sonra özeti yazar; bu son denetim cevabın kayıtla tuttuğunu güvenceye alır. Üç koşul:
 *   • bölüm başlıklarının hepsi, sırasıyla (**Muayene:** … **Plan:**) — atlanan bölüm yok;
 *   • muayenenin kayıtlı ölçüm ve lab değerleri cevapta geçiyor;
 *   • cevapta kanıtta olmayan değer (ölçüm, lab, persentil, tarih) yok.
 * Biri tutmazsa cevap kayıttaki deterministik özetle DEĞİŞTİRİLİR (vizitOzetEkrani). Tutan cevaba dokunulmaz.
 */
export function vizitOzetiGuvenceyeAl(cevap: string, o: VizitOzeti, hastaAdi?: string | null): OzetGuvencesi {
  const kesin = (neden: string): OzetGuvencesi => ({ metin: vizitOzetEkrani(o, hastaAdi), degisti: true, neden })
  const c = String(cevap || '')
  let konum = -1
  for (const b of o.bolumler) {
    const i = c.indexOf(`**${b.baslik}`, konum + 1)
    if (i === -1) return kesin(`başlık yok ya da sırası farklı: ${b.baslik}`)
    konum = i
  }
  const kaynak = [...vizitOzetKanitSatirlari(o), o.yas || ''].join('\n')
  const gecen = sayiKumesi(c)
  const eksik = o.degerler.find((d) => !d.split('/').every((p) => gecen.has(sayiDegeri(p))))
  if (eksik) return kesin(`kayıtlı değer cevapta yok: ${eksik}`)
  const yabanciTarih = (c.match(TARIH) || []).find((t) => !kaynak.includes(t))
  if (yabanciTarih) return kesin(`kanıtta olmayan tarih: ${yabanciTarih}`)
  const izinli = sayiKumesi(kaynak)
  const tarihsiz = c.replace(TARIH, ' ')
  for (const m of tarihsiz.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const bas = m.index ?? 0, son = bas + m[0].length
    const deger = /[.,]/.test(m[0]) || DEGER_ONU.test(tarihsiz.slice(Math.max(0, bas - 6), bas)) || DEGER_BIRIMI.test(tarihsiz.slice(son, son + 12))
    if (deger && !izinli.has(sayiDegeri(m[0]))) return kesin(`kanıtta olmayan değer: ${tarihsiz.slice(Math.max(0, bas - 6), son + 8).replace(/\s+/g, ' ').trim()}`)
  }
  return { metin: c, degisti: false, neden: null }
}

/** Modele giden kanıt satırları: sekiz bölüm, sırasıyla, numaralı başlıklarla. Hasta adı yok. */
export function vizitOzetKanitSatirlari(o: VizitOzeti): string[] {
  const out: string[] = [`MUAYENE ÖZETİ KANITI — ${trGun(o.tarih)} tarihli muayene; ${o.bolumler.length} bölüm, sırası değişmez. Yalnız kayıt; kayıtta olmayan bölüm kısa ifadesiyle yazılıdır.`]
  o.bolumler.forEach((b, i) => { out.push(`${i + 1}) ${b.baslik.toLocaleUpperCase('tr-TR')}${b.var ? '' : ' — KAYIT YOK'}:`); out.push(...b.kanit.map((s) => `   ${s}`)) })
  return out
}
