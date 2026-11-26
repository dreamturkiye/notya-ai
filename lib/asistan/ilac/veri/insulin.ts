/**
 * İnsülinler — ILAC-TABLOSU-INSULIN (Kaan, 2026-11-25: "Fix the Levemir drug-table in order to provide the most accurate
 * and up to date information").
 *
 * Before this file the table carried ONE insulin (glarjin). Humalog / NovoRapid / Tresiba resolved to nothing, and
 * "Levemir" fuzzy-matched levetirasetam (an antiepileptic) through its brand "Levemax" — that wrong molecule then reached
 * the interaction check. Every insulin and insulin combination found on the Turkish market (TİTCK KÜB + ilacrehberi /
 * ilacabak market listings, checked 2026-11-25) now has its own row: brand → etken madde → ATC → insülin türü.
 *
 * Sources and check dates per entry: docs/kaynak/ILAC-TABLOSU-INSULIN.md. Rules kept from tipler.ts:
 *   • `kub()` only where the TİTCK KÜB PDF itself was read; KÜB text read on ilacrehberi (TİTCK host unreachable) is `literatur()`.
 *   • No `pediatrik` block: insulin is dosed by glucose, never mg/kg; the free-text line says that.
 *   • A brand whose Turkish market status could not be confirmed still RESOLVES to its molecule (patients and colleagues
 *     abroad say the name) and carries a `markaDurumu` line saying exactly what was and was not verified.
 *   • Insulin ↔ insulin never fires an interaction (basal-bolus is the standard regimen); the class lists below name the
 *     NON-insulin partners from the KÜB §4.5 text instead of the broad 'Antidiyabetik' label.
 */
import { kub, literatur } from '../kaynak'
import type { Etkilesim, PiyasaDurumu, TürkishDrug } from '../tipler'

/** KÜB §4.5, common to every insulin KÜB read for this file (Humalog, NovoRapid, Levemir, Tresiba, Insulatard, Humulin R, Glarin). */
const INSULIN_ETKILESIM: readonly Etkilesim[] = [
  { ile: 'Beta blokör', siddet: 'ciddi', not: 'Hipoglisemi belirtilerini (taşikardi, tremor) maskeleyebilir ve insülin ihtiyacını değiştirebilir; diyabetikte kan şekeri yakın izlenmeli (KÜB §4.5).' },
  { ile: 'Oral antidiyabetik', siddet: 'orta', not: 'İnsülin ihtiyacını azaltır; kombinasyonda hipoglisemi riski artar, insülin dozu gözden geçirilmeli (KÜB §4.5).' },
  { ile: 'GLP-1 reseptör agonisti', siddet: 'orta', not: 'İnsülin ihtiyacını azaltır; GLP-1 RA eklenirken hipoglisemi açısından insülin dozu gözden geçirilmeli (KÜB §4.5).' },
  { ile: 'ACE inhibitörü', siddet: 'orta', not: 'İnsülin ihtiyacını azaltabilir; hipoglisemi riski artar (KÜB §4.5).' },
  { ile: 'MAO inhibitörü', siddet: 'orta', not: 'İnsülin ihtiyacını azaltabilir; hipoglisemi riski artar (KÜB §4.5).' },
  { ile: 'Salisilat', siddet: 'orta', not: 'Kan şekerini düşürücü etkiyi artırabilir; yüksek dozda hipoglisemi riski (KÜB §4.5).' },
  { ile: 'Fluoksetin', siddet: 'orta', not: 'Kan şekerini düşürücü etkiyi ve hipoglisemi eğilimini artırabilir (KÜB §4.5).' },
  { ile: 'Kortikosteroid', siddet: 'orta', not: 'İnsülin ihtiyacını artırır; steroid başlanınca/kesilince insülin dozu gözden geçirilmeli (KÜB §4.5).' },
  { ile: 'Tiyazid diüretik', siddet: 'orta', not: 'İnsülin ihtiyacını artırabilir; kan şekeri izlenmeli (KÜB §4.5).' },
  { ile: 'Beta-2 agonist', siddet: 'orta', not: 'Sempatomimetikler (salbutamol, terbutalin) insülin ihtiyacını artırabilir (KÜB §4.5).' },
  { ile: 'Tiroid hormonu', siddet: 'orta', not: 'İnsülin ihtiyacını artırabilir; levotiroksin dozu değişince kan şekeri izlenmeli (KÜB §4.5).' },
  { ile: 'Kombine oral kontraseptif', siddet: 'orta', not: 'Östrojen/progestojen insülin ihtiyacını artırabilir (KÜB §4.5).' },
  { ile: 'Alkol', siddet: 'ciddi', not: 'İnsülinin hipoglisemik etkisini artırabilir veya azaltabilir; özellikle gece hipoglisemisi riski (KÜB §4.5).' },
]

