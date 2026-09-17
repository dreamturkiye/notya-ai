/**
 * GOZ-CHAPTER — Hızlı protokol kartları: katarakt/GİL ön-op kontrol listesi, kuru göz / kontakt lens / alerjik konjonktivit,
 * pediatrik ambliyopi–şaşılık izlem köprüsü. Pure. Kontrol listeleri hekimin işaretlediği maddeleri sayar; doz yazılmaz,
 * GİL gücü hesaplanmaz (biyometri cihazı + hekim), ilaç sınıfı düzeyinde kalınır.
 */
import type { Dipnot } from '../protocols/sources'

// ---------- Katarakt / GİL ön-op ----------
export const KATARAKT_KONTROL: Array<{ kod: string; ad: string; zorunlu: boolean }> = [
  { kod: 'va_refraksiyon', ad: 'Düzeltilmiş görme keskinliği + refraksiyon (iki göz)', zorunlu: true },
  { kod: 'biyometri', ad: 'Biyometri: aksiyel uzunluk + keratometri (GİL gücü cihaz/hekim; Notya hesaplamaz)', zorunlu: true },
  { kod: 'gil_secimi', ad: 'GİL tipi ve gücü hekim tarafından seçildi', zorunlu: true },
  { kod: 'on_segment', ad: 'Biyomikroskopi: kornea, ön kamara derinliği, psödoeksfoliasyon, pupilla dilatasyonu', zorunlu: true },
  { kod: 'fundus_makula', ad: 'Dilate fundus / makula değerlendirmesi (gerekirse OCT)', zorunlu: true },
  { kod: 'gib', ad: 'GİB ölçümü', zorunlu: true },
  { kod: 'endotel', ad: 'Endotel sayımı (Fuchs / kornea şüphesi varsa)', zorunlu: false },
  { kod: 'alfa_bloker', ad: 'Alfa-1 bloker (ör. tamsulosin) sorgulandı — IFIS riski ekibe bildirildi', zorunlu: true },
  { kod: 'antikoagulan', ad: 'Antikoagülan / antiagregan kullanımı sorgulandı (kesme kararı ilgili hekimle)', zorunlu: true },
  { kod: 'dm_kontrol', ad: 'Diyabet varsa glisemi ve DR/DMÖ durumu değerlendirildi', zorunlu: false },
  { kod: 'onam', ad: 'Aydınlatılmış onam alındı (GİL tipi ve beklenti dahil)', zorunlu: true },
]
export function kataraktHazirlik(isaretli: Record<string, boolean>): { tamam: number; toplam: number; eksikZorunlu: string[]; hazir: boolean; dipnotlar: Dipnot[] } {
  const eksikZorunlu = KATARAKT_KONTROL.filter((m) => m.zorunlu && !isaretli[m.kod]).map((m) => m.ad)
  return {
    tamam: KATARAKT_KONTROL.filter((m) => isaretli[m.kod]).length, toplam: KATARAKT_KONTROL.length, eksikZorunlu, hazir: eksikZorunlu.length === 0,
    dipnotlar: [
      { ref: 'TOD', not: 'Ön-op değerlendirme maddeleri — TR klinik pratik; kurum protokolü hekim teyit eder' },
      { ref: 'SUT_244I', not: 'SGK sözleşmeli özel sağlık hizmeti sunucusu FAKO tarihini ≥2 gün önce sisteme kaydeder (SGK sistemi kurulana kadar uygulanmaz)' },
      { ref: 'SUT_EK3G', not: 'GİL SGK ödemesi EK-3/G listesine bağlı; monofokal/torik/multifokal kalemleri hekim/idare teyit eder' },
    ],
  }
}

// ---------- Ön segment hızlı protokoller ----------
export type OnSegmentProtokol = 'kuru_goz' | 'kontakt_lens' | 'alerjik_konjonktivit'
export interface ProtokolKart { id: OnSegmentProtokol; ad: string; sorgu: string[]; kirmiziBayrak: string[]; yaklasim: string[]; sgk: string[]; dipnotlar: Dipnot[] }

