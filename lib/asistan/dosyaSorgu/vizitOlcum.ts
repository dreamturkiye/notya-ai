/**
 * NOTYA-DANIS-OLCUM (Dr. Gökhan, canlı, 2026-10-02) — belirli bir MUAYENENİN ölçümü, kayıttan. Deterministik, LLM'siz.
 *
 * "Bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu" sorusuna Ayşe, dosyada 12 aylık sağlam çocuk izlemi varken,
 * demir dozundan (1 mg/kg/gün) yaklaşık 9,35 kg diye tahmin yürüttü. Kök neden: hiçbir yüzeyde "o muayenenin ölçümü"
 * sorgusu yoktu — vizit türü / yaş-dönümü süzgeci yalnız özet sorusunda çalışıyordu (vizitTuruBolumu, PR 512), ölçüm
 * sorusu güncel kiloyu ya da ilk–son trendi alıyordu; Danış panelinin dosya metninde vizit ölçümü hiç yoktu.
 *
 * Bu modül tek sorgudur ve üç yüzey de onu kullanır (Danış paneli, Ayşe sohbet, Ayşe ses); branşa bağlı değildir
 * (erişkinde kilo, boy, VKİ, tansiyon aynı yoldan):
 *   1. vizitOlcumSorusuBul  — soru hangi ölçümü, hangi muayene için istiyor: adı geçen vizit türü / yaş-dönümü
 *      ("12 aylık muayenede", "6 aylık kontrolde", "15 aylıkken"), "ilk / son muayenede", ya da muayeneler boyunca
 *      seri ("bütün muayenelerinde kilosu", "kilo gelişimi").
 *   2. vizitleriSec         — o muayene(ler): vizitTuruEsanlam yardımcılarıyla not metninden; notta yaş yazmıyorsa
 *      muayene tarihindeki yaştan (ve bu söylenir). Eşleşme yoksa SESSİZCE başka muayeneye düşülmez.
 *   3. vizitOlcumKaniti     — o muayenenin ölçümü üç yerden aranır: notun yaşamsal bulgu alanı, aynı günlü cihaz
 *      ölçümü, not metni (etiketli değer). Her değer birimi, tarihi ve kaynağıyla döner.
 *
 * Kural: YALNIZ KAYITLI DEĞER. Kayıt yoksa "kayıtlı ölçüm yok" denir; ilaç dozundan, persentilden ya da komşu
 * ölçümden değer türetilmez. Tek hesap VKİ'dir (aynı muayenenin kayıtlı kilo ve boyundan) ve hesap olduğu yazılır.
 * KVKK: kanıt bloğu hasta adını taşımaz; ad yalnız kesin cevabın başındadır.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { gunEkleIso, gunFarkiIso, trGun } from '@/lib/doktor/dosyaOlaylari'
import { olcumGosterimi } from '@/lib/clinical/olcumMetni'
import { terimlerdenBiriGeciyor } from '@/lib/klinik/sikayetEsanlam'
import { vizitTuruGruplariBul, vizitYasIfadeleriCoz, vizitYasIfadesiCoz, vizitYasIfadesiEslesir, type VizitTuruGrubu, type VizitYasIfadesi } from '@/lib/klinik/vizitTuruEsanlam'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type OlcumAnahtari = 'kilo' | 'boy' | 'basCevresi' | 'vki' | 'tansiyon' | 'ates' | 'nabiz' | 'spo2'

export type VizitHedefi =
  | { tip: 'vizit'; yas: VizitYasIfadesi | null; gruplar: VizitTuruGrubu[] }
  | { tip: 'ilk' }
  | { tip: 'son' }
  | { tip: 'seri'; son?: number }

export interface VizitOlcumSorusu {
  olcumler: OlcumAnahtari[]
  /** Ölçüm adı verilmedi ("ölçümleri", ya da çağıranın varsayılanı): kayıtlı olan gösterilir, olmayan tek tek sayılmaz. */
  genel: boolean
  hedef: VizitHedefi
  /** "normal miydi", "persentili", "nasıldı" — kesin cevap değil, kanıtla birlikte modele giden soru. */
  degerlendirme: boolean
  /**
   * Soru yalnız değeri istiyor ("kaç kiloydu", "boyu ve kilosu") — kayıttaki kesin cevap tek başına yeter. false:
   * değerlendirme ya da ölçüme dayanan BAŞKA bir soru ("… kilosuna göre hangi mama önerilmişti"); o soruya kayıt
   * cümlesi tek başına cevap olmaz, kanıtla birlikte model cevaplar.
   */
  kesin: boolean
}

const AD: Record<OlcumAnahtari, string> = { kilo: 'kilo', boy: 'boy', basCevresi: 'baş çevresi', vki: 'VKİ', tansiyon: 'tansiyon', ates: 'ateş', nabiz: 'nabız', spo2: 'SpO₂' }
/** Ölçümün cevapta ve kanıtta yazılan adı. */
export const OLCUM_ADI = AD
const GENEL_OLCUMLER: OlcumAnahtari[] = ['kilo', 'boy', 'basCevresi', 'tansiyon', 'ates', 'nabiz', 'spo2']