/** Insulin + a GLP-1 RA in one pen (Soliqua): never add another GLP-1 RA or another basal insulin on top. */
const KOMBINASYON_ETKILESIM: readonly Etkilesim[] = [
  ...INSULIN_ETKILESIM.filter((e) => e.ile !== 'GLP-1 reseptör agonisti'),
  { ile: 'GLP-1 reseptör agonisti', siddet: 'ciddi', not: 'Ürün zaten bir GLP-1 reseptör agonisti içerir; ikinci bir GLP-1 RA ile birlikte kullanılmaz (KÜB §4.2).' },
  { ile: 'Uzun etkili insülin', siddet: 'ciddi', not: 'Ürün zaten bazal insülin içerir; başka bir bazal insülinle birlikte kullanılmaz — geçişte önceki bazal insülin kesilir (KÜB §4.2).' },
]

/** Ryzodeg contains a basal insulin (degludek): a second basal insulin on top is a duplication. */
const BAZAL_KARISIM_ETKILESIM: readonly Etkilesim[] = [
  ...INSULIN_ETKILESIM,
  { ile: 'Uzun etkili insülin', siddet: 'ciddi', not: 'Ürün zaten bazal insülin (degludek) içerir; başka bir bazal insülinle birlikte kullanılmaz.' },
]

const serbest = (l: readonly Etkilesim[]) => l.map((e) => e.ile)

const PEDIATRIK_SATIR = 'Pediatrik doz kan glukozuna göre bireyselleştirilir — mg/kg olarak ifade edilmez'
const KONTROL = '2026-11-25'
const KONTRENDIKASYON = (etken: string) => [`${etken} veya yardımcı maddelere aşırı duyarlılık`, 'Hipoglisemi']
const GEBELIK_ANALOG = 'Gebelikte insülin tercih edilen tedavidir; doz gereksinimi trimesterlere göre değişir, yakın glukoz izlemi gerekir.'
const EMZIRME = 'Emzirme döneminde kullanılabilir; insülin dozu ve diyet ayarı gerekebilir.'

const ILACREHBERI_A10AE = 'https://www.ilacrehberi.com/s/a10ae/6/'
const ILACREHBERI_A10AD30 = 'https://www.ilacrehberi.com/s/a10ad30/6/'
const ILACABAK_NOVO = 'https://www.ilacabak.com/firmagoster.php?Id=4728'

const BULUNAMADI = `Türkiye piyasa listelerinde (ilacrehberi, ilacabak) bulunamadı (${KONTROL}); ad doğru moleküle çözülür, Türkiye'de reçetelenebilirliği ayrıca teyit edilmeli.`

/** Novo Nordisk ends Levemir production. Türkiye-specific TİTCK decision not found — said plainly, never guessed. */
const LEVEMIR_DURUMU: PiyasaDurumu = {
  durum: 'cekiliyor',
  metin:
    'Novo Nordisk Levemir üretimini sonlandırıyor (portföy konsolidasyonu, güvenlik/kalite nedeni değil): ABD\'de 31.12.2024\'te tamamen kalktı; ' +
    'İngiltere, İrlanda ve Avustralya\'da arz Aralık 2026 sonuna kadar. Türkiye\'de ' + KONTROL + ' itibarıyla ilacrehberi/ilacabak "piyasada var" ' +
    'gösteriyor (fiyat güncellemesi 21.11.2026); Türkiye\'ye özgü TİTCK çekilme duyurusu bulunamadı. Hasta için başka bir bazal insüline geçiş planı hekimle yapılmalı.',
  kontrol: KONTROL,
  kaynak:
    'Novo Nordisk UK/MHRA/DHSC arz bildirimi (Ekim 2025); PharmExec 14.11.2023 (ABD); ilacabak LEVEMIR FLEXPEN kaydı (21.11.2026); ilacrehberi A10AE listesi',
}

