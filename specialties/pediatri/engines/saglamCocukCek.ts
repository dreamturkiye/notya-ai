/**
 * Sağlam çocuk çek listesi — yaşa özel hatırlatmalar.
 * Pencereler ve tarama kalemleri SB İzlem Protokolü 2018 (gelisimPlan); uydurma pencere yok.
 * Yalnız pediatrik bağlamda çağrılır — KD / kardiyoloji bu dosyayı import etmez, muayeneCekListesi kapılar.
 *
 * NOTYA-CEK-DOGRULA-02 (Dr. Gökhan, 2026-09-23): 1 aylık vizitte "D vitamini", "işitme taraması", "GİDR 6–9 ay",
 * "göbek bakımı" hep eksik çıkıyordu. Nedenleri: tarama kalemlerinin tek anahtarı kalem kodu ('dvit', 'gidr') idi —
 * klinik metinde hiç geçmez; vizitPlani hastanın kayıtları olmadan çağrılıyordu (kayıtlı tarama hiç "tamam" olmaz);
 * gelecekteki pencereler ('surekli') eksik sayılıyordu. Şimdi: gerçek Türkçe anahtarlar, hasta kayıtları, yalnız
 * şimdi vadesi gelen kalemler + her izlemde bakılanlar. Kapsam: 'vizit' bu muayenede yazılmalı; 'dosya' dosyanın
 * herhangi bir yerinde (önceki onaylı not, kayıt formu, tarama kaydı, ilaç listesi) varsa karşılanmış sayılır.
 */
import type { CekMadde } from '@/lib/doktor/muayeneCekListesi'
import { vizitPlani, type KalemKod, type TaramaKalemi, type VizitGirdisi } from './gelisimPlan'

const m = (id: string, etiket: string, grup: CekMadde['grup'], anahtarlar: string[], kapsam: CekMadde['kapsam'] = 'vizit'): CekMadde => ({
  id, etiket, grup, anahtarlar, kapsam,
})

const KALCA = ['kalca', 'ortolani', 'barlow']
const GOBEK = ['gobek', 'kordon', 'umbilik']

/** İlk 10 gün — NTP, göbek, sarılık, fizyolojik kilo. */
const YENIDOGAN: CekMadde[] = [
  m('sc_gobek', 'Göbek kordonu / göbek bakımı', 'fizik', GOBEK, 'dosya'),
  m('sc_sarilik', 'Sarılık (ikter)', 'fizik', ['sarilik', 'ikter', 'bilirubin']),
  m('sc_kilo_kaybi', 'Doğum kilosuna göre kilo (fizyolojik kayıp)', 'olcum', ['kilo kayb', 'dogum kilo']),
  m('sc_ntp', 'Yenidoğan metabolik tarama (NTP) sonucu', 'anamnez', ['ntp', 'metabolik tarama', 'topuk', 'neonatal tarama', 'yenidogan tarama'], 'dosya'),
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', KALCA),
  m('sc_fontanel', 'Fontanel', 'fizik', ['fontanel']),
]

/** 11–59. gün — göbek düştü mü, sarılık geriledi mi, kalça. */
const ERKEN_BEBEK: CekMadde[] = [
  m('sc_gobek', 'Göbek düştü mü / göbek bakımı', 'fizik', GOBEK, 'dosya'),
  m('sc_sarilik', 'Sarılık geriledi mi', 'fizik', ['sarilik', 'ikter']),
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', KALCA),
  m('sc_fontanel', 'Fontanel', 'fizik', ['fontanel']),
  m('sc_ntp', 'NTP sonucu (kayıtta yoksa sor)', 'anamnez', ['ntp', 'metabolik tarama', 'topuk', 'neonatal tarama', 'yenidogan tarama'], 'dosya'),
]

const BEBEK_KALCA: CekMadde[] = [
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', KALCA),
  m('sc_fontanel', 'Fontanel (kapanma)', 'fizik', ['fontanel']),
]

const EK_GIDA: CekMadde[] = [
  m('sc_ek_gida', 'Ek gıda / tamamlayıcı beslenme', 'anamnez', [
    'ek gida', 'tamamlayici', 'mama', 'püre', 'pure', 'sofra', 'sofra gida', 'gida', 'gidalar',
    'sut', 'protein', 'et', 'sebze', 'meyve', 'yemek', 'yiyor', 'beslenme', 'kati gida',
  ]),
]

const YURUME: CekMadde[] = [
  m('sc_yurume', 'Motor: oturma / emekleme / yürüme', 'fizik', ['yurume', 'emekleme', 'oturma']),
]

const DIL: CekMadde[] = [
  m('sc_dil', 'Dil / iletişim (kelime, işaret)', 'fizik', ['dil', 'kelime', 'konusma']),
]

const OKUL: CekMadde[] = [
  m('sc_okul', 'Okul / öğrenme / davranış', 'anamnez', ['okul', 'ogrenme', 'davranis']),
  m('sc_gorme_okul', 'Görme / işitme (okul çağı)', 'fizik', ['gorme', 'isitme', 'tahta']),
]

