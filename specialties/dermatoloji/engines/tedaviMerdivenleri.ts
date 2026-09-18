/**
 * DERM-CHAPTER — Tedavi merdiveni karar kartları: psoriasis (PSOKİD 2025), atopik dermatit (TDD AD 2018),
 * akne (TDD Akne + GÖP köprüsü). Motor **basamak adı** ve **gerekçe** üretir; basamağı **hekim kilitler**.
 *
 * Kilitler: ilaç dozu, potens sınıfı, uygulama sıklığı ve süresi YAZILMAZ. Kılavuz metni kopyalanmaz —
 * kaynak rol/yıl ile anılır. Eklem tutulumunda romatoloji "değerlendirmesi" yapılmaz; yalnız triyaj + sevk ipucu.
 */
import type { Dipnot } from '../protocols/sources'
import { akneIgaAdi, pasiBant, scoradBant } from './score-calculator'

export type MerdivenBasamak = {
  id: string
  ad: string
  /** hekime gösterilecek kısa kapsam — ilaç adı sınıf düzeyinde, doz yok */
  kapsam: string
}

export type MerdivenKarar = {
  baslik: string
  /** motorun işaret ettiği basamak — hekim onaylayana kadar öneri */
  onerilenBasamakId: string | null
  gerekce: string[]
  basamaklar: MerdivenBasamak[]
  eksikler: string[]
  dipnotlar: Dipnot[]
  /** her zaman true — kaydı hekim kilitler */
  hekimKilitler: true
  kilitNotu: string
}

export const HEKIM_KILIT_NOTU =
  'Basamak önerisidir; tedavi seçimi, ilaç, potens ve doz hekime aittir. Kaydı hekim kilitler.'

// ── Psoriasis — PSOKİD 2025 basamakları ───────────────────────────────────────

export const PSORIASIS_BASAMAKLARI: MerdivenBasamak[] = [
  { id: 'topikal', ad: '1. Topikal tedavi', kapsam: 'Topikal kortikosteroid / D vitamini analogu, keratolitik; saçlı deri ve kıvrım bölgesi ayrı ele alınır' },
  { id: 'fototerapi', ad: '2. Fototerapi', kapsam: 'NB-UVB / PUVA; MED + J/cm² defteri ve yıllık TBSE ile' },
  { id: 'konvansiyonel', ad: '3. Konvansiyonel sistemik', kapsam: 'Metotreksat / siklosporin / asitretin sınıfı — laboratuvar izlemi ve gebelik kapıları ile' },
  { id: 'biyolojik', ad: '4. Biyolojik / küçük molekül', kapsam: 'SUT basamak koşulu + TB/HBV/HCV taraması + rapor; etken madde ve doz hekimin' },
]

export type PsoriasisGirdi = {
  pasi?: number | null
  bsaPct?: number | null
  dlqi?: number | null
  /** özel bölge tutulumu (yüz, el-ayak, genital, saçlı deri) — şiddeti yükseltir (hekim değerlendirmesi) */
  ozelBolge?: boolean
  psaTutulumu?: boolean
  /** hekim beyanı: önceki basamakta hedefe ulaşılamadı */
  topikalYanitsiz?: boolean
  fototerapiYanitsiz?: boolean
  konvansiyonelYanitsiz?: boolean
}

/** "Onluk kuralı": PASI > 10 veya BSA > %10 veya DLQI > 10 → orta-şiddetli tarafta değerlendirilir (karar hekimin). */
export function psoriasisSiddet(g: PsoriasisGirdi): { sinif: 'hafif' | 'orta_siddetli' | 'belirsiz'; gerekce: string[] } {
  const gerekce: string[] = []
  const veri = [g.pasi, g.bsaPct, g.dlqi].some((x) => x != null)
  if (!veri) return { sinif: 'belirsiz', gerekce: ['PASI / BSA / DLQI girilmedi'] }
  if (g.pasi != null && g.pasi > 10) gerekce.push(`PASI ${g.pasi} (${pasiBant(g.pasi)})`)
  if (g.bsaPct != null && g.bsaPct > 10) gerekce.push(`BSA %${g.bsaPct}`)
  if (g.dlqi != null && g.dlqi > 10) gerekce.push(`DLQI ${g.dlqi}`)
  if (g.ozelBolge) gerekce.push('Özel bölge tutulumu (yüz / el-ayak / genital / saçlı deri)')
  if (g.psaTutulumu) gerekce.push('Eklem tutulumu bulguları')
  if (gerekce.length) return { sinif: 'orta_siddetli', gerekce }
  return { sinif: 'hafif', gerekce: ['Onluk kuralı eşiklerinin altında'] }
}

