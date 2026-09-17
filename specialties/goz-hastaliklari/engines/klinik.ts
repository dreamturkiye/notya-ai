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
      { ref: 'SUT_EK3G', not: 'GİL: EK-3/G kodları (G10090 standart/monofokal sınıfı, G10100 multifokal/akomodatif, G10105 özel kaplamalı, G10110 torik, G10115 ilgili kalem) — güncel bedel hekim/idare; Notya fiyat yazmaz' },
    ],
  }
}

/** GOZ-EK3G — SGK EK-3/G göz içi lens kodları (sgk.gov.tr EK-3/G PDF özet, 2026-09-17 doğrulama). Bedel/fiyat gömülmez. */
export const GIL_EK3G_KALEMLERI: Array<{ kod: string; ad: string; not: string }> = [
  { kod: 'G10090', ad: 'Standart / monofokal sınıfı GİL', not: 'SGK’nın klasik katarakt GİL kalemi; güncel bedel idare/hekim' },
  { kod: 'G10100', ad: 'Multifokal ve akomodatif lensler', not: 'EK-3/G listesinde; ödeme koşulları ve fark hekim/idare' },
  { kod: 'G10105', ad: 'Özel kaplamalı lens', not: 'EK-3/G listesinde; endikasyon/bedel hekim/idare' },
  { kod: 'G10110', ad: 'Torik lensler', not: 'EK-3/G listesinde; endikasyon/bedel hekim/idare' },
  { kod: 'G10115', ad: 'İlgili GİL kalemi (EK-3/G)', not: 'Listedeki komşu kalem; güncel satır metni hekim/idare' },
]