const ERGEN: CekMadde[] = [
  m('sc_ergen', 'Ergenlik / psikososyal (hekim sorar)', 'anamnez', ['ergen', 'okul', 'arkadas', 'uyku']),
]

/**
 * Tarama kalemlerinin klinik metinde aranacak Türkçe karşılıkları (trAramaNormalize ile, kelime başı eşleşme).
 * Kapsam: bir kez yapılan / süregiden kalemler 'dosya'; pencereli taramalar (GİDR, otizm, görme, Hb) o pencereye
 * ait olduğundan yalnız bu notta ya da yapısal kayıtta (vizitPlani 'tamam') karşılanır — eski pencerenin notu saymaz.
 */
export const TARAMA_ANAHTARLARI: Record<KalemKod, { anahtarlar: string[]; kapsam: NonNullable<CekMadde['kapsam']>; grup: CekMadde['grup'] }> = {
  isitme: { anahtarlar: ['isitme tarama', 'isitme testi', 'isitme test', 'abr', 'aabr', 'oae', 'teoae', 'odyolo'], kapsam: 'dosya', grup: 'anamnez' },
  // Risk faktörü gözden geçirmesi çoğunlukla perinatal öyküden yapılır; işitme durumu (tarama / odyoloji) dosyada
  // belgelendiyse karşılanmış sayılır.
  isitme_risk: { anahtarlar: ['isitme risk', 'risk faktor', 'isitme kaybi', 'isitme tarama', 'isitme testi', 'odyolo', 'abr', 'oae'], kapsam: 'dosya', grup: 'anamnez' },
  kirmizi_refle: { anahtarlar: ['kirmizi refle', 'red refle', 'fundus refle'], kapsam: 'vizit', grup: 'fizik' },
  gorme: { anahtarlar: ['gorme', 'lea sembol', 'snellen'], kapsam: 'vizit', grup: 'fizik' },
  rop: { anahtarlar: ['rop', 'prematur retinopati', 'retinopati'], kapsam: 'dosya', grup: 'fizik' },
  otizm: { anahtarlar: ['m-chat', 'mchat', 'otizm'], kapsam: 'vizit', grup: 'fizik' },
  gidr: { anahtarlar: ['gidr', 'gelisim degerlendir', 'gelisim taramasi', 'gelisim testi', 'denver'], kapsam: 'vizit', grup: 'fizik' },
  gelisim_testi: { anahtarlar: ['gelisim birim', 'cocuk gelisim', 'standart gelisim', 'bayley'], kapsam: 'dosya', grup: 'kapanis' },
  dvit: { anahtarlar: ['d vitamin', 'vitamin d', 'd vit', 'd3 vitamin', 'kolekalsiferol', '400 iu', '400 unite'], kapsam: 'dosya', grup: 'anamnez' },
  demir: { anahtarlar: ['demir', 'ferr'], kapsam: 'dosya', grup: 'anamnez' },
  hb: { anahtarlar: ['hb', 'hemoglobin', 'htc', 'hct', 'hematokrit', 'hemogram', 'tam kan'], kapsam: 'vizit', grup: 'anamnez' },
}

/** Bu vizitte listelenecek mi: vadesi gelmiş (şimdi / gecikti / dikkat) ya da gerçekten her izlemde bakılan. */
export function taramaBuVizitte(k: Pick<TaramaKalemi, 'durum' | 'pencere'>): boolean {
  if (k.durum === 'simdi' || k.durum === 'gecikti' || k.durum === 'dikkat') return true
  return k.durum !== 'tamam' && k.pencere.startsWith('her izlemde')
}

/** Hastanın kayıtları — vizitPlani'nin tarama / M-CHAT / GİDR / seans / doğum bilgisi girdileri. */
export type SaglamCocukKayitlari = Omit<VizitGirdisi, 'dogumIso' | 'bugunIso'>

function taramaCek(dogumIso: string, bugunIso: string, kayitlar?: SaglamCocukKayitlari): CekMadde[] {
  const p = vizitPlani({ ...(kayitlar || {}), dogumIso, bugunIso })
  const liste: CekMadde[] = []
  if (p.simdikiVizit) {
    liste.push(m(
      `sc_izlem_${p.simdikiVizit.id}`,
      `Sağlam çocuk: ${p.simdikiVizit.etiket} izlemi — bu vizite özgü kontroller`,
      'anamnez',
      ['izlem', 'saglam cocuk'],
    ))
  }
  for (const k of p.kalemler) {
    if (!taramaBuVizitte(k)) continue
    const t = TARAMA_ANAHTARLARI[k.kod]
    const etiket =
      k.kod === 'gidr' && p.preterm
        ? `${k.ad} (prematüre: düzeltilmiş yaş)`
        : (k.durum === 'gecikti' || k.durum === 'dikkat') && k.ne
          ? `${k.ad} — ${k.ne.length > 90 ? `${k.ne.slice(0, 87)}…` : k.ne}`
          : k.ad
    liste.push(m(`sc_tarama_${k.kod}`, etiket, t.grup, t.anahtarlar, t.kapsam))
  }
  return liste
}