export function psoriasisMerdiveni(g: PsoriasisGirdi): MerdivenKarar {
  const s = psoriasisSiddet(g)
  const eksikler: string[] = []
  if (g.pasi == null) eksikler.push('PASI (bölge çalışma sayfası)')
  if (g.dlqi == null) eksikler.push('DLQI')
  if (g.bsaPct == null) eksikler.push('Tutulan vücut yüzey alanı (%)')

  let onerilen: string | null = null
  const gerekce = [...s.gerekce]
  if (s.sinif === 'belirsiz') {
    onerilen = null
    gerekce.push('Skorlar girilmeden basamak önerilmez')
  } else if (s.sinif === 'hafif') {
    onerilen = g.topikalYanitsiz ? 'fototerapi' : 'topikal'
    if (g.topikalYanitsiz) gerekce.push('Topikal basamakta hedefe ulaşılamadı (hekim beyanı)')
  } else {
    if (g.konvansiyonelYanitsiz) {
      onerilen = 'biyolojik'
      gerekce.push('Konvansiyonel sistemik basamakta hedefe ulaşılamadı (hekim beyanı)')
    } else if (g.fototerapiYanitsiz || g.psaTutulumu) {
      onerilen = 'konvansiyonel'
      if (g.fototerapiYanitsiz) gerekce.push('Fototerapi basamağında hedefe ulaşılamadı (hekim beyanı)')
    } else {
      onerilen = 'fototerapi'
    }
  }

  return {
    baslik: 'Psoriasis basamak kararı',
    onerilenBasamakId: onerilen,
    gerekce,
    basamaklar: PSORIASIS_BASAMAKLARI,
    eksikler,
    dipnotlar: [
      { ref: 'PSOKID_2025', not: 'Basamaklı yaklaşım ve “onluk kuralı” şiddet ölçütleri — ilaç ve doz kararı hekimin' },
      { ref: 'SUT_2026', not: 'Biyolojik basamağında rapor / basamak koşulu; madde ve süre hekim / idare teyidiyle' },
    ],
    hekimKilitler: true,
    kilitNotu: HEKIM_KILIT_NOTU,
  }
}

// ── PsA / eklem triyajı ───────────────────────────────────────────────────────

/** Eklem triyajı — dermatolog sorar, romatoloji değerlendirir. Tanı koymaz, skor adı taşımaz. */
export const PSA_TRIYAJ_MADDELERI: Array<{ kod: string; ad: string }> = [
  { kod: 'sabah_tutuklugu', ad: 'Sabah eklem tutukluğu 30 dakikadan uzun' },
  { kod: 'sisme', ad: 'Eklemde şişlik / hassasiyet (hekim muayenesi)' },
  { kod: 'daktilit', ad: 'Parmakta bütün olarak şişlik (daktilit görünümü)' },
  { kod: 'entezit', ad: 'Topuk / aşil veya tendon yapışma yerinde ağrı' },
  { kod: 'inflamatuvar_bel', ad: 'Dinlenmeyle geçmeyen, hareketle azalan bel ağrısı' },
  { kod: 'tirnak', ad: 'Tırnak tutulumu (pitting / onikolizis)' },
  { kod: 'aile', ad: 'Ailede psoriatik artrit / spondiloartrit öyküsü' },
]

export type PsaTriyajSonuc = {
  isaretli: string[]
  sayi: number
  sevkOnerilir: boolean
  hint: string
  dipnot: Dipnot
}