export function gilSgkKontrol(gilTipiHekim: string | null): { kalem: typeof GIL_EK3G_KALEMLERI[number] | null; uyari: string[]; dipnotlar: Dipnot[] } {
  const tip = String(gilTipiHekim || '').toLowerCase()
  const map: Record<string, string> = { monofokal: 'G10090', torik: 'G10110', multifokal: 'G10100', edof: 'G10100', diger: '' }
  const kod = map[tip] || ''
  const kalem = GIL_EK3G_KALEMLERI.find((k) => k.kod === kod) || null
  const uyari: string[] = []
  if (tip === 'multifokal' || tip === 'edof') uyari.push('Multifokal/akomodatif (G10100): SGK farkı / ödeme koşulları idareyle teyit — Notya bedel yazmaz')
  if (tip === 'torik') uyari.push('Torik (G10110): endikasyon ve ödeme idare/hekim teyidi')
  if (!tip) uyari.push('GİL tipi hekim seçimi bekleniyor')
  return {
    kalem,
    uyari,
    dipnotlar: [{ ref: 'SUT_EK3G', not: 'EK-3/G GİL kodları doğrulandı (G10090–G10115 sınıfı); fiyat listesi değişkendir, gömülmez' }],
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
/** GOZ-SB-GORME — SB Ulusal Görme Taraması Rehberi 02.08.2019 (birincil PDF) sevk eşikleri. */
export type PediatrikTip = 'ambliyopi' | 'sasilik' | 'ambliyopi_sasilik' | 'refraktif'
export type SbSevkNeden =
  | 'va_esik'
  | 'iki_goz_2_sira'
  | 'sasilik_nistagmus'
  | 'kirmizi_refle'
  | 'rop'
  | 'acil_konjenital'
  | 'risk_grubu'

export function sbGormeSevk(g: {
  yasAy: number | null
  /** ondalık VA sağ/sol (LEA/Snellen ondalık); null = ölçülmedi */
  vaSag: number | null
  vaSol: number | null
  sasilikVeyaNistagmus?: boolean
  kirmiziRefleAnormal?: boolean
  prematüreRiskRop?: boolean // ≤32 hf veya ≤1500 g
  konjenitalSuphe?: boolean // RB / konjenital glokom / katarakt
  riskGrubu?: boolean // SB risk listesi (CP, Down, aile öyküsü, …)
}): { sevk: boolean; nedenler: Array<{ kod: SbSevkNeden; metin: string }>; esikNotu: string | null; dipnotlar: Dipnot[] } {
  const nedenler: Array<{ kod: SbSevkNeden; metin: string }> = []
  let esikNotu: string | null = null
  const y = g.yasAy
  if (g.prematüreRiskRop) nedenler.push({ kod: 'rop', metin: '≤32 hf veya ≤1500 g: 4. haftada ROP için göz muayenesine sevk (SB 2019/17)' })
  if (g.konjenitalSuphe) nedenler.push({ kod: 'acil_konjenital', metin: 'Retinoblastom / konjenital glokom / konjenital katarakt şüphesi veya aile öyküsü → acil göz sevki' })
  if (g.sasilikVeyaNistagmus) nedenler.push({ kod: 'sasilik_nistagmus', metin: 'Şaşılık veya nistagmus → göz hastalıkları sevki' })
  if (g.kirmiziRefleAnormal) nedenler.push({ kod: 'kirmizi_refle', metin: 'Kırmızı refle yok / beyaz-donuk / asimetrik → sevk' })
  if (g.riskGrubu) nedenler.push({ kod: 'risk_grubu', metin: 'SB risk grubu (CP, Down, ailede ambliyopi/yüksek numaralı gözlük, metabolik, …) → sevk' })

  if (y != null && g.vaSag != null && g.vaSol != null) {
    const diffLines = Math.abs(Math.log10(Math.max(g.vaSag, 0.01)) - Math.log10(Math.max(g.vaSol, 0.01))) / 0.1 // ~0.1 logMAR ≈ 1 sıra
    // 36–48 ay / 3–5 yaş: her göz ≥0,5; 2 sıra fark → sevk (Rehber EK-2 / EK-6)
    if (y >= 36 && y < 72) {
      esikNotu = '36–48 ay / 3–5 yaş: her gözde VA ≥0,5; gözler arası ≥2 sıra fark → sevk (SB Rehber 2019)'
      if (g.vaSag < 0.5 || g.vaSol < 0.5) nedenler.push({ kod: 'va_esik', metin: `VA eşik altı (0,5): sağ ${g.vaSag}, sol ${g.vaSol}` })
      if (diffLines >= 2) nedenler.push({ kod: 'iki_goz_2_sira', metin: 'İki göz arasında ≥2 sıra görme farkı' })
    }
    // 6–10 yaş / 1. sınıf: her göz ≥0,8 normal; sevk ≤0,7 veya 2 sıra (EK-3 / EK-6)
    if (y >= 72 && y <= 120) {
      esikNotu = '6–10 yaş / 1. sınıf: normal ≥0,8; sevk VA ≤0,7 veya ≥2 sıra fark (SB Rehber 2019)'
      if (g.vaSag <= 0.7 || g.vaSol <= 0.7) nedenler.push({ kod: 'va_esik', metin: `VA ≤0,7: sağ ${g.vaSag}, sol ${g.vaSol}` })
      if (diffLines >= 2) nedenler.push({ kod: 'iki_goz_2_sira', metin: 'İki göz arasında ≥2 sıra görme farkı' })
    }
  }

  return {
    sevk: nedenler.length > 0,
    nedenler,
    esikNotu,
    dipnotlar: [{ ref: 'SB_COCUK_IZLEM', not: 'SB Ulusal Görme Taraması Rehberi 02.08.2019 (birincil PDF): EK-2/EK-3/EK-6 sevk eşikleri gömüldü' }],
  }
}

export function pediatrikIzlem(g: { yasAy: number | null; tip: PediatrikTip | null; kapamaHekim: string | null; sonrakiKontrol: string | null; bugun: string; vaSag?: number | null; vaSol?: number | null; sasilikVeyaNistagmus?: boolean }): { hatirlatmalar: string[]; gorevler: { kod: string; ad: string; due: string | null }[]; sevk: ReturnType<typeof sbGormeSevk>; dipnotlar: Dipnot[] } {
  const hatirlatmalar: string[] = [], gorevler: { kod: string; ad: string; due: string | null }[] = []
  if (g.yasAy != null && g.yasAy < 216) {
    if (g.yasAy <= 3) hatirlatmalar.push('0–3 ay: kırmızı refle + risk soruları (SB ulusal görme taraması)')
    if (g.yasAy >= 36 && g.yasAy <= 48) hatirlatmalar.push('36–48 ay: kırmızı refle + LEA görme keskinliği (SB); eşik her göz ≥0,5 / ≥2 sıra fark → sevk')
    if (g.yasAy >= 72 && g.yasAy <= 84) hatirlatmalar.push('6–7 yaş (1. sınıf): LEA/Snellen (SB); normal ≥0,8; sevk ≤0,7 veya ≥2 sıra fark')
  }
  if (g.tip) {
    if (!g.sonrakiKontrol) gorevler.push({ kod: 'ped_kontrol', ad: 'Ambliyopi/şaşılık izlem kontrol tarihini hekim belirlesin', due: null })
    else if (g.sonrakiKontrol <= g.bugun) gorevler.push({ kod: 'ped_kontrol', ad: `Ambliyopi/şaşılık kontrolü zamanı (${g.sonrakiKontrol})`, due: g.sonrakiKontrol })
    if ((g.tip === 'ambliyopi' || g.tip === 'ambliyopi_sasilik') && !g.kapamaHekim) hatirlatmalar.push('Kapama / penalizasyon rejimi kayıtlı değil — hekim yazar (saat/gün motor önermez)')
    hatirlatmalar.push('Pediatri takibi pediatri bölümünde kalır; burada yalnız göz izlem hatırlatması tutulur.')
  }
  const sevk = sbGormeSevk({
    yasAy: g.yasAy,
    vaSag: g.vaSag ?? null,
    vaSol: g.vaSol ?? null,
    sasilikVeyaNistagmus: g.sasilikVeyaNistagmus || g.tip === 'sasilik' || g.tip === 'ambliyopi_sasilik',
  })
  if (sevk.esikNotu) hatirlatmalar.push(sevk.esikNotu)
  for (const n of sevk.nedenler) hatirlatmalar.push(`Sevk: ${n.metin}`)
  return {
    hatirlatmalar, gorevler, sevk,
    dipnotlar: [
      ...sevk.dipnotlar,
      { ref: 'TOD', not: 'TOD Pediatrik Oftalmoloji ve Şaşılık birimi — üye erişimli ayrıntı hekim teyit eder; SB eşikleri birincil' },
      { ref: 'AAO_PPP_PED', not: 'Uluslararası derinlik' },
    ],
  }
}