const MUAYENE = '(?:muayene|vizit|kontrol|ziyaret|gelis(?!im)|basvuru|izlem)'
const OLCUM_SOZU: [OlcumAnahtari, RegExp][] = [
  ['kilo', /\b(kilo(?!gram|\s+basina)\w*|agirlig\w*|tarti\w*)\b|\bkac kg\b/],
  ['boy', /\bboy(u|unu|uydu|lari|larini)?\b/],
  ['basCevresi', /\bbas cevre\w*/],
  ['vki', /\b(vki\w*|bki|bmi)\b|\b(vucut|beden) kitle/],
  ['tansiyon', /\btansiyon\w*|\bkan basinc\w*/],
  ['ates', /\bates(i|ini|iydi)?\b/],
  ['nabiz', /\bnabiz\w*|\bnabz\w*|\bkalp hizi\w*/],
  ['spo2', /\bspo2\b|\bsaturasyon\w*|\boksijen (doygunlug|saturasyon)\w*/],
]
const GENEL_SOZU = /\b(olcum\w*|vital\w*|yasamsal bulgu\w*|antropometri\w*)\b/
/** Ateş bir şikayettir de — ölçüm olarak yalnız değeri sorulduğunda. */
const DEGER_SOZU = /\b(kac|kacti|kacmis|neydi|nedir|ne kadar\w*|olcul\w*|deger\w*|derece\w*)\b/
/** Doz / ilaç sorusu ölçüm sorusu değildir ("… demir dozu kaç mg/kg"). */
const DOZ_SOZU = /\b(doz\w*|mg|ml|mcg|ilac\w*|recete\w*|antibiyoti\w*|surup\w*|damla\w*)\b|mg\/kg/
const DEGERLENDIRME = /persentil|egri|normal mi|geri mi|yeterli mi|dusuk mu|fazla mi|yuksek mi|uygun mu|uzuyor mu|\bnasil\w*|yasina gore|kilo (aliyor|alimi|alamiyor|kaybi)|\byorumla\w*|\bdegerlendir\w*/
/** Ölçümün yanında başka bir şey soruluyor — neden, hangi, neye göre, ne önerildi. */
const BASKA_SORU = /\b(hangi\w*|neden|nicin|niye|ne zaman|kim\w*|oner\w*|verdi\w*|verildi\w*|verilmis\w*|yazdi\w*|yazildi\w*|yazmis\w*|baslan\w*|basladi\w*|gore|icin|ragmen|yuzunden|sebeb\w*)\b/
const SERI = new RegExp(`\\b(butun|tum|her)\\s+${MUAYENE}\\w*|\\b${MUAYENE}ler\\w*|\\b(gelisim\\w*|seyri\\w*|seyir\\w*|degisim\\w*|trend\\w*|gecmis\\w*|kronoloji\\w*|olcumler\\w*|degerler\\w*|sirayla|sirasiyla|zaman icinde|tablo\\w*|liste\\w*)\\b`)
/** A series in so many words — a plural alone ("ölçümleri") is not one. */
const SERI_SOZU = new RegExp(`\\b(butun|tum|her)\\s+${MUAYENE}\\w*|\\b${MUAYENE}ler\\w*|\\b(gelisim\\w*|seyri\\w*|seyir\\w*|degisim\\w*|trend\\w*|gecmis\\w*|kronoloji\\w*|sirayla|sirasiyla|zaman icinde|tablo\\w*|liste\\w*)\\b`)
const SAYI: Record<string, number> = { iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10 }

/**
 * Soruda adı geçen yaş-dönümü. Yalnız dönüm biçimi sayılır ("12 aylık", "15 aylıkken", "2 yaşında", "12. ay
 * muayenesinde", "2 yaş kontrolünde"); süre ifadesi sayılmaz ("son 6 ayda", "3 gündür", "2 hafta önce").
 */
function yasDonumuBul(n: string): VizitYasIfadesi | null {
  for (const m of n.matchAll(/\b(\d{1,3})\s*\.?\s*(aylik|haftalik|gunluk|yasinda|yas|ay|hafta|gun)(\w*)/g)) {
    const birim = m[2]
    // "son 3 aylık kilo değişimi" bir süredir, 3 aylık muayene değil.
    if (/\bson\s*$/.test(n.slice(0, m.index))) continue
    const donum = ['aylik', 'haftalik', 'gunluk', 'yasinda'].includes(birim)
      || (!m[3] && new RegExp(`^\\s+${MUAYENE}`).test(n.slice(m.index + m[0].length)))
    if (!donum) continue
    const y = vizitYasIfadesiCoz(`${m[1]} ${birim.startsWith('ay') ? 'aylik' : birim.startsWith('hafta') ? 'haftalik' : birim.startsWith('gun') ? 'gunluk' : 'yasinda'}`)
    if (y) return y
  }
  return null
}

/**
 * Mesaj bir muayenenin (ya da muayeneler boyunca) ölçümünü mü soruyor? null → bu modülün sorusu değil: tek bilgi
 * ("kilosu kaç" → hızlı kart), ölçüm adı geçmeyen değerlendirme ("büyümesi nasıl"), doz sorusu.
 * `varsayilan`: ölçüm adı geçmese de muayene adı geçiyorsa bu ölçümlerle sor (büyüme kanıtı böyle çağırır).
 */