export function psaTriyaj(isaretler: Record<string, boolean> | null | undefined): PsaTriyajSonuc {
  const m = isaretler || {}
  const isaretli = PSA_TRIYAJ_MADDELERI.filter((x) => m[x.kod]).map((x) => x.ad)
  const sayi = isaretli.length
  const sevk = sayi >= 2 || !!m.daktilit || !!m.sisme
  return {
    isaretli,
    sayi,
    sevkOnerilir: sevk,
    hint: sevk
      ? 'Eklem bulguları var — romatoloji sevki hekim tarafından değerlendirilir. Notya romatolojik tanı veya aktivite değerlendirmesi yapmaz.'
      : sayi === 0
        ? 'Eklem bulgusu işaretlenmedi. Psoriasis izleminde her kontrolde sorulması önerilir.'
        : 'Tek bulgu işaretli — izlemde yeniden sorgulanır; sevk kararı hekimin.',
    dipnot: { ref: 'PSOKID_2025', not: 'Psoriasis hastasında eklem semptomlarının sorgulanması; değerlendirme romatoloji ile birlikte' },
  }
}

// ── Atopik dermatit — TDD AD 2018 basamakları ────────────────────────────────

export const ATOPI_BASAMAKLARI: MerdivenBasamak[] = [
  { id: 'temel', ad: '1. Temel bakım', kapsam: 'Nemlendirici, tetikleyicilerden kaçınma, banyo ve giysi önerileri, hasta eğitimi' },
  { id: 'topikal', ad: '2. Topikal antiinflamatuvar', kapsam: 'Topikal kortikosteroid / kalsinörin inhibitörü; bölgeye göre potens seçimi hekimin' },
  { id: 'fototerapi', ad: '3. Fototerapi / proaktif izlem', kapsam: 'NB-UVB veya UVA1; enfeksiyon ve kaşıntı kontrolü ile birlikte' },
  { id: 'sistemik', ad: '4. Sistemik tedavi', kapsam: 'Konvansiyonel sistemik veya biyolojik / küçük molekül; lab izlemi ve rapor koşulları ile' },
]

export type AtopiGirdi = {
  scorad?: number | null
  easi?: number | null
  /** yüz, el, göz kapağı gibi hassas bölge tutulumu */
  hassasBolge?: boolean
  /** uyku bölünmesi / yaşam kalitesi etkisi (hekim değerlendirmesi) */
  uykuEtkilenmis?: boolean
  temelBakimYanitsiz?: boolean
  topikalYanitsiz?: boolean
  fototerapiYanitsiz?: boolean
  /** pediatrik hasta — ped köprüsü metni (pediatri UI'si açılmaz) */
  pediatrik?: boolean
}

export function atopiMerdiveni(g: AtopiGirdi): MerdivenKarar {
  const eksikler: string[] = []
  if (g.scorad == null && g.easi == null) eksikler.push('SCORAD veya EASI (çalışma sayfası)')

  const gerekce: string[] = []
  if (g.scorad != null) gerekce.push(`SCORAD ${g.scorad} (${scoradBant(g.scorad)})`)
  if (g.easi != null) gerekce.push(`EASI ${g.easi}`)
  if (g.hassasBolge) gerekce.push('Hassas bölge tutulumu (yüz / el / göz kapağı)')
  if (g.uykuEtkilenmis) gerekce.push('Uyku bölünmesi')

  let onerilen: string | null = null
  const siddetli = (g.scorad != null && g.scorad > 50) || (g.easi != null && g.easi > 21)
  const orta = (g.scorad != null && g.scorad >= 25) || (g.easi != null && g.easi > 7)
  if (g.scorad == null && g.easi == null) {
    onerilen = 'temel'
    gerekce.push('Skor girilmedi — temel bakım her basamakta sürer')
  } else if (g.fototerapiYanitsiz || (siddetli && g.topikalYanitsiz)) {
    onerilen = 'sistemik'
    if (g.fototerapiYanitsiz) gerekce.push('Fototerapi basamağında hedefe ulaşılamadı (hekim beyanı)')
  } else if (g.topikalYanitsiz || siddetli) {
    onerilen = 'fototerapi'
    if (g.topikalYanitsiz) gerekce.push('Topikal basamakta hedefe ulaşılamadı (hekim beyanı)')
  } else if (orta || g.temelBakimYanitsiz || g.hassasBolge) {
    onerilen = 'topikal'
  } else {
    onerilen = 'temel'
  }

  if (g.pediatrik) {
    gerekce.push('Çocuk hasta: potens seçimi, uygulama alanı ve izlem aralığı hekim tarafından yaşa göre belirlenir.')
  }

  return {
    baslik: 'Atopik dermatit basamak kararı',
    onerilenBasamakId: onerilen,
    gerekce,
    basamaklar: ATOPI_BASAMAKLARI,
    eksikler,
    dipnotlar: [
      { ref: 'TDD_AD_2018', not: 'Basamaklı tedavi yaklaşımı; potens ve doz kararı hekimin' },
      { ref: 'BOLOGNIA', not: 'Atopik dermatit derinliği (rol atfı; metin kopyalanmaz)' },
    ],
    hekimKilitler: true,
    kilitNotu: HEKIM_KILIT_NOTU,
  }
}