export const INSULIN: Record<string, TürkishDrug> = {
  insulinGlarjin: {
    name: 'İnsülin glarjin',
    brand: ['Lantus', 'Toujeo', 'Basaglar', 'Glarin', 'Abasaglar', 'Glaritus', 'Semglee', 'Basalog'],
    dose: 'Günde bir kez subkutan, her gün aynı saatte. Doz kan glukozuna göre bireysel titre edilir. Toujeo 300 U/mL; Lantus/Basaglar/Glarin 100 U/mL — ünite sayısı ürüne özgüdür, ürün değişiminde doz yeniden titre edilir.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk çözelti (kalem/flakon)',
    sgkCovered: true,
    category: 'Uzun etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Uzun etkili insülin', 'Bazal insülin'],
    atc: 'A10AE04',
    insulinTuru: 'bazal',
    markaDurumu: {
      Lantus: `Piyasada (Sanofi, Lantus SoloStar 100 U/mL) — ilacrehberi ${KONTROL}`,
      Toujeo: `Piyasada (Sanofi, Toujeo SoloStar 300 U/mL) — ilacrehberi ${KONTROL}`,
      Basaglar: `Piyasada (Lilly, Basaglar KwikPen 100 U/mL; biyobenzer glarjin) — ilacrehberi ${KONTROL}`,
      Glarin: `Piyasada (Koçak Farma, 100 U/mL kalem; biyobenzer glarjin, ruhsat 2016/483) — ilacrehberi KÜB + liste ${KONTROL}`,
      Abasaglar: 'AB\'deki adı; Türkiye\'de aynı ürün Basaglar adıyla satılır.',
      Glaritus: `Ruhsatlı (Onko), "piyasada yok" — ilacrehberi ${KONTROL}`,
      Semglee: BULUNAMADI,
      Basalog: BULUNAMADI,
    },
    contraindications: KONTRENDIKASYON('İnsülin glarjin'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { metin: GEBELIK_ANALOG },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'Diğer insülinlerle KARIŞTIRILMAZ ve sulandırılmaz. Ünite sayısı ürüne özgüdür — marka değişiminde doz yeniden titre edilmelidir.',
    kaynak: kub('LANTUS SOLOSTAR 100 U/ML S.C. ENJEKSİYONLUK ÇÖZELTİ (onay 12/08/2026)', 'https://titck.gov.tr/storage/Archive/2026/kubKtAttachments/Ekek4kubtemiz_21_08_2026.pdf'),
  },

  insulinDetemir: {
    name: 'İnsülin detemir',
    brand: ['Levemir'],
    dose: 'Subkutan. Oral antidiyabetik veya GLP-1 RA ile birlikte günde tek doz; bazal-bolus rejiminde günde bir ya da iki kez. Doz kan glukozuna göre bireysel titre edilir.',
    pediatricDose: `${PEDIATRIK_SATIR}. KÜB: 1 yaş ve üzeri çocuk ve adolesanlarda kullanılabilir; 1 yaş altında güvenlilik/etkililik kanıtlanmamıştır.`,
    form: 'Subkutan enjeksiyonluk çözelti (FlexPen kalem 100 U/mL)',
    sgkCovered: true,
    category: 'Uzun etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Uzun etkili insülin', 'Bazal insülin'],
    atc: 'A10AE05',
    insulinTuru: 'bazal',
    piyasaDurumu: LEVEMIR_DURUMU,
    markaDurumu: { Levemir: `Levemir FlexPen 100 U/mL (Novo Nordisk) — üretimi sonlandırılıyor; ayrıntı piyasaDurumu satırında (${KONTROL}).` },
    contraindications: KONTRENDIKASYON('İnsülin detemir'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Klinik olarak gerekliyse gebelikte kullanılabilir; 4.500\'ü aşkın gebelik sonucunda malformasyon riskinde artış görülmemiştir. Yakın glukoz izlemi gerekir (KÜB §4.6).' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'LEVETİRASETAM (Keppra, Levemax — antiepileptik) İLE KARIŞTIRILMAMALIDIR. Diğer insülinlerle karıştırılmaz; intravenöz uygulanmaz.',
    kaynak: kub('LEVEMIR FlexPen 100 U/mL (ruhsat 117/41; TİTCK e-imza 14.09.2021)', 'https://titck.gov.tr/storage/Archive/2021/kubKtAttachments/onaykub_9f5494bd-704f-47b3-9670-55ed1b46c257.pdf'),
  },

  insulinDegludek: {
    name: 'İnsülin degludek',
    brand: ['Tresiba'],
    dose: 'Günde bir kez subkutan, günün herhangi bir saatinde (tercihen her gün aynı saatte). Doz kan glukozuna göre bireysel titre edilir. 100 U/mL ve 200 U/mL kalemler vardır.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk çözelti (FlexTouch kalem 100 ve 200 U/mL)',
    sgkCovered: false,
    sgkRestriction: 'SGK kapsamı bu tabloda doğrulanmadı — güncel SUT EK-4/A listesinden kontrol edin.',
    category: 'Uzun etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Uzun etkili insülin', 'Bazal insülin'],
    atc: 'A10AE06',
    insulinTuru: 'bazal',
    markaDurumu: {
      Tresiba: `TİTCK KÜB'ü olan ruhsatlı ürün (100 U/mL ilk ruhsat 09.09.2016; 200 U/mL ruhsat yenileme 25.08.2021). ilacabak Novo Nordisk ürün listesinde ve ilacrehberi A10AE listesinde görünmüyor — güncel piyasa durumu doğrulanamadı (${KONTROL}).`,
    },
    contraindications: KONTRENDIKASYON('İnsülin degludek'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'C', metin: 'Gebelikte klinik deneyim yoktur; gerekli olmadıkça gebelikte kullanılmamalıdır (KÜB §4.6).' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'Diğer insülinlerle karıştırılmaz; intravenöz/intramüsküler uygulanmaz.',
    kaynak: kub('TRESİBA FlexTouch 100 U/mL (ilk ruhsat 09.09.2016)', 'https://titck.gov.tr/storage/Archive/2021/kubKtAttachments/kb_6f44afba-e683-4834-9267-73131f75d547.pdf'),
  },

  insulinLispro: {
    name: 'İnsülin lispro',
    brand: ['Humalog', 'Lyumjev', 'Admelog'],
    dose: 'Yemekten hemen önceki 15 dakika içinde subkutan; gerektiğinde yemekten hemen sonra. Doz kan glukozuna göre bireysel. 100 U/mL (flakon, kartuş, KwikPen) ve 200 U/mL KwikPen.',
    pediatricDose: `${PEDIATRIK_SATIR}. KÜB: çocuklarda hızlı etkili insülinin etkisi daha yararlı olacaksa regüler insüline tercih edilebilir.`,
    form: 'Subkutan enjeksiyonluk çözelti (flakon, kartuş, KwikPen kalem)',
    sgkCovered: true,
    category: 'Hızlı etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hızlı etkili insülin', 'Prandiyal insülin'],
    atc: 'A10AB04',
    insulinTuru: 'hızlı etkili',
    markaDurumu: {
      Humalog: `Piyasada (Lilly: 100 IU/mL flakon, kartuş, KwikPen; KwikPen 200 IU/mL) — ilacrehberi A10AB04 ${KONTROL}`,
      Lyumjev: BULUNAMADI,
      Admelog: BULUNAMADI,
    },
    contraindications: KONTRENDIKASYON('İnsülin lispro'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Çok sayıda gebelik verisi gebelik, fetüs veya yenidoğan üzerinde advers etki göstermemiştir; dikkatle kullanılır (KÜB §4.6).' },
    emzirme: 'Anne sütüne geçişi hakkında veri sınırlıdır; emziren diyabetik annede doz ayarı gerekebilir (KÜB §4.6).',
    renkliRecete: 'normal',
    notes: 'HUMİRA (adalimumab) ile karıştırılmamalıdır. Humalog Mix 25/50 ayrı bir üründür (hazır karışım).',
    kaynak: kub('HUMALOG KWIKPEN 100 U/ml (ruhsat 131/52, ilk ruhsat 06.06.2011)', 'https://titck.gov.tr/storage/kubKtAttachments/DFf45aLiZZnNY.pdf'),
  },

  insulinAspart: {
    name: 'İnsülin aspart',
    brand: ['NovoRapid', 'Fiasp'],
    dose: 'Hızlı etki başlangıcı nedeniyle genellikle yemekten hemen önce subkutan; gerektiğinde yemekten hemen sonra. Doz kan glukozuna göre bireysel.',
    pediatricDose: `${PEDIATRIK_SATIR}. KÜB: 1 yaş ve üzeri; 1 yaş altında güvenlilik/etkililik kanıtlanmamıştır.`,
    form: 'Subkutan enjeksiyonluk çözelti (flakon, Penfill kartuş, FlexPen kalem)',
    sgkCovered: true,
    category: 'Hızlı etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hızlı etkili insülin', 'Prandiyal insülin'],
    atc: 'A10AB05',
    insulinTuru: 'hızlı etkili',
    markaDurumu: {
      NovoRapid: `Piyasada (Novo Nordisk: flakon 100 IU/mL, FlexPen, Penfill) — ilacrehberi/ilacabak ${KONTROL}`,
      Fiasp: `Ruhsat kaydı var (Novo Nordisk, FlexTouch/Penfill; ilacprospektusu bilgi tarihi 22.11.2018) ama güncel fiyat/piyasa kaydı bulunamadı — piyasa durumu doğrulanamadı (${KONTROL}).`,
    },
    contraindications: KONTRENDIKASYON('İnsülin aspart'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Gebelikte kullanılabilir; iki randomize çalışmada insan insülinine göre advers etki görülmemiştir. Yakın glukoz izlemi önerilir (KÜB §4.6).' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'NovoMix 30 ayrı bir üründür (hazır karışım, protamin insülin aspart içerir).',
    kaynak: kub('NovoRapid Penfill 100 U/mL', 'https://titck.gov.tr/storage/Archive/2021/kubKtAttachments/TTCKONAYLIKBNOVORAPDPENFLL_daf5470c-e45c-4533-89fe-6877ccf215aa.pdf'),
  },

  insulinGlulisin: {
    name: 'İnsülin glulisin',
    brand: ['Apidra'],
    dose: 'Yemekten hemen önce veya hemen sonra subkutan. Doz kan glukozuna göre bireysel.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk çözelti (SoloStar kalem 100 U/mL)',
    sgkCovered: true,
    category: 'Hızlı etkili insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hızlı etkili insülin', 'Prandiyal insülin'],
    atc: 'A10AB06',
    insulinTuru: 'hızlı etkili',
    markaDurumu: { Apidra: `Piyasada (Sanofi, Apidra SoloStar 100 U/mL; beyaz reçete) — ilacabak, güncelleme 21.11.2026` },
    contraindications: KONTRENDIKASYON('İnsülin glulisin'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { metin: GEBELIK_ANALOG },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    kaynak: literatur(
      'ilacabak — APIDRA 100 U/ML SOLOSTAR ürün kaydı (A10AB06, Sanofi, 21.11.2026); etkileşimler insülin KÜB §4.5 sınıf metninden (Humalog/NovoRapid KÜB)',
      'https://www.ilacabak.com/apidra-100-u-ml-solostar-enjeksiyonluk-cozelti-iceren-kullanima-hazir-5-kalem-7131'
    ),
  },

  insanInsuliniRegular: {
    name: 'İnsan insülini regüler',
    brand: ['Humulin R', 'Actrapid', 'Insuman Rapid'],
    dose: 'Yemekten 20–30 dakika önce subkutan; Actrapid flakon intravenöz de uygulanabilir (hastane). Doz kan glukozuna göre bireysel.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Enjeksiyonluk çözelti (flakon, kartuş)',
    sgkCovered: true,
    category: 'Kısa etkili insan insülini',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Kısa etkili insülin', 'İnsan insülini', 'Prandiyal insülin'],
    atc: 'A10AB01',
    insulinTuru: 'kısa etkili',
    markaDurumu: {
      'Humulin R': `Piyasada (Lilly, 100 IU/mL flakon ve kartuş) — ilacrehberi A10AB01 ${KONTROL}`,
      Actrapid: `Piyasada (Novo Nordisk, Actrapid HM flakon ve Penfill) — ilacrehberi A10AB01 ${KONTROL}`,
      'Insuman Rapid': BULUNAMADI,
    },
    contraindications: KONTRENDIKASYON('İnsan insülini'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Gebelikte insülin kullanımına kısıtlama yoktur; doz gereksinimi trimesterlere göre değişir (KÜB §4.6).' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    kaynak: literatur('HUMULIN R 100 IU/ml kartuş KÜB §4.2/4.5/4.6 — ilacrehberi KÜB metni (TİTCK PDF bu ortamdan açılamadı)', 'https://www.ilacrehberi.com/v/humulin-r-100-iuml-cozelti-iceren-kartus-a49a/kub/klinik-ozellikler/'),
  },

  insanInsuliniNph: {
    name: 'İnsan insülini NPH izofan',
    brand: ['Humulin N', 'Humulin NPH', 'Insulatard', 'Insuman Basal'],
    dose: 'Subkutan; günlük enjeksiyon sayısı ve doz hekimce bireysel belirlenir (tipik gereksinim 0,3–1,0 IU/kg/gün). İntravenöz uygulanmaz.',
    pediatricDose: `${PEDIATRIK_SATIR}. KÜB: çocuk ve adolesanlarda kullanılabilir.`,
    form: 'Subkutan enjeksiyonluk süspansiyon (flakon, kartuş, kalem)',
    sgkCovered: true,
    category: 'Orta etkili (NPH) insan insülini',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Orta etkili insülin', 'NPH insülin', 'İnsan insülini', 'Bazal insülin'],
    atc: 'A10AC01',
    insulinTuru: 'NPH',
    markaDurumu: {
      'Humulin N': `Piyasada (Lilly, 100 IU/mL flakon ve kartuş) — ilacrehberi A10AC01 ${KONTROL}`,
      'Humulin NPH': 'Humulin N\'nin eski/yaygın yazımı.',
      Insulatard: `Piyasada (Novo Nordisk, Insulatard HM Penfill) — ilacrehberi A10AC01 ${KONTROL}`,
      'Insuman Basal': BULUNAMADI,
    },
    contraindications: KONTRENDIKASYON('İnsan insülini'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Gebelikte insülin kullanımına kısıtlama yoktur; doz gereksinimi trimesterlere göre değişir (KÜB §4.6).' },
    emzirme: 'Emzirme döneminde kısıtlama yoktur; doz ayarı gerekebilir (KÜB §4.6).',
    renkliRecete: 'normal',
    notes: 'Süspansiyondur: kullanmadan önce homojen hale gelene kadar karıştırılır.',
    kaynak: kub('INSULATARD FlexPen 100 IU/mL (ruhsat 121/14)', 'https://titck.gov.tr/storage/Archive/2021/kubKtAttachments/kb_3683a857-05a9-47d6-b645-827b2bac6d1e.pdf'),
  },

  insulinLisproKarisim: {
    name: 'İnsülin lispro + insülin lispro protamin',
    brand: ['Humalog Mix 25', 'Humalog Mix 50', 'Humalog Mix'],
    dose: 'Yemekten hemen önceki 15 dakika içinde subkutan; gerektiğinde yemekten hemen sonra. Mix 25 = %25 lispro / %75 lispro protamin; Mix 50 = %50 / %50. İntravenöz uygulanmaz.',
    pediatricDose: `${PEDIATRIK_SATIR}. KÜB: 12 yaş altında yalnızca regüler insüline göre beklenen yarar varsa düşünülür.`,
    form: 'Subkutan enjeksiyonluk süspansiyon (kartuş, KwikPen kalem)',
    sgkCovered: true,
    category: 'Hazır karışım insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hazır karışım insülin'],
    atc: 'A10AD04',
    insulinTuru: 'hazır karışım',
    markaDurumu: {
      'Humalog Mix 25': `Piyasada (Lilly, kartuş ve KwikPen) — ilacrehberi ${KONTROL}`,
      'Humalog Mix 50': `Piyasada (Lilly, kartuş ve KwikPen) — ilacrehberi ${KONTROL}`,
      'Humalog Mix': 'Mix 25 / Mix 50 yazılmadıysa oran hekimle teyit edilmeli.',
    },
    contraindications: KONTRENDIKASYON('İnsülin lispro'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Advers etki görülmemiştir; yeterli kontrollü çalışma olmadığından yalnızca kesin gereksinimde verilir (KÜB §4.6).' },
    emzirme: 'Laktasyon verisi sınırlıdır; karar çocuk ve anne yararı tartılarak verilir (KÜB §4.6).',
    renkliRecete: 'normal',
    notes: 'Süspansiyondur: kullanmadan önce homojen hale gelene kadar karıştırılır.',
    kaynak: kub('HUMALOG MIX25 KWIKPEN 100 U/ml', 'https://titck.gov.tr/storage/kubKtAttachments/za7axWrJJ4oTZ.pdf'),
  },

  insulinAspartKarisim: {
    name: 'İnsülin aspart + protamin insülin aspart',
    brand: ['NovoMix 30', 'NovoMix'],
    dose: 'Yemekten hemen önce subkutan (gerektiğinde hemen sonra); günde bir, iki veya üç kez. %30 çözünür insülin aspart / %70 protamin insülin aspart. İntravenöz uygulanmaz.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk süspansiyon (FlexPen kalem, Penfill kartuş)',
    sgkCovered: true,
    category: 'Hazır karışım insülin analoğu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hazır karışım insülin'],
    atc: 'A10AD05',
    insulinTuru: 'hazır karışım',
    markaDurumu: {
      'NovoMix 30': `FlexPen piyasada; Penfill ilacrehberi'de "piyasada yok", ilacabak'ta fiyatlı — Novo Nordisk ${KONTROL}`,
      NovoMix: 'NovoMix 30\'un kısa yazımı.',
    },
    contraindications: KONTRENDIKASYON('İnsülin aspart'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { metin: GEBELIK_ANALOG },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'Süspansiyondur: kullanmadan önce homojen hale gelene kadar karıştırılır.',
    kaynak: literatur(
      `ilacrehberi A10AD30 listesi + ilacabak Novo Nordisk ürün listesi (NovoMix 30 FlexPen/Penfill), ${KONTROL}; etkileşimler insülin aspart KÜB §4.5 (NovoRapid Penfill)`,
      ILACREHBERI_A10AD30
    ),
  },

  insanInsuliniKarisim: {
    name: 'İnsan insülini regüler + NPH karışım',
    brand: ['Humulin M', 'Humulin M3', 'Humulin 70/30', 'Mixtard 30', 'Mixtard', 'Insuman Comb'],
    dose: 'Yemekten 20–30 dakika önce subkutan; genellikle günde iki kez. %30 regüler / %70 NPH. İntravenöz uygulanmaz.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk süspansiyon (kartuş)',
    sgkCovered: true,
    category: 'Hazır karışım insan insülini',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hazır karışım insülin', 'İnsan insülini'],
    atc: 'A10AD01',
    insulinTuru: 'hazır karışım',
    markaDurumu: {
      'Humulin M': `Piyasada (Lilly, Humulin M 70/30 kartuş) — ilacrehberi ${KONTROL}`,
      'Humulin M3': 'Humulin M 70/30\'un diğer ülkelerdeki adı.',
      'Humulin 70/30': 'Humulin M 70/30\'un kısa yazımı.',
      'Mixtard 30': `Piyasada (Novo Nordisk, Mixtard 30 HM Penfill) — ilacrehberi ${KONTROL}`,
      Mixtard: 'Mixtard 30\'un kısa yazımı.',
      'Insuman Comb': BULUNAMADI,
    },
    contraindications: KONTRENDIKASYON('İnsan insülini'),
    interactions: serbest(INSULIN_ETKILESIM),
    etkilesimler: INSULIN_ETKILESIM,
    gebelik: { kategori: 'B', metin: 'Gebelikte insülin kullanımına kısıtlama yoktur; doz gereksinimi trimesterlere göre değişir.' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    notes: 'Süspansiyondur: kullanmadan önce homojen hale gelene kadar karıştırılır.',
    kaynak: literatur(
      `ilacrehberi A10AD30 listesi (Humulin M 70/30, Mixtard 30 HM Penfill), ${KONTROL}; etkileşimler Humulin R / Insulatard KÜB §4.5`,
      ILACREHBERI_A10AD30
    ),
  },

  insulinDegludekAspart: {
    name: 'İnsülin degludek + insülin aspart',
    brand: ['Ryzodeg'],
    dose: 'Subkutan, günde bir veya iki kez ana öğün(ler)le. %70 degludek / %30 aspart. Doz kan glukozuna göre bireysel titre edilir; intravenöz uygulanmaz.',
    pediatricDose: PEDIATRIK_SATIR,
    form: 'Subkutan enjeksiyonluk çözelti (FlexTouch kalem, Penfill kartuş, 100 U/mL)',
    sgkCovered: false,
    sgkRestriction: 'SGK kapsamı bu tabloda doğrulanmadı — güncel SUT EK-4/A listesinden kontrol edin.',
    category: 'Bazal + hızlı etkili insülin analoğu kombinasyonu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Hazır karışım insülin', 'Uzun etkili insülin'],
    atc: 'A10AD06',
    insulinTuru: 'hazır karışım',
    markaDurumu: {
      Ryzodeg: `Penfill piyasada (ilacrehberi); FlexTouch ilacrehberi'de "piyasada yok", ilacabak'ta fiyat güncellemesi 29.08.2026 — kaynaklar çelişiyor (${KONTROL}).`,
    },
    contraindications: KONTRENDIKASYON('İnsülin degludek veya insülin aspart'),
    interactions: serbest(BAZAL_KARISIM_ETKILESIM),
    etkilesimler: BAZAL_KARISIM_ETKILESIM,
    gebelik: { metin: 'Gebelikte klinik deneyim sınırlıdır; gerekli olmadıkça kullanılmamalıdır (degludek KÜB §4.6).' },
    emzirme: EMZIRME,
    renkliRecete: 'normal',
    kaynak: literatur(
      `ilacabak RYZODEG FLEXTOUCH ürün kaydı (A10AD06, Novo Nordisk, 29.08.2026) + ilacrehberi; etkileşimler Tresiba / NovoRapid KÜB §4.5`,
      'https://www.ilacabak.com/ryzodeg-flextouch-100-u-ml-sc-enjeksiyonluk-cozelti-iceren-kullanima-hazir-kalem-5-kalem-18733'
    ),
  },

  insulinGlarjinLiksisenatid: {
    name: 'İnsülin glarjin + liksisenatid',
    brand: ['Soliqua', 'Suliqua'],
    dose: 'Günde bir kez subkutan, öğünden önceki 1 saat içinde (tercihen her gün aynı öğün). (10–40) kalem: 10–40 doz adımı; (30–60) kalem: 30–60 doz adımı; günlük en fazla 60 doz adımı. Başlamadan önce metformin ve SGLT2 inhibitörü dışındaki glukoz düşürücüler kesilir.',
    pediatricDose: 'Pediatrik kullanım için KÜB onayı yoktur',
    form: 'Subkutan enjeksiyonluk çözelti (SoloStar kalem: 100 U/mL glarjin + 50 mcg/mL veya 33 mcg/mL liksisenatid)',
    sgkCovered: false,
    sgkRestriction: 'SGK kapsamı bu tabloda doğrulanmadı — güncel SUT EK-4/A listesinden kontrol edin.',
    category: 'Bazal insülin + GLP-1 reseptör agonisti kombinasyonu',
    siniflar: ['İnsülin', 'Antidiyabetik', 'Uzun etkili insülin', 'Bazal insülin', 'GLP-1 reseptör agonisti', 'GLP-1 agonisti'],
    atc: 'A10AE54',
    insulinTuru: 'bazal + GLP-1',
    markaDurumu: {
      Soliqua: `Piyasada (Sanofi, Soliqua SoloStar 33 mcg ve 50 mcg kalemler) — ilacrehberi A10AE ${KONTROL}`,
      Suliqua: 'AB\'deki adı; Türkiye\'de Soliqua.',
    },
    contraindications: ['Etkin maddelere veya yardımcı maddelere aşırı duyarlılık', 'Kişisel veya ailede medüller tiroid karsinomu öyküsü', 'Multipl endokrin neoplazi tip 2 (MEN 2)'],
    interactions: serbest(KOMBINASYON_ETKILESIM),
    etkilesimler: KOMBINASYON_ETKILESIM,
    gebelik: { metin: 'Gebelikte kullanılmamalıdır; gebelik planlanıyor veya oluştuysa tedavi kesilmelidir (KÜB §4.6).' },
    emzirme: 'Emzirme döneminde kullanılmamalıdır.',
    renkliRecete: 'normal',
    notes: 'Liksisenatid mide boşalmasını yavaşlatır: eşik konsantrasyona bağlı oral ilaçlar (ör. antibiyotikler) liksisenatidden en az 1 saat önce veya 4 saat sonra alınmalıdır (KÜB §4.5).',
    kaynak: literatur('SOLIQUA SoloStar 100 U/ml + 50 mcg/ml KÜB §4.2/4.3/4.5/4.6 — ilacrehberi KÜB metni (TİTCK PDF bu ortamdan açılamadı)', 'https://www.ilacrehberi.com/v/soliqua-solostar-100-uml-ve-50-mcgml-sc-enjeksiyo-10578/kub/klinik-ozellikler/'),
  },
}

/** Market listings this file was checked against (kept for the source doc and the review sheet). */
export const INSULIN_PIYASA_LISTELERI = [ILACREHBERI_A10AE, ILACREHBERI_A10AD30, ILACABAK_NOVO] as const