/**
 * NOTYA-CEK-HASTA-01 — dosyadaki riskler (prematüre, M-CHAT, GİDR sevk).
 * Yaş bandı / SB vizit kalemlerinden ayrı: hastaya özel hatırlatma.
 */
export function hastaRiskCekMaddeleri(
  kayitlar?: SaglamCocukKayitlari | null,
  dogumIso?: string | null,
  bugunIso: string = new Date().toISOString(),
): CekMadde[] {
  if (!kayitlar) return []
  const liste: CekMadde[] = []
  const gh = kayitlar.gebelikHaftasi
  const kilo = kayitlar.dogumKiloGr
  const preterm = gh != null && gh < 37
  const dusukKilo = kilo != null && kilo < 2500
  if (preterm || dusukKilo) {
    const parca = [
      gh != null ? `${Number.isInteger(gh) ? gh : gh.toFixed(1)} hf` : null,
      kilo != null ? `${Math.round(kilo)} g` : null,
    ].filter(Boolean).join(', ')
    const yasGun = dogumIso && /^\d{4}-\d{2}-\d{2}/.test(dogumIso)
      ? yasGunFn(dogumIso, bugunIso)
      : -1
    const gelisimNotu = yasGun >= 0 && yasGun < Math.round(3 * 365.25)
      ? 'gelişimi düzeltilmiş yaşla değerlendir; nörogelişim / erken müdahale öyküsünü sor'
      : 'prematüre / DDA öyküsünü muayenede dikkate al'
    liste.push(m(
      'sc_risk_prematur',
      `Dosya: prematüre / düşük doğum ağırlığı${parca ? ` (${parca})` : ''} — ${gelisimNotu}`,
      'anamnez',
      ['prematur', 'erken dogum', 'duzeltilmis yas', 'dusuk dogum', 'dda'],
      'dosya',
    ))
  }
  const sonM = (kayitlar.mchat || []).slice().sort((a, b) => a.tarih.localeCompare(b.tarih)).pop()
  if (sonM && (sonM.risk === 'orta' || sonM.risk === 'yuksek')) {
    liste.push(m(
      'sc_risk_mchat',
      `Dosya: son M-CHAT-R/F ${sonM.risk === 'yuksek' ? 'yüksek' : 'orta'} risk (${sonM.tarih}) — ileri değerlendirme / sevk`,
      'fizik',
      ['m-chat', 'mchat', 'otizm'],
      'dosya',
    ))
  }
  if ((kayitlar.gidr || []).some((x) => x.sevk)) {
    liste.push(m(
      'sc_risk_gidr_sevk',
      'Dosya: GİDR’de sevk önerisi var — çocuk gelişim birimi / standart test takibi',
      'kapanis',
      ['gidr', 'gelisim birim', 'sevk'],
      'dosya',
    ))
  }
  return liste
}

function yasGunFn(dogumIso: string, bugunIso: string): number {
  const a = Date.parse(dogumIso.slice(0, 10))
  const b = Date.parse(bugunIso.slice(0, 10))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return -1
  return Math.floor((b - a) / 86_400_000)
}

function yasGun(dogumIso: string, bugunIso: string): number {
  return yasGunFn(dogumIso, bugunIso)
}

function yasBandiEk(gun: number): CekMadde[] {
  if (gun < 0) return []
  if (gun <= 10) return YENIDOGAN
  if (gun <= 59) return ERKEN_BEBEK
  if (gun <= 180) return [...BEBEK_KALCA, ...EK_GIDA]
  if (gun <= 394) return [...BEBEK_KALCA, ...EK_GIDA, ...YURUME]
  if (gun <= 760) return [...YURUME, ...DIL]
  if (gun < Math.round(6 * 365.25)) return [...DIL, ...OKUL]
  if (gun < Math.round(11 * 365.25)) return OKUL
  return ERGEN
}

/** Pediatrik bağlam + kayıtlı doğum tarihi varken yaşa özel hatırlatmalar. Doğum yoksa boş — generic PEDIATRI listesi kalır. */
export function saglamCocukCekMaddeleri(
  dogumIso: string | null | undefined,
  bugunIso: string = new Date().toISOString(),
  kayitlar?: SaglamCocukKayitlari,
): CekMadde[] {
  const iso = String(dogumIso || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return []
  const gun = yasGun(iso, bugunIso)
  if (gun < 0 || gun > Math.round(21 * 365.25)) return []
  const gorulen = new Set<string>()
  const birlesik = [
    ...hastaRiskCekMaddeleri(kayitlar, iso, bugunIso),
    ...taramaCek(iso, bugunIso, kayitlar),
    ...yasBandiEk(gun),
  ]
  return birlesik.filter((x) => {
    if (gorulen.has(x.id)) return false
    gorulen.add(x.id)
    return true
  })
}