// ── Akne — IGA + foto serisi + izotretinoin köprüsü ──────────────────────────

export type AkneGirdi = {
  iga?: number | null
  /** skar / nedbe varlığı */
  skar?: boolean
  /** gövde tutulumu */
  govde?: boolean
  /** psikososyal etki (hekim değerlendirmesi) */
  psikososyal?: boolean
  /** izotretinoin kürü aktif mi (GÖP kapısı ayrı motorda) */
  izotretinoinKuru?: boolean
  /** ay-0 ve ay-3 foto serisi kayıtlı mı */
  fotoAy0?: boolean
  fotoAy3?: boolean
}

export type AkneKarar = {
  igaAd: string
  siddet: 'hafif' | 'orta' | 'siddetli' | 'belirsiz'
  fotoCue: string[]
  gerekce: string[]
  eksikler: string[]
  dipnotlar: Dipnot[]
  kilitNotu: string
}

export function akneKarar(g: AkneGirdi): AkneKarar {
  const eksikler: string[] = []
  const gerekce: string[] = []
  const fotoCue: string[] = []
  const iga = g.iga
  const siddet = iga == null ? 'belirsiz' : iga >= 4 ? 'siddetli' : iga === 3 ? 'orta' : 'hafif'
  if (iga == null) eksikler.push('IGA değerlendirmesi (0–4)')
  else gerekce.push(`IGA ${iga} — ${akneIgaAdi(iga)}`)
  if (g.skar) gerekce.push('Skar / nedbe gelişimi')
  if (g.govde) gerekce.push('Gövde tutulumu')
  if (g.psikososyal) gerekce.push('Belirgin psikososyal etki (hekim değerlendirmesi)')

  if (g.izotretinoinKuru) {
    if (!g.fotoAy0) { fotoCue.push('Ay-0 foto serisi eksik — kür başlangıcı için çekilir'); eksikler.push('Ay-0 klinik fotoğraf serisi') }
    else fotoCue.push('Ay-0 foto serisi kayıtlı')
    if (!g.fotoAy3) fotoCue.push('Ay-3 karşılaştırma fotoğrafı planlanır (aynı açı / ışık)')
    else fotoCue.push('Ay-3 karşılaştırma fotoğrafı kayıtlı')
    gerekce.push('İzotretinoin kürü aktif — GÖP kapısı ve laboratuvar izlemi ayrı kartta; doz hekimin.')
  } else if (siddet === 'siddetli' || g.skar) {
    fotoCue.push('Sistemik tedavi düşünülüyorsa ay-0 foto serisi çekilir (karşılaştırma için)')
  }

  return {
    igaAd: iga == null ? '—' : akneIgaAdi(iga),
    siddet,
    fotoCue,
    gerekce,
    eksikler,
    dipnotlar: [
      { ref: 'TDD_AKNE', not: 'Akne şiddet değerlendirmesi ve izlem; tedavi seçimi ve doz hekimin' },
      { ref: 'GOP_KUB', not: 'İzotretinoin küründe gebelik önleme programı kapıları — doz yazılmaz' },
    ],
    kilitNotu: HEKIM_KILIT_NOTU,
  }
}