export const ON_SEGMENT_PROTOKOLLERI: ProtokolKart[] = [
  {
    id: 'kuru_goz', ad: 'Kuru göz',
    sorgu: ['Ekran süresi / çevre (klima, rüzgâr)', 'Kontakt lens', 'Sistemik ilaç (antihistaminik, antidepresan, isotretinoin)', 'Otoimmün öykü (Sjögren, RA)', 'Blefarit / meibomian bez disfonksiyonu bulgusu'],
    kirmiziBayrak: ['Görme azalması', 'Şiddetli ağrı veya fotofobi', 'Kornea ülseri / infiltrat', 'Tek taraflı kalıcı kızarıklık'],
    yaklasim: ['Suni gözyaşı (koruyucusuz tercih — hekim seçer)', 'Kapak hijyeni / sıcak kompres (MBD)', 'Çevresel düzenleme', 'Dirençli olguda anti-inflamatuvar sınıf (siklosporin) — hekim'],
    sgk: ['Siklosporin göz damlası: 1 yıl süreli göz uzmanı raporu ile, göz uzmanınca reçete (SUT 4.2.33.D)', 'Suni gözyaşı: göz uzmanı veya göz uzmanı raporuyla uzmanlar, etkilenen göz başına günde en fazla 7 damlaya kadar; aile hekimi raporsuz ayda en fazla 1 kutu, 1 yıl (SUT 4.2.33.D)'],
    dipnotlar: [{ ref: 'SUT_4233', not: '4.2.33.D — siklosporin ve suni gözyaşı reçete kuralları (birincil metin)' }, { ref: 'TOD', not: 'TOD Kornea birimi yaklaşımı — güncel doküman hekim teyit eder' }],
  },
  {
    id: 'kontakt_lens', ad: 'Kontakt lens ilişkili kırmızı göz',
    sorgu: ['Lens tipi ve kullanım süresi', 'Lensle uyuma / suya girme', 'Solüsyon ve kap hijyeni', 'Ağrı, fotofobi, akıntı'],
    kirmiziBayrak: ['Kornea infiltratı / ülser (mikrobiyal keratit şüphesi)', 'Şiddetli ağrı + fotofobi', 'Görme azalması', 'Akantamoeba şüphesi (suyla temas + orantısız ağrı)'],
    yaklasim: ['Lens kullanımı hemen bırakılır', 'Keratit şüphesinde aynı gün biyomikroskopi; kültür/kazıntı ve yoğun topikal antibiyotik sınıfı kararı hekimin', 'Lens ve kabı atılmaz — kültür için saklanabilir'],
    sgk: [],
    dipnotlar: [{ ref: 'TOD', not: 'Kontakt lens komplikasyonları — TR pratik; hekim teyit eder' }, { ref: 'KANSKI', not: 'Mikrobiyal keratit yaklaşımı — ders kitabı derinliği' }],
  },
  {
    id: 'alerjik_konjonktivit', ad: 'Alerjik konjonktivit',
    sorgu: ['Mevsimsel / sürekli', 'Kaşıntı baskın mı', 'Atopi (astım, egzama, rinit)', 'Kontakt lens', 'Çocukta vernal bulgular (papil, limbal)'],
    kirmiziBayrak: ['Kornea tutulumu (kalkan ülser, punktat)', 'Görme azalması', 'Uzun süreli steroid kullanımı öyküsü (GİB / katarakt)'],
    yaklasim: ['Alerjenden kaçınma, soğuk kompres, suni gözyaşı', 'Antihistaminik / mast hücre stabilizatörü (çift etkili) sınıfı — hekim seçer', 'Steroid yalnız hekim, kısa süre ve GİB izlemiyle'],
    sgk: [],
    dipnotlar: [{ ref: 'TOD', not: 'TOD Kornea / oküler alerji yaklaşımı — hekim teyit eder' }],
  },
]

// ---------- Pediatrik köprü (pediatri bölümünü çatallamaz) ----------
export type PediatrikTip = 'ambliyopi' | 'sasilik' | 'ambliyopi_sasilik' | 'refraktif'
export function pediatrikIzlem(g: { yasAy: number | null; tip: PediatrikTip | null; kapamaHekim: string | null; sonrakiKontrol: string | null; bugun: string }): { hatirlatmalar: string[]; gorevler: { kod: string; ad: string; due: string | null }[]; dipnotlar: Dipnot[] } {
  const hatirlatmalar: string[] = [], gorevler: { kod: string; ad: string; due: string | null }[] = []
  if (g.yasAy != null && g.yasAy < 216) {
    // SB Ulusal Görme Taraması Programı Genelgesi 2019/17 — yaş noktaları (ikincil özet üzerinden; kesme değerleri gömülmedi)
    if (g.yasAy <= 3) hatirlatmalar.push('0–3 ay: kırmızı refle + risk soruları (SB ulusal görme taraması)')
    if (g.yasAy >= 36 && g.yasAy <= 48) hatirlatmalar.push('36–48 ay: kırmızı refle + görme keskinliği taraması dönemi (SB)')
    if (g.yasAy >= 72 && g.yasAy <= 84) hatirlatmalar.push('6–7 yaş (1. sınıf): okul dönemi görme taraması (SB)')
  }
  if (g.tip) {
    if (!g.sonrakiKontrol) gorevler.push({ kod: 'ped_kontrol', ad: 'Ambliyopi/şaşılık izlem kontrol tarihini hekim belirlesin', due: null })
    else if (g.sonrakiKontrol <= g.bugun) gorevler.push({ kod: 'ped_kontrol', ad: `Ambliyopi/şaşılık kontrolü zamanı (${g.sonrakiKontrol})`, due: g.sonrakiKontrol })
    if ((g.tip === 'ambliyopi' || g.tip === 'ambliyopi_sasilik') && !g.kapamaHekim) hatirlatmalar.push('Kapama / penalizasyon rejimi kayıtlı değil — hekim yazar (saat/gün motor önermez)')
    hatirlatmalar.push('Pediatri takibi pediatri bölümünde kalır; burada yalnız göz izlem hatırlatması tutulur.')
  }
  return {
    hatirlatmalar, gorevler,
    dipnotlar: [
      { ref: 'SB_COCUK_IZLEM', not: 'SB Ulusal Görme Taraması Programı Genelgesi 2019/17: 0–3 ay, 36–48 ay, 6–7 yaş; ≤32 hf / ≤1500 g ROP muayenesi (ikincil özet) — sevk kesme değerleri doğrulanamadı, gömülmedi' },
      { ref: 'TOD', not: 'TOD Pediatrik Oftalmoloji ve Şaşılık birimi — üye erişimli; hekim teyit eder' },
      { ref: 'AAO_PPP_PED', not: 'Uluslararası derinlik' },
    ],
  }
}