export function vizitOlcumSorusuBul(mesaj: string | null | undefined, secenek: { varsayilan?: OlcumAnahtari[] } = {}): VizitOlcumSorusu | null {
  const n = trAramaNormalize(mesaj).replace(/[?!,;:'’"]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!n || DOZ_SOZU.test(n)) return null

  let olcumler = OLCUM_SOZU.filter(([, re]) => re.test(n)).map(([o]) => o)
  if (olcumler.includes('ates') && !DEGER_SOZU.test(n)) olcumler = olcumler.filter((o) => o !== 'ates')
  let genel = false
  if (!olcumler.length && GENEL_SOZU.test(n)) { olcumler = [...GENEL_OLCUMLER]; genel = true }
  if (!olcumler.length && secenek.varsayilan?.length) { olcumler = [...secenek.varsayilan]; genel = true }
  if (!olcumler.length) return null

  const degerlendirme = DEGERLENDIRME.test(n)
  const sor = (hedef: VizitHedefi): VizitOlcumSorusu => ({ olcumler, genel, hedef, degerlendirme, kesin: !degerlendirme && !BASKA_SORU.test(n) })

  const yas = yasDonumuBul(n)
  const gruplar = vizitTuruGruplariBul(mesaj)
  if (yas || gruplar.length) return sor({ tip: 'vizit', yas, gruplar })

  const sonN = n.match(new RegExp(`\\bson (\\d{1,2}|${Object.keys(SAYI).join('|')}) ${MUAYENE}`))
  if (sonN) return sor({ tip: 'seri', son: /^\d+$/.test(sonN[1]) ? Number(sonN[1]) : SAYI[sonN[1]] })
  if (new RegExp(`\\bilk ${MUAYENE}(?!ler)`).test(n)) return sor({ tip: 'ilk' })
  if (new RegExp(`\\b(son|en son|gecen|onceki) ${MUAYENE}(?!ler)`).test(n)) return sor({ tip: 'son' })
  // NOTYA-KORPUS-KALAN-01 (Y-021): "Son ölçümleri neler?" — the measurements of the LAST exam (ateş and tansiyon
  // included), not the series the plural "ölçümleri" would otherwise select below.
  if (genel && /\b(son|en son) (olcum|vital|yasamsal bulgu|antropometri)/.test(n) && !SERI_SOZU.test(n)) return sor({ tip: 'son' })
  // Yalnız ölçüm adı verilen seri: "kilo gelişimi", "tansiyon seyri". Varsayılanla gelen soruda seri sayılmaz.
  if (!secenek.varsayilan && SERI.test(n)) return sor({ tip: 'seri' })
  return null
}

/** Adı geçen tek muayene (yaş-dönümü / tür / ilk / son) — seri değil. */
const tekMuayeneHedefi = (h: VizitHedefi | null | undefined): h is Exclude<VizitHedefi, { tip: 'seri' }> => Boolean(h) && h!.tip !== 'seri'

/**
 * NOTYA-DANIS-OLCUM-07 (L-DANIS-BOYU): muayeneyi yinelemeyen takip sorusu — "peki boyu?". Bir önceki hekim sorusu bir
 * muayenenin ölçümünü sorduysa takip sorusu AYNI muayenenin ölçümünü sorar. Yalnız bir önceki soruya bakılır (daha
 * eski bir konu taşınmaz) ve yalnız ölçüm adından ibaret kısa söze (kendi muayenesini anan soru kendi başına okunur).
 */
export function vizitOlcumTakipSorusu(mesaj: string | null | undefined, oncekiSoru: string | null | undefined): VizitOlcumSorusu | null {
  const n = trAramaNormalize(mesaj).replace(/[?!,;:'’"]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!n || DOZ_SOZU.test(n) || n.split(' ').length > 6) return null
  const olcumler = OLCUM_SOZU.filter(([o, re]) => re.test(n) || (o === 'ates' && /\bates\w*/.test(n))).map(([o]) => o)
  if (!olcumler.length) return null
  // Bir ebeveynin boyu hastanın ölçümü değildir.
  if (/\b(anne|baba)\w*/.test(n)) return null
  const onceki = vizitOlcumSorusuBul(oncekiSoru, { varsayilan: ['kilo'] })
  if (!tekMuayeneHedefi(onceki?.hedef)) return null
  const degerlendirme = DEGERLENDIRME.test(n)
  return { olcumler, genel: false, hedef: onceki!.hedef, degerlendirme, kesin: !degerlendirme && !BASKA_SORU.test(n) }
}

/**
 * Adı geçen muayenenin, takip sorusuna YENİDEN yazılabilen söylenişi: "12 aylık muayenesinde", "ilk muayenesinde".
 * Sohbet / ses bağlamı (konusmaBaglami `vizit`) bunu saklar; söyleniş bu modülde aynı muayeneye çözülmüyorsa null.
 */
export function vizitSoylenisi(soru: VizitOlcumSorusu | null | undefined): string | null {
  if (!soru || !tekMuayeneHedefi(soru.hedef)) return null
  const etiket = hedefEtiketi(soru.hedef)
  const soylenis = /muayenesi$|muayene$/.test(etiket) ? etiket.replace(/muayenesi$|muayene$/, 'muayenesinde') : `${etiket} sırasında`
  const geri = vizitOlcumSorusuBul(`${soylenis} kilosu kaçtı`)
  return geri && geri.hedef.tip === soru.hedef.tip && hedefEtiketi(geri.hedef) === etiket ? soylenis : null
}

/* ───────────────────────────── muayene seçimi ───────────────────────────── */

const vizitleri = (o: DosyaOlayi[]) => o.filter((x) => x.kaynak === 'not' && x.tur === 'vizit').sort((a, b) => a.tarih.localeCompare(b.tarih))
/** Plan cümlesi vizitin türünü / yaşını anlatmaz ("15. ayda kontrol") — tür ve yaş öykü / bulgu / tanıda aranır. */
const oykuKismi = (v: DosyaOlayi) => v.metin.split(' | Plan:')[0]

function ayEkleIso(iso: string, ay: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  const gun = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + ay)
  d.setUTCDate(Math.min(gun, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()))
  return d.toISOString().slice(0, 10)
}

/** Yaş-dönümünün takvim günü ve kabul edilen sapma (gün). */
function donumGunu(dogumIso: string, y: VizitYasIfadesi): { tarih: string; pay: number } {
  if (y.birim === 'gun') return { tarih: gunEkleIso(dogumIso, y.sayi), pay: 2 }
  if (y.birim === 'hafta') return { tarih: gunEkleIso(dogumIso, y.sayi * 7), pay: 4 }
  if (y.birim === 'ay') return { tarih: ayEkleIso(dogumIso, y.sayi), pay: 21 }
  return { tarih: ayEkleIso(dogumIso, y.sayi * 12), pay: 60 }
}

export type VizitSecimi = 'metin' | 'yas-tarih' | 'ilk' | 'son' | 'tum'

/**
 * Sorunun andığı muayene(ler). Tür ve yaş önce NOT METNİNDE aranır (vizitTuruEsanlam). Yaş notta yazmıyorsa muayene
 * tarihindeki yaşa en yakın tek muayene alınır (dönüm gününe ± pay) ve seçim 'yas-tarih' olarak işaretlenir.
 * Eşleşme yoksa boş döner — çağıran "bulamadım" der, başka muayeneye düşmez.
 */
export function vizitleriSec(olaylar: DosyaOlayi[], hasta: Pick<DosyaHastasi, 'dogumIso'>, hedef: VizitHedefi): { vizitler: DosyaOlayi[]; secim: VizitSecimi } {
  const tum = vizitleri(olaylar)
  if (hedef.tip === 'ilk') return { vizitler: tum.slice(0, 1), secim: 'ilk' }
  if (hedef.tip === 'son') return { vizitler: tum.slice(-1), secim: 'son' }
  if (hedef.tip === 'seri') return { vizitler: hedef.son ? tum.slice(-hedef.son) : tum, secim: 'tum' }
  const { yas, gruplar } = hedef
  const turEslesen = gruplar.length ? tum.filter((v) => gruplar.some((g) => terimlerdenBiriGeciyor(oykuKismi(v), g.terimler))) : tum
  if (!yas) return { vizitler: turEslesen, secim: 'metin' }
  // Yaş verildiyse TAM eşleşme şart. Tür notta geçmiyorsa (hekim "sağlam çocuk" yazmamış olabilir) yaş bütün
  // muayenelerde aranır; tür geçen muayeneler varsa yalnız onlarda.
  const aday = turEslesen.length ? turEslesen : tum
  const metinde = aday.filter((v) => vizitYasIfadeleriCoz(oykuKismi(v)).some((y) => vizitYasIfadesiEslesir(y, yas)))
  if (metinde.length) return { vizitler: metinde, secim: 'metin' }
  if (!hasta.dogumIso) return { vizitler: [], secim: 'metin' }
  const { tarih, pay } = donumGunu(hasta.dogumIso, yas)
  const yakin = aday.map((v) => ({ v, fark: Math.abs(gunFarkiIso(tarih, v.tarih)) })).filter((x) => x.fark <= pay).sort((a, b) => a.fark - b.fark)
  return { vizitler: yakin.slice(0, 1).map((x) => x.v), secim: 'yas-tarih' }
}

const BIRIM_AD: Record<VizitYasIfadesi['birim'], string> = { gun: 'günlük', hafta: 'haftalık', ay: 'aylık', yas: 'yaş' }

/** "12 aylık muayene", "2 yaş muayenesi", "ilk muayene", "sağlam çocuk muayenesi / rutin kontrol". */
export function hedefEtiketi(hedef: VizitHedefi): string {
  if (hedef.tip === 'ilk') return 'ilk muayene'
  if (hedef.tip === 'son') return 'son muayene'
  if (hedef.tip === 'seri') return hedef.son ? `son ${hedef.son} muayene` : 'bütün muayeneler'
  if (hedef.yas) return hedef.yas.birim === 'yas' ? `${hedef.yas.sayi} yaş muayenesi` : `${hedef.yas.sayi} ${BIRIM_AD[hedef.yas.birim]} muayene`
  return hedef.gruplar.map((g) => g.ad.toLocaleLowerCase('tr-TR')).join(', ') || 'belirtilen muayene'
}

/* ───────────────────────────── bir muayenenin ölçümleri ───────────────────────────── */

export type OlcumKaynagi = 'alan' | 'cihaz' | 'metin' | 'hesap'

export interface OlcumKaydi {
  olcum: OlcumAnahtari
  /** "9,8 kg", "128/82 mmHg" */
  metin: string
  tarih: string
  kaynak: OlcumKaynagi
  /** Cevapta yazılan kaynak cümlesi. */
  kaynakAdi: string
}

export interface VizitOlcumu {
  tarih: string
  kayitlar: OlcumKaydi[]
  /** Sorulan ama bu muayenede kaydı olmayan ölçümler. */
  eksik: OlcumAnahtari[]
  /** Alan / cihaz / not metni aynı ölçüm için farklı değer taşıyorsa — gizlenmez. */
  celiski: string[]
  /** Kaydı olmayan ölçüm için en yakın önceki ve sonraki kayıtlı değer (bu muayenenin ölçümü DEĞİL). */
  yakin: OlcumKaydi[]
}

const KAYNAK_ADI: Record<Exclude<OlcumKaynagi, 'metin' | 'hesap'>, string> = {
  alan: 'muayene notunun yaşamsal bulgu alanı',
  cihaz: 'aynı günlü cihaz ölçümü',
}
const KAYNAK_KISA: Record<OlcumKaynagi, string> = { alan: 'muayene alanı', cihaz: 'cihaz ölçümü', metin: 'not metni', hesap: 'hesaplandı' }
const BAKILAN = 'muayene notunun yaşamsal bulgu alanı, aynı günlü cihaz ölçümleri, not metni'

const CIHAZ_TURU: [RegExp, OlcumAnahtari][] = [
  [/^(kilo|agirlik|weight|tarti)/, 'kilo'], [/^(boy|height)/, 'boy'], [/^(bas ?cevre|head)/, 'basCevresi'],
  [/^tansiyon/, 'tansiyon'], [/^ates/, 'ates'], [/^nabiz/, 'nabiz'], [/^spo2/, 'spo2'],
]
const cihazOlcumu = (o: DosyaOlayi): OlcumAnahtari | null => CIHAZ_TURU.find(([re]) => re.test(trAramaNormalize(o.tur)))?.[1] ?? null
const gosterim = (olcum: OlcumAnahtari, o: DosyaOlayi) => olcumGosterimi(olcum, o.deger, o.degerMetni || o.metin.replace(/^tansiyon /, ''))

/** Bir muayenede bir ölçümün bütün kayıtları: önce alan, sonra aynı günlü cihaz, sonra not metni. */
function vizitKayitlari(olaylar: DosyaOlayi[], v: DosyaOlayi, olcum: OlcumAnahtari): OlcumKaydi[] {
  const out: OlcumKaydi[] = []
  const ekle = (o: DosyaOlayi | undefined, kaynak: Exclude<OlcumKaynagi, 'hesap'>) => {
    if (!o || (o.deger == null && !o.degerMetni && olcum !== 'tansiyon')) return
    out.push({ olcum, metin: gosterim(olcum, o), tarih: v.tarih, kaynak, kaynakAdi: kaynak === 'metin' ? `muayene notunun metni (${o.metin})` : KAYNAK_ADI[kaynak] })
  }
  ekle(olaylar.find((o) => o.kaynak === 'olcum' && o.vizitId === v.vizitId && o.tur === olcum), 'alan')
  ekle(olaylar.find((o) => o.kaynak === 'cihaz' && o.tarih === v.tarih && cihazOlcumu(o) === olcum), 'cihaz')
  ekle(olaylar.find((o) => o.kaynak === 'not' && o.tur === 'olcum-metin' && o.vizitId === v.vizitId && o.anahtar === olcum), 'metin')
  return out
}

const sayiDegeri = (metin: string) => Number(metin.replace(/[^\d,]/g, '').replace(',', '.'))

/** VKİ kayıtlı değilse aynı muayenenin kayıtlı kilo ve boyundan hesaplanır — ve hesap olduğu kaynağında yazılır. */
function vkiHesabi(olaylar: DosyaOlayi[], v: DosyaOlayi): OlcumKaydi | null {
  const kilo = vizitKayitlari(olaylar, v, 'kilo')[0], boy = vizitKayitlari(olaylar, v, 'boy')[0]
  if (!kilo || !boy) return null
  const kg = sayiDegeri(kilo.metin), cm = sayiDegeri(boy.metin)
  if (!(kg > 0) || !(cm >= 50)) return null
  return {
    olcum: 'vki', metin: olcumGosterimi('vki', Math.round((kg / (cm / 100) ** 2) * 10) / 10), tarih: v.tarih, kaynak: 'hesap',
    kaynakAdi: `hesaplanan değer — aynı muayenede kayıtlı kilo (${kilo.metin}) ve boydan (${boy.metin}) hesaplandı; ayrı bir VKİ kaydı yok`,
  }
}

function vizitOlcumu(olaylar: DosyaOlayi[], v: DosyaOlayi, olcumler: OlcumAnahtari[], genel: boolean): VizitOlcumu {
  const kayitlar: OlcumKaydi[] = [], eksik: OlcumAnahtari[] = [], celiski: string[] = []
  for (const olcum of olcumler) {
    const hepsi = vizitKayitlari(olaylar, v, olcum)
    const ilk = hepsi[0] ?? (olcum === 'vki' ? vkiHesabi(olaylar, v) : null)
    if (!ilk) { if (!genel) eksik.push(olcum); continue }
    kayitlar.push(ilk)
    for (const diger of hepsi.slice(1)) {
      if (diger.metin !== ilk.metin) celiski.push(`${diger.kaynak === 'metin' ? 'not metninde' : 'cihaz ölçümünde'} ${AD[olcum]} ${diger.metin}${diger.kaynak === 'metin' ? ` ${diger.kaynakAdi.replace(/^muayene notunun metni /, '')}` : ''}`)
    }
  }
  return { tarih: v.tarih, kayitlar, eksik, celiski, yakin: [] }
}

/* ───────────────────────────── seri ───────────────────────────── */

export interface SeriSatiri { tarih: string; tur: 'muayene' | 'cihaz'; kayitlar: Partial<Record<OlcumAnahtari, OlcumKaydi>> }

/** Muayene başına bir satır (eskiden yeniye); muayenesi olmayan günlerin cihaz ölçümleri kendi satırında. */
function seriSatirlari(olaylar: DosyaOlayi[], secili: DosyaOlayi[], olcumler: OlcumAnahtari[], cihazDahil: boolean): SeriSatiri[] {
  const satirlar: SeriSatiri[] = secili.map((v) => {
    const kayitlar: SeriSatiri['kayitlar'] = {}
    for (const k of vizitOlcumu(olaylar, v, olcumler, true).kayitlar) kayitlar[k.olcum] = k
    return { tarih: v.tarih, tur: 'muayene', kayitlar }
  })
  if (cihazDahil) {
    const vizitGunleri = new Set(vizitleri(olaylar).map((v) => v.tarih))
    for (const o of olaylar) {
      const olcum = o.kaynak === 'cihaz' ? cihazOlcumu(o) : null
      if (!olcum || !olcumler.includes(olcum) || vizitGunleri.has(o.tarih) || (o.deger == null && !o.degerMetni)) continue
      satirlar.push({ tarih: o.tarih, tur: 'cihaz', kayitlar: { [olcum]: { olcum, metin: gosterim(olcum, o), tarih: o.tarih, kaynak: 'cihaz', kaynakAdi: 'cihaz ölçümü' } } })
    }
  }
  return satirlar.sort((a, b) => a.tarih.localeCompare(b.tarih))
}

/* ───────────────────────────── kanıt ───────────────────────────── */

export interface VizitOlcumKaniti {
  soru: VizitOlcumSorusu
  /** kayitli: sorulanların hepsi var · kismi: bir kısmı · olcum-yok: muayene var, ölçüm yok · vizit-yok: o muayene dosyada yok */
  durum: 'kayitli' | 'kismi' | 'olcum-yok' | 'vizit-yok'
  etiket: string
  secim: VizitSecimi
  vizitler: VizitOlcumu[]
  /** Yalnız seri sorusunda. */
  seri: SeriSatiri[] | null
  /** Dosyadaki bütün onaylı muayenelerin tarihleri (eskiden yeniye). */
  muayeneTarihleri: string[]
}

export function vizitOlcumKaniti(soru: VizitOlcumSorusu, olaylar: DosyaOlayi[], hasta: Pick<DosyaHastasi, 'dogumIso'>): VizitOlcumKaniti {
  const { vizitler: secili, secim } = vizitleriSec(olaylar, hasta, soru.hedef)
  const temel = { soru, etiket: hedefEtiketi(soru.hedef), secim, muayeneTarihleri: vizitleri(olaylar).map((v) => v.tarih) }

  if (soru.hedef.tip === 'seri') {
    const seri = seriSatirlari(olaylar, secili, soru.olcumler, !soru.hedef.son)
    return { ...temel, durum: seri.some((s) => Object.keys(s.kayitlar).length) ? 'kayitli' : 'olcum-yok', vizitler: [], seri }
  }
  if (!secili.length) return { ...temel, durum: 'vizit-yok', vizitler: [], seri: null }

  const tumSeri = seriSatirlari(olaylar, vizitleri(olaylar), soru.olcumler, true)
  const vizitler = secili.map((v) => {
    const o = vizitOlcumu(olaylar, v, soru.olcumler, soru.genel)
    for (const olcum of o.eksik) {
      const olan = tumSeri.filter((s) => s.kayitlar[olcum]).map((s) => s.kayitlar[olcum]!)
      const once = olan.filter((k) => k.tarih < v.tarih).at(-1), sonra = olan.find((k) => k.tarih > v.tarih)
      o.yakin.push(...[once, sonra].filter((k): k is OlcumKaydi => Boolean(k)))
    }
    return o
  })
  const var_ = vizitler.some((v) => v.kayitlar.length), eksik = vizitler.some((v) => v.eksik.length || !v.kayitlar.length)
  return { ...temel, durum: !var_ ? 'olcum-yok' : eksik ? 'kismi' : 'kayitli', vizitler, seri: null }
}

/* ───────────────────────────── kesin cevap ───────────────────────────── */

const birlestir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`)
const buyukBas = (s: string) => (s ? s[0].toLocaleUpperCase('tr-TR') + s.slice(1) : s)
const adlar = (o: OlcumAnahtari[]) => birlestir(o.map((x) => AD[x]))
const hucre = (s: string) => String(s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const satir = (h: string[]) => `| ${h.join(' | ')} |`
const KAYIT_YOK = 'kayıt yok'

function secimNotu(k: VizitOlcumKaniti): string {
  if (k.secim !== 'yas-tarih') return ''
  return ' Notta bu yaş yazmıyor; muayene tarihindeki yaşa göre seçildi.'
}

/** Bir muayenenin cevap cümlesi (addan sonra gelen kısım). */
function vizitCumlesi(k: VizitOlcumKaniti, v: VizitOlcumu): string {
  const bas = `${k.etiket} (${trGun(v.tarih)}): `
  const sorulan = k.soru.genel ? 'ölçüm' : `${adlar(k.soru.olcumler)} ölçümü`
  if (!v.kayitlar.length) {
    const yakin = v.yakin.length
      ? ` En yakın kayıtlı ${[...new Set(v.yakin.map((y) => y.olcum))].map((o) => `${AD[o]}: ${birlestir(v.yakin.filter((y) => y.olcum === o).map((y) => `${y.metin} (${trGun(y.tarih)})`))}`).join('; ')}.`
      : ''
    return `${bas}kayıtlı ${sorulan} yok Hocam. Muayene notunun yaşamsal bulgu alanında, aynı günlü cihaz ölçümlerinde ve not metninde ${k.soru.genel ? 'ölçüm' : adlar(k.soru.olcumler)} değeri bulamadım.${yakin}${secimNotu(k)}`
  }
  const degerler = v.kayitlar.map((x) => `${AD[x.olcum]} ${x.metin}`).join('; ')
  const kaynaklar = [...new Set(v.kayitlar.map((x) => x.kaynakAdi))]
  // Several sources: each source once, with the measurements read from it.
  const kaynak = kaynaklar.length === 1 ? kaynaklar[0] : kaynaklar.map((s) => `${adlar(v.kayitlar.filter((x) => x.kaynakAdi === s).map((x) => x.olcum))} — ${s}`).join('; ')
  const eksik = v.eksik.length ? ` ${buyukBas(adlar(v.eksik))} için bu muayenede kayıtlı ölçüm yok.` : ''
  const celiski = v.celiski.length ? ` Çelişen kayıt: ${v.celiski.join('; ')}.` : ''
  return `${bas}${degerler}. Kaynak: ${kaynak}.${eksik}${celiski}${secimNotu(k)}`
}

function seriTablosu(k: VizitOlcumKaniti, baslik: string): string {
  const seri = k.seri || []
  const olcumler = k.soru.olcumler.filter((o) => !k.soru.genel || seri.some((s) => s.kayitlar[o]))
  const muayene = seri.filter((s) => s.tur === 'muayene').length, cihaz = seri.length - muayene
  return [
    `**${baslik} — ${adlar(olcumler)} ölçümleri** (${muayene} muayene${cihaz ? `, ${cihaz} cihaz ölçümü` : ''}; eskiden yeniye)`,
    '',
    satir(['Tarih', ...olcumler.map((o) => buyukBas(AD[o])), 'Kaynak']),
    satir(['---', ...olcumler.map(() => '---'), '---']),
    ...seri.map((s) => satir([
      trGun(s.tarih),
      ...olcumler.map((o) => hucre(s.kayitlar[o]?.metin || (s.tur === 'cihaz' ? '' : KAYIT_YOK))),
      [...new Set(Object.values(s.kayitlar).map((x) => KAYNAK_KISA[x.kaynak]))].join(', '),
    ])),
    '',
    `Yalnız dosyada kayıtlı değerler gösterilir; kayıtlı olmayan ölçüm "${KAYIT_YOK}" olarak işaretlidir.`,
  ].join('\n')
}

export interface VizitOlcumCevabi {
  /** Ekran cevabı (seri: tablo). */
  ekran: string
  /** Söylenen cevap — seri için tek kısa cümle. */
  konusma: string
}

/**
 * Kesin cevap: değer, birim, tarih, kaynak — yalnız kayıttan. `hastaAdi` verilirse cümle adla başlar
 * (NOTYA-HASTA-ODAK-01); verilmezse "Kayıt — …" (Danış paneli hasta adını yazmaz).
 */
export function vizitOlcumCevabi(k: VizitOlcumKaniti, hastaAdi?: string | null): VizitOlcumCevabi {
  const ad = String(hastaAdi || '').trim()
  const on = ad ? `${ad} — ` : 'Kayıt — '
  const tek = (s: string): VizitOlcumCevabi => ({ ekran: s, konusma: s })

  if (!k.muayeneTarihleri.length && !(k.seri || []).length) return tek(`${on}onaylı muayene kaydı yok Hocam; ${k.soru.genel ? 'ölçüm' : adlar(k.soru.olcumler)} kaydı da bulamadım.`)

  if (k.seri) {
    if (k.durum === 'olcum-yok') return tek(`${on}${k.etiket === 'bütün muayeneler' ? 'hiçbir muayenede' : `${k.etiket} içinde`} kayıtlı ${k.soru.genel ? 'ölçüm' : `${adlar(k.soru.olcumler)} ölçümü`} yok Hocam.`)
    const ilkSon = k.soru.olcumler.map((o) => {
      const olan = k.seri!.filter((s) => s.kayitlar[o]).map((s) => s.kayitlar[o]!)
      if (!olan.length) return ''
      const a = olan[0], z = olan[olan.length - 1]
      return olan.length === 1 ? `tek ${AD[o]} kaydı ${a.metin} (${trGun(a.tarih)})` : `ilk ${AD[o]} ${a.metin} (${trGun(a.tarih)}), son ${AD[o]} ${z.metin} (${trGun(z.tarih)})`
    }).filter(Boolean)
    return {
      ekran: seriTablosu(k, ad || 'Kayıt'),
      konusma: `${on}${adlar(k.soru.olcumler)} ölçümlerini tarih sırasıyla ekrana getirdim Hocam; ${k.seri.length} kayıt var. ${buyukBas(ilkSon.join('; '))}.`,
    }
  }

  if (k.durum === 'vizit-yok') {
    const liste = k.muayeneTarihleri.slice(-8).map(trGun).join(', ')
    return tek(`${on}dosyada ${k.etiket} kaydı bulamadım Hocam; başka bir muayenenin ölçümünü vermedim. Onaylı muayeneler: ${liste}${k.muayeneTarihleri.length > 8 ? ' (son 8)' : ''}.`)
  }

  const cumleler = k.vizitler.map((v) => vizitCumlesi(k, v))
  const cok = cumleler.length > 1 ? `\nBirden fazla muayene eşleşti (${cumleler.length}); hangisini sorduğunuzu söylerseniz yalnız onu veririm.` : ''
  return tek(`${on}${cumleler.join('\n')}${cok}`)
}

/* ───────────────────────────── kanıt bloğu (modele giden) ───────────────────────────── */

/** Kanıt satırları — hasta adı yok. Büyüme / özet kanıtına da aynen eklenir (kanit.ts). */
export function vizitOlcumKanitSatirlari(k: VizitOlcumKaniti): string[] {
  const sorulan = k.soru.genel ? 'kayıtlı ölçümler' : adlar(k.soru.olcumler)
  const out: string[] = [`VİZİT ÖLÇÜMÜ KANITI — sorulan: ${sorulan}; muayene: ${k.etiket}.`]
  if (k.seri) {
    out.push(...(k.seri.length ? k.seri.map((s) => {
      const d = Object.values(s.kayitlar)
      return `- ${trGun(s.tarih)} (${s.tur === 'cihaz' ? 'cihaz ölçümü' : 'muayene'}): ${d.length ? d.map((x) => `${AD[x.olcum]} ${x.metin} [${KAYNAK_KISA[x.kaynak]}]`).join('; ') : 'KAYIT YOK'}`
    }) : ['- Onaylı muayene yok.']))
    out.push('[KURAL] Tarih ve değerleri bu sırayla, AYNEN ver. "KAYIT YOK" yazan muayene için değer yazma; araya değer uydurma.')
    return out
  }
  if (k.durum === 'vizit-yok') {
    out.push(`- Dosyada ${k.etiket} kaydı bulunamadı (not metninde ve muayene tarihindeki yaşa göre arandı). Onaylı muayeneler: ${k.muayeneTarihleri.map(trGun).join(', ') || 'yok'}.`)
    out.push('[KURAL] İlk cümlede bu muayenenin dosyada bulunmadığını söyle. Başka muayenenin ölçümünü bu muayenenin ölçümü gibi sunma.')
    return out
  }
  for (const v of k.vizitler) {
    out.push(`Eşleşen muayene: ${trGun(v.tarih)}${k.secim === 'yas-tarih' ? ' (notta bu yaş yazmıyor; muayene tarihindeki yaşa göre seçildi)' : ''}.`)
    for (const x of v.kayitlar) out.push(`- KAYITLI: ${AD[x.olcum]} ${x.metin} — ${trGun(x.tarih)} — kaynak: ${x.kaynakAdi}.`)
    for (const c of v.celiski) out.push(`- ÇELİŞEN KAYIT: ${c}.`)
    const yok = v.kayitlar.length ? v.eksik : k.soru.genel ? [] : k.soru.olcumler
    if (yok.length || !v.kayitlar.length) out.push(`- KAYIT YOK: bu muayene için ${yok.length ? adlar(yok) : ''} ölçümü bulunamadı (bakılan yerler: ${BAKILAN}).`.replace('için  ölçümü', 'için ölçüm'))
    if (v.yakin.length) out.push(`- En yakın kayıtlı ölçümler (bu muayenenin ölçümü DEĞİL): ${v.yakin.map((y) => `${AD[y.olcum]} ${y.metin} (${trGun(y.tarih)})`).join('; ')}.`)
  }
  out.push('[KURAL] KAYITLI değeri birimi, tarihi ve kaynağıyla AYNEN ver. İlaç dozundan (mg/kg), başka bir hesaptan ya da komşu ölçümlerden değer TÜRETME; başka muayenenin ölçümünü bu muayenenin ölçümü gibi sunma.')
  if (k.durum !== 'kayitli') out.push('[KURAL] KAYIT YOK yazan ölçüm için ilk cümlede "bu muayenede kayıtlı ölçüm yok" de. Tahmin verirsen açıkça "tahmin" diye etiketle, neye dayandığını söyle ve kayıtlı ölçüm gibi sunma.')
  return out
}

export function vizitOlcumKanitBlogu(k: VizitOlcumKaniti): string {
  return ['=== VİZİT ÖLÇÜMÜ (kayıttan, deterministik) ===', ...vizitOlcumKanitSatirlari(k), '=== VİZİT ÖLÇÜMÜ SONU ==='].join('\n')
}

/* ───────────────────────────── son kayıtlı ölçümler (büyüme sorusu, Danış) ───────────────────────────── */

/**
 * NOTYA-KORPUS-KALAN-01 (I-03): her ölçümün EN SON kayıtlı değeri — hangi muayenede ya da cihaz ölçümünde olursa
 * olsun. "Büyümesi nasıl gidiyor?" sorusunda Danış paneli modele yalnız dosya metnini veriyordu; model son boyu
 * yuvarladı (kayıt 87,5 cm, cevap "88 cm") ve cevabı kayıtla karşılaştıran yoktu.
 */
export function sonKayitliOlcumler(olaylar: DosyaOlayi[], olcumler: OlcumAnahtari[]): OlcumKaydi[] {
  const seri = seriSatirlari(olaylar, vizitleri(olaylar), olcumler, true)
  return olcumler.map((o) => seri.filter((s) => s.kayitlar[o]).at(-1)?.kayitlar[o]).filter((x): x is OlcumKaydi => Boolean(x))
}

const sonOlcumMetni = (kayitlar: OlcumKaydi[]) => kayitlar.map((x) => `${AD[x.olcum]} ${x.metin} (${trGun(x.tarih)})`).join('; ')

/** Modele giden kanıt — hasta adı yok. */
export function sonOlcumKanitBlogu(kayitlar: OlcumKaydi[]): string {
  if (!kayitlar.length) return ''
  return ['=== SON KAYITLI ÖLÇÜMLER (kayıttan, deterministik) ===', ...kayitlar.map((x) => `- ${AD[x.olcum]} ${x.metin} — ${trGun(x.tarih)} — kaynak: ${x.kaynakAdi}.`), '[KURAL] Bu değerleri birimi ve tarihiyle AYNEN ver; yuvarlama, başka muayenenin değerini son değer gibi sunma.', '=== SON KAYITLI ÖLÇÜMLER SONU ==='].join('\n')
}

/**
 * Cevap kayıtlı son değerlerin hepsini taşıyorsa dokunulmaz; taşımıyorsa kayıt cümlesi cevabın ÖNÜNE konur (cevap
 * silinmez — değerlendirme modelindir, değer kaydındır).
 */
export function sonOlcumleriGuvenceyeAl(cevap: string, kayitlar: OlcumKaydi[]): string {
  if (!kayitlar.length) return cevap
  const c = duz(cevap)
  if (kayitlar.every((x) => geciyor(c, sayiKismi(x.metin)))) return cevap
  const kayit = `Kayıt — son ölçümler: ${sonOlcumMetni(kayitlar)}.`
  return c.trim() ? `${kayit}\n\n${cevap}` : kayit
}

/* ───────────────────────────── modelin cevabı kayıtla tutuyor mu ───────────────────────────── */

const BIRIM_RE: Record<OlcumAnahtari, string> = {
  kilo: '\\s*(?:kg|kilo|gr|gram|g)\\b', boy: '\\s*(?:cm|m)\\b', basCevresi: '\\s*cm\\b', vki: '\\s*kg\\s*/\\s*m', tansiyon: '\\s*/\\s*\\d{2,3}',
  ates: '\\s*(?:°|derece)', nabiz: '\\s*/\\s*dk', spo2: '\\s*%',
}
/** "9.8" ↔ "9,8"; boşluklar tek. */
const duz = (s: string) => String(s || '').replace(/(\d)\.(\d)/g, '$1,$2').replace(/\s+/g, ' ')
const sayiKismi = (metin: string) => (metin.match(/\d+(?:,\d+)?(?:\/\d+)?/) || [''])[0]
const geciyor = (cevap: string, sayi: string) => Boolean(sayi) && new RegExp(`(?<![\\d,/])${sayi.replace('/', '\\s*/\\s*')}(?![\\d,])`).test(cevap)
const YOK_DIYOR = /(kay[ıi]t|kayd[ıi]|ölç[üu]m|muayene|vizit)[^.\n]{0,60}(yok|bulamad|bulunm|görünm|rastlamad)|yaz[ıi]lmam[ıi][şs]|girilmemi[şs]|ölç[üu]lmemi[şs]/i
const TAHMIN_DIYOR = /tahm[iİ]n/i

/**
 * Model (Danış paneli) kanıtı gördükten sonra cevap verir; bu son denetim cevabın kayıtla tuttuğunu güvenceye alır:
 *   • kayıtlı değer varsa cevapta o değer geçmelidir — geçmiyorsa (model tahmin etti, "yazılmamış" dedi) cevap
 *     kayıttaki kesin cevapla DEĞİŞTİRİLİR; değerlendirme ya da ölçüme dayanan başka bir soruda (soru.kesin = false)
 *     kesin cevap modelin cevabının ÖNÜNE konur, cevap silinmez.
 *   • kayıt yoksa cevap bunu söylemelidir ve kayıtta olmayan bir değer ancak "tahmin" etiketiyle geçebilir.
 * Kayıtla tutan cevaba dokunulmaz.
 */
export function olcumCevabiniGuvenceyeAl(cevap: string, k: VizitOlcumKaniti): string {
  const kesin = vizitOlcumCevabi(k).ekran
  const c = duz(cevap)
  const kayitli = k.seri ? k.seri.flatMap((s) => Object.values(s.kayitlar)) : k.vizitler.flatMap((v) => v.kayitlar)
  // NOTYA-KORPUS-KALAN-01 (L-DANIS-SERI-2): a series the doctor asked for as values ("bütün muayenelerinde kilosu") is
  // the record's own TABLE on every surface. The model listing the same values as bullets used to pass the check
  // above unchanged, so the panel showed a list where chat showed the table.
  if (k.seri && kayitli.length && k.soru.kesin) return kesin
  if (kayitli.length) {
    if (kayitli.every((x) => geciyor(c, sayiKismi(x.metin)))) return cevap
    return !k.soru.kesin && c.trim() ? `${kesin}\n\n${cevap}` : kesin
  }
  const izinli = new Set(k.vizitler.flatMap((v) => v.yakin).map((y) => sayiKismi(y.metin)))
  const yabanci = k.soru.olcumler.some((o) => [...c.matchAll(new RegExp(`(\\d+(?:,\\d+)?)${BIRIM_RE[o]}`, 'gi'))].some((m) => !izinli.has(m[1])))
  if (YOK_DIYOR.test(cevap) && (!yabanci || TAHMIN_DIYOR.test(cevap))) return cevap
  return kesin
}
