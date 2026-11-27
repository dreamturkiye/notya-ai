/**
 * BRANS-PAKETI (diyetisyen) — diagnosis-bound nutrition templates. The PHYSICIAN's diagnosis is required (the dietitian
 * does not diagnose — Sağlık Meslek Mensupları … İş ve Görev Tanımlarına Dair Yönetmelik, RG 22.05.2014/29007, Ek-2
 * "Diyetisyen": diyet tedavisini hekimin yönlendirmesine göre planlar). No diagnosis, drug or supplement dose is written.
 * Each template is principles + what to follow, with its source ids (docs/kaynak/DIYETISYEN-PAKETI-ARASTIRMA.md).
 * Source order follows CLAUDE.md "what Turkish doctors use": SB / TEMD first, then the international guideline Turkish
 * doctors use (latest edition).
 */
import { taniReferansi } from './diyet'

export type TaniSablonKodu = 'pkos' | 'insulin-direnci' | 'hipotiroidi' | 'tip2-diyabet' | 'gebelik-diyabeti' | 'masld' | 'dislipidemi'

export interface TaniSablonu {
  kod: TaniSablonKodu
  ad: string
  /** ICD-10 prefixes the physician's diagnosis usually carries (for matching only — the dietitian never codes). */
  icd: string[]
  ilkeler: string[]
  izlenecek: string[]
  /** Patient-portal condition module this template can switch on (when one exists). */
  portalModulu: string | null
  kaynaklar: string[]
}

export const TANI_SABLONLARI: readonly TaniSablonu[] = [
  {
    kod: 'pkos', ad: 'Polikistik over sendromu (PKOS)', icd: ['E28.2'], portalModulu: 'diyet-pkos',
    ilkeler: [
      'Belirli bir diyet tipi diğerine üstün değildir; sağlıklı, sürdürülebilir beslenme ve fiziksel aktivite önerilir (kilo kaybı olmadan da yarar vardır).',
      'Fazla kiloda kilo artışını önleme ve kilo yönetimi desteği; kilo damgalamasından kaçınılır.',
      'Yeme bozukluğu ve düzensiz yeme riski artmıştır — tarama soruları planın parçasıdır.',
      'Döngü ve belirti günlüğü hekimle paylaşılır; tıbbi tedavi kararı hekimindir.',
    ],
    izlenecek: ['Kilo, bel çevresi', 'Döngü düzeni (hasta günlüğü)', 'Hekimin istediği glukoz / HbA1c / lipid sonuçları'],
    kaynaklar: ['PCOS-2023', 'TEMD-OBEZITE-2024'],
  },
  {
    kod: 'insulin-direnci', ad: 'Prediyabet / insülin direnci (hekim tanısı)', icd: ['R73', 'E88.81'], portalModulu: 'diyet-ir',
    ilkeler: [
      'Düzenli öğün ritmi, lif ve tam tahıl ağırlıklı tabak, şekerli içeceklerin azaltılması (TÜBER 2022 besin grupları).',
      'Fazla kiloda haftada 0,5–1,0 kg kayıp hedefi (TEMD 2024 § 6.1.1).',
      'Öğün sonrası kısa yürüyüş ve haftalık fiziksel aktivite planı.',
      'Tanı ve izlem için insülin / HOMA-IR ölçümü kullanılmaz (TEMD 2024 § 5.6) — izlem hekimin istediği glukoz / HbA1c ile yapılır.',
    ],
    izlenecek: ['Hekimin istediği açlık glukozu, HbA1c', 'Kilo, bel çevresi'],
    kaynaklar: ['TEMD-OBEZITE-2024', 'TUBER-2022', 'ADA-SOC-2026'],
  },
  {
    kod: 'hipotiroidi', ad: 'Hipotiroidi / Hashimoto (hekim tanısı)', icd: ['E03', 'E06.3'], portalModulu: 'diyet-tiroid',
    ilkeler: [
      'Levotiroksin aç karnına alınır; kahvaltı ilaçtan sonra (KÜB: en az yarım saat), kalsiyum ve demir en az 2 saat arayla (KÜB) — ilaç saatini hasta ile birlikte kahvaltı planına oturtun.',
      'Kalsiyum karbonat, demir sülfat ve mide asidi baskılayıcılar T4 emilimini azaltabilir (TEMD Tiroid 2025, Tablo 1.3) — bunlar hekimle konuşulur.',
      'Soya içeriği yüksek beslenmeye geçiş/bırakış emilimi etkileyebilir; değişiklik hekime bildirilir (KÜB).',
      'Glütensiz diyet veya selenyum takviyesi bu şablonun parçası değildir — kanıt ve karar hekimdedir.',
    ],
    izlenecek: ['Hekimin istediği TSH', 'Kilo'],
    kaynaklar: ['TEMD-TIROID-2025', 'TITCK-KUB-LT4'],
  },
  {
    kod: 'tip2-diyabet', ad: 'Tip 2 diyabet (hekim tanısı)', icd: ['E11'], portalModulu: null,
    ilkeler: [
      'Bireyselleştirilmiş tıbbi beslenme tedavisi; Akdeniz ve düşük karbonhidratlı örüntüler kanıtlıdır (ADA SoC 2026).',
      'Kilo kaybında yeterli protein ve mikro besin izlenir (ADA SoC 2026, öneri 8.14).',
      'Karbonhidrat dağılımı ilaç (özellikle insülin) planıyla hekim kararına göre uyumlanır — doz yazılmaz.',
      'Metformin kullananlarda uzun dönemde B12 düzeyi hekimce izlenebilir (ilaç–besin notu).',
    ],
    izlenecek: ['Hekimin istediği HbA1c, açlık glukozu, lipidler', 'Kilo, bel çevresi'],
    kaynaklar: ['ADA-SOC-2026', 'TEMD-DIYABET', 'TUBER-2022'],
  },
  {
    kod: 'gebelik-diyabeti', ad: 'Gebelik diyabeti (hekim tanısı)', icd: ['O24.4'], portalModulu: null,
    ilkeler: [
      'Tarama ve tanı SB doğum öncesi bakım protokolüne ve kadın doğum hekimine aittir; diyetisyen hekimin tanısıyla çalışır.',
      'Öğünleri güne yayan plan (3 ana + ara öğün), yeterli enerji — gebelikte kilo verme hedeflenmez.',
      'Glukoz hedefleri ve ilaç/insülin kararı hekimindir; plan hekimin verdiği hedeflere göre gözden geçirilir.',
    ],
    izlenecek: ['Hekimin istediği glukoz ölçümleri', 'Gebelik haftasına göre kilo (hekim takibi)'],
    kaynaklar: ['SB-DOGUM-ONCESI', 'ADA-SOC-2026'],
  },
  {
    kod: 'masld', ad: 'MASLD (yağlı karaciğer, hekim tanısı)', icd: ['K76.0', 'K75.8'], portalModulu: null,
    ilkeler: [
      'Fruktozdan fakir, hipokalorik diyet önerilir (TEMD 2024, MASLD bölümü).',
      'Makro besin oranlarını değiştirmenin kalori azaltımının ötesinde ek yararı gösterilmemiştir (TEMD 2024).',
      'Fazla kiloda kademeli kilo kaybı (haftada 0,5–1,0 kg); alkol kararı hekimle.',
    ],
    izlenecek: ['Hekimin istediği karaciğer enzimleri, lipidler', 'Kilo, bel çevresi'],
    kaynaklar: ['TEMD-OBEZITE-2024'],
  },
  {
    kod: 'dislipidemi', ad: 'Dislipidemi (hekim tanısı)', icd: ['E78'], portalModulu: null,
    ilkeler: [
      'Doymuş ve trans yağ azaltımı, lif ve sebze-meyve artışı; TÜBER 2022 yağlar ve şekerler grubu sınırlı.',
      'Lipid hedefleri ve ilaç kararı hekimindir (TEMD / ESC — kayıt kütüphanesindeki sıra).',
      'Kilo fazlalığında kademeli kayıp; düzenli fiziksel aktivite.',
    ],
    izlenecek: ['Hekimin istediği total kolesterol, LDL, HDL, trigliserid'],
    kaynaklar: ['TEMD-DISLIPIDEMI', 'ESC-DISLIPIDEMI', 'TUBER-2022'],
  },
] as const

export function taniSablonu(kod: string): TaniSablonu | null {
  return TANI_SABLONLARI.find((s) => s.kod === kod) || null
}

/** Template text for the tool; refuses without the physician's diagnosis (hekim tanısı kilidi). */
export function taniSablonuCikti(kod: string, hekimTani: string): { ozet: string; satirlar: string[] } | { hata: string } {
  const ref = taniReferansi(hekimTani)
  if ('hata' in ref) return ref
  const s = taniSablonu(kod)
  if (!s) return { hata: 'Şablon seçin.' }
  return {
    ozet: `${ref.ozet} Şablon: ${s.ad}.`,
    satirlar: [...s.ilkeler.map((i) => `• ${i}`), `İzlenecek: ${s.izlenecek.join(' · ')}`, `Kaynak: ${s.kaynaklar.join(', ')}`],
  }
}
